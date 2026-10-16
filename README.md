# 📈 AI Stock Copilot

AI Stock Copilot is a Python-based stock analysis web application that helps users explore stock market data, compare stocks, understand risk indicators, and create investment allocation plans.

🌐 **Live Demo:** https://ai-stock-copilot-os-1.onrender.com  
📂 **GitHub Repository:** https://github.com/swaruppatil09/AI-STOCK-COPILOT-OS

## 🚀 Features

- 📊 **Stock Analysis** — Explore stock data and performance indicators.
- 📈 **Historical Charts** — View historical stock price movements.
- 🧠 **Stock Scoring and Ranking** — Compare stocks using data-driven metrics.
- ⚠️ **Risk Analysis** — Explore risk indicators and maximum drawdown.
- 💰 **Investment Planning** — Generate allocation plans based on a budget.
- 📉 **Mutual Fund Data** — Explore available mutual fund information.
- 🤖 **AI Chat Assistant** — Interact with the integrated chat feature.
- 🌐 **Web Dashboard** — Access the application through a deployed frontend and backend.

## 🛠️ Technologies Used

**Backend**
- Python
- FastAPI
- Uvicorn
- Pandas
- NumPy
- yfinance

**Frontend**
- HTML
- CSS
- JavaScript

**Data and Deployment**
- Yahoo Finance data via yfinance
- Render for web deployment

## 🏗️ Project Architecture

The application uses a frontend-backend architecture.

1. The frontend provides the dashboard and user interactions.
2. The FastAPI backend handles API requests and data processing.
3. Market data is retrieved using the configured data source.
4. The frontend displays analysis, charts, and investment-planning results.

## 📁 Project Structure

```text
AI-STOCK-COPILOT-OS/
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── dashboard.py
├── requirements.txt
├── .gitignore
└── README.md
```

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/swaruppatil09/AI-STOCK-COPILOT-OS.git
cd AI-STOCK-COPILOT-OS
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the environment

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Start the backend

```bash
uvicorn backend.main:app --reload
```

The API will normally be available at:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 6. Open the frontend

Open `frontend/index.html` in your browser or use a local static web server.

**Note:** The frontend must be configured to communicate with the correct backend URL. For local development, configure it to use the local API; for the deployed version, use the deployed backend URL.

## 🎯 Project Objectives

- Make stock market information easier to explore.
- Compare stocks using performance and risk indicators.
- Generate budget-based investment allocation plans.
- Integrate market-data analysis with a user-friendly web interface.

## 🔮 Future Improvements

- Add more technical indicators and comparison tools.
- Improve stock-ranking and risk-analysis methods.
- Add historical strategy testing and performance evaluation.
- Improve error handling and data validation.
- Add automated tests and monitoring.
- Improve security and external API configuration.

## ⚠️ Disclaimer

This project is intended for educational and informational purposes only. Stock scores and investment plans are experimental and do not guarantee returns or constitute personalized financial advice. Market data may be delayed, incomplete, or inaccurate. Always conduct independent research before making financial decisions.

## 👨‍💻 Author

**Swarup Patil**

GitHub: https://github.com/swaruppatil09
