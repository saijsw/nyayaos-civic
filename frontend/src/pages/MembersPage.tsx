import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'config/firebase';
import { usePool } from 'context/PoolContext';
import { useAuth } from 'context/AuthContext';
import LoadingSpinner from 'components/common/LoadingSpinner';
import EmptyState from 'components/common/EmptyState';
import { getInitials } from 'utils/formatters';

interface MemberInfo {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  reputation: { score: number };
  isAdmin: boolean;
}

const MembersPage: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { currentPool } = usePool();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentPool?.members) return;
    const loadMembers = async () => {
      const memberData = await Promise.all(
        currentPool.members.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          if (!snap.exists()) return null;
          const data = snap.data();
          return {
            uid,
            displayName: data.displayName || 'Unknown',
            email: data.email || '',
            role: data.role || 'member',
            reputation: data.reputation || { score: 0 },
            isAdmin: currentPool.admins?.includes(uid) || false,
          } as MemberInfo;
        })
      );
      setMembers(memberData.filter(Boolean) as MemberInfo[]);
      setLoading(false);
    };
    loadMembers();
  }, [currentPool]);

  if (loading) return <LoadingSpinner fullPage />;

  const isAdmin = currentPool?.admins?.includes(user?.uid || '');

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>👥 Members ({members.length})</h1>
      </div>

      {members.length === 0 ? (
        <EmptyState icon="👥" title="No members" description="This pool has no members yet." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Reputation</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.uid}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--primary-bg)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {getInitials(m.displayName)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{m.displayName}</p>
                        {m.uid === user?.uid && (
                          <span style={{ fontSize: 10, color: 'var(--primary-light)' }}>You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.email}</td>
                  <td>
                    <span className={`badge ${m.isAdmin ? 'badge-info' : 'badge-neutral'}`}>
                      {m.isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ⭐ {m.reputation.score}
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

export default MembersPage;
