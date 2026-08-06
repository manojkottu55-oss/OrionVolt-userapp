import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

const Refunds = () => {
  // 2 Hardcoded fake readings for the user app refunds page
  const [refunds] = useState([
    {
      id: 'REF-83749102',
      txnId: 'TXN-934812304912',
      date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      method: 'UPI',
      paid: 150.00,
      refund: 40.00,
      reason: 'Power Cut / Early Stop',
      status: 'processed'
    },
    {
      id: 'REF-38291047',
      txnId: 'TXN-109283471029',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      method: 'Credit Card',
      paid: 450.50,
      refund: 450.50,
      reason: 'Manual',
      status: 'pending'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'var(--success)';
      case 'failed': return 'var(--danger)';
      case 'pending': return 'var(--primary)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-center gap-2 mb-2">
        <RotateCcw size={24} color="var(--primary)" />
        <h1 style={{ marginBottom: 0 }}>My Refunds</h1>
      </div>
      <p className="subtitle text-center mb-6">Your recent refund history</p>

      {refunds.length === 0 ? (
        <div className="text-center mt-8" style={{ color: 'var(--text-muted)' }}>
          No refunds found.
        </div>
      ) : (
        refunds.map(refund => (
          <div key={refund.id} className="card" style={{ borderLeft: `4px solid ${getStatusColor(refund.status)}` }}>
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{refund.id}</span>
              <span style={{ color: getStatusColor(refund.status), fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem' }}>
                {refund.status}
              </span>
            </div>

            <div className="flex justify-between mb-1" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date</span>
              <span>{new Date(refund.date).toLocaleDateString()} at {new Date(refund.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex justify-between mb-1" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
              <span style={{ fontFamily: 'monospace' }}>{refund.txnId}</span>
            </div>

            <div className="flex justify-between mb-1" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Method</span>
              <span>{refund.method}</span>
            </div>

            <div className="flex justify-between mb-1" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reason</span>
              <span>{refund.reason}</span>
            </div>

            <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 600 }}>Paid</span>
              <span style={{ fontWeight: 600 }}>₹{refund.paid.toFixed(2)}</span>
            </div>

            <div className="flex justify-between mt-1 pt-1" style={{ fontSize: '0.9rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Refunded</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{refund.refund.toFixed(2)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Refunds;
