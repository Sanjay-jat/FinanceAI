import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time

TICKERS = {
    "gold": "GC=F",
    "silver": "SI=F",
    "nifty": "^NSEI"
}

_cache = {}
CACHE_DURATION_MINUTES = 5

def fetch_data(asset: str, period: str = "10y") -> pd.DataFrame:
    ticker = TICKERS.get(asset.lower())
    if not ticker:
        raise ValueError(f"Unknown asset: {asset}")

    if asset in _cache:
        age = datetime.now() - _cache[asset]["cached_at"]
        if age < timedelta(minutes=CACHE_DURATION_MINUTES):
            cached = _cache[asset]["data"]
            if not cached.empty:
                return cached.copy()

    # Retry up to 3 times — yfinance can return empty on first cold call
    for attempt in range(3):
        df = yf.download(ticker, period=period, auto_adjust=True, progress=False)

        # Flatten MultiIndex columns if present (common with futures GC=F)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df.dropna(inplace=True)

        if not df.empty:
            break

        print(f"⚠️ Empty data for {asset} (attempt {attempt + 1}/3), retrying...")
        time.sleep(2)

    if df.empty:
        raise ValueError(f"No data returned from yfinance for {asset} ({ticker}) after 3 attempts")

    _cache[asset] = {
        "data": df.copy(),
        "cached_at": datetime.now()
    }

    return df

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(series: pd.Series):
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    return macd, signal

def engineer_features(asset: str) -> pd.DataFrame:
    df = fetch_data(asset)

    # Force close to always be a clean 1D Series
    close = df["Close"]
    if hasattr(close, 'squeeze'):
        close = close.squeeze()
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]
    close = pd.Series(close.values, index=df.index)

    if len(close) < 30:
        raise ValueError(f"Not enough data for {asset} — only {len(close)} rows after cleaning")

    df["MA7"] = close.rolling(window=7).mean()
    df["MA30"] = close.rolling(window=30).mean()
    df["RSI"] = calculate_rsi(close)
    df["MACD"], df["MACD_Signal"] = calculate_macd(close)
    df["Volatility"] = close.rolling(window=7).std()
    df["TrendStrength"] = close - close.rolling(window=30).mean()
    df["Return"] = close.pct_change().shift(-1)
    df["Target"] = df["Return"].apply(lambda x: 1 if x > 0 else 0)

    df.dropna(inplace=True)

    if df.empty:
        raise ValueError(f"DataFrame empty after feature engineering for {asset}")

    return df