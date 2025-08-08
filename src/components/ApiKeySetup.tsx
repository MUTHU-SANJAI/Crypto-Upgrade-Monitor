import React, { useState } from 'react';
import { Key, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeySetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeySetup({ isOpen, onClose }: ApiKeySetupProps) {
  const [apiKeys, setApiKeys] = useState({
    etherscan: import.meta.env.VITE_ETHERSCAN_API_KEY || '',
    polygonscan: import.meta.env.VITE_POLYGONSCAN_API_KEY || '',
    arbiscan: import.meta.env.VITE_ARBISCAN_API_KEY || '',
    coingecko: import.meta.env.VITE_COINGECKO_API_KEY || '',
    twitter: import.meta.env.VITE_TWITTER_BEARER_TOKEN || '',
    huggingface: import.meta.env.VITE_HUGGINGFACE_API_KEY || ''
  });

  const apiProviders = [
    {
      name: 'Etherscan',
      key: 'etherscan',
      url: 'https://etherscan.io/apis',
      description: 'Ethereum blockchain data and contract information',
      required: true
    },
    {
      name: 'PolygonScan',
      key: 'polygonscan',
      url: 'https://polygonscan.com/apis',
      description: 'Polygon blockchain data and contract information',
      required: false
    },
    {
      name: 'Arbiscan',
      key: 'arbiscan',
      url: 'https://arbiscan.io/apis',
      description: 'Arbitrum blockchain data and contract information',
      required: false
    },
    {
      name: 'CoinGecko',
      key: 'coingecko',
      url: 'https://www.coingecko.com/en/api',
      description: 'Cryptocurrency market data and prices',
      required: true
    },
    {
      name: 'Twitter API',
      key: 'twitter',
      url: 'https://developer.twitter.com/en/portal/dashboard',
      description: 'Social sentiment analysis from Twitter',
      required: false
    },
    {
      name: 'Hugging Face',
      key: 'huggingface',
      url: 'https://huggingface.co/settings/tokens',
      description: 'AI-powered sentiment analysis',
      required: false
    }
  ];

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const getKeyStatus = (key: string) => {
    if (!key) return 'missing';
    if (key.length < 10) return 'invalid';
    return 'valid';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-400" />
              API Key Configuration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            Configure your API keys to enable real-time data fetching. Create a .env file in your project root with these keys.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {apiProviders.map((provider) => (
            <div key={provider.key} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-white">{provider.name}</h3>
                  {provider.required && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                      Required
                    </span>
                  )}
                  {getStatusIcon(getKeyStatus(apiKeys[provider.key as keyof typeof apiKeys]))}
                </div>
                <a
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  Get API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <p className="text-gray-400 text-sm mb-3">{provider.description}</p>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  API Key / Bearer Token
                </label>
                <input
                  type="password"
                  value={apiKeys[provider.key as keyof typeof apiKeys]}
                  onChange={(e) => handleKeyChange(provider.key, e.target.value)}
                  placeholder={`Enter your ${provider.name} API key`}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <div className="text-xs text-gray-400">
                  Environment variable: <code>VITE_{provider.key.toUpperCase()}_API_KEY</code>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">Environment Setup Instructions</h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Create a <code>.env</code> file in your project root directory</li>
              <li>Copy the example from <code>.env.example</code></li>
              <li>Replace the placeholder values with your actual API keys</li>
              <li>Restart your development server for changes to take effect</li>
            </ol>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-medium text-yellow-300 mb-2">Security Notice</h4>
            <p className="text-sm text-gray-300">
              Never commit your <code>.env</code> file to version control. The <code>.env.example</code> file 
              shows the required format without exposing your actual keys.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}