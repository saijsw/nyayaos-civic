import { FeatureFlags, SubscriptionTier } from "../types";

/**
 * Feature Flag Engine
 * Returns the feature flags map based on the pool's subscription tier.
 * This is the single source of truth for what features are available.
 */

const TIER_FLAGS: Record<SubscriptionTier, FeatureFlags> = {
  free: {
    reputationWeightedVoting: false,
    advancedAnalytics: false,
    costProjection: false,
    privatePools: false,
    customGovernance: false,
    dataExport: false,
    federationAccess: false,
    sharedWarChest: false,
    interPoolVoting: false,
    federationAnalytics: false,
  },
  pro: {
    reputationWeightedVoting: true,
    advancedAnalytics: true,
    costProjection: true,
    privatePools: true,
    customGovernance: true,
    dataExport: true,
    federationAccess: false,
    sharedWarChest: false,
    interPoolVoting: false,
    federationAnalytics: false,
  },
  federation: {
    reputationWeightedVoting: true,
    advancedAnalytics: true,
    costProjection: true,
    privatePools: true,
    customGovernance: true,
    dataExport: true,
    federationAccess: true,
    sharedWarChest: true,
    interPoolVoting: true,
    federationAnalytics: true,
  },
};

/** Get feature flags for a given tier */
export function getFlagsForTier(tier: SubscriptionTier): FeatureFlags {
  return TIER_FLAGS[tier] || TIER_FLAGS.free;
}

/** Check if a specific feature is enabled for a tier */
export function isFeatureEnabled(
  tier: SubscriptionTier,
  feature: keyof FeatureFlags
): boolean {
  const flags = getFlagsForTier(tier);
  return flags[feature] === true;
}

/** Get all enabled feature names for a tier */
export function getEnabledFeatures(tier: SubscriptionTier): string[] {
  const flags = getFlagsForTier(tier);
  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}
