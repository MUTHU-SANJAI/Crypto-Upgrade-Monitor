import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Plus, Trash2 } from 'lucide-react';
import { Network, MonitoringConfig } from '../types';
import { BlockchainApiService } from '../services/blockchainApi';
import { clsx } from 'clsx';

interface NetworkMonitorProps {
  selectedNetworks: string[];
  onNetworkSelect: (networkId: string) => void;
  config: MonitoringConfig;
  onConfigChange: (config: MonitoringConfig) => void;
}

interface NetworkStatus {
  network: Network;
  blockHeight: number;
  gasPrice: number;
  tps: number;
  validators: number;
  isConnected: boolean;
  lastUpdate: number;
}

interface LiveEvent {
  id: string;
  type: 'transaction' | 'proposal' | 'upgrade';
  network: string;
  description: string;
  timestamp: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const NETWORKS: Network[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    chainId: 0,
    rpcUrl: 'https://blockstream.info/api',
    explorerUrl: 'https://blockstream.info/api',
    icon: '₿'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/',
    explorerUrl: 'https://api.etherscan.io',
    icon: '⟠'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://api.polygonscan.com',
    icon: '⬟'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://api.arbiscan.io',
    icon: '🔷'
  }
];

const UPGRADE_TYPES = [
  { id: 'governance', name: 'Governance proposals' },
  { id: 'implementation', name: 'Implementation upgrades' },
  { id: 'parameter', name: 'Parameter changes' }
];

const ASSET_PAIRS = [
  'ETH/USDT', 'BTC/USDT', 'MATIC/DAI', 'ETH/DAI', 'AAVE/ETH', 'UNI/ETH', 'LINK/ETH'
];

export function NetworkMonitor({ selectedNetworks, onNetworkSelect, config, onConfigChange }: NetworkMonitorProps) {
  const [networkStatuses, setNetworkStatuses] = useState<NetworkStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProtocol, setNewProtocol] = useState('');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const fetchNetworkStatuses = async () => {
      const apiService = BlockchainApiService.getInstance();
      
      try {
        const statuses = await Promise.all(
          NETWORKS.map(async (network) => {
            try {
              const status = await apiService.getNetworkStatus(network);
              return {
                network,
                ...status,
                isConnected: true,
                lastUpdate: Date.now()
              };
            } catch (error) {
              return {
                network,
                blockHeight: 0,
                gasPrice: 0,
                tps: 0,
                validators: 0,
                isConnected: false,
                lastUpdate: Date.now()
              };
            }
          })
        );
        
        setNetworkStatuses(statuses);
      } catch (error) {
        console.error('Error fetching network statuses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkStatuses();
    
    // Update every 30 seconds
    const interval = setInterval(fetchNetworkStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Generate live events
  useEffect(() => {
    const generateLiveEvent = () => {
      const eventTypes = ['transaction', 'proposal', 'upgrade'] as const;
      const riskLevels = ['low', 'medium', 'high'] as const;
      const networks = selectedNetworks.length > 0 ? selectedNetworks : ['ethereum'];
      
      const newEvent: LiveEvent = {
        id: `event-${Date.now()}`,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        network: networks[Math.floor(Math.random() * networks.length)],
        description: `New ${eventTypes[Math.floor(Math.random() * eventTypes.length)]} detected`,
        timestamp: Date.now(),
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)]
      };
      
      setLiveEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
    };

    const interval = setInterval(generateLiveEvent, 5000);
    return () => clearInterval(interval);
  }, [selectedNetworks]);

  const addProtocol = () => {
    if (newProtocol.trim() && !config.protocols.includes(newProtocol.trim())) {
      onConfigChange({
        ...config,
        protocols: [...config.protocols, newProtocol.trim()]
      });
      setNewProtocol('');
    }
  };

  const removeProtocol = (protocol: string) => {
    onConfigChange({
      ...config,
      protocols: config.protocols.filter(p => p !== protocol)
    });
  };

  const handleUpgradeTypeChange = (upgradeType: string, checked: boolean) => {
    const newUpgradeTypes = checked
      ? [...config.upgradeTypes, upgradeType]
      : config.upgradeTypes.filter(type => type !== upgradeType);
    
    onConfigChange({
      ...config,
      upgradeTypes: newUpgradeTypes
    });
  };

  const handleAssetPairChange = (assetPair: string) => {
    onConfigChange({
      ...config,
      assetPairs: [assetPair]
    });
  };

  const handleTimeHorizonChange = (horizon: string) => {
    onConfigChange({
      ...config,
      timeHorizon: horizon as any
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          Network Monitoring Dashboard
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Network Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Network Selector</h3>
          <div className="space-y-2">
            {NETWORKS.map((network) => {
              const status = networkStatuses.find(s => s.network.id === network.id);
              return (
                <label
                  key={network.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedNetworks.includes(network.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedNetworks.includes(network.id)}
                    onChange={() => onNetworkSelect(network.id)}
                    className="sr-only"
                  />
                  <span className="text-lg">{network.icon}</span>
                  <div className="flex-1">
                    <span className="text-white font-medium">{network.name}</span>
                    {status && (
                      <div className="text-xs text-gray-400 mt-1">
                        Block: {status.blockHeight.toLocaleString()} | Gas: {status.gasPrice.toFixed(1)} gwei
                      </div>
                    )}
                  </div>
                  {status?.isConnected ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Protocol Addresses Input */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Protocol Addresses</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newProtocol}
                onChange={(e) => setNewProtocol(e.target.value)}
                placeholder="Enter smart contract address"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={addProtocol}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {config.protocols.map((protocol) => (
                <div
                  key={protocol}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700"
                >
                  <span className="text-white font-mono text-xs truncate">{protocol}</span>
                  <button
                    onClick={() => removeProtocol(protocol)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Types Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Upgrade Types</h3>
          <div className="space-y-2">
            {UPGRADE_TYPES.map((type) => (
              <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.upgradeTypes.includes(type.id)}
                  onChange={(e) => handleUpgradeTypeChange(type.id, e.target.checked)}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">{type.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Risk Threshold Sliders */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Risk Thresholds</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Volatility Tolerance: {config.riskThresholds.volatility}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.riskThresholds.volatility}
                onChange={(e) => onConfigChange({
                  ...config,
                  riskThresholds: {
                    ...config.riskThresholds,
                    volatility: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Liquidity Requirements: {config.riskThresholds.liquidity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.riskThresholds.liquidity}
                onChange={(e) => onConfigChange({
                  ...config,
                  riskThresholds: {
                    ...config.riskThresholds,
                    liquidity: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Time Horizon</h3>
          <div className="space-y-2">
            {[
              { value: '1h', label: 'Short-term' },
              { value: '24h', label: 'Medium-term' },
              { value: '7d', label: 'Long-term' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeHorizon"
                  value={option.value}
                  checked={config.timeHorizon === option.value}
                  onChange={() => handleTimeHorizonChange(option.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300 text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Asset Pairs Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Asset Pairs</h3>
          <select
            value={config.assetPairs[0] || ''}
            onChange={(e) => handleAssetPairChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="">Select asset pair</option>
            {ASSET_PAIRS.map((pair) => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>

        {/* Live Feed */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Live Feed</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {liveEvents.map((event) => (
              <div key={event.id} className="p-2 bg-gray-800 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 capitalize">{event.type}</span>
                  <span className={`text-xs font-medium ${getRiskColor(event.riskLevel)}`}>
                    {event.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-white">{event.description}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 capitalize">{event.network}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}