import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import random
import httpx

from dotenv import load_dotenv
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class BlockchainEventsRequest(BaseModel):
    network: Literal["ethereum", "polygon", "arbitrum"]
    protocol_addresses: List[str]
    upgrade_types: List[Literal["governance", "implementation", "parameter"]]

class UpgradeEvent(BaseModel):
    id: str
    type: str
    protocol: str
    description: str
    timestamp: int
    risk_level: Literal["low", "medium", "high"]
    explorer_link: str

class VolatilityPredictionRequest(BaseModel):
    token_pair: str
    time_horizon: Literal["1h", "24h", "7d"]

class VolatilityPredictionResponse(BaseModel):
    model: str
    volatility: float
    confidence: float
    time_horizon: str

class LiquidityPredictionRequest(BaseModel):
    protocol_address: str
    time_horizon: Literal["1h", "24h", "7d"]

class LiquidityPredictionResponse(BaseModel):
    model: str
    liquidity_shift: float
    confidence: float
    time_horizon: str

class SentimentAnalysisRequest(BaseModel):
    protocol_name: str

class SentimentAnalysisResponse(BaseModel):
    positive: float
    neutral: float
    negative: float
    overall: float
    tweet_count: int

class RiskScoreRequest(BaseModel):
    upgrade_type: str
    protocol: str
    description: str
    market_volatility: float
    liquidity: float
    governance_score: float

class RiskScoreResponse(BaseModel):
    risk_score: int
    factors: dict

# --- Helper functions for blockchain APIs ---
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
POLYGONSCAN_API_KEY = os.getenv("POLYGONSCAN_API_KEY", "")
ARBISCAN_API_KEY = os.getenv("ARBISCAN_API_KEY", "")

EXPLORER_URLS = {
    "ethereum": "https://etherscan.io/address/",
    "polygon": "https://polygonscan.com/address/",
    "arbitrum": "https://arbiscan.io/address/",
}

SCAN_API_URLS = {
    "ethereum": "https://api.etherscan.io/api",
    "polygon": "https://api.polygonscan.com/api",
    "arbitrum": "https://api.arbiscan.io/api",
}

SCAN_API_KEYS = {
    "ethereum": ETHERSCAN_API_KEY,
    "polygon": POLYGONSCAN_API_KEY,
    "arbitrum": ARBISCAN_API_KEY,
}

UNISWAP_GOVERNANCE_CONTRACT = "0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F"
SNAPSHOT_GRAPHQL_URL = "https://hub.snapshot.org/graphql"

async def fetch_uniswap_snapshot_proposals(limit: int = 5):
    query = f"""
    {{
      proposals(
        first: {limit},
        skip: 0,
        where: {{ space_in: [\"uniswap\"] }},
        orderBy: \"created\",
        orderDirection: desc
      ) {{
        id
        title
        body
        start
        end
        created
        state
        author
        link
      }}
    }}
    """
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                SNAPSHOT_GRAPHQL_URL,
                json={"query": query}
            )
            data = resp.json()
            print("Snapshot API response:", data)
            if resp.status_code != 200 or "data" not in data or "proposals" not in data["data"]:
                logger.error(f"Snapshot API error: {data}")
                raise HTTPException(status_code=502, detail="Error fetching Uniswap proposals from Snapshot.")
            return data["data"]["proposals"]
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching Snapshot proposals: {e}")
            raise HTTPException(status_code=502, detail="Error fetching Uniswap proposals from Snapshot.")

