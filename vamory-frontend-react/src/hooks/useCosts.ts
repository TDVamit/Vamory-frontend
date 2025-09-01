import { useState, useEffect } from 'react';
import { costAPI } from '../services/api';
import type { CostResponse } from '../types';

export const useCosts = () => {
  const [costs, setCosts] = useState<CostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const costData = await costAPI.getCosts();
        setCosts(costData);
      } catch (err) {
        console.error('Failed to fetch costs:', err);
        setError('Failed to load pricing information');
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
  }, []);

  // Calculate standard storage cost using dynamic pricing
  const calculateStandardCost = (gb: number): number => {
    if (!costs) return 0;
    
    let totalCost = 0;
    let remainingGB = gb;

    for (const tier of costs.standard_storage.tiers) {
      if (remainingGB <= 0) break;
      
      const tierGB = tier.max_gb === null 
        ? remainingGB 
        : Math.min(remainingGB, tier.max_gb - tier.min_gb);
      
      totalCost += tierGB * tier.cost_per_gb;
      remainingGB -= tierGB;
    }

    return totalCost;
  };

  // Calculate archive storage cost using dynamic pricing
  const calculateArchiveCost = (gb: number): number => {
    if (!costs) return 0;
    
    let totalCost = 0;
    let remainingGB = gb;

    for (const tier of costs.archive_storage.tiers) {
      if (remainingGB <= 0) break;
      
      const tierGB = tier.max_gb === null 
        ? remainingGB 
        : Math.min(remainingGB, tier.max_gb - tier.min_gb);
      
      totalCost += tierGB * tier.cost_per_gb;
      remainingGB -= tierGB;
    }

    return totalCost;
  };

  // Calculate retrieval cost using dynamic pricing
  const calculateRetrievalCost = (gb: number): number => {
    if (!costs) return 0;
    return gb * costs.retrieval.cost_per_gb;
  };

  return {
    costs,
    loading,
    error,
    calculateStandardCost,
    calculateArchiveCost,
    calculateRetrievalCost,
  };
};
