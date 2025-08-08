export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  icon: string;
}

export interface Protocol {
  address: string;
  name: string;
  symbol: string;
  network: string;
  tvl: number;
  volume24h: number;
}

export interface UpgradeEvent {
  id: string;
  protocolAddress: string;
  protocolName: string;
  type: 'governance' | 'implementation' | 'parameter';
  title: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'active' | 'executed' | 'failed';
  riskScore: number;
  estimatedImpact: {
    volatility: number;
    liquidity: number;
    governance: number;
  };
}

export interface RiskAssessment {
  overall: number;
  technical: number;
  governance: number;
  market: number;
  liquidity: number;
  timestamp: number;
}

export interface VolatilityPrediction {
  current: number;
  predicted1h: number;
  predicted24h: number;
  predicted7d: number;
  confidence: number;
  garchParams: {
    alpha: number;
    beta: number;
    omega: number;
  };
}

export interface LiquidityPrediction {
  currentTVL: number;
  predictedTVL1h: number;
  predictedTVL24h: number;
  predictedTVL7d: number;
  flowDirection: 'inflow' | 'outflow' | 'stable';
  confidence: number;
}

export interface SentimentData {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  sources: {
    twitter: number;
    reddit: number;
    telegram: number;
    discord: number;
  };
  trending: boolean;
  keywords: string[];
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  endTime: number;
  executionETA: number;
  successProbability: number;
}

export interface ExecutionGuidance {
  action: 'buy' | 'sell' | 'hold' | 'hedge';
  confidence: number;
  optimalTiming: {
    entry: number;
    exit: number;
  };
  riskMitigation: string[];
  portfolioRebalancing: {
    asset: string;
    currentWeight: number;
    recommendedWeight: number;
  }[];
}

export interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  fdv: number;
  timestamp: number;
}

export interface MonitoringConfig {
  networks: string[];
  protocols: string[];
  upgradeTypes: string[];
  riskThresholds: {
    volatility: number;
    liquidity: number;
    governance: number;
  };
  timeHorizon: '1h' | '24h' | '7d' | '30d';
  assetPairs: string[];
  refreshInterval: number;
}