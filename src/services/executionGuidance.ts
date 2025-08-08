import { ExecutionGuidance, RiskAssessment, VolatilityPrediction, LiquidityPrediction } from '../types';

export class ExecutionGuidanceService {
  private static instance: ExecutionGuidanceService;

  static getInstance(): ExecutionGuidanceService {
    if (!ExecutionGuidanceService.instance) {
      ExecutionGuidanceService.instance = new ExecutionGuidanceService();
    }
    return ExecutionGuidanceService.instance;
  }

  async generateExecutionGuidance(
    riskAssessment: RiskAssessment,
    volatilityPrediction: VolatilityPrediction,
    liquidityPrediction: LiquidityPrediction,
    marketData: any,
    userProfile: any
  ): Promise<ExecutionGuidance> {
    try {
      // Multi-factor decision engine
      const action = this.determineOptimalAction(
        riskAssessment,
        volatilityPrediction,
        liquidityPrediction,
        marketData
      );
      
      const confidence = this.calculateActionConfidence(
        riskAssessment,
        volatilityPrediction,
        liquidityPrediction
      );
      
      const optimalTiming = this.calculateOptimalTiming(
        volatilityPrediction,
        liquidityPrediction,
        action
      );
      
      const riskMitigation = this.generateRiskMitigationStrategies(
        riskAssessment,
        volatilityPrediction,
        action
      );
      
      const portfolioRebalancing = this.generateRebalancingRecommendations(
        riskAssessment,
        marketData,
        userProfile
      );
      
      return {
        action,
        confidence,
        optimalTiming,
        riskMitigation,
        portfolioRebalancing
      };
    } catch (error) {
      console.error('Error generating execution guidance:', error);
      
      // Return safe default guidance
      return {
        action: 'hold',
        confidence: 0.5,
        optimalTiming: {
          entry: Date.now() + 3600000, // 1 hour
          exit: Date.now() + 86400000  // 24 hours
        },
        riskMitigation: ['Monitor market conditions', 'Set stop losses', 'Diversify holdings'],
        portfolioRebalancing: []
      };
    }
  }

  private determineOptimalAction(
    riskAssessment: RiskAssessment,
    volatilityPrediction: VolatilityPrediction,
    liquidityPrediction: LiquidityPrediction,
    marketData: any
  ): 'buy' | 'sell' | 'hold' | 'hedge' {
    
    // Decision matrix based on multiple factors
    let actionScore = 0;
    
    // Risk assessment impact
    if (riskAssessment.overall < 30) actionScore += 2;      // Low risk = buy signal
    else if (riskAssessment.overall > 70) actionScore -= 2; // High risk = sell signal
    
    // Volatility impact
    if (volatilityPrediction.predicted24h > volatilityPrediction.current * 1.5) {
      actionScore -= 1; // Increasing volatility = caution
    }
    
    // Liquidity impact
    if (liquidityPrediction.flowDirection === 'inflow') actionScore += 1;
    else if (liquidityPrediction.flowDirection === 'outflow') actionScore -= 1;
    
    // Market trend impact
    if (marketData.change24h > 5) actionScore += 1;
    else if (marketData.change24h < -5) actionScore -= 1;
    
    // Convert score to action
    if (actionScore >= 2) return 'buy';
    if (actionScore <= -2) return 'sell';
    if (riskAssessment.overall > 60 || volatilityPrediction.predicted24h > 0.5) return 'hedge';
    return 'hold';
  }

  private calculateActionConfidence(
    riskAssessment: RiskAssessment,
    volatilityPrediction: VolatilityPrediction,
    liquidityPrediction: LiquidityPrediction
  ): number {
    // Confidence based on prediction quality and consistency
    const volatilityConfidence = volatilityPrediction.confidence;
    const liquidityConfidence = liquidityPrediction.confidence;
    const riskConsistency = this.calculateRiskConsistency(riskAssessment);
    
    return (volatilityConfidence + liquidityConfidence + riskConsistency) / 3;
  }

  private calculateRiskConsistency(riskAssessment: RiskAssessment): number {
    // Measure consistency across risk factors
    const risks = [
      riskAssessment.technical,
      riskAssessment.governance,
      riskAssessment.market,
      riskAssessment.liquidity
    ];
    
    const mean = risks.reduce((sum, risk) => sum + risk, 0) / risks.length;
    const variance = risks.reduce((sum, risk) => sum + (risk - mean) ** 2, 0) / risks.length;
    
    // Lower variance = higher consistency = higher confidence
    return Math.max(0.3, 1 - Math.sqrt(variance) / 50);
  }

  private calculateOptimalTiming(
    volatilityPrediction: VolatilityPrediction,
    liquidityPrediction: LiquidityPrediction,
    action: 'buy' | 'sell' | 'hold' | 'hedge'
  ): { entry: number; exit: number } {
    
    const now = Date.now();
    let entryDelay = 0;
    let exitDelay = 86400000; // Default 24 hours
    
    // Timing based on volatility patterns
    if (volatilityPrediction.predicted1h < volatilityPrediction.current) {
      entryDelay = 3600000; // Wait 1 hour for volatility to decrease
    }
    
    // Timing based on liquidity flows
    if (liquidityPrediction.flowDirection === 'inflow' && action === 'buy') {
      entryDelay = Math.min(entryDelay, 1800000); // Enter within 30 minutes
    }
    
    // Exit timing based on action type
    if (action === 'hedge') {
      exitDelay = volatilityPrediction.predicted24h > 0.3 ? 172800000 : 86400000; // 2 days vs 1 day
    } else if (action === 'buy') {
      exitDelay = 604800000; // 7 days for buy positions
    }
    
    return {
      entry: now + entryDelay,
      exit: now + entryDelay + exitDelay
    };
  }

