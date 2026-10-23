import glob
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb
from lightgbm import early_stopping

# Load and concatenate all csv files
file_list = sorted(glob.glob('data/aqidaily202*.csv'))
dfs = [pd.read_csv(f) for f in file_list]
df = pd.concat(dfs, ignore_index=True)

# Sort dates 
df['Date'] = pd.to_datetime(df['Date'])
df = (
    df.sort_values('Date')
    .drop_duplicates(subset=['Date'])
    .reset_index(drop=True)
)

# Cyclic time features 
df['year'] = df['Date'].dt.year
df['month'] = df['Date'].dt.month
df['day_of_week'] = df['Date'].dt.day_of_week
# Using sin and cos to connect Dec 31 to Jan 1
df['sin_day'] = np.sin(2 * np.pi * df['Date'].dt.dayofyear / 365.25)
df['cos_day'] = np.cos(2 * np.pi * df['Date'].dt.dayofyear / 365.25)

# Pollutant lags from previous 2 days
for col in ['PM25', 'Ozone', 'NO2', 'CO']:
    # Replace strings with NaN
    df[col] = pd.to_numeric(df[col], errors='coerce')
    df[f'{col}_lag1'] = df[col].shift(1)
    df[f'{col}_lag2'] = df[col].shift(2)

# Rolling trend window to smooth out short term changes
df['pm25_roll_mean_3d'] = df['PM25_lag1'].rolling(window=3).mean()
df['pm25_roll_mean_7d'] = df['PM25_lag1'].rolling(window=7).mean()
df['pm25_roll_std_7d'] = df['PM25_lag1'].rolling(window=7).std()

# Momentum over last 2 days
df['pm25_trend'] = df['PM25_lag1'] - df['PM25_lag2']

# Drop initial rows with NaN caused by rolling windows
df_clean = df.dropna().reset_index(drop=True)

feature_cols = [
    'year',
    'month',
    'day_of_week',
    'sin_day',
    'cos_day',
    'PM25_lag1',
    'PM25_lag2',
    'Ozone_lag1',
    'NO2_lag1',
    'CO_lag1',
    'pm25_roll_mean_3d',
    'pm25_roll_mean_7d',
    'pm25_roll_std_7d',
    'pm25_trend',
]

# Select different years for different data sets without overlap
train_mask = df_clean['year'] <= 2024
val_mask = df_clean['year'] == 2025
test_mask = df_clean['year'] == 2026


X_train, y_train = (
    df_clean.loc[train_mask, feature_cols],
    df_clean.loc[train_mask, 'PM25'],
)
X_val, y_val = df_clean.loc[val_mask, feature_cols], df_clean.loc[val_mask, 'PM25']
X_test, y_test = (
    df_clean.loc[test_mask, feature_cols],
    df_clean.loc[test_mask, 'PM25'],
)

model_lgb = lgb.LGBMRegressor(
    n_estimators=300,
    learning_rate=0.03,
    random_state=42
)

model_lgb.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    callbacks=[early_stopping(stopping_rounds=50)]
)
preds_lgb = model_lgb.predict(X_test)

# Results
print(f'Test R²:   {r2_score(y_test, preds_lgb):.4f}')
print(f'Test MAE:  {mean_absolute_error(y_test, preds_lgb):.2f} AQI points')
print(f'Test RMSE: {np.sqrt(mean_squared_error(y_test, preds_lgb)):.2f} AQI points')