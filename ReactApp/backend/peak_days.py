from pathlib import Path
import pandas as pd

CSV_PATH = Path(__file__).parent / 'data' / 'aqidaily2025.csv'
RANK_BY = 'PM25'  # 'PM25', 'Ozone', 'CO', 'NO2', or 'Overall AQI Value'


def _clean(value):
    return None if pd.isna(value) else float(value)


def get_peak_days(days=7):
    df = pd.read_csv(CSV_PATH)
    df['Date'] = pd.to_datetime(df['Date'], format='%m/%d/%Y')
    for col in ['PM25', 'Ozone', 'CO', 'NO2', 'Overall AQI Value']:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    top = df.nlargest(days, RANK_BY)  # highest first
    return [
        {
            'date': row['Date'].strftime('%Y-%m-%d'),
            'pm25': _clean(row['PM25']),
            'ozone': _clean(row['Ozone']),
            'co': _clean(row['CO']),
            'no2': _clean(row['NO2']),
            'overall_aqi': _clean(row['Overall AQI Value']),
        }
        for _, row in top.iterrows()
    ]