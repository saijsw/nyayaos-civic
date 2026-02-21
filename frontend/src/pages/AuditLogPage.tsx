import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPoolAuditLogs, AuditLogEntry } from 'services/adminService';
import LoadingSpinner from 'components/common/LoadingSpinner';
import EmptyState from 'components/common/EmptyState';
import { formatDateTime } from 'utils/formatters';

const AuditLogPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poolId) return;
    const load = async () => {
      try {
        const data = await getPoolAuditLogs(poolId);
        setLogs(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [poolId]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>📜 Audit Log</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Immutable record of all pool actions
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon="📜" title="No audit entries" description="Actions in this pool will be logged here." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(log.timestamp)}</td>
                  <td>
                    <span className="badge badge-neutral">{log.action}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{log.performedBy}</td>
                  <td style={{ fontSize: 13 }}>{log.targetType}: {log.targetId}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {JSON.stringify(log.details).slice(0, 60)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