async def fetch_contract_events(network: str, address: str, upgrade_types: List[str]):
    # Special case: Uniswap governance proposals via Snapshot
    if (
        network == "ethereum"
        and address.lower() == UNISWAP_GOVERNANCE_CONTRACT.lower()
        and "governance" in upgrade_types
    ):
        try:
            proposals = await fetch_uniswap_snapshot_proposals(limit=5)
            events = []
            for p in proposals:
                events.append(UpgradeEvent(
                    id=p["id"],
                    type="governance",
                    protocol=address,
                    description=p.get("title") or p.get("body", "")[:100],
                    timestamp=int(p.get("created", 0)),
                    risk_level=random.choice(["low", "medium", "high"]),
                    explorer_link=p.get("link", "")
                ))
            return events
        except Exception as e:
            logger.error(f"Error fetching Uniswap governance proposals from Snapshot: {e}")
            raise HTTPException(status_code=502, detail="Error fetching Uniswap governance proposals.")
    api_url = SCAN_API_URLS[network]
    api_key = SCAN_API_KEYS[network]
    explorer_url = EXPLORER_URLS[network]
    events = []
    if not api_key:
        raise HTTPException(status_code=500, detail=f"Missing {network} API key.")
    async with httpx.AsyncClient(timeout=10) as client:
        # Fetch contract internal transactions (proxy for upgrades/parameter changes)
        try:
            resp = await client.get(api_url, params={
                "module": "account",
                "action": "txlistinternal",
                "address": address,
                "sort": "desc",
                "apikey": api_key
            })
            data = resp.json()
            print("Etherscan API response:", data)
            if data.get("status") != "1":
                if "Invalid API Key" in data.get("result", ""):
                    raise HTTPException(status_code=401, detail=f"Invalid {network} API key.")
                if "rate limit" in data.get("result", "").lower():
                    raise HTTPException(status_code=429, detail=f"{network.capitalize()} API rate limit exceeded.")
                logger.warning(f"No internal tx for {address} on {network}: {data.get('result')}")
                return []
            for tx in data["result"][:10]:
                # Heuristic: if input data is not empty, could be upgrade/parameter change
                if int(tx.get("isError", "0")) == 0 and tx.get("input") and tx.get("input") != "0x":
                    event_type = "upgrade" if "implementation" in upgrade_types else "parameter"
                    events.append(UpgradeEvent(
                        id=tx["hash"],
                        type=event_type,
                        protocol=address,
                        description=f"Internal tx: {tx['hash'][:10]}...",
                        timestamp=int(tx["timeStamp"]),
                        risk_level=random.choice(["low", "medium", "high"]),
                        explorer_link=explorer_url + address
                    ))
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching {network} events: {e}")
            raise HTTPException(status_code=502, detail=f"Error fetching {network} events.")
    # Governance proposals: not directly available, but for some protocols, can be fetched from logs (not implemented here)
    # For demo, add a mock governance event if requested
    if "governance" in upgrade_types:
        events.append(UpgradeEvent(
            id=f"gov-{address[:6]}-{random.randint(1000,9999)}",
            type="governance",
            protocol=address,
            description="Mock governance proposal (real fetch requires protocol-specific subgraph)",
            timestamp=int(random.uniform(1680000000, 1700000000)),
            risk_level=random.choice(["low", "medium", "high"]),
            explorer_link=explorer_url + address
        ))
    return events

# --- Endpoints ---
@app.post("/api/blockchain-events", response_model=List[UpgradeEvent])
async def blockchain_events(req: BlockchainEventsRequest):
    logger.info(f"Received blockchain-events request: {req}")
    all_events = []
    for addr in req.protocol_addresses:
        try:
            events = await fetch_contract_events(req.network, addr, req.upgrade_types)
            all_events.extend(events)
        except HTTPException as e:
            logger.error(f"Error for {addr} on {req.network}: {e.detail}")
            raise e
        except Exception as e:
            logger.error(f"Unhandled error for {addr} on {req.network}: {e}")
            raise HTTPException(status_code=500, detail=f"Error fetching events for {addr} on {req.network}")
    return all_events

@app.post("/api/volatility-prediction", response_model=VolatilityPredictionResponse)
async def volatility_prediction(req: VolatilityPredictionRequest):
    logger.info(f"Received volatility-prediction request: {req}")
    # Mock GARCH/EGARCH
    model = random.choice(["GARCH(1,1)", "EGARCH"])
    volatility = round(random.uniform(0.01, 0.2), 4)
    confidence = round(random.uniform(0.7, 0.99), 2)
    return VolatilityPredictionResponse(
        model=model,
        volatility=volatility,
        confidence=confidence,
        time_horizon=req.time_horizon
    )

@app.post("/api/liquidity-prediction", response_model=LiquidityPredictionResponse)
async def liquidity_prediction(req: LiquidityPredictionRequest):
    logger.info(f"Received liquidity-prediction request: {req}")
    # Mock ARIMA/Prophet
    model = random.choice(["ARIMA", "Prophet"])
    liquidity_shift = round(random.uniform(-0.2, 0.2), 4)
    confidence = round(random.uniform(0.7, 0.99), 2)
    return LiquidityPredictionResponse(
        model=model,
        liquidity_shift=liquidity_shift,
        confidence=confidence,
        time_horizon=req.time_horizon
    )

@app.post("/api/sentiment-analysis", response_model=SentimentAnalysisResponse)
async def sentiment_analysis(req: SentimentAnalysisRequest):
    logger.info(f"Received sentiment-analysis request: {req}")
    # Placeholder for Twitter API + BERT model
    # In production, fetch tweets and run BERT sentiment
    positive = round(random.uniform(0.2, 0.7), 2)
    neutral = round(random.uniform(0.1, 0.5), 2)
    negative = round(1 - positive - neutral, 2)
    overall = round(positive - negative, 2)
    tweet_count = random.randint(20, 100)
    return SentimentAnalysisResponse(
        positive=positive,
        neutral=neutral,
        negative=negative,
        overall=overall,
        tweet_count=tweet_count
    )

@app.post("/api/risk-score", response_model=RiskScoreResponse)
async def risk_score(req: RiskScoreRequest):
    logger.info(f"Received risk-score request: {req}")
    # Simple multi-factor risk scoring
    score = int(
        0.3 * req.market_volatility * 100 +
        0.3 * (1 - req.liquidity) * 100 +
        0.4 * (1 - req.governance_score) * 100
    )
    score = max(0, min(100, score))
    return RiskScoreResponse(
        risk_score=score,
        factors={
            "market_volatility": req.market_volatility,
            "liquidity": req.liquidity,
            "governance_score": req.governance_score
        }
    )

# --- Error Handling ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return HTTPException(status_code=500, detail="Internal server error") 