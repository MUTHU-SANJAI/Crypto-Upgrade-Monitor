import { GovernanceProposal } from '../types';

export class GovernanceAnalysisService {
  private static instance: GovernanceAnalysisService;

  static getInstance(): GovernanceAnalysisService {
    if (!GovernanceAnalysisService.instance) {
      GovernanceAnalysisService.instance = new GovernanceAnalysisService();
    }
    return GovernanceAnalysisService.instance;
  }

  async predictProposalOutcome(proposal: GovernanceProposal): Promise<{
    successProbability: number;
    confidence: number;
    factors: Array<{ name: string; impact: number; weight: number }>;
  }> {
    try {
      // Multi-factor model for governance outcome prediction
      const factors = [
        {
          name: 'Voter Participation',
          impact: this.calculateParticipationImpact(proposal),
          weight: 0.25
        },
        {
          name: 'Vote Distribution',
          impact: this.calculateVoteDistributionImpact(proposal),
          weight: 0.3
        },
        {
          name: 'Proposal Quality',
          impact: this.calculateProposalQualityImpact(proposal),
          weight: 0.2
        },
        {
          name: 'Community Sentiment',
          impact: Math.random() * 2 - 1, // Mock sentiment
          weight: 0.15
        },
        {
          name: 'Historical Pattern',
          impact: this.calculateHistoricalPatternImpact(proposal),
          weight: 0.1
        }
      ];
      
      // Weighted probability calculation
      const weightedScore = factors.reduce((sum, factor) => 
        sum + factor.impact * factor.weight, 0);
      
      // Convert to probability [0,1]
      const successProbability = Math.max(0, Math.min(1, (weightedScore + 1) / 2));
      
      // Confidence based on data quality and consistency
      const confidence = this.calculatePredictionConfidence(factors);
      
      return {
        successProbability,
        confidence,
        factors
      };
    } catch (error) {
      console.error('Error predicting proposal outcome:', error);
      
      return {
        successProbability: Math.random(),
        confidence: 0.5,
        factors: []
      };
    }
  }

  private calculateParticipationImpact(proposal: GovernanceProposal): number {
    const participationRate = proposal.totalVotes / (proposal.totalVotes + proposal.quorum);
    
    // Higher participation generally increases success probability
    if (participationRate > 1.5) return 0.8;
    if (participationRate > 1.0) return 0.4;
    if (participationRate > 0.5) return 0.0;
    return -0.6;
  }

  private calculateVoteDistributionImpact(proposal: GovernanceProposal): number {
    if (proposal.totalVotes === 0) return 0;
    
    const forRatio = proposal.votesFor / proposal.totalVotes;
    
    // Convert vote ratio to impact score
    return (forRatio - 0.5) * 2; // Maps [0,1] to [-1,1]
  }

  private calculateProposalQualityImpact(proposal: GovernanceProposal): number {
    // Simple quality scoring based on description length and content
    const descLength = proposal.description.length;
    let qualityScore = 0;
    
    // Length-based scoring
    if (descLength > 1000) qualityScore += 0.3;
    else if (descLength > 500) qualityScore += 0.1;
    else qualityScore -= 0.2;
    
    // Keyword-based scoring
    const qualityKeywords = ['analysis', 'benefit', 'risk', 'implementation', 'timeline'];
    const keywordMatches = qualityKeywords.filter(keyword => 
      proposal.description.toLowerCase().includes(keyword)).length;
    
    qualityScore += (keywordMatches / qualityKeywords.length) * 0.4;
    
    return Math.max(-1, Math.min(1, qualityScore));
  }

  private calculateHistoricalPatternImpact(proposal: GovernanceProposal): number {
    // Mock historical pattern analysis
    // In practice, this would analyze past proposals of similar type
    return Math.random() * 0.4 - 0.2; // Small random impact
  }

  private calculatePredictionConfidence(
    factors: Array<{ name: string; impact: number; weight: number }>
  ): number {
    // Confidence based on factor agreement and data quality
    const impacts = factors.map(f => f.impact);
    const variance = this.calculateVariance(impacts);
    
    // Lower variance in factors = higher confidence
    const baseConfidence = Math.max(0.3, 1 - variance);
    
    return baseConfidence;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return variance;
  }

  async analyzeVotingPatterns(proposals: GovernanceProposal[]): Promise<{
    averageParticipation: number;
    successRate: number;
    voterConcentration: number;
    trends: Array<{ period: string; metric: string; value: number; change: number }>;
  }> {
    if (proposals.length === 0) {
      return {
        averageParticipation: 0,
        successRate: 0,
        voterConcentration: 0,
        trends: []
      };
    }
    
    // Calculate participation metrics
    const participationRates = proposals.map(p => p.totalVotes / (p.totalVotes + p.quorum));
    const averageParticipation = participationRates.reduce((sum, rate) => sum + rate, 0) / participationRates.length;
    
    // Calculate success rate
    const successfulProposals = proposals.filter(p => p.status === 'succeeded' || p.status === 'executed');
    const successRate = successfulProposals.length / proposals.length;
    
    // Mock voter concentration (Gini coefficient would be ideal)
    const voterConcentration = Math.random() * 0.5 + 0.3;
    
    // Generate trend data
    const trends = [
      {
        period: '7d',
        metric: 'participation',
        value: averageParticipation,
        change: (Math.random() - 0.5) * 0.2
      },
      {
        period: '7d',
        metric: 'success_rate',
        value: successRate,
        change: (Math.random() - 0.5) * 0.3
      }
    ];
    
    return {
      averageParticipation,
      successRate,
      voterConcentration,
      trends
    };
  }

  async predictGovernanceRisk(
    proposal: GovernanceProposal,
    protocolMetrics: any
  ): Promise<{
    riskScore: number;
    riskFactors: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; description: string }>;
    mitigationStrategies: string[];
  }> {
    const riskFactors = [];
    let totalRisk = 0;
    
    // Low participation risk
    const participationRate = proposal.totalVotes / (proposal.totalVotes + proposal.quorum);
    if (participationRate < 0.3) {
      riskFactors.push({
        factor: 'Low Participation',
        severity: 'high' as const,
        description: 'Insufficient voter participation may lead to unrepresentative outcomes'
      });
      totalRisk += 30;
    }
    
    // Concentration risk
    const voteConcentration = Math.max(proposal.votesFor, proposal.votesAgainst) / proposal.totalVotes;
    if (voteConcentration > 0.8) {
      riskFactors.push({
        factor: 'Vote Concentration',
        severity: 'medium' as const,
        description: 'High concentration of votes may indicate governance centralization'
      });
      totalRisk += 20;
    }
    
    // Timeline risk
    const timeToEnd = proposal.endTime - Date.now();
    if (timeToEnd < 86400000) { // Less than 24 hours
      riskFactors.push({
        factor: 'Short Timeline',
        severity: 'medium' as const,
        description: 'Limited time for community review and discussion'
      });
      totalRisk += 15;
    }
    
    // Implementation risk
    if (proposal.description.length < 200) {
      riskFactors.push({
        factor: 'Insufficient Detail',
        severity: 'high' as const,
        description: 'Lack of detailed implementation plan increases execution risk'
      });
      totalRisk += 25;
    }
    
    const mitigationStrategies = [
      'Extend voting period to allow for more participation',
      'Implement delegation mechanisms to reduce concentration',
      'Require detailed technical specifications for implementation proposals',
      'Establish emergency pause mechanisms for critical upgrades'
    ];
    
    return {
      riskScore: Math.min(100, totalRisk),
      riskFactors,
      mitigationStrategies
    };
  }
}