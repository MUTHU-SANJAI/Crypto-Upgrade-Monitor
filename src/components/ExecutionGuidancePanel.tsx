import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Shield, AlertTriangle, Clock, MessageSquare } from 'lucide-react';
import { ExecutionGuidance, RiskAssessment, VolatilityPrediction, LiquidityPrediction, SentimentData } from '../types';
import { ExecutionGuidanceService } from '../services/executionGuidance';
import { SentimentAnalysisService } from '../services/sentimentAnalysis';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface ExecutionGuidancePanelProps {
  selectedProtocols: string[];
  riskAssessment?: RiskAssessment;
  volatilityPrediction?: VolatilityPrediction;
  liquidityPrediction?: LiquidityPrediction;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

export function ExecutionGuidancePanel({
  selectedProtocols,
  riskAssessment,
  volatilityPrediction,
  liquidityPrediction
}: ExecutionGuidancePanelProps) {
  const [guidance, setGuidance] = useState<ExecutionGuidance | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateGuidance = async () => {
      if (!riskAssessment || !volatilityPrediction || !liquidityPrediction) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const guidanceService = ExecutionGuidanceService.getInstance();
        const sentimentService = SentimentAnalysisService.getInstance();
        
        // Mock market data and user profile
        const mockMarketData = {
          price: 1000 + Math.random() * 500,
          change24h: (Math.random() - 0.5) * 20,
          volume24h: Math.random() * 1000000,
          marketCap: Math.random() * 10000000000
        };
        
        const mockUserProfile = {
          riskTolerance: 0.7,
          investmentHorizon: '30d',
          portfolioSize: 100000
        };
        
        const executionGuidance = await guidanceService.generateExecutionGuidance(
          riskAssessment,
          volatilityPrediction,
          liquidityPrediction,
          mockMarketData,
          mockUserProfile
        );
        
        // Get sentiment analysis
        const sentimentData = await sentimentService.analyzeSentiment('DeFi protocol upgrade governance');
        
        setGuidance(executionGuidance);
        setSentiment(sentimentData);
      } catch (error) {
        console.error('Error generating execution guidance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateGuidance();
  }, [riskAssessment, volatilityPrediction, liquidityPrediction]);

  // Generate alerts
  useEffect(() => {
    const generateAlert = () => {
      const alertTypes = ['critical', 'warning', 'info'] as const;
      const alertMessages = [
        { title: 'High-risk proposal passed', message: 'Compound governance proposal with 85% risk score has been executed', type: 'critical' },
        { title: 'Volatility spike detected', message: 'ETH volatility increased by 45% in the last hour', type: 'warning' },
        { title: 'Liquidity flow change', message: 'Large TVL movement detected in Aave protocol', type: 'info' }
      ];
      
      const randomAlert = alertMessages[Math.floor(Math.random() * alertMessages.length)];
      
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        type: randomAlert.type,
        title: randomAlert.title,
        message: randomAlert.message,
        timestamp: Date.now()
      };
      
      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep last 5 alerts
    };

    const interval = setInterval(generateAlert, 15000); // Generate alert every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action: ExecutionGuidance['action']) => {
    switch (action) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'hold':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'hedge':
        return <Shield className="w-5 h-5 text-yellow-400" />;
      default:
        return <Target className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActionColor = (action: ExecutionGuidance['action']) => {
    switch (action) {
      case 'buy':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'sell':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'hold':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'hedge':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-400';
    if (score > -0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive';
    if (score > -0.3) return 'Neutral';
    return 'Negative';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Execution Guidance and Recommendations
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!guidance ? (
          <div className="text-center text-gray-400 py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No guidance available</p>
            <p className="text-sm mt-2">Configure monitoring to receive execution guidance</p>
          </div>
        ) : (
          <>
            {/* Execution Timing Suggestions */}
            <div className={`border rounded-lg p-4 ${getActionColor(guidance.action)}`}>
              <div className="flex items-center gap-3 mb-4">
                {getActionIcon(guidance.action)}
                <div>
                  <h3 className="font-semibold text-lg capitalize">{guidance.action} Recommendation</h3>
                  <div className="text-sm opacity-80">
                    Confidence: {(guidance.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Optimal Timing</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400">Entry Window</div>
                      <div className="font-mono">
                        {format(new Date(guidance.optimalTiming.entry), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400">Exit Window</div>
                      <div className="font-mono">
                        {format(new Date(guidance.optimalTiming.exit), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Rebalancing Recommendations */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Portfolio Rebalancing
              </h4>
              
              {guidance.portfolioRebalancing.length === 0 ? (
                <p className="text-gray-400 text-sm">No rebalancing needed at this time</p>
              ) : (
                <div className="space-y-3">
                  {guidance.portfolioRebalancing.map((recommendation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                      <span className="font-mono text-white">{recommendation.asset}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">
                          {(recommendation.currentWeight * 100).toFixed(1)}%
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`font-medium ${
                          recommendation.recommendedWeight > recommendation.currentWeight
                            ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(recommendation.recommendedWeight * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk Mitigation Strategies */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Risk Mitigation Strategies
              </h4>
              <div className="space-y-2">
                {guidance.riskMitigation.map((strategy, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts Section */}
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Real-time Alerts
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No alerts at this time</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`border rounded p-3 ${getAlertColor(alert.type)}`}>
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h5 className="font-medium text-white text-sm">{alert.title}</h5>
                          <p className="text-gray-300 text-xs mt-1">{alert.message}</p>
                          <div className="text-xs text-gray-400 mt-2">
                            {format(new Date(alert.timestamp), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sentiment Analysis Summary */}
            {sentiment && (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Sentiment Analysis Summary
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Overall Sentiment:</span>
                    <span className={`font-medium ${getSentimentColor(sentiment.score)}`}>
                      {getSentimentLabel(sentiment.score)} ({(sentiment.score * 100).toFixed(1)})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400 mb-1">Twitter</div>
                      <div className={getSentimentColor(sentiment.sources.twitter)}>
                        {(sentiment.sources.twitter * 100).toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Reddit</div>
                      <div className={getSentimentColor(sentiment.sources.reddit)}>
                        {(sentiment.sources.reddit * 100).toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 mb-2">Trending Topics</div>
                    <div className="flex flex-wrap gap-1">
                      {sentiment.keywords.slice(0, 6).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}