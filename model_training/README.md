# Train Windows Dataset

Windowed IMU dataset for Parkinson's activity recommendation.

---

## Shape

Each row = one 10-second window (1000 samples @ 100 Hz, 50% overlap).

**Saved as:** `train_windows.csv`

---

## Columns

| Column | Type | Description |
|---|---|---|
| `imu_features` | List[float] | 6 statistical IMU features (mean + std of vertical, medial-lateral, and anterior-posterior acceleration) |
| `fog_severity` | float | Window-level proxy score representing recent freezing-of-gait intensity based on event signal averages |
| `time_of_day` | float ∈ [0, 24) | Synthetic hour-of-day feature derived from sample index to model daily activity context |
| `movement_mag` | float | Mean acceleration vector magnitude within the window, used as a proxy for movement intensity |
| `source_file` | string | Name of the original recording session from which the window was extracted |
| `window_start` | int | Starting sample index of the 10-second window within the source file |
| `target_activity` | int | Rule-based activity recommendation label generated from FOG severity, movement level, and time context |

---

## Feature Details

**`imu_features`** — 6 statistical features:
- Mean + Std of AccV (vertical)
- Mean + Std of AccML (medial-lateral)
- Mean + Std of AccAP (anterior-posterior)

**`fog_severity`** — Window-level proxy score derived from:
```
mean(StartHesitation) + mean(Turn) + mean(Walking)
```
Higher = stronger FOG signal.

**`time_of_day`** — Synthetic cyclic hour feature derived from sample index.

**`movement_mag`** — Mean acceleration vector magnitude (activity intensity proxy).

---

## Target Activity Labels

| ID | Activity |
|---|---|
| 0 | Rest |
| 1 | Seated Exercise |
| 2 | Gait Training |
| 3 | Balance Practice |
| 4 | Stretching |
| 6 | Medication Check |

---

## Purpose

Transforms raw FOG recordings into structured supervision for training a multi-class activity recommendation model.

