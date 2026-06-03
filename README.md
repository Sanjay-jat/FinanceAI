<div align="center">

# FinanceAI

**Financial Signal Classification System**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-FF6600?style=for-the-badge&logo=python&logoColor=white)](https://xgboost.readthedocs.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

### **[🚀 Live Demo → finance-ai-eight-vert.vercel.app](https://finance-ai-eight-vert.vercel.app)**

*Deployed on Vercel (frontend) · Render (backend) · Supabase PostgreSQL (database)*

</div>

---

## Screenshots

### Dashboard — Live Signals & Price Charts
![Dashboard](screenshots/dashboard.png)

### Backtesting — Historical Signal Performance
![Backtesting](screenshots/backtesting.png)

---

## What This Project Does

FinanceAI is a production-deployed, full-stack machine learning platform that generates next-day **BUY / SELL signals** for Gold, Silver, and Nifty 50 using XGBoost trained on 10 years of market data.

Rather than predicting exact prices — which is statistically unreliable — FinanceAI frames the problem as **binary classification**: will this asset close higher or lower tomorrow? This is more honest, measurable, and actionable.

The platform is built end-to-end: data pipeline → feature engineering → model training → REST API → React frontend → cloud deployment — with JWT authentication, a backtesting engine, signal history per user, live financial news, and automated weekly model retraining.

---

## Why This Project Stands Out

- **Not a tutorial clone.** Every component — ML pipeline, auth system, backtesting engine, frontend — was designed and built from scratch.
- **Production deployed.** Live on the internet with a real database, not just running on localhost.
- **Freemium access model.** Public dashboard for all users, protected routes (Backtesting, History) for authenticated users — mirrors real SaaS product design.
- **Automated MLOps.** Models retrain every Sunday midnight via APScheduler without any manual intervention.
- **Honest ML.** Model accuracy and metrics are shown transparently on the dashboard — no inflated numbers.

---

## Features

| Feature | Description |
|---|---|
| Signal Classification | BUY / SELL predictions for Gold, Silver, Nifty 50 |
| Confidence Score | Model probability shown with every signal |
| Live Price Data | Real-time market data via Yahoo Finance |
| Interactive Charts | Line chart, Candlestick, Moving Average Overlay |
| Backtesting Engine | Historical signal performance across 1M / 3M / 6M / 1Y |
| Market Mood Gauge | Fear / Neutral / Greed calculated from RSI, MACD, Trend |
| Live Financial News | Bloomberg, Reuters, Livemint via NewsAPI |
| Signal History | Personal log of every signal checked per user |
| JWT Authentication | Secure register, login, and protected route system |
| Freemium Access Model | Public dashboard — Backtesting and History require login |
| Weekly Auto-Retraining | Model retrains every Sunday at midnight via APScheduler |
| Weekend Detection | Displays market closed status and Monday prediction |
| Response Caching | 5-minute in-memory cache on yfinance calls for faster loads |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│           React + Vite + Tailwind CSS                   │
│   Dashboard · Backtesting · History · Auth Pages        │
│              Deployed on Vercel                         │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP / REST API (Axios + JWT)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     BACKEND                             │
│                 FastAPI + Python                        │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │  Auth Layer │  │  ML Engine  │  │  Data Layer   │   │
│  │  JWT Tokens │  │  XGBoost    │  │  yfinance     │   │
│  │  Bcrypt     │  │  Features   │  │  NewsAPI      │   │
│  │  Register   │  │  Predict    │  │  PostgreSQL   │   │
│  │  Login      │  │  Backtest   │  │  SQLAlchemy   │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
│                                                         │
│           APScheduler → Weekly Retrain                  │
│              Deployed on Render                         │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    DATABASE                             │
│              PostgreSQL on Supabase                     │
│        Users Table · Signal History Table               │
└─────────────────────────────────────────────────────────┘
```

---

## Machine Learning

### Feature Engineering

```python
FEATURES = [
    "RSI",            # Relative Strength Index
    "MACD",           # Moving Average Convergence Divergence
    "MACD_Signal",    # MACD signal line
    "MA7",            # 7-day Moving Average
    "MA30",           # 30-day Moving Average
    "Volatility",     # 7-day rolling standard deviation
    "TrendStrength",  # Distance from 30-day mean
]
```

### Target Variable

```python
df["Target"] = df["Return"].apply(
    lambda x: 1 if x > 0 else 0   # 1 = BUY, 0 = SELL
)
```

### Model Performance

| Asset | Model | Accuracy | Precision | Recall | F1 Score |
|---|---|---|---|---|---|
| Gold | XGBoost | 59% | 0.56 | 0.59 | 0.53 |
| Silver | XGBoost | 51% | 0.55 | 0.51 | 0.49 |
| Nifty 50 | XGBoost | 52% | 0.51 | 0.52 | 0.48 |

Trained on 10 years of daily OHLCV data (~2500 rows per asset). Logistic Regression used as baseline for comparison. Models retrain automatically every Sunday.

### Why XGBoost over LSTM

- Input is engineered tabular features, not raw sequences. Tree-based models consistently outperform LSTMs on tabular data.
- XGBoost provides feature importance scores, making predictions interpretable and explainable.
- Training time is significantly lower — important for weekly automated retraining on a free server.
- LSTM requires substantially larger datasets to generalize well. ~2500 rows is insufficient for reliable sequence learning.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python | Core backend language |
| SQLAlchemy | ORM and database abstraction |
| PostgreSQL | Production relational database |
| python-jose | JWT token creation and verification |
| Passlib + Bcrypt | Secure password hashing |
| APScheduler | Background job scheduling |
| httpx | Async HTTP client for news API |

### Machine Learning
| Technology | Purpose |
|---|---|
| XGBoost | Primary classification model |
| Logistic Regression | Baseline comparison model |
| yfinance | 10 years of historical OHLCV data |
| scikit-learn | Feature scaling and evaluation metrics |
| pandas + numpy | Data processing and transformation |

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | Component-based UI framework |
| JavaScript (ES6+) | Core frontend language |
| Tailwind CSS | Utility-first styling |
| Recharts | Price and backtesting charts |
| React Router | Client-side page routing |
| Axios | API communication with JWT interceptors |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting (automatic deploys from GitHub) |
| Render | Backend hosting (free tier, Python 3) |
| Supabase | Managed PostgreSQL database |

---

## Project Structure

```
financeAi/
│
├── backend/
│   ├── auth/
│   │   ├── hashing.py              # Password hashing with bcrypt
│   │   └── jwt_handler.py          # JWT token creation and verification
│   │
│   ├── database/
│   │   ├── connection.py           # PostgreSQL engine and session
│   │   └── models.py               # User and SignalHistory tables
│   │
│   ├── ml/
│   │   ├── features.py             # Data fetching and feature engineering
│   │   ├── train.py                # Model training pipeline
│   │   ├── predict.py              # Live signal generation
│   │   └── scheduler.py            # Weekly retraining scheduler
│   │
│   ├── routes/
│   │   ├── auth_routes.py          # Register and login endpoints
│   │   └── signal_routes.py        # Signal, backtest, news, history
│   │
│   ├── models/                     # Trained .pkl files (XGBoost + scalers)
│   ├── main.py                     # FastAPI app entry point
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx        # Public main page
        │   ├── Backtesting.jsx      # Protected signal performance
        │   ├── History.jsx          # Protected personal signal log
        │   ├── Login.jsx
        │   └── Register.jsx
        │
        ├── components/
        │   ├── Navbar.jsx           # Top bar with live price ticker
        │   ├── Sidebar.jsx          # Navigation, asset selector, news
        │   ├── AssetCard.jsx        # Price, signal, confidence display
        │   ├── PriceChart.jsx       # Line, Candlestick, MA chart
        │   ├── MoodGauge.jsx        # Market mood semicircle gauge
        │   └── SignalBanner.jsx     # Today's signal with confidence
        │
        ├── context/
        │   └── AuthContext.jsx      # JWT token global state
        │
        └── api/
            └── axios.js             # Axios instance with interceptors
```

---

## API Reference

```
PUBLIC
GET    /signals/public/{asset}        Signal, confidence, features
GET    /signals/price/{asset}         Live price and daily change
GET    /signals/chart/{asset}         OHLCV data for charts
GET    /signals/news                  Live financial news

AUTHENTICATION
POST   /auth/register                 Create a new account
POST   /auth/login                    Authenticate and receive JWT token

PROTECTED  (Authorization: Bearer <token>)
GET    /signals/private/{asset}       Signal saved to user history
GET    /signals/backtest/{asset}      Backtesting results
GET    /signals/history               Personal signal history
```

Swagger UI: https://financeai-backend-0iqu.onrender.com/docs

---

## Running Locally

### Backend

```bash
git clone https://github.com/sanjayjat354339-cell/FinanceAI.git
cd FinanceAI/backend

python -m venv finance
finance\Scripts\activate

pip install -r requirements.txt
```

Create `.env` in `backend/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/financedb
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
NEWS_API_KEY=your_newsapi_key
```

```bash
python -m ml.train
uvicorn main:app --reload
```

API at `http://127.0.0.1:8000` · Swagger at `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App at `http://localhost:5173`

---

## Access Model

```
Public Access                     Login Required
─────────────────────             ──────────────────────
Dashboard                         Backtesting Page
Live Signals                      Signal History
Price Charts                      Personal Signal Log
Market Mood Gauge
Live Features Panel
Financial News Feed
```

---

## Roadmap

- [x] XGBoost binary classification pipeline
- [x] FastAPI backend with JWT authentication
- [x] React frontend with live charts
- [x] Backtesting engine
- [x] Signal history per user
- [x] Automated weekly model retraining
- [x] Live financial news feed
- [x] Weekend market detection
- [x] Response caching for faster loads
- [x] Production deployment (Vercel + Render + Supabase)
- [ ] Macro features — DXY, VIX, Crude Oil, INR/USD
- [ ] AI Agent using LangGraph for signal explanation
- [ ] Email alerts on signal change

---

## Developer

<div align="center">

**Sanjay Jat**
B.Tech Computer Science · 3rd Year · Rajasthan, India

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sanjayjat354339-cell)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sanjay-jat-250767346)

</div>

---

<div align="center">

*This project is built for educational and portfolio purposes only and does not constitute financial advice.*

</div>