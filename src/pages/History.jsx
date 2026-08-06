import React, { useEffect, useState } from 'react';
import api from '../api';
import { History as HistoryIcon } from 'lucide-react';

const History = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/signin/history');
        setSessions(res.data.sessions);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success)';
      case 'charging': return 'var(--primary)';
      case 'failed':
      case 'interrupted': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) return <div className="page-content text-center mt-8">Loading history...</div>;

  return (
    <div className="page-content">
      <div className="flex items-center justify-center gap-2 mb-2">
        <HistoryIcon size={24} color="var(--primary)" />
        <h1 style={{marginBottom: 0}}>My Sessions</h1>
      </div>
      <p className="subtitle text-center mb-6">Your recent charging history</p>

      {sessions.length === 0 ? (
        <div className="text-center mt-8" style={{color: 'var(--text-muted)'}}>
          No sessions found.
        </div>
      ) : (
        sessions.map(session => (
          <div key={session._id} className="card" style={{borderLeft: `4px solid ${getStatusColor(session.status)}`}}>
            <div className="flex justify-between items-center mb-2">
              <span style={{fontWeight: 600, fontSize: '1.1rem'}}>{session.kioskId}</span>
              <span style={{color: getStatusColor(session.status), fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem'}}>
                {session.status}
              </span>
            </div>
            
            <div className="flex justify-between mb-1" style={{fontSize: '0.9rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Date</span>
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between mb-1" style={{fontSize: '0.9rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Energy</span>
              <span>{session.energyDispensed.toFixed(2)} kWh</span>
            </div>

            <div className="flex justify-between mt-2 pt-2" style={{borderTop: '1px solid var(--border)', fontSize: '0.9rem'}}>
              <span style={{fontWeight: 600}}>Paid</span>
              <span style={{fontWeight: 600}}>₹{session.estimatedAmount}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History;
