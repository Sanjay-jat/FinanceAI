import pickle
import numpy as np
import pandas as pd
from datetime import datetime
import pytz
from ml.features import engineer_features

FEATURES = ["MA7", "MA30", "RSI", "MACD", "MACD_Signal",
            "Volatility", "TrendStrength"]

def is_market_open() -> dict:
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    day = now.weekday()  # 0=Monday 6=Sunday
    is_weekend = day >= 5

    return {
        "is_open": not is_weekend,
        "day": now.strftime("%A"),
        "status": "Market Closed — Showing Monday Prediction" 
                  if is_weekend else "Market Open",
    }

def load_model(asset: str):
    with open(f"models/{asset}_xgb.pkl", "rb") as f:
        model = pickle.load(f)
    with open(f"models/{asset}_scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
    return model, scaler

def get_signal(asset: str) -> dict:
    try:
        df = engineer_features(asset)
        latest = df[FEATURES].iloc[-1:]

        model, scaler = load_model(asset)
        scaled = scaler.transform(latest)

        prediction = model.predict(scaled)[0]
        probability = model.predict_proba(scaled)[0]
        confidence = round(float(max(probability)), 2)

        signal = "BUY" if prediction == 1 else "SELL"

        latest_row = df.iloc[-1]
        market = is_market_open()

        return {
            "asset": asset.upper(),
            "signal": signal,
            "confidence": confidence,
            "market_open": market["is_open"],
            "market_status": market["status"],
            "day": market["day"],
            "features": {
                "MA7": round(float(np.array(latest_row["MA7"]).flatten()[0]), 4),
                "MA30": round(float(np.array(latest_row["MA30"]).flatten()[0]), 4),
                "RSI": round(float(np.array(latest_row["RSI"]).flatten()[0]), 2),
                "MACD": round(float(np.array(latest_row["MACD"]).flatten()[0]), 4),
                "Volatility": round(float(np.array(latest_row["Volatility"]).flatten()[0]), 4),
                "TrendStrength": round(float(np.array(latest_row["TrendStrength"]).flatten()[0]), 4),
            }
        }

    except Exception as e:
        return {"error": str(e)}