  private generateRiskMitigationStrategies(
    riskAssessment: RiskAssessment,
    volatilityPrediction: VolatilityPrediction,
    action: 'buy' | 'sell' | 'hold' | 'hedge'
  ): string[] {
    const strategies: string[] = [];
    
    // General risk mitigation
    strategies.push('Implement stop-loss orders at 5-10% below entry');
    strategies.push('Monitor market conditions every 4 hours');
    
    // Volatility-specific strategies
    if (volatilityPrediction.predicted24h > 0.3) {
      strategies.push('Use smaller position sizes due to high volatility');
      strategies.push('Consider options strategies for volatility hedging');
    }
    
    // Risk-specific strategies
    if (riskAssessment.governance > 60) {
      strategies.push('Monitor governance proposals closely');
      strategies.push('Prepare for potential governance-driven price movements');
    }
    
    if (riskAssessment.liquidity > 60) {
      strategies.push('Ensure sufficient liquidity buffers');
      strategies.push('Consider staggered entry/exit strategies');
    }
    
    if (riskAssessment.technical > 60) {
      strategies.push('Review smart contract audit reports');
      strategies.push('Monitor protocol upgrade implementations');
    }
    
    // Action-specific strategies
    if (action === 'hedge') {
      strategies.push('Use correlated assets for hedging');
      strategies.push('Consider derivatives for downside protection');
    }
    
    return strategies;
  }

  private generateRebalancingRecommendations(
    riskAssessment: RiskAssessment,
    marketData: any,
    userProfile: any
  ): Array<{
    asset: string;
    currentWeight: number;
    recommendedWeight: number;
  }> {
    
    const recommendations = [];
    
    // Mock portfolio assets
    const assets = ['ETH', 'BTC', 'USDC', 'PROTOCOL_TOKEN'];
    const currentWeights = [0.4, 0.3, 0.2, 0.1];
    
    // Risk-based rebalancing
    const riskTolerance = userProfile?.riskTolerance || 0.5;
    const overallRisk = riskAssessment.overall / 100;
    
    assets.forEach((asset, index) => {
      let recommendedWeight = currentWeights[index];
      
      // Adjust based on risk assessment
      if (asset === 'USDC') {
        // Increase stablecoin allocation if high risk
        recommendedWeight = Math.min(0.5, currentWeights[index] + overallRisk * 0.2);
      } else if (asset === 'PROTOCOL_TOKEN') {
        // Decrease protocol token if high protocol-specific risk
        if (riskAssessment.technical > 60 || riskAssessment.governance > 60) {
          recommendedWeight = Math.max(0.05, currentWeights[index] * 0.5);
        }
      }
      
      // Normalize weights
      recommendations.push({
        asset,
        currentWeight: currentWeights[index],
        recommendedWeight
      });
    });
    
    // Normalize to sum to 1
    const totalWeight = recommendations.reduce((sum, rec) => sum + rec.recommendedWeight, 0);
    recommendations.forEach(rec => {
      rec.recommendedWeight = rec.recommendedWeight / totalWeight;
    });
    
    return recommendations;
  }

  async generateStressTestScenarios(
    baseAssessment: RiskAssessment
  ): Promise<Array<{
    scenario: string;
    probability: number;
    impact: string;
    recommendedAction: string;
  }>> {
    
    const scenarios = [
      {
        scenario: 'Smart Contract Exploit',
        probability: 0.05,
        impact: 'Severe protocol token devaluation (-50% to -90%)',
        recommendedAction: 'Immediate exit of protocol positions, hedge with short positions'
      },
      {
        scenario: 'Governance Attack',
        probability: 0.10,
        impact: 'Protocol parameter manipulation, potential fund drainage',
        recommendedAction: 'Monitor governance closely, prepare to exit if malicious proposals pass'
      },
      {
        scenario: 'Market Crash',
        probability: 0.20,
        impact: 'Broad market decline (-30% to -50%)',
        recommendedAction: 'Increase stablecoin allocation, implement hedging strategies'
      },
      {
        scenario: 'Liquidity Crisis',
        probability: 0.15,
        impact: 'Unable to exit positions, high slippage',
        recommendedAction: 'Diversify across multiple protocols, maintain liquidity buffers'
      },
      {
        scenario: 'Regulatory Intervention',
        probability: 0.25,
        impact: 'Protocol shutdown or restricted access',
        recommendedAction: 'Monitor regulatory developments, have exit strategies ready'
      }
    ];
    
    return scenarios;
  }

  async calculatePortfolioMetrics(
    positions: Array<{ asset: string; amount: number; value: number }>,
    riskAssessment: RiskAssessment
  ): Promise<{
    totalValue: number;
    riskAdjustedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    valueAtRisk: number;
    diversificationRatio: number;
  }> {
    
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    
    // Mock calculations - in practice, these would use historical data
    const riskAdjustedReturn = Math.random() * 0.2 - 0.05; // -5% to 15%
    const sharpeRatio = Math.random() * 2; // 0 to 2
    const maxDrawdown = Math.random() * 0.3; // 0% to 30%
    const valueAtRisk = totalValue * (Math.random() * 0.1 + 0.05); // 5% to 15% of portfolio
    
    // Simple diversification calculation
    const weights = positions.map(pos => pos.value / totalValue);
    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);
    const diversificationRatio = (1 - herfindahlIndex) / (1 - 1/positions.length);
    
    return {
      totalValue,
      riskAdjustedReturn,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk,
      diversificationRatio
    };
  }
}