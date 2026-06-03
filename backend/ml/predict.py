import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
import pytz
import traceback
from ml.features import engineer_features

FEATURES = ["MA7", "MA30", "RSI", "MACD", "MACD_Signal",
            "Volatility", "TrendStrength"]

def is_market_open(asset: str) -> dict:
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    day = now.weekday()  # 0=Monday, 6=Sunday
    is_weekend = day >= 5  # Saturday=5, Sunday=6
    hour = now.hour
    minute = now.minute
    time_val = hour * 100 + minute

    asset = asset.lower()

    if asset in ["gold", "silver"]:
        # MCX Gold & Silver: Mon–Fri 9:00 AM – 11:30 PM IST only
        if is_weekend:
            is_open = False
            status = "Market Closed — No trading on weekends"
        else:
            is_open = (time_val >= 900) and (time_val <= 2330)
            if is_open:
                status = "Market Open"
            elif time_val < 900:
                status = "Market Closed — Opens at 9:00 AM IST"
            else:
                status = "Market Closed — Closes at 11:30 PM IST"

    elif asset == "nifty":
        # NSE Nifty 50: Mon–Fri 9:15 AM – 3:30 PM IST only
        if is_weekend:
            is_open = False
            status = "Market Closed — No trading on weekends"
        else:
            is_open = (time_val >= 915) and (time_val <= 1530)
            if is_open:
                status = "Market Open"
            elif time_val < 915:
                status = "Market Closed — Opens at 9:15 AM IST"
            else:
                status = "Market Closed — Closes at 3:30 PM IST"

    else:
        is_open = False
        status = "Unknown asset"

    return {
        "is_open": is_open,
        "day": now.strftime("%A"),
        "status": status,
    }

def load_model(asset: str):
    xgb_path = f"models/{asset}_xgb.pkl"
    scaler_path = f"models/{asset}_scaler.pkl"

    if not os.path.exists(xgb_path) or not os.path.exists(scaler_path):
        raise FileNotFoundError(
            f"Model files not found for {asset}. Run training first."
        )

    with open(xgb_path, "rb") as f:
        model = pickle.load(f)
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
    return model, scaler

def get_signal(asset: str) -> dict:
    try:
        df = engineer_features(asset)

        # Flatten all feature columns to clean 1D float values
        feature_row = {}
        for feat in FEATURES:
            col = df[feat]
            if isinstance(col, pd.DataFrame):
                col = col.iloc[:, 0]
            val = col.iloc[-1]
            if hasattr(val, '__iter__'):
                val = float(list(val)[0])
            else:
                val = float(val)
            feature_row[feat] = val

        latest = pd.DataFrame([feature_row], columns=FEATURES)

        if latest.isnull().values.any():
            bad = [f for f in FEATURES if pd.isna(feature_row[f])]
            raise ValueError(f"NaN in features after extraction: {bad}")

        model, scaler = load_model(asset)
        scaled = scaler.transform(latest)

        prediction = model.predict(scaled)[0]
        probability = model.predict_proba(scaled)[0]
        confidence = round(float(max(probability)), 2)
        signal = "BUY" if prediction == 1 else "SELL"

        market = is_market_open(asset)

        return {
            "asset": asset.upper(),
            "signal": signal,
            "confidence": confidence,
            "market_open": market["is_open"],
            "market_status": market["status"],
            "day": market["day"],
            "features": {
                "MA7":           round(feature_row["MA7"], 4),
                "MA30":          round(feature_row["MA30"], 4),
                "RSI":           round(feature_row["RSI"], 2),
                "MACD":          round(feature_row["MACD"], 4),
                "Volatility":    round(feature_row["Volatility"], 4),
                "TrendStrength": round(feature_row["TrendStrength"], 4),
            }
        }

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}