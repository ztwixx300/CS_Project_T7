import glob
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import optuna 

# Load and clean Climate Data
climate_files = sorted(glob.glob('ClimateData/ArlingtonClimateData*.csv'))
df_climate = pd.concat([pd.read_csv(f) for f in climate_files], ignore_index=True)
df_climate['Date'] = pd.to_datetime(df_climate['Date'], format='mixed')
df_climate = df_climate.drop_duplicates(subset=['Date'])

# Turn #DIV/0 into NaN
for col in ['HighºF', 'LowºF', 'Average temp', 'Precip.inch']:
    df_climate[col] = pd.to_numeric(df_climate[col], errors='coerce')

# Set Date index 
df_climate = df_climate.set_index('Date').asfreq('D')

# Estimate missing temps for up to 3 days in a row
temp_cols = ['HighºF', 'LowºF', 'Average temp']
df_climate[temp_cols] = df_climate[temp_cols].interpolate(method='time', limit=3)

# Create rain binary feature
df_climate['Precip.inch'] = df_climate['Precip.inch'].fillna(0)
df_climate['is_raining'] = (df_climate['Precip.inch'] > 0).astype(int) 

# Load and clean AQI Data
aqi_files = sorted(glob.glob('data/aqidaily*.csv'))
df_aqi = pd.concat([pd.read_csv(f) for f in aqi_files], ignore_index=True)
df_aqi['Date'] = pd.to_datetime(df_aqi['Date'], format='mixed')
df_aqi = df_aqi.drop_duplicates(subset=['Date'])
df_aqi = df_aqi.set_index('Date').asfreq('D')
for col in ['PM25', 'Ozone', 'NO2', 'CO']:
    df_aqi[col] = pd.to_numeric(df_aqi[col], errors='coerce')

# Merge AQI and Climate data 
df = pd.merge(df_aqi, df_climate, left_index=True, right_index=True, how='inner')

df = df.reset_index()
print("Climate files found:", climate_files)
print("AQI files found:", aqi_files)
# Cyclic time features 
df['year'] = df['Date'].dt.year
df['month'] = df['Date'].dt.month
df['day_of_week'] = df['Date'].dt.day_of_week
# Using sin and cos to connect Dec 31 to Jan 1
df['sin_day'] = np.sin(2 * np.pi * df['Date'].dt.dayofyear / 365.25)
df['cos_day'] = np.cos(2 * np.pi * df['Date'].dt.dayofyear / 365.25)

# PM2.5 lags from previous 2 days
df['PM25_lag1'] = df['PM25'].shift(1)
df['PM25_lag2'] = df['PM25'].shift(2)
# Rolling trend window to smooth out short term changes
df['pm25_roll_mean_3d'] = df['PM25_lag1'].rolling(window=3).mean()
df['pm25_roll_mean_7d'] = df['PM25_lag1'].rolling(window=7).mean()
df['pm25_roll_std_7d'] = df['PM25_lag1'].rolling(window=7).std()
# Momentum over last 2 days
df['pm25_trend'] = df['PM25_lag1'] - df['PM25_lag2']
# Weather lags (how was weather yesterday?)
df['high_lag1'] = df['HighºF'].shift(1)
df['low_lag1'] = df['LowºF'].shift(1)
df['precip_lag1'] = df['Precip.inch'].shift(1)

# Drop initial rows with NaN caused by rolling windows
df_clean = df.dropna().reset_index(drop=True)

feature_cols = [
   'day_of_week',
    'sin_day',
    'cos_day',
    'PM25_lag1',
    'PM25_lag2',
    'pm25_roll_mean_3d',
    'pm25_roll_mean_7d',
    'pm25_roll_std_7d',
    'pm25_trend',
    'HighºF', 
    'LowºF', 
    'Precip.inch', 
    'is_raining',
    'high_lag1',
    'low_lag1'
]

# Select different years for different data sets without overlap
train_mask = df_clean['year'].between(2015, 2023)
val_mask = df_clean['year'] == 2024
test_mask = df_clean['year'] == 2025

X_train, y_train = (
    df_clean.loc[train_mask, feature_cols],
    df_clean.loc[train_mask, 'PM25'],
)
X_val, y_val = df_clean.loc[val_mask, feature_cols], df_clean.loc[val_mask, 'PM25']
X_test, y_test = (
    df_clean.loc[test_mask, feature_cols],
    df_clean.loc[test_mask, 'PM25'],
)

dtrain = xgb.DMatrix(X_train, label=y_train)
dval = xgb.DMatrix(X_val, label=y_val)
dtest = xgb.DMatrix(X_test, label=y_test)

def objective(trial): 
    # Hyperparameter search space
    param_grid = {
        'objective': 'reg:squarederror',
        'eval_metric': 'mae',
        # Tree complexity
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
        'gamma': trial.suggest_float('gamma', 1e-8, 1.0, log=True), 
        'seed': 42,
        # Overfitting prevention
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        # Learning speed
        'learning_rate': trial.suggest_float('learning_rate', 0.005, 0.1, log=True)
    }

    # Train model inside trial
    model = xgb.train(
        params=param_grid, 
        dtrain=dtrain, 
        num_boost_round=1000,
        evals=[(dtrain, 'train'), (dval, 'val')],
        early_stopping_rounds=30,
        verbose_eval=False
    )
    # Return best validation MAE to Optuna so it can minimize it
    return model.best_score

# Create and run optimization study 
study = optuna.create_study(direction='minimize', sampler=optuna.samplers.TPESampler(seed=42))
study.optimize(objective, n_trials=150)

# Extract best parameters
print("\nBest parameters found by Optuna:")
for key, value in study.best_params.items():
    print(f"{key}: {value}")

# Retrain model using best parameters
best_params = study.best_params
best_params['objective'] = 'reg:squarederror'
best_params['eval_metric'] = 'mae'

final_model = xgb.train(
    params=best_params, 
    dtrain=dtrain, 
    num_boost_round=1000,
    evals=[(dtrain, 'train'), (dval, 'val')],
    early_stopping_rounds=30,
    verbose_eval=50
)
# Results
preds = final_model.predict(dtest)
print(f'Test R²:   {r2_score(y_test, preds):.4f}')
print(f'Test MAE:  {mean_absolute_error(y_test, preds):.2f} AQI points')
print(f'Test RMSE: {np.sqrt(mean_squared_error(y_test, preds)):.2f} AQI points')
