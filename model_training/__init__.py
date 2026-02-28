import pandas as pd
import numpy as np

def load_fog_series(folder='train/defog'):
    """Load one FOG series → windows"""
    all_windows = []
    
    for file in os.listdir(folder):
        if file.endswith('.csv'):
            df = pd.read_csv(f"{folder}/{file}")
            
            # 10s windows (1000 samples @100Hz)
            for i in range(0, len(df)-1000, 500):  # 50% overlap
                window = df.iloc[i:i+1000].copy()
                
                # IMU features (12 feats)
                acc_v = window['AccV'].values
                imu_feats = [
                    np.mean(acc_v), np.std(acc_v), 
                    np.mean(window['AccML']), np.std(window['AccML']),
                    np.mean(window['AccAP']), np.std(window['AccAP'])
                ]
                
                # FOG state (recent 30s avg)
                recent_fog = window['StartHesitation'].mean() + \
                           window['Turn'].mean() + \
                           window['Walking'].mean()
                
                window_data = {
                    'imu_features': imu_feats,
                    'fog_severity': recent_fog,
                    'time_of_day': i / 100 / 3600 % 24,  # Hours
                    'movement_mag': np.linalg.norm(imu_feats[:3])  # Proxy activity level
                }
                all_windows.append(window_data)
    
    return pd.DataFrame(all_windows)
