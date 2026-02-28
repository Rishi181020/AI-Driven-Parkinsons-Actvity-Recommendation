import argparse
import ast
import numpy as np
import pandas as pd
from pathlib import Path


# per-class augmentation functions 

def make_medication_check(real: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Class 5 — Medication Check
    Patient is near-stationary: sitting or standing still to take medication.
    Very low movement magnitude, all axes suppressed, minimal std.
    [AccV_mean, AccV_std, AccML_mean, AccML_std, AccAP_mean, AccAP_std]
    """
    aug = real.copy()
    # Dominant gravity on vertical, almost no movement on ML/AP
    aug[0]  = rng.normal(-0.98, 0.02)      # near-gravity vertical mean (standing still)
    aug[1]  = abs(rng.normal(0.01, 0.005)) # very tight vertical std
    aug[2]  = rng.normal(0.0,  0.03)       # ML near zero
    aug[3]  = abs(rng.normal(0.01, 0.005)) # ML std tiny
    aug[4]  = rng.normal(0.0,  0.03)       # AP near zero
    aug[5]  = abs(rng.normal(0.01, 0.005)) # AP std tiny
    return aug


def make_mild_fog(real: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Class 6 — Mild FOG Onset
    Slight hesitation: forward (AP) progress slows, mild tremor begins.
    Vertical and ML stds slightly elevated; AP mean reduced.
    """
    aug = real.copy()
    tremor = rng.uniform(0.03, 0.08)
    aug[1] += tremor                        # AccV std slightly elevated
    aug[3] += tremor * 0.6                  # AccML std slightly elevated
    aug[4] *= rng.uniform(0.4, 0.7)        # AP mean reduced — less forward progress
    aug[5] += tremor * 0.5                  # AccAP std slightly elevated
    aug[0] += rng.normal(0, 0.04)          # small vertical mean drift
    aug[2] += rng.normal(0, 0.04)          # small ML mean drift
    return aug


def make_moderate_fog(real: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Class 7 — Moderate FOG
    Shuffled gait: elevated tremor on all axes, very little net AP displacement.
    Multi-axis std elevated, AP mean close to zero (feet barely lifting).
    """
    aug = real.copy()
    tremor = rng.uniform(0.10, 0.20)
    aug[1] += tremor                        # AccV std elevated
    aug[3] += tremor * 0.9                  # AccML std elevated — lateral sway
    aug[5] += tremor * 0.85                 # AccAP std elevated
    aug[4]  = rng.normal(0.0, 0.05)        # AP mean ≈ 0 — no forward progress
    aug[0] += rng.normal(0, 0.06)
    aug[2] += rng.normal(0, 0.06)
    return aug


def make_severe_fog(real: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """
    Class 8 — Severe FOG / Freeze Episode
    High-frequency tremor on all axes. Net displacement near zero.
    Std spikes significantly; mean acceleration minimal (patient is frozen in place).
    """
    aug = real.copy()
    tremor_amp = rng.uniform(0.20, 0.40)
    aug[0]  = rng.normal(-0.95, 0.05)      # vertical locked near gravity
    aug[1] += tremor_amp                    # AccV std spikes strongly
    aug[2]  = rng.normal(0.0, 0.04)        # ML mean near zero — no lateral progress
    aug[3] += tremor_amp * 0.85            # AccML std spikes
    aug[4]  = rng.normal(0.0, 0.04)        # AP mean near zero — frozen
    aug[5] += tremor_amp * 0.85            # AccAP std spikes
    return aug

def make_rest(real: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Class 0 — Rest: low variance, gravity dominates vertical."""
    aug = real + rng.normal(0, 0.05, real.shape)
    aug[0] -= 0.3
    aug[1]  = abs(aug[1]) * 0.4
    aug[3]  = abs(aug[3]) * 0.4
    aug[5]  = abs(aug[5]) * 0.4
    return aug


def make_seated(real: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Class 1 — Seated Exercise: minimal vertical, ML/AP jitter."""
    aug = real.copy()
    aug[0] *= 0.3
    aug[1] *= 0.3
    aug[2] += rng.normal(0, 0.1)
    aug[3] += abs(rng.normal(0, 0.1))
    aug[4] += rng.normal(0, 0.1)
    aug[5] += abs(rng.normal(0, 0.1))
    return aug

CLASS_GENERATORS = {
    0: make_rest,
    1: make_seated,
    5: make_medication_check,
    6: make_mild_fog,
    7: make_moderate_fog,
    8: make_severe_fog,
}


# core augmentation
def augment_fog_classes(
    df: pd.DataFrame,
    target_classes: list[int],
    prob: float,
    rng: np.random.Generator,
) -> pd.DataFrame:
    """
    For each real sample, randomly generate synthetic rows for each
    target class using its perturbation function.

    Parameters
    ----------
    df             : original dataframe (must have imu_features, target_activity)
    target_classes : class IDs to synthesize (e.g. [0, 1, 5, 8])
    prob           : probability per real sample of generating each class
    rng            : numpy Generator

    Returns
    -------
    Augmented dataframe (originals + synthetic rows), shuffled.
    """
    # Parse imu_features strings → numpy arrays
    real_X = np.stack(
        df["imu_features"].apply(
            lambda x: np.array(ast.literal_eval(x), dtype=np.float32)
        ).values
    )  # shape: (N, 6)

    synthetic_rows = []

    for idx, (features, row) in enumerate(zip(real_X, df.itertuples(index=False))):
        for cls in target_classes:
            if rng.random() < prob:
                gen_fn   = CLASS_GENERATORS[cls]
                aug_feat = gen_fn(features.copy(), rng)

                synthetic_rows.append({
                    "imu_features"    : str(aug_feat.tolist()),
                    "fog_severity"    : float(row.fog_severity),
                    "time_of_day"     : float(row.time_of_day),
                    "movement_mag"    : float(row.movement_mag),
                    "source_file"     : "synthetic",
                    "window_start"    : -1,
                    "target_activity" : cls,
                })

    synth_df = pd.DataFrame(synthetic_rows, columns=df.columns)
    result   = pd.concat([df, synth_df], ignore_index=True)
    result   = result.sample(frac=1, random_state=42).reset_index(drop=True)

    return result


# reporting
def class_report(label: str, y: pd.Series) -> None:
    counts = y.value_counts().sort_index()
    total  = len(y)
    print(f"\n{label} ({total:,} total):")
    for cls, cnt in counts.items():
        bar = "█" * (cnt * 40 // total)
        print(f"  class {cls:>2}: {cnt:>6}  {bar}")


# CLI
def main():
    parser = argparse.ArgumentParser(
        description="Augment underrepresented FOG classes via IMU perturbation."
    )
    parser.add_argument("--input",   required=True,  help="Path to train_windows.csv")
    parser.add_argument("--output",  required=True,  help="Output CSV path")
    parser.add_argument("--classes", nargs="+", type=int, default=[5, 6, 7, 8],
                        help="Class IDs to synthesize (default: 5 6 7 8)")
    parser.add_argument("--prob",    type=float, default=0.3,
                        help="Per-sample generation probability (default: 0.3)")
    parser.add_argument("--seed",    type=int,   default=42)
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)

    print(f"Loading {args.input} ...")
    df = pd.read_csv(args.input)
    print(f"Loaded {len(df):,} rows.")

    class_report("BEFORE augmentation", df["target_activity"])

    print(f"\nAugmenting classes {args.classes} with prob={args.prob} per sample ...")
    df_out = augment_fog_classes(df, args.classes, args.prob, rng)

    class_report("AFTER augmentation", df_out["target_activity"])

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    df_out.to_csv(args.output, index=False)
    print(f"\nSaved → {args.output}")


if __name__ == "__main__":
    main()
