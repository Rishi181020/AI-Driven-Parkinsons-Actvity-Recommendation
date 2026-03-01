import os
import pandas as pd
import numpy as np

WINDOW_SIZE      = 1000   # samples per window  (10s @ 100Hz)
STRIDE           = 500    # 50% overlap
SAMPLE_RATE_HZ   = 100
DOWNSAMPLE_STEP  = 10     # keep every Nth sample → 1000 // 10 = 100 timesteps

def get_defog_train_folder() -> str:
    """Returns the absolute path to:
      .../model_training/tlvmc-parkinsons-freezing-gait-prediction/train/defog
    regardless of where you run the script from.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))  # model_training/
    return os.path.join(
        base_dir,
        "tlvmc-parkinsons-freezing-gait-prediction",
        "train",
        "defog",
    )

def compute_imu_features(window: pd.DataFrame) -> tuple[list, float]:
    """
    Returns:
      - imu_feats : raw downsampled time series as nested list → shape (100, 3)
                    stored as a Python list so it survives CSV round-trips via ast.literal_eval
      - movement_mag: mean acceleration magnitude over the full window (scalar, for labeling)

    Downsampling: 1000 samples → every 10th → 100 timesteps.
    This preserves gait rhythm (~1 Hz stride) while keeping CSV size manageable.
    """
    acc_v  = window["AccV"].to_numpy(dtype=float)
    acc_ml = window["AccML"].to_numpy(dtype=float)
    acc_ap = window["AccAP"].to_numpy(dtype=float)

    # Stack full window → (1000, 3), then downsample → (100, 3)
    raw = np.stack([acc_v, acc_ml, acc_ap], axis=1)          # (1000, 3)
    downsampled = raw[::DOWNSAMPLE_STEP]                      # (100,  3)

    # Convert to nested Python list for safe CSV storage
    imu_feats = downsampled.tolist()                          # [[v,ml,ap], ...]  len=100

    # Scalar movement proxy (used only for labeling heuristic)
    movement_mag = float(np.mean(np.sqrt(acc_v**2 + acc_ml**2 + acc_ap**2)))

    return imu_feats, movement_mag


def compute_fog_severity(window: pd.DataFrame) -> float:
    """
    Weak 'FOG severity' score from available event columns.
    Uses sum of means as a simple proxy (can be reweighted later).
    """
    return float(
        window["StartHesitation"].mean()
        + window["Turn"].mean()
        + window["Walking"].mean()
    )


def estimate_time_of_day_hour(sample_index: int, sample_rate_hz: int = SAMPLE_RATE_HZ) -> float:
    """
    Maps a sample index -> hour-of-day in [0, 24).
    Note: Dataset is not real clock time; this is just a cyclic feature proxy.
    """
    seconds = sample_index / float(sample_rate_hz)
    hours   = (seconds / 3600.0) % 24.0
    return float(hours)

def fog_to_activity(fog_state: float, movement: float, hour: float) -> int:
    """
    FOG patterns → optimal intervention class.

    Returns activity class:
      0: Rest / relaxation
      1: Seated exercise
      2: Gait training NOW
      3: Balance practice
      4: Stretching
      6: Medication check
    """
    if fog_state > 0.3:           # Active FOG
        return 2
    elif fog_state > 0.1:         # Recent FOG
        return 3
    elif movement < 0.1:          # Sedentary + PD
        return 1
    elif int(hour) in (7, 12, 18):  # Meal-ish times
        return 6
    elif hour > 21:               # Evening
        return 0
    else:
        return 4

def load_fog_series(
    folder: str | None = None,
    window_size: int   = WINDOW_SIZE,
    stride: int        = STRIDE,
    sample_rate_hz: int = SAMPLE_RATE_HZ,
) -> pd.DataFrame:
    """
    Loads all CSVs in the defog train folder, windows them, and returns a DataFrame:
      - imu_features  : nested list of shape (100, 3) — raw downsampled accelerometer sequence
      - fog_severity  : float  — weak FOG proxy for the window
      - time_of_day   : float  — hour-of-day proxy
      - movement_mag  : float  — mean vector magnitude
      - source_file   : str
      - window_start  : int
    target_activity is added in main() via weak-supervision rules.
    """
    if folder is None:
        folder = get_defog_train_folder()

    folder = os.path.abspath(folder)

    if not os.path.exists(folder):
        raise FileNotFoundError(f"Folder not found:\n  {folder}")

    required_cols = {"AccV", "AccML", "AccAP", "StartHesitation", "Turn", "Walking"}

    all_windows: list[dict] = []

    files = [f for f in os.listdir(folder) if f.lower().endswith(".csv")]
    if not files:
        raise FileNotFoundError(f"No .csv files found in:\n  {folder}")

    n_timesteps = window_size // DOWNSAMPLE_STEP
    print(f"[INFO] Loading {len(files)} CSV files from:\n  {folder}")
    print(f"[INFO] Window: {window_size} samples  |  Stride: {stride}  |  "
          f"Downsample: every {DOWNSAMPLE_STEP}th → {n_timesteps} timesteps per window")

    for file in files:
        file_path = os.path.join(folder, file)

        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            print(f"[WARN] Failed to read {file}: {e}")
            continue

        missing = required_cols - set(df.columns)
        if missing:
            print(f"[WARN] Skipping {file} (missing columns: {sorted(missing)})")
            continue

        if len(df) < window_size:
            print(f"[WARN] Skipping {file} (too short: {len(df)} rows < {window_size})")
            continue

        # Sliding window
        n_windows = 0
        for i in range(0, len(df) - window_size + 1, stride):
            window = df.iloc[i : i + window_size]

            imu_feats, movement_mag = compute_imu_features(window)
            fog_severity            = compute_fog_severity(window)
            hour                    = estimate_time_of_day_hour(i, sample_rate_hz=sample_rate_hz)

            all_windows.append({
                "imu_features" : imu_feats,
                "fog_severity" : fog_severity,
                "time_of_day"  : hour,
                "movement_mag" : movement_mag,
                "source_file"  : file,
                "window_start" : i,
            })
            n_windows += 1

        print(f"  {file}: {n_windows} windows")

    out = pd.DataFrame(all_windows)
    if out.empty:
        raise RuntimeError(
            "No windows were created. "
            "Check column names, file contents, and window_size/stride."
        )

    print(f"\n[INFO] Total windows created: {len(out):,}")
    print(f"[INFO] imu_features shape per row: ({n_timesteps}, 3)")
    return out

def main():
    train_df = load_fog_series()

    # Weak-supervision labels
    train_df["target_activity"] = train_df.apply(
        lambda row: fog_to_activity(
            row["fog_severity"], row["movement_mag"], row["time_of_day"]
        ),
        axis=1,
    )

    # Class distribution
    counts = train_df["target_activity"].value_counts().sort_index()
    print("\n[INFO] Class distribution:")
    for cls, cnt in counts.items():
        bar = "█" * max(1, cnt * 30 // len(train_df))
        print(f"  class {cls:>2}: {cnt:>6} rows  {bar}")

    print("\n[INFO] Sample imu_features entry:")
    sample = train_df["imu_features"].iloc[0]
    print(f"  type        : {type(sample)}")
    print(f"  len         : {len(sample)} timesteps")
    print(f"  first entry : {sample[0]}  (3 values = AccV, AccML, AccAP)")

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "train_windows.csv")
    train_df.to_csv(out_path, index=False)
    print(f"\n[INFO] Saved → {out_path}")
    print(f"[INFO] Next step: run augment.py, then model.py")


if __name__ == "__main__":
    main()
