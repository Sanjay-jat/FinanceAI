import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

TICKERS = {
    "gold": "GC=F",
    "silver": "SI=F",
    "nifty": "^NSEI"
}

# Cache: stores { asset: { "data": df, "cached_at": datetime } }
_cache = {}
CACHE_DURATION_MINUTES = 5

def fetch_data(asset: str, period: str = "10y") -> pd.DataFrame:
    ticker = TICKERS.get(asset.lower())
    if not ticker:
        raise ValueError(f"Unknown asset: {asset}")

    # Return cached data if still fresh
    if asset in _cache:
        age = datetime.now() - _cache[asset]["cached_at"]
        if age < timedelta(minutes=CACHE_DURATION_MINUTES):
            return _cache[asset]["data"].copy()

    # Fresh download
    df = yf.download(ticker, period=period, auto_adjust=True)
    df.dropna(inplace=True)

    # Store in cache
    _cache[asset] = {
        "data": df.copy(),
        "cached_at": datetime.now()
    }

    return df

# RSI
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

    close = df["Close"].squeeze()

    df["MA7"] = close.rolling(window=7).mean()
    df["MA30"] = close.rolling(window=30).me