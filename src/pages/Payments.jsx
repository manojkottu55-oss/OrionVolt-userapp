import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';

const Payments = () => {
  // Hardcoded fake readings for the user app payments page
  const [payments] = useState([
    {
      id: 'PAY-87236491',
      txnId: 'TXN-934812304912',
      date: new Date(Date.now() - 3600000).toISOString(),
      amount: 150.00,
      status: 'success',
      method: 'UPI'
    },
    {
      id: 'PAY-19283746',
      txnId: 'TXN-109283471029',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      amount: 450.50,
      status: 'success',
      method: 'Credit Card'
    },
    {
      id: 'PAY-56473829',
      txnId: 'TXN-581920348571',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      amount: 80.00,
      status: 'failed',
      method: 'UPI'
    },
    {
      id: 'PAY-90128374',
      txnId: 'TXN-491823746192',
      date: new Date(Date.now() - 86400000 * 12).toISOString(),
      amount: 220.00,
      status: 'success',
      method: 'Debit Card'
    },
    {
      id: 'PAY-34567890',
      txnId: 'TXN-293847561029',
      date: new Date(Date.now() - 86400000 * 18).toISOString(),
      amount: 110.00,
      status: 'success',
      method: 'UPI'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'var(--success)';
      case 'failed': return 'var(--danger)';
      case 'pending': return 'var(--primary)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-center gap-2 mb-2">
        <CreditCard size={24} color="var(--primary)" />
        <h1 style={{marginBottom: 0}}>My Payments</h1>
      </div>
      <p className="subtitle text-center mb-6">Your recent transaction history</p>

      {payments.length === 0 ? (
        <div className="text-center mt-8" style={{color: 'var(--text-muted)'}}>
          No payments found.
        </div>
      ) : (
        payments.map(payment => (
          <div key={payment.id} className="card" style={{borderLeft: `4px solid ${getStatusColor(payment.status)}`}}>
            <div className="flex justify-between items-center mb-2">
              <span style={{fontWeight: 600, fontSize: '1.1rem'}}>{payment.id}</span>
              <span style={{color: getStatusColor(payment.status), fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem'}}>
                {payment.status}
              </span>
            </div>
            
            <div className="flex justify-between mb-1" style={{fontSize: '0.9rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Date</span>
              <span>{new Date(payment.date).toLocaleDateString()} at {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex justify-between mb-1" style={{fontSize: '0.9rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Transaction ID</span>
              <span style={{fontFamily: 'monospace'}}>{payment.txnId}</span>
            </div>
            
            <div className="flex justify-between mb-1" style={{fontSize: '0.9rem'}}>
              <span style={{color: 'var(--text-muted)'}}>Method</span>
              <span>{payment.method}</span>
            </div>

            <div className="flex justify-between mt-2 pt-2" style={{borderTop: '1px solid var(--border)', fontSize: '0.9rem'}}>
              <span style={{fontWeight: 600}}>Amount</span>
              <span style={{fontWeight: 600}}>₹{payment.amount.toFixed(2)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Payments;
