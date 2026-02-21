import { useMemo } from 'react';
import { usePool } from 'context/PoolContext';

/** Feature availability by tier */
const TIER_FEATURES: Record<string, string[]> = {
  free: [
    'treasury_ledger',
    'proposals_voting',
    'case_tracking',
    'public_transparency',
    'audit_logs',
  ],
  pro: [
    'treasury_ledger',
    'proposals_voting',
    'case_tracking',
    'public_transparency',
    'audit_logs',
    'reputation_weighted_voting',
    'advanced_analytics',
    'cost_projection',
    'private_pools',
    'custom_governance',
    'data_export',
  ],
  federation: [
    'treasury_ledger',
    'proposals_voting',
    'case_tracking',
    'public_transparency',
    'audit_logs',
    'reputation_weighted_voting',
    'advanced_analytics',
    'cost_projection',
    'private_pools',
    'custom_governance',
    'data_export',
    'federation_alliances',
    'shared_war_chest',
    'inter_pool_voting',
    'federation_analytics',
  ],
};

/** Check if a feature is enabled for the current pool's tier */
export const useFeatureFlag = (feature: string): boolean => {
  const { currentPool } = usePool();
  return useMemo(() => {
    if (!currentPool) return false;
    const tier = currentPool.subscriptionTier || 'free';
    return TIER_FEATURES[tier]?.includes(feature) ?? false;
  }, [currentPool, feature]);
};

/** Get all available features for current pool */
export const useAvailableFeatures = (): string[] => {
  const { currentPool } = usePool();
  return useMemo(() => {
    if (!currentPool) return [];
    const tier = currentPool.subscriptionTier || 'free';
    return TIER_FEATURES[tier] || TIER_FEATURES.free;
  }, [currentPool]);
};

/** Get current tier */
export const useCurrentTier = (): string => {
  const { currentPool } = usePool();
  return currentPool?.subscriptionTier || 'free';
};

export default useFeatureFlag;
