import yfinance as yf
import pandas as pd
import numpy as np

TICKERS = {
    "gold": "GC=F",
    "silver": "SI=F",
    "nifty": "^NSEI"
}

def fetch_data(asset: str, period: str = "10y") -> pd.DataFrame:
    ticker = TICKERS.get(asset.lower())
    if not ticker:
        raise ValueError(f"Unknown asset: {asset}")
    df = yf.download(ticker, period=period, auto_adjust=True)   
    df.dropna(inplace=True)
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

    # Moving Averages
    df["MA7"] = close.rolling(window=7).mean()
    df["MA30"] = close.rolling(window=30).mean()


    # RSI
    df["RSI"] = calculate_rsi(close)

    # MACD
    df["MACD"], df["MACD_Signal"] = calculate_macd(close)

    # Volatility
    df["Volatility"] = close.rolling(window=7).std()

    # Trend Strength
    df["TrendStrength"] = close - close.rolling(window=30).mean()

    # Target — what we want to predict
    df["Return"] = close.pct_change().shift(-1)
    df["Target"] = df["Return"].apply(
        lambda x: 1 if x > 0 else 0
    )

    df.dropna(inplace=True)
    return df