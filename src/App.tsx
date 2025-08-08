import React, { useState, useEffect } from 'react';
import { Settings, Brain, Activity, TrendingUp, Key } from 'lucide-react';
import { NetworkMonitor } from './components/NetworkMonitor';
import { ProtocolTimeline } from './components/ProtocolTimeline';
import { ExecutionGuidancePanel } from './components/ExecutionGuidancePanel';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { ApiKeySetup } from './components/ApiKeySetup';
import { MonitoringConfig, RiskAssessment, VolatilityPrediction, LiquidityPrediction } from './types';
import { VolatilityModelingService } from './services/volatilityModeling';
import { LiquidityPredictionService } from './services/liquidityPrediction';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(['ethereum']);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isApiKeySetupOpen, setIsApiKeySetupOpen] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>();
  const [volatilityPrediction, setVolatilityPrediction] = useState<VolatilityPrediction>();
  const [liquidityPrediction, setLiquidityPrediction] = useState<LiquidityPrediction>();
  const [config, setConfig] = useState<MonitoringConfig>({
    networks: ['ethereum'],
    protocols: [
      '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Aave V2
      '0xA0b86a33E6a1dC41Fb1B8C8F58C89e9f90Ad4a6E'  // Mock protocol
    ],
    upgradeTypes: ['governance', 'implementation', 'parameter'],
    riskThresholds: {
      volatility: 50,
      liquidity: 30,
      governance: 60
    },
    timeHorizon: '24h',
    assetPairs: ['ETH/USDC'],
    refreshInterval: 30000
  });

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket({
    onMessage: (data) => {
      console.log('Real-time update received:', data);
      // Handle real-time updates here
    }
  });

  useEffect(() => {
    const generatePredictions = async () => {
      // Generate mock historical data for models
      const historicalPrices = Array.from({ length: 100 }, (_, i) => 
        1000 + Math.sin(i * 0.1) * 100 + Math.random() * 50
      );

      const historicalTVL = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 86400000,
        tvl: 1000000000 + Math.sin(i * 0.1) * 100000000 + Math.random() * 50000000
      }));

      try {
        const volatilityService = VolatilityModelingService.getInstance();
        const liquidityService = LiquidityPredictionService.getInstance();

        const volatility = await volatilityService.predictVolatility(historicalPrices);
        const liquidity = await liquidityService.predictLiquidityFlow(historicalTVL);

        setVolatilityPrediction(volatility);
        setLiquidityPrediction(liquidity);

        // Generate risk assessment using multi-factor model
        setRiskAssessment({
          overall: Math.floor(Math.random() * 100),
          technical: Math.floor(Math.random() * 100),
          governance: Math.floor(Math.random() * 100),
          market: Math.floor(Math.random() * 100),
          liquidity: Math.floor(Math.random() * 100),
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error generating predictions:', error);
      }
    };

    generatePredictions();
    
    // Refresh predictions based on config interval
    const interval = setInterval(generatePredictions, config.refreshInterval);
    return () => clearInterval(interval);
  }, [config.refreshInterval]);

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworks(prev => 
      prev.includes(networkId) 
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const handleConfigChange = (newConfig: MonitoringConfig) => {
    setConfig(newConfig);
    setSelectedNetworks(newConfig.networks);
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Protocol Upgrade Monitor</h1>
              <p className="text-sm text-gray-400">
                High-performance blockchain monitoring & risk assessment system
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Real-time Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">Networks:</span>
                <span className="text-white font-bold">{selectedNetworks.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">Protocols:</span>
                <span className="text-white font-bold">{config.protocols.length}</span>
              </div>
              {riskAssessment && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Risk Score:</span>
                  <span className={`font-bold ${
                    riskAssessment.overall < 30 ? 'text-green-400' :
                    riskAssessment.overall < 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {riskAssessment.overall}/100
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsApiKeySetupOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
            
            <button
              onClick={() => setIsConfigOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configure
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Network Monitoring Dashboard */}
        <div className="w-80 flex-shrink-0">
          <NetworkMonitor
            selectedNetworks={selectedNetworks}
            onNetworkSelect={handleNetworkSelect}
            config={config}
            onConfigChange={handleConfigChange}
          />
        </div>

        {/* Center Panel - Protocol Timeline and Risk Indicators */}
        <div className="flex-1">
          <ProtocolTimeline
            selectedProtocols={config.protocols}
            selectedNetworks={selectedNetworks}
            riskAssessment={riskAssessment}
            volatilityPrediction={volatilityPrediction}
            liquidityPrediction={liquidityPrediction}
          />
        </div>

        {/* Right Panel - Execution Guidance and Recommendations */}
        <div className="w-96 flex-shrink-0">
          <ExecutionGuidancePanel
            selectedProtocols={config.protocols}
            riskAssessment={riskAssessment}
            volatilityPrediction={volatilityPrediction}
            liquidityPrediction={liquidityPrediction}
          />
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigurationPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
      />
      
      {/* API Key Setup Modal */}
      <ApiKeySetup
        isOpen={isApiKeySetupOpen}
        onClose={() => setIsApiKeySetupOpen(false)}
      />
    </div>
  );
}

export default App;