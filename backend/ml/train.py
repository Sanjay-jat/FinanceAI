import os
import pickle
import numpy as np
from ml.features import engineer_features
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

FEATURES = ["MA7", "MA30", "RSI", "MACD", "MACD_Signal",
            "Volatility", "TrendStrength"]


def train_model(asset: str):
    print(f"\nTraining models for {asset}...")

    df = engineer_features(asset)

    X = df[FEATURES]
    y = df["Target"]

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, shuffle=False
    )

    # Logistic Regression
    lr = LogisticRegression(max_iter=1000, class_weight="balanced")
    lr.fit(X_train, y_train)
    lr_preds = lr.predict(X_test)
    print(f"\n--- Logistic Regression ({asset}) ---")
    print(classification_report(y_test, lr_preds))

    # XGBoost — main model
    xgb = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        eval_metric="mlogloss",
        random_state=42
    )

    xgb.fit(X_train, y_train)
    xgb_preds = xgb.predict(X_test)
    print(f"\n--- XGBoost ({asset}) ---")
    print(classification_report(y_test, xgb_preds))

    # Save models
    os.makedirs("models", exist_ok=True)
    with open(f"models/{asset}_xgb.pkl", "wb") as f:
        pickle.dump(xgb, f)
    with open(f"models/{asset}_lr.pkl", "wb") as f:
        pickle.dump(lr, f)
    with open(f"models/{asset}_scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    print(f"\n✅ Models saved for {asset}")
    return xgb, lr, scaler


if __name__ == "__main__":
    for asset in ["gold", "silver", "nifty"]:
        train_model(asset)