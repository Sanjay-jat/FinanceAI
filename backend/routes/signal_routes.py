from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from auth.jwt_handler import verify_token
from ml.predict import get_signal

router = APIRouter(prefix="/signals", tags=["Signals"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return email

# Public route 
@router.get("/public/{asset}")
def get_public_signal(asset: str):
    if asset.lower() not in ["gold", "silver", "nifty"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid asset. Choose gold, silver or nifty"
        )
    result = get_signal(asset)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    return result

# Protected route — needs JWT token
from database.connection import get_db
from database.models import SignalHistory
from sqlalchemy.orm import Session

@router.get("/private/{asset}")
def get_private_signal(
    asset: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    if asset.lower() not in ["gold", "silver", "nifty"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid asset"
        )

    result = get_signal(asset)

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )

    # Save to history
    history = SignalHistory(
        user_email=current_user,
        asset=asset,
        signal=result["signal"],
        confidence=result["confidence"],
        rsi=result["features"].get("RSI"),
        macd=result["features"].get("MACD"),
        ma7=result["features"].get("MA7"),
        ma30=result["features"].get("MA30"),
        market_open=result.get("market_open", True)
    )
    db.add(history)
    db.commit()

    result["requested_by"] = current_user
    return result


import httpx
import os

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

@router.get("/news")
async def get_news():
    url = (
        f"https://newsapi.org/v2/everything?"
        f"q=%22gold%22+OR+%22silver%22+OR+%22nifty%2050%22+OR+%22sensex%22+OR+%22commodity%22&"
        f"language=en&"
        f"sortBy=publishedAt&"
        f"pageSize=6&"
        f"domains=reuters.com,economictimes.indiatimes.com,moneycontrol.com,livemint.com,bloomberg.com&"
        f"apiKey={NEWS_API_KEY}"
    )
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()

    articles = []
    for article in data.get("articles", []):
        articles.append({
            "title": article["title"],
            "source": article["source"]["name"],
            "published_at": article["publishedAt"],
            "url": article["url"]
        })
    return {"news": articles}

@router.get("/chart/{asset}")
def get_chart_data(asset: str, period: str = "3M"):
    import yfinance as yf
    from datetime import datetime, timedelta

    tickers = {"gold": "GC=F", "silver": "SI=F", "nifty": "^NSEI"}
    ticker = tickers.get(asset.lower())

    periods = {
        "1M": 30, "3M": 90,
        "6M": 180, "1Y": 365, "All": 3650
    }
    days = periods.get(period, 90)
    end = datetime.today()
    start = end - timedelta(days=days)

    df = yf.download(ticker, start=start, end=end, auto_adjust=True)
    df.dropna(inplace=True)

    import pandas as pd
    close = df["Close"].squeeze()
    ma7 = close.rolling(7).mean()
    ma30 = close.rolling(30).mean()

    result = []
    for date, row in df.iterrows():
        result.append({
            "date": str(date.date()),
            "open": round(float(df["Open"].squeeze()[date]), 2),
            "high": round(float(df["High"].squeeze()[date]), 2),
            "low": round(float(df["Low"].squeeze()[date]), 2),
            "close": round(float(close[date]), 2),
            "ma7": round(float(ma7[date]), 2) if not pd.isna(ma7[date]) else None,
            "ma30": round(float(ma30[date]), 2) if not pd.isna(ma30[date]) else None,
        })

    return {"asset": asset, "period": period, "data": result}

@router.get("/price/{asset}")
def get_price(asset: str):
    import yfinance as yf
    tickers = {"gold": "GC=F", "silver": "SI=F", "nifty": "^NSEI"}
    ticker = tickers.get(asset.lower())
    data = yf.Ticker(ticker)
    hist = data.history(period="2d")
    
    current = round(float(hist["Close"].iloc[-1]), 2)
    previous = round(float(hist["Close"].iloc[-2]), 2)
    change = round(current - previous, 2)
    change_pct = round((change / previous) * 100, 2)
    
    return {
        "asset": asset,
        "price": current,
        "change": change,
        "changePercent": change_pct
    }


@router.get("/backtest/{asset}")
def backtest(asset: str, period: str = "6M", current_user: str = Depends(get_current_user)):
    import yfinance as yf
    from datetime import datetime, timedelta

    tickers = {"gold": "GC=F", "silver": "SI=F", "nifty": "^NSEI"}
    ticker = tickers.get(asset.lower())

    periods = {"1M": 30, "3M": 90, "6M": 180, "1Y": 365}
    days = periods.get(period, 180)
    end = datetime.today()
    start = end - timedelta(days=days)

    df = yf.download(ticker, start=start, end=end, auto_adjust=True)
    df.dropna(inplace=True)

    close = df["Close"].squeeze()
    returns = close.pct_change().dropna()

    import pickle
    import numpy as np
    from ml.features import engineer_features

    features_df = engineer_features(asset)
    FEATURES = ["MA7", "MA30", "RSI", "MACD", "MACD_Signal", "Volatility", "TrendStrength"]

    with open(f"models/{asset}_xgb.pkl", "rb") as f:
        model = pickle.load(f)
    with open(f"models/{asset}_scaler.pkl", "rb") as f:
        scaler = pickle.load(f)

    results = []
    cumulative = 1.0
    wins = 0
    losses = 0

    common_dates = features_df.index.intersection(returns.index)

    for date in common_dates[-days:]:
        try:
            row = features_df.loc[date, FEATURES].values.reshape(1, -1)
            scaled = scaler.transform(row)
            pred = model.predict(scaled)[0]
            signal = "BUY" if pred == 1 else "SELL"

            ret = float(returns.loc[date])
            strategy_ret = ret if pred == 1 else -ret
            cumulative *= (1 + strategy_ret)

            if strategy_ret > 0:
                wins += 1
            else:
                losses += 1

            results.append({
                "date": str(date.date()),
                "signal": signal,
                "return": round(ret * 100, 3),
                "strategy_return": round(strategy_ret * 100, 3),
                "cumulative": round((cumulative - 1) * 100, 2)
            })
        except:
            continue

    total = wins + losses
    return {
        "asset": asset,
        "period": period,
        "total_return": round((cumulative - 1) * 100, 2),
        "win_rate": round(wins / total * 100, 1) if total > 0 else 0,
        "total_trades": total,
        "wins": wins,
        "losses": losses,
        "data": results
    }


@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    records = db.query(SignalHistory)\
        .filter(SignalHistory.user_email == current_user)\
        .order_by(SignalHistory.created_at.desc())\
        .limit(50)\
        .all()

    return {
        "history": [
            {
                "id": r.id,
                "asset": r.asset,
                "signal": r.signal,
                "confidence": r.confidence,
                "rsi": r.rsi,
                "macd": r.macd,
                "ma7": r.ma7,
                "ma30": r.ma30,
                "market_open": r.market_open,
                "created_at": str(r.created_at)
            }
            for r in records
        ]
    }