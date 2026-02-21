import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { usePool } from 'context/PoolContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import TierBadge from 'components/common/TierBadge';

interface SidebarLink {
  to: string;
  label: string;
  icon: string;
  feature?: string; // Required feature flag
}

const Sidebar: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { currentPool } = usePool();

  const baseLinks: SidebarLink[] = [
    { to: `/pool/${poolId}`, label: 'Overview', icon: '📊' },
    { to: `/pool/${poolId}/proposals`, label: 'Proposals', icon: '📋' },
    { to: `/pool/${poolId}/treasury`, label: 'Treasury', icon: '💰' },
    { to: `/pool/${poolId}/cases`, label: 'Cases', icon: '⚖️' },
    { to: `/pool/${poolId}/members`, label: 'Members', icon: '👥' },
    { to: `/pool/${poolId}/audit`, label: 'Audit Log', icon: '📜' },
  ];

  const proLinks: SidebarLink[] = [
    { to: `/pool/${poolId}/analytics`, label: 'Analytics', icon: '📈', feature: 'advanced_analytics' },
    { to: `/pool/${poolId}/reputation`, label: 'Reputation', icon: '⭐', feature: 'reputation_weighted_voting' },
    { to: `/pool/${poolId}/cost-projection`, label: 'Cost Projection', icon: '🧮', feature: 'cost_projection' },
  ];

  const fedLinks: SidebarLink[] = [
    { to: `/pool/${poolId}/federation`, label: 'Federation', icon: '🏛️', feature: 'federation_alliances' },
  ];

  const settingsLinks: SidebarLink[] = [
    { to: `/pool/${poolId}/settings`, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)', background: 'var(--bg-sidebar)',
      color: 'white', minHeight: 'calc(100vh - var(--navbar-height))',
      padding: '20px 0', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 'var(--navbar-height)', flexShrink: 0,
    }}>
      {/* Pool name & tier */}
      {currentPool && (
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
            {currentPool.name}
          </h3>
          <TierBadge tier={currentPool.subscriptionTier} />
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        <SidebarSection title="General" links={baseLinks} />
        <SidebarSection title="Pro Features" links={proLinks} />
        <SidebarSection title="Federation" links={fedLinks} />
        <SidebarSection title="Admin" links={settingsLinks} />
      </nav>
    </aside>
  );
};

const SidebarSection: React.FC<{ title: string; links: SidebarLink[] }> = ({ title, links }) => {
  const filteredLinks = links.filter(link => {
    if (!link.feature) return true;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useFeatureFlag(link.feature);
  });

  if (filteredLinks.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        padding: '4px 20px', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1.2,
        color: 'rgba(255,255,255,0.4)',
      }}>
        {title}
      </div>
      {filteredLinks.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === `/pool/${link.to.split('/')[2]}`}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 20px', fontSize: 14, fontWeight: 500,
            color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--primary-light)' : '3px solid transparent',
            textDecoration: 'none',
            transition: 'all 0.15s',
          })}
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
