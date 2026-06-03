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

def is_market_open() -> dict:
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    day = now.weekday()  # 0=Mon, 6=Sun

    is_weekend = day >= 5
    hour = now.hour
    minute = now.minute
    time_val = hour * 100 + minute

    # Indian market hours: 9:15 AM – 3:30 PM IST, weekdays only
    is_trading_hours = (time_val >= 915) and (time_val <= 1530)
    is_open = (not is_weekend) and is_trading_hours

    if is_weekend:
        status = "Market Closed — Weekend"
    elif not is_trading_hours:
        status = "Market Closed — Outside Trading Hours (9:15 AM – 3:30 PM IST)"
    else:
        status = "Market Open"

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

        # --- THE FIX ---
        # Flatten all feature columns to clean 1D float Series
        # before building the feature row. This neutralises any
        # MultiIndex column bleed-through from yfinance for GC=F.
        feature_row = {}
        for feat in FEATURES:
            col = df[feat]
            if isinstance(col, pd.DataFrame):
                col = col.iloc[:, 0]
            val = col.iloc[-1]
            # unwrap any remaining array/Series wrapper
            if hasattr(val, '__iter__'):
                val = float(list(val)[0])
            else:
                val = float(val)
            feature_row[feat] = val

        latest = pd.DataFrame([feature_row], columns=FEATURES)

        # Validate — no NaN allowed going into scaler
        if latest.isnull().values.any():
            bad = [f for f in FEATURES if pd.isna(feature_row[f])]
            raise ValueError(f"NaN in features after extraction: {bad}")

        model, scaler = load_model(asset)
        scaled = scaler.transform(latest)

        prediction = model.predict(scaled)[0]
        probability = model.predict_proba(scaled)[0]
        confidence = round(float(max(probability)), 2)
        signal = "BUY" if prediction == 1 else "SELL"

        market = is_market_open()

        return {
            "asset": asset.upper(),
            "signal": signal,
            "confidence": confidence,
            "market_open": market["is_open"],
            "market_status": market["status"],
            "day": market["day"],
            "features": {
                "MA7":          round(feature_row["MA7"], 4),
                "MA30":         round(feature_row["MA30"], 4),
                "RSI":          round(feature_row["RSI"], 2),
                "MACD":         round(feature_row["MACD"], 4),
                "Volatility":   round(feature_row["Volatility"], 4),
                "TrendStrength":round(feature_row["TrendStrength"], 4),
            }
        }

    except Exception as e:
        # Print full traceback to Render logs so you can see exactly
        # what line fails for each asset
        traceback.print_exc()
        return {"error": str(e)}