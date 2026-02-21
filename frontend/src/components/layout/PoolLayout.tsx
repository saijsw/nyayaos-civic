import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { usePool } from 'context/PoolContext';
import LoadingSpinner from 'components/common/LoadingSpinner';

/** Layout wrapper for pool pages: sidebar + content area */
const PoolLayout: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { currentPool, setCurrentPoolId, loading } = usePool();

  useEffect(() => {
    if (poolId) setCurrentPoolId(poolId);
    return () => setCurrentPoolId(null);
  }, [poolId, setCurrentPoolId]);

  if (loading) {
    return <LoadingSpinner fullPage text="Loading pool..." />;
  }

  if (!currentPool) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2>Pool not found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This pool doesn't exist or you don't have access.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--navbar-height))' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default PoolLayout;
