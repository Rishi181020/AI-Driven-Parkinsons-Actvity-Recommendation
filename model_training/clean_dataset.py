"""
clean_dataset.py (Windows-safe)

- Uses absolute paths based on this file's location (no fragile relative paths)
- Avoids backslash escape issues by using os.path.join everywhere
- Adds clear diagnostics + guards for short files / missing columns
- Produces a window-level dataset with features + weak-supervision labels
"""

import os
import pandas as pd
import numpy as np


# ----------------------------
# Path helpers (Windows-safe)
# ----------------------------
def get_defog_train_folder() -> str:
    """
    Returns the absolute path to:
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


# ----------------------------
# Feature engineering
# ----------------------------
def compute_imu_features(window: pd.DataFrame) -> tuple[list[float], float]:
    """
    Returns:
      - imu_feats: simple stats features
      - movement_mag: mean acceleration magnitude over the window
    """
    # Basic stats (6 features)
    acc_v = window["AccV"].to_numpy(dtype=float)
    acc_ml = window["AccML"].to_numpy(dtype=float)
    acc_ap = window["AccAP"].to_numpy(dtype=float)

    imu_feats = [
        float(np.mean(acc_v)),
        float(np.std(acc_v)),
        float(np.mean(acc_ml)),
        float(np.std(acc_ml)),
        float(np.mean(acc_ap)),
        float(np.std(acc_ap)),
    ]

    # More meaningful movement proxy: mean vector magnitude
    movement_mag = float(np.mean(np.sqrt(acc_v**2 + acc_ml**2 + acc_ap**2)))
    return imu_feats, movement_mag


def compute_fog_severity(window: pd.DataFrame) -> float:
    """
    Weak "FOG severity" score from available event columns.
    Uses sum of means as a simple proxy (can be reweighted later).
    """
    return float(
        window["StartHesitation"].mean()
        + window["Turn"].mean()
        + window["Walking"].mean()
    )


def estimate_time_of_day_hour(sample_index: int, sample_rate_hz: int = 100) -> float:
    """
    Maps a sample index -> hour-of-day in [0, 24).
    Note: Dataset is not real clock time; this is just a cyclic feature proxy.
    """
    seconds = sample_index / float(sample_rate_hz)
    hours = (seconds / 3600.0) % 24.0
    return float(hours)


# ----------------------------
# Labeling (weak supervision)
# ----------------------------
def fog_to_activity(fog_state: float, movement: float, hour: float) -> int:
    """
    FOG patterns → optimal intervention class (example mapping)

    Returns activity class:
      0: Rest/relaxation
      1: Seated exercise
      2: Gait training NOW
      3: Balance practice
      4: Stretching
      6: Medication check
    """
    if fog_state > 0.3:  # Active FOG
        return 2
    elif fog_state > 0.1:  # Recent FOG
        return 3
    elif movement < 0.1:  # Sedentary + PD
        return 1
    elif int(hour) in (7, 12, 18):  # Meal-ish times
        return 6
    elif hour > 21:  # Evening
        return 0
    else:
        return 4


# ----------------------------
# Dataset creation
# ----------------------------
def load_fog_series(
    folder: str | None = None,
    window_size: int = 1000,    # 10s @ 100Hz
    stride: int = 500,          # 50% overlap
    sample_rate_hz: int = 100
) -> pd.DataFrame:
    """
    Loads all CSVs in the defog train folder, windows them, and returns a DataFrame:
      - imu_features (list[float])
      - fog_severity (float)
      - time_of_day (float)
      - movement_mag (float)
      - (later) target_activity (int)
      - source_file (str)
      - window_start (int)
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

    print(f"[INFO] Loading {len(files)} CSV files from:\n  {folder}")

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
            print(f"[WARN] Skipping {file} (too short: {len(df)} rows)")
            continue

        # Windowing
        for i in range(0, len(df) - window_size + 1, stride):
            window = df.iloc[i : i + window_size]

            imu_feats, movement_mag = compute_imu_features(window)
            fog_severity = compute_fog_severity(window)
            hour = estimate_time_of_day_hour(i, sample_rate_hz=sample_rate_hz)

            all_windows.append(
                {
                    "imu_features": imu_feats,
                    "fog_severity": fog_severity,
                    "time_of_day": hour,
                    "movement_mag": movement_mag,
                    "source_file": file,
                    "window_start": i,
                }
            )

    out = pd.DataFrame(all_windows)
    if out.empty:
        raise RuntimeError(
            "No windows were created. Check column names, file contents, and window_size/stride."
        )
    return out


def main():
    train_df = load_fog_series()

    # Training labels via weak supervision rules
    train_df["target_activity"] = train_df.apply(
        lambda row: fog_to_activity(row["fog_severity"], row["movement_mag"], row["time_of_day"]),
        axis=1,
    )

    print("[INFO] Dataset built.")
    print(train_df.head())

    # Optional: save output next to this script
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "train_windows.csv")
    train_df.to_csv(out_path, index=False)
    print(f"[INFO] Saved -> {out_path}")


if __name__ == "__main__":
    main()

    