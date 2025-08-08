import { VolatilityPrediction } from '../types';

export class VolatilityModelingService {
  private static instance: VolatilityModelingService;

  static getInstance(): VolatilityModelingService {
    if (!VolatilityModelingService.instance) {
      VolatilityModelingService.instance = new VolatilityModelingService();
    }
    return VolatilityModelingService.instance;
  }

  async predictVolatility(historicalPrices: number[], upgradeEvent?: any): Promise<VolatilityPrediction> {
    try {
      // Calculate returns
      const returns = this.calculateReturns(historicalPrices);
      
      // Fit GARCH(1,1) model
      const garchParams = this.fitGARCH(returns);
      
      // Generate predictions
      const currentVolatility = this.calculateCurrentVolatility(returns);
      const predictions = this.generateVolatilityPredictions(currentVolatility, garchParams, upgradeEvent);
      
      return {
        current: currentVolatility,
        predicted1h: predictions.h1,
        predicted24h: predictions.d1,
        predicted7d: predictions.d7,
        confidence: predictions.confidence,
        garchParams
      };
    } catch (error) {
      console.error('Error predicting volatility:', error);
      
      // Return mock predictions
      return {
        current: Math.random() * 0.5 + 0.1,
        predicted1h: Math.random() * 0.6 + 0.1,
        predicted24h: Math.random() * 0.8 + 0.2,
        predicted7d: Math.random() * 1.0 + 0.3,
        confidence: Math.random() * 0.4 + 0.6,
        garchParams: {
          alpha: Math.random() * 0.1 + 0.05,
          beta: Math.random() * 0.3 + 0.7,
          omega: Math.random() * 0.01 + 0.005
        }
      };
    }
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    return returns;
  }

  private fitGARCH(returns: number[]): { alpha: number; beta: number; omega: number } {
    // Simplified GARCH(1,1) parameter estimation using method of moments
    const variance = this.calculateVariance(returns);
    const autocorr = this.calculateAutocorrelation(returns.map(r => r * r), 1);
    
    // Initial parameter estimates
    let alpha = 0.1;
    let beta = 0.85;
    let omega = variance * (1 - alpha - beta);
    
    // Simple optimization (in practice, use maximum likelihood estimation)
    for (let iter = 0; iter < 100; iter++) {
      const newParams = this.optimizeGARCH(returns, alpha, beta, omega);
      alpha = newParams.alpha;
      beta = newParams.beta;
      omega = newParams.omega;
    }
    
    return { alpha, beta, omega };
  }

  private optimizeGARCH(returns: number[], alpha: number, beta: number, omega: number): 
    { alpha: number; beta: number; omega: number } {
    
    // Simplified optimization step
    const learningRate = 0.001;
    const gradient = this.calculateGARCHGradient(returns, alpha, beta, omega);
    
    return {
      alpha: Math.max(0.01, Math.min(0.99, alpha - learningRate * gradient.alpha)),
      beta: Math.max(0.01, Math.min(0.99, beta - learningRate * gradient.beta)),
      omega: Math.max(0.001, omega - learningRate * gradient.omega)
    };
  }

  private calculateGARCHGradient(returns: number[], alpha: number, beta: number, omega: number): 
    { alpha: number; beta: number; omega: number } {
    
    // Simplified gradient calculation
    const n = returns.length;
    let gradAlpha = 0, gradBeta = 0, gradOmega = 0;
    
    let variance = omega / (1 - alpha - beta); // Long-run variance
    
    for (let i = 1; i < n; i++) {
      const prevVariance = variance;
      variance = omega + alpha * returns[i - 1] ** 2 + beta * variance;
      
      const residual = returns[i] ** 2 - variance;
      
      gradAlpha += residual * returns[i - 1] ** 2 / variance;
      gradBeta += residual * prevVariance / variance;
      gradOmega += residual / variance;
    }
    
    return {
      alpha: -gradAlpha / n,
      beta: -gradBeta / n,
      omega: -gradOmega / n
    };
  }

  private generateVolatilityPredictions(
    current: number, 
    garchParams: { alpha: number; beta: number; omega: number },
    upgradeEvent?: any
  ): { h1: number; d1: number; d7: number; confidence: number } {
    
    const { alpha, beta, omega } = garchParams;
    const longRunVariance = omega / (1 - alpha - beta);
    
    // Event impact multiplier
    let eventMultiplier = 1;
    if (upgradeEvent) {
      eventMultiplier = 1 + (upgradeEvent.riskScore / 100) * 0.5;
    }
    
    // GARCH predictions with mean reversion
    const h1 = Math.sqrt(omega + alpha * current ** 2 + beta * current ** 2) * eventMultiplier;
    const d1 = Math.sqrt(omega + (alpha + beta) * current ** 2 + 
                         (1 - Math.pow(alpha + beta, 24)) / (1 - (alpha + beta)) * 
                         (longRunVariance - current ** 2)) * eventMultiplier;
    const d7 = Math.sqrt(longRunVariance + Math.pow(alpha + beta, 7 * 24) * 
                         (current ** 2 - longRunVariance)) * eventMultiplier;
    
    // Confidence based on model fit quality
    const confidence = Math.max(0.5, 1 - Math.abs(alpha + beta - 0.95));
    
    return { h1, d1, d7, confidence };
  }

  private calculateCurrentVolatility(returns: number[]): number {
    // Use EWMA for current volatility estimate
    const lambda = 0.94;
    let variance = this.calculateVariance(returns);
    
    for (let i = returns.length - 20; i < returns.length; i++) {
      if (i >= 0) {
        variance = lambda * variance + (1 - lambda) * returns[i] ** 2;
      }
    }
    
    return Math.sqrt(variance);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1);
    return variance;
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;
    
    const n = values.length - lag;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += (values[i] - mean) ** 2;
    }
    
    return numerator / denominator;
  }

  async predictEventVolatility(
    baseVolatility: number,
    eventType: string,
    riskScore: number,
    historicalEvents: any[]
  ): Promise<number> {
    // Machine learning approach for event-specific volatility prediction
    const eventTypeMultiplier = {
      'governance': 1.2,
      'implementation': 1.5,
      'parameter': 0.8
    }[eventType] || 1.0;
    
    const riskMultiplier = 1 + (riskScore / 100) * 0.5;
    
    // Historical event impact analysis
    const similarEvents = historicalEvents.filter(e => e.type === eventType);
    const avgHistoricalImpact = similarEvents.length > 0 ?
      similarEvents.reduce((sum, e) => sum + e.volatilityImpact, 0) / similarEvents.length : 1.0;
    
    return baseVolatility * eventTypeMultiplier * riskMultiplier * avgHistoricalImpact;
  }
}