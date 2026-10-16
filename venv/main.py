from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd

# Initialize the API application
app = FastAPI(title="AI Stock Copilot API")

# Allow the frontend to communicate with this backend securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/chart/{ticker}")
def get_chart_data(ticker: str):
    """Fetches 6 months of historical data and formats it for TradingView."""
    try:
        # Download data using yfinance
        df = yf.download(ticker, period="6mo", interval="1d")
        
        # If the ticker is invalid, yfinance returns an empty dataframe
        if df.empty:
            return {"status": "error", "message": "No data found for this ticker."}
            
        df.reset_index(inplace=True)
        
        # Format the data exactly how TradingView Lightweight Charts requires it
        chart_data = []
        for _, row in df.iterrows():
            chart_data.append({
                "time": row['Date'].strftime("%Y-%m-%d"),
                "open": float(row['Open'].iloc[0] if isinstance(row['Open'], pd.Series) else row['Open']),
                "high": float(row['High'].iloc[0] if isinstance(row['High'], pd.Series) else row['High']),
                "low": float(row['Low'].iloc[0] if isinstance(row['Low'], pd.Series) else row['Low']),
                "close": float(row['Close'].iloc[0] if isinstance(row['Close'], pd.Series) else row['Close'])
            })
            
        return {"status": "success", "data": chart_data}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}