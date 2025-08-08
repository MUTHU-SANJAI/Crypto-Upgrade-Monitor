# Protocol Upgrade Monitor Backend

This is a FastAPI backend for the Protocol Upgrade Monitor project. It provides mock endpoints for blockchain event monitoring, volatility and liquidity prediction, sentiment analysis, and risk scoring.

## Features
- **/api/blockchain-events**: Mock upgrade events for selected networks and protocols
- **/api/volatility-prediction**: Volatility forecast using GARCH(1,1) or EGARCH (mocked)
- **/api/liquidity-prediction**: Liquidity shift prediction using ARIMA or Prophet (mocked)
- **/api/sentiment-analysis**: Sentiment scores using a placeholder for Twitter API and BERT (mocked)
- **/api/risk-score**: Multi-factor risk score (mocked)
- CORS enabled for frontend access
- Logging and error handling

## Requirements
- Python 3.11+
- See `requirements.txt` for dependencies

## Setup
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Server
```bash
uvicorn main:app --reload
```

## API Endpoints

### 1. /api/blockchain-events
**POST**
```json
{
  "network": "ethereum",
  "protocol_addresses": ["0x123...", "0x456..."],
  "upgrade_types": ["governance", "implementation"]
}
```
**Example:**
```bash
curl -X POST http://localhost:8000/api/blockchain-events \
  -H "Content-Type: application/json" \
  -d '{"network":"ethereum","protocol_addresses":["0x123"],"upgrade_types":["governance"]}'
```

### 2. /api/volatility-prediction
**POST**
```json
{
  "token_pair": "ETH/USDT",
  "time_horizon": "24h"
}
```
**Example:**
```bash
curl -X POST http://localhost:8000/api/volatility-prediction \
  -H "Content-Type: application/json" \
  -d '{"token_pair":"ETH/USDT","time_horizon":"24h"}'
```

### 3. /api/liquidity-prediction
**POST**
```json
{
  "protocol_address": "0x123...",
  "time_horizon": "7d"
}
```
**Example:**
```bash
curl -X POST http://localhost:8000/api/liquidity-prediction \
  -H "Content-Type: application/json" \
  -d '{"protocol_address":"0x123","time_horizon":"7d"}'
```

### 4. /api/sentiment-analysis
**POST**
```json
{
  "protocol_name": "Uniswap"
}
```
**Example:**
```bash
curl -X POST http://localhost:8000/api/sentiment-analysis \
  -H "Content-Type: application/json" \
  -d '{"protocol_name":"Uniswap"}'
```

### 5. /api/risk-score
**POST**
```json
{
  "upgrade_type": "governance",
  "protocol": "0x123...",
  "description": "Upgrade X",
  "market_volatility": 0.12,
  "liquidity": 0.8,
  "governance_score": 0.7
}
```
**Example:**
```bash
curl -X POST http://localhost:8000/api/risk-score \
  -H "Content-Type: application/json" \
  -d '{"upgrade_type":"governance","protocol":"0x123","description":"Upgrade X","market_volatility":0.12,"liquidity":0.8,"governance_score":0.7}'
```

## Notes
- All endpoints return mock data for demonstration.
- For real Twitter/BERT/Prophet/ARIMA integration, see comments in `requirements.txt` and `main.py`. 