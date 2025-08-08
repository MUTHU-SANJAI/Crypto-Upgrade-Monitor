import React, { useState } from 'react';
import { Settings, Plus, Trash2, Save } from 'lucide-react';
import { MonitoringConfig } from '../types';
import { clsx } from 'clsx';

interface ConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: MonitoringConfig;
  onConfigChange: (config: MonitoringConfig) => void;
}

const AVAILABLE_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { id: 'polygon', name: 'Polygon', icon: '⬟' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
  { id: 'bitcoin', name: 'Bitcoin', icon: '₿' }
];

const UPGRADE_TYPES = [
  { id: 'governance', name: 'Governance Proposals', description: 'Protocol governance votes and proposals' },
  { id: 'implementation', name: 'Implementation Upgrades', description: 'Smart contract implementation changes' },
  { id: 'parameter', name: 'Parameter Changes', description: 'Protocol parameter modifications' }
];

export function ConfigurationPanel({ isOpen, onClose, config, onConfigChange }: ConfigurationPanelProps) {
  const [localConfig, setLocalConfig] = useState<MonitoringConfig>(config);
  const [newProtocol, setNewProtocol] = useState('');
  const [newAssetPair, setNewAssetPair] = useState('');

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleNetworkToggle = (networkId: string) => {
    const networks = localConfig.networks.includes(networkId)
      ? localConfig.networks.filter(id => id !== networkId)
      : [...localConfig.networks, networkId];
    
    setLocalConfig({ ...localConfig, networks });
  };

  const handleUpgradeTypeToggle = (upgradeType: string) => {
    const upgradeTypes = localConfig.upgradeTypes.includes(upgradeType)
      ? localConfig.upgradeTypes.filter(type => type !== upgradeType)
      : [...localConfig.upgradeTypes, upgradeType];
    
    setLocalConfig({ ...localConfig, upgradeTypes });
  };

  const addProtocol = () => {
    if (newProtocol.trim() && !localConfig.protocols.includes(newProtocol.trim())) {
      setLocalConfig({
        ...localConfig,
        protocols: [...localConfig.protocols, newProtocol.trim()]
      });
      setNewProtocol('');
    }
  };

  const removeProtocol = (protocol: string) => {
    setLocalConfig({
      ...localConfig,
      protocols: localConfig.protocols.filter(p => p !== protocol)
    });
  };

  const addAssetPair = () => {
    if (newAssetPair.trim() && !localConfig.assetPairs.includes(newAssetPair.trim())) {
      setLocalConfig({
        ...localConfig,
        assetPairs: [...localConfig.assetPairs, newAssetPair.trim()]
      });
      setNewAssetPair('');
    }
  };

  const removeAssetPair = (assetPair: string) => {
    setLocalConfig({
      ...localConfig,
      assetPairs: localConfig.assetPairs.filter(pair => pair !== assetPair)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-400" />
              Monitoring Configuration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Network Selection */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Networks to Monitor</h3>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_NETWORKS.map((network) => (
                <label
                  key={network.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    localConfig.networks.includes(network.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={localConfig.networks.includes(network.id)}
                    onChange={() => handleNetworkToggle(network.id)}
                    className="sr-only"
                  />
                  <span className="text-lg">{network.icon}</span>
                  <span className="text-white font-medium">{network.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Protocol Addresses */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Protocol Addresses</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProtocol}
                  onChange={(e) => setNewProtocol(e.target.value)}
                  placeholder="Enter protocol address (e.g., 0x...)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={addProtocol}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {localConfig.protocols.map((protocol) => (
                  <div
                    key={protocol}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <span className="text-white font-mono text-sm">{protocol}</span>
                    <button
                      onClick={() => removeProtocol(protocol)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upgrade Types */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Upgrade Types to Monitor</h3>
            <div className="space-y-3">
              {UPGRADE_TYPES.map((type) => (
                <label
                  key={type.id}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                    localConfig.upgradeTypes.includes(type.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={localConfig.upgradeTypes.includes(type.id)}
                    onChange={() => handleUpgradeTypeToggle(type.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-medium">{type.name}</div>
                    <div className="text-gray-400 text-sm">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Thresholds */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Risk Thresholds</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Volatility Tolerance
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localConfig.riskThresholds.volatility}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    riskThresholds: {
                      ...localConfig.riskThresholds,
                      volatility: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <div className="text-center text-white text-sm mt-1">
                  {localConfig.riskThresholds.volatility}%
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Liquidity Requirements
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localConfig.riskThresholds.liquidity}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    riskThresholds: {
                      ...localConfig.riskThresholds,
                      liquidity: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <div className="text-center text-white text-sm mt-1">
                  {localConfig.riskThresholds.liquidity}%
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Governance Risk
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localConfig.riskThresholds.governance}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    riskThresholds: {
                      ...localConfig.riskThresholds,
                      governance: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
                <div className="text-center text-white text-sm mt-1">
                  {localConfig.riskThresholds.governance}%
                </div>
              </div>
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Analysis Time Horizon</h3>
            <div className="flex gap-2">
              {['1h', '24h', '7d', '30d'].map((horizon) => (
                <button
                  key={horizon}
                  onClick={() => setLocalConfig({ ...localConfig, timeHorizon: horizon as any })}
                  className={clsx(
                    'px-4 py-2 rounded-lg border transition-colors',
                    localConfig.timeHorizon === horizon
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                  )}
                >
                  {horizon}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Pairs */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Asset Pairs to Monitor</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAssetPair}
                  onChange={(e) => setNewAssetPair(e.target.value)}
                  placeholder="Enter asset pair (e.g., ETH/USDC)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={addAssetPair}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {localConfig.assetPairs.map((pair) => (
                  <div
                    key={pair}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1"
                  >
                    <span className="text-white text-sm">{pair}</span>
                    <button
                      onClick={() => removeAssetPair(pair)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Data Refresh Interval</h3>
            <select
              value={localConfig.refreshInterval}
              onChange={(e) => setLocalConfig({ ...localConfig, refreshInterval: parseInt(e.target.value) })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}