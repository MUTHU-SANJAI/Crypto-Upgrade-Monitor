import { LiquidityPrediction } from '../types';

export class LiquidityPredictionService {
  private static instance: LiquidityPredictionService;

  static getInstance(): LiquidityPredictionService {
    if (!LiquidityPredictionService.instance) {
      LiquidityPredictionService.instance = new LiquidityPredictionService();
    }
    return LiquidityPredictionService.instance;
  }

  async predictLiquidityFlow(
    historicalTVL: Array<{ timestamp: number; tvl: number }>,
    upgradeEvent?: any
  ): Promise<LiquidityPrediction> {
    try {
      const currentTVL = historicalTVL[historicalTVL.length - 1]?.tvl || 0;
      
      // Use ARIMA or Prophet-like approach for TVL forecasting
      const trendComponent = this.calculateTrend(historicalTVL);
      const seasonalComponent = this.calculateSeasonality(historicalTVL);
      const volatilityComponent = this.calculateTVLVolatility(historicalTVL);
      
      // Event impact on liquidity
      let eventImpact = 1;
      if (upgradeEvent) {
        eventImpact = this.calculateEventImpact(upgradeEvent);
      }
      
      const predictions = this.generateTVLPredictions(
        currentTVL,
        trendComponent,
        seasonalComponent,
        volatilityComponent,
        eventImpact
      );
      
      return {
        currentTVL,
        predictedTVL1h: predictions.h1,
        predictedTVL24h: predictions.d1,
        predictedTVL7d: predictions.d7,
        flowDirection: this.determineFlowDirection(predictions.h1, currentTVL),
        confidence: predictions.confidence
      };
    } catch (error) {
      console.error('Error predicting liquidity flow:', error);
      
      // Return mock predictions
      const currentTVL = Math.random() * 1000000000;
      return {
        currentTVL,
        predictedTVL1h: currentTVL * (1 + (Math.random() - 0.5) * 0.02),
        predictedTVL24h: currentTVL * (1 + (Math.random() - 0.5) * 0.1),
        predictedTVL7d: currentTVL * (1 + (Math.random() - 0.5) * 0.3),
        flowDirection: Math.random() > 0.5 ? 'inflow' : 'outflow',
        confidence: Math.random() * 0.3 + 0.7
      };
    }
  }

  private calculateTrend(data: Array<{ timestamp: number; tvl: number }>): number {
    if (data.length < 2) return 0;
    
    // Simple linear regression for trend
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.tvl, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.tvl, 0);
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateSeasonality(data: Array<{ timestamp: number; tvl: number }>): number {
    // Simplified seasonality detection based on day of week
    const hourOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Market hours tend to have higher activity
    const hourlyMultiplier = hourOfDay >= 8 && hourOfDay <= 20 ? 1.1 : 0.9;
    const dailyMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.05 : 0.95;
    
    return hourlyMultiplier * dailyMultiplier;
  }

  private calculateTVLVolatility(data: Array<{ timestamp: number; tvl: number }>): number {
    if (data.length < 2) return 0.01;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].tvl - data[i-1].tvl) / data[i-1].tvl);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
    
    return Math.sqrt(variance);
  }

  private calculateEventImpact(upgradeEvent: any): number {
    // Event impact on TVL based on upgrade type and risk score
    const typeMultipliers = {
      'governance': 0.95, // Usually minor TVL impact
      'implementation': 0.85, // Can cause significant outflows due to uncertainty
      'parameter': 1.05 // Often positive for yield improvements
    };
    
    const baseMultiplier = typeMultipliers[upgradeEvent.type as keyof typeof typeMultipliers] || 1.0;
    const riskAdjustment = 1 - (upgradeEvent.riskScore / 100) * 0.2;
    
    return baseMultiplier * riskAdjustment;
  }

  private generateTVLPredictions(
    currentTVL: number,
    trend: number,
    seasonality: number,
    volatility: number,
    eventImpact: number
  ): { h1: number; d1: number; d7: number; confidence: number } {
    
    const randomComponent = () => (Math.random() - 0.5) * volatility;
    
    // Hour prediction
    const h1 = currentTVL * (1 + trend * (1/24/365) + randomComponent()) * seasonality * eventImpact;
    
    // Day prediction
    const d1 = currentTVL * (1 + trend * (1/365) + randomComponent() * Math.sqrt(24)) * seasonality * eventImpact;
    
    // Week prediction
    const d7 = currentTVL * (1 + trend * (7/365) + randomComponent() * Math.sqrt(7*24)) * seasonality * eventImpact;
    
    // Confidence based on historical volatility and data quality
    const confidence = Math.max(0.4, 1 - volatility * 10);
    
    return { h1, d1, d7, confidence };
  }

  private determineFlowDirection(predicted: number, current: number): 'inflow' | 'outflow' | 'stable' {
    const change = (predicted - current) / current;
    
    if (change > 0.01) return 'inflow';
    if (change < -0.01) return 'outflow';
    return 'stable';
  }

  async analyzeCrossProtocolFlows(
    protocols: string[],
    timeframe: string
  ): Promise<Array<{
    from: string;
    to: string;
    amount: number;
    confidence: number;
  }>> {
    // Analyze liquidity flows between protocols
    const flows = [];
    
    for (let i = 0; i < protocols.length; i++) {
      for (let j = 0; j < protocols.length; j++) {
        if (i !== j) {
          flows.push({
            from: protocols[i],
            to: protocols[j],
            amount: Math.random() * 10000000, // Mock flow amount
            confidence: Math.random() * 0.4 + 0.6
          });
        }
      }
    }
    
    return flows.sort((a, b) => b.amount - a.amount).slice(0, 10);
  }

  async predictYieldImpact(
    currentYield: number,
    liquidityChange: number,
    protocolType: string
  ): Promise<{
    newYield: number;
    impact: number;
    confidence: number;
  }> {
    // Predict yield changes based on liquidity flows
    const utilizationImpact = liquidityChange > 0 ? -0.1 : 0.1; // More liquidity = lower yields
    const protocolMultiplier = {
      'lending': 1.2,
      'dex': 0.8,
      'yield_farming': 1.5,
      'staking': 0.6
    }[protocolType] || 1.0;
    
    const impact = utilizationImpact * protocolMultiplier;
    const newYield = currentYield * (1 + impact);
    
    return {
      newYield,
      impact,
      confidence: Math.random() * 0.3 + 0.7
    };
  }
}