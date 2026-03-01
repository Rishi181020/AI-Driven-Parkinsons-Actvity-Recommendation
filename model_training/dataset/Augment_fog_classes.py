import argparse
import ast
import numpy as np
import pandas as pd
from pathlib import Path



def make_rest(real, rng):
    """Class 0 — Rest: near-stationary, gravity dominates vertical."""
    aug = real.copy()
    aug[0] = rng.normal(-0.98, 0.02)
    aug[1] = abs(rng.normal(0.008, 0.003))
    aug[2] = rng.normal(0.0,  0.02)
    aug[3] = abs(rng.normal(0.008, 0.003))
    aug[4] = rng.normal(0.0,  0.02)
    aug[5] = abs(rng.normal(0.008, 0.003))
    return aug


def make_seated(real, rng):
    """Class 1 — Seated Exercise: vertical suppressed, slight ML/AP arm movement."""
    aug = real.copy()
    aug[0] = rng.normal(-0.95, 0.03)
    aug[1] = abs(real[1]) * 0.3
    aug[2] += rng.normal(0, 0.08)
    aug[3] += abs(rng.normal(0, 0.06))
    aug[4] += rng.normal(0, 0.08)
    aug[5] += abs(rng.normal(0, 0.06))
    return aug


def make_balance(real, rng):
    """Class 3 — Balance Practice: moderate ML/AP sway, stable vertical."""
    aug = real.copy()
    aug[0] += rng.normal(0, 0.03)
    aug[1]  = abs(real[1]) * rng.uniform(0.8, 1.2)
    aug[2] += rng.normal(0, 0.12)
    aug[3] += abs(rng.normal(0, 0.08))
    aug[4] += rng.normal(0, 0.10)
    aug[5] += abs(rng.normal(0, 0.08))
    return aug


def make_medication_check(real, rng):
    """Class 6 — Medication Check: fully stationary, all axes near-zero."""
    aug = real.copy()
    aug[0] = rng.normal(-0.99, 0.01)
    aug[1] = abs(rng.normal(0.005, 0.002))
    aug[2] = rng.normal(0.0,  0.01)
    aug[3] = abs(rng.normal(0.005, 0.002))
    aug[4] = rng.normal(0.0,  0.01)
    aug[5] = abs(rng.normal(0.005, 0.002))
    return aug


CLASS_GENERATORS = {
    0: make_rest,
    1: make_seated,
    3: make_balance,
    6: make_medication_check,
}


def augment(df, target, rng):
    real_X = np.stack(
        df["imu_features"]
        .apply(lambda x: np.array(ast.literal_eval(x), dtype=np.float32))
        .values
    )

    synthetic_rows = []

    for cls, gen_fn in CLASS_GENERATORS.items():
        existing = (df["target_activity"] == cls).sum()
        n_needed = max(0, target - existing)

        if n_needed == 0:
            print(f"  class {cls}: {existing} real rows already — skipping")
            continue

        for _ in range(n_needed):
            idx      = rng.integers(0, len(real_X))
            features = real_X[idx]
            row      = df.iloc[idx]
            aug_feat = gen_fn(features.copy(), rng)

            synthetic_rows.append({
                "imu_features"   : str(aug_feat.tolist()),
                "fog_severity"   : float(np.clip(row.fog_severity + rng.normal(0, 0.02), 0, 1)),
                "time_of_day"    : float(row.time_of_day),
                "movement_mag"   : float(np.clip(row.movement_mag + rng.normal(0, 0.01), 0, None)),
                "source_file"    : "synthetic",
                "window_start"   : -1,
                "target_activity": cls,
            })

        print(f"  class {cls}: {existing} real + {n_needed} synthetic = {existing + n_needed}")

    synth_df = pd.DataFrame(synthetic_rows, columns=df.columns)
    result   = pd.concat([df, synth_df], ignore_index=True)
    result   = result.sample(frac=1, random_state=42).reset_index(drop=True)
    return result


def class_report(label, y):
    counts = y.value_counts().sort_index()
    total  = len(y)
    print(f"\n{label} ({total:,} total rows):")
    for cls, cnt in counts.items():
        bar = "█" * max(1, cnt * 30 // total)
        print(f"  class {cls:>2}:  {cnt:>6} rows  {bar}")


def main():
    parser = argparse.ArgumentParser(description="Augment underrepresented FOG activity classes.")
    parser.add_argument("--input",  default="train_windows.csv",           help="Input CSV (default: train_windows.csv)")
    parser.add_argument("--output", default="train_windows_augmented.csv", help="Output CSV (default: train_windows_augmented.csv)")
    parser.add_argument("--target", type=int, default=1500,                help="Target rows per augmented class (default: 1500)")
    parser.add_argument("--seed",   type=int, default=42,                  help="Random seed (default: 42)")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)

    print(f"Loading {args.input} ...")
    df = pd.read_csv(args.input)
    print(f"Loaded {len(df):,} rows.")

    class_report("BEFORE augmentation", df["target_activity"])

    print(f"\nAugmenting to {args.target} rows per class ...")
    df_out = augment(df, args.target, rng)

    class_report("AFTER augmentation", df_out["target_activity"])

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    df_out.to_csv(args.output, index=False)
    print(f"\nSaved → {args.output}")


if __name__ == "__main__":
    main()