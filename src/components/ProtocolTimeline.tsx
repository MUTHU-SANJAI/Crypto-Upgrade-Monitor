import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { UpgradeEvent, GovernanceProposal, RiskAssessment, VolatilityPrediction, LiquidityPrediction } from '../types';
import { BlockchainApiService } from '../services/blockchainApi';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface ProtocolTimelineProps {
  selectedProtocols: string[];
  selectedNetworks: string[];
  riskAssessment?: RiskAssessment;
  volatilityPrediction?: VolatilityPrediction;
  liquidityPrediction?: LiquidityPrediction;
}

interface UpgradeDetails {
  id: string;
  title: string;
  description: string;
  voteCount: number;
  outcomePredict: number;
  historicalData: Array<{
    date: string;
    similarUpgrade: string;
    outcome: string;
    impact: number;
  }>;
}

export function ProtocolTimeline({ 
  selectedProtocols, 
  selectedNetworks, 
  riskAssessment,
  volatilityPrediction,
  liquidityPrediction 
}: ProtocolTimelineProps) {
  const [events, setEvents] = useState<UpgradeEvent[]>([]);
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<UpgradeEvent | null>(null);
  const [upgradeDetails, setUpgradeDetails] = useState<UpgradeDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedProtocols.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const apiService = BlockchainApiService.getInstance();
        
        const allEvents: UpgradeEvent[] = [];
        const allProposals: GovernanceProposal[] = [];
        
        for (const protocolAddress of selectedProtocols) {
          const protocolEvents = await apiService.getUpgradeEvents(protocolAddress);
          const protocolProposals = await apiService.getGovernanceProposals(protocolAddress);
          
          allEvents.push(...protocolEvents);
          allProposals.push(...protocolProposals);
        }
        
        // Sort by timestamp
        allEvents.sort((a, b) => b.timestamp - a.timestamp);
        allProposals.sort((a, b) => b.endTime - a.endTime);
        
        setEvents(allEvents);
        setProposals(allProposals);
      } catch (error) {
        console.error('Error fetching protocol data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedProtocols, selectedNetworks]);

  const handleEventClick = (event: UpgradeEvent) => {
    setSelectedEvent(event);
    
    // Generate mock upgrade details
    setUpgradeDetails({
      id: event.id,
      title: event.title,
      description: event.description,
      voteCount: Math.floor(Math.random() * 10000),
      outcomePredict: Math.random(),
      historicalData: [
        {
          date: '2024-01-15',
          similarUpgrade: 'Governance Parameter Update',
          outcome: 'Passed',
          impact: 0.15
        },
        {
          date: '2023-12-10',
          similarUpgrade: 'Implementation Upgrade',
          outcome: 'Failed',
          impact: -0.08
        },
        {
          date: '2023-11-22',
          similarUpgrade: 'Protocol Enhancement',
          outcome: 'Passed',
          impact: 0.22
        }
      ]
    });
  };

  const getEventStatusIcon = (status: UpgradeEvent['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'active':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return { bg: 'bg-green-500', text: 'text-green-400', label: 'Low Risk' };
    if (score < 70) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium Risk' };
    return { bg: 'bg-red-500', text: 'text-red-400', label: 'High Risk' };
  };

  const generateVolatilityData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      volatility: Math.random() * 0.5 + 0.1
    }));
  };

  const generateLiquidityData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      tvl: Math.random() * 1000000000 + 500000000
    }));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Protocol Upgrade Timeline and Risk Indicators
        </h2>
      </div>

      <div className="flex-1 flex">
        {/* Timeline Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Interactive Timeline */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-4">Protocol Upgrade Timeline</h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upgrade events found</p>
                </div>
              ) : (
                events.map((event) => {
                  const riskInfo = getRiskColor(event.riskScore);
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={clsx(
                        'border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-800',
                        selectedEvent?.id === event.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getEventStatusIcon(event.status)}
                          <h4 className="font-medium text-white">{event.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${riskInfo.bg}`} />
                          <span className={`text-sm font-medium ${riskInfo.text}`}>
                            {riskInfo.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{event.description}</p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{event.protocolName}</span>
                        <span>{format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Risk Score Gauge */}
          {riskAssessment && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-white mb-4">Risk Score Gauge</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={riskAssessment.overall < 30 ? "#10B981" : riskAssessment.overall < 70 ? "#F59E0B" : "#EF4444"}
                        strokeWidth="3"
                        strokeDasharray={`${riskAssessment.overall}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{riskAssessment.overall}</div>
                        <div className="text-xs text-gray-400">Risk Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volatility Graph */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-4">Volatility Graph</h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="h-32 flex items-end justify-between gap-1">
                {generateVolatilityData().map((point, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-t"
                    style={{
                      height: `${point.volatility * 100}%`,
                      width: '3%'
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-400 text-center">
                Expected Volatility Impact (24h)
              </div>
            </div>
          </div>

          {/* Liquidity Forecast Graph */}
          <div>
            <h3 className="text-md font-medium text-white mb-4">Liquidity Forecast Graph</h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="h-32 flex items-end justify-between gap-1">
                {generateLiquidityData().map((point, index) => (
                  <div
                    key={index}
                    className="bg-emerald-500 rounded-t"
                    style={{
                      height: `${(point.tvl / 1500000000) * 100}%`,
                      width: '12%'
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-400 text-center">
                TVL Movement Prediction (7 days)
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Details Popup */}
        {selectedEvent && upgradeDetails && (
          <div className="w-80 border-l border-gray-700 bg-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Upgrade Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Proposal Title</h4>
                <p className="text-white">{upgradeDetails.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                <p className="text-gray-300 text-sm">{upgradeDetails.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Vote Count</h4>
                <p className="text-white font-mono">{upgradeDetails.voteCount.toLocaleString()}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Outcome Prediction</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${upgradeDetails.outcomePredict * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">
                    {(upgradeDetails.outcomePredict * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Historical Data</h4>
                <div className="space-y-2">
                  {upgradeDetails.historicalData.map((item, index) => (
                    <div key={index} className="bg-gray-700 rounded p-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white text-sm">{item.similarUpgrade}</span>
                        <span className={`text-xs ${item.outcome === 'Passed' ? 'text-green-400' : 'text-red-400'}`}>
                          {item.outcome}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{item.date}</span>
                        <span>Impact: {(item.impact * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}