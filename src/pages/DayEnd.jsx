import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './DayEnd.css';

export default function DayEnd() {
  const [actualCash, setActualCash] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);
  const { currency, todayRevenue, todayCost, todayProfit, nonCashPayments } = useSettings();

  const expectedCashInDrawer = todayRevenue - nonCashPayments;
  const discrepancy = Number(actualCash || 0) - expectedCashInDrawer;

  return (
    <div className="page-container day-end-page">
      <div className="day-end-grid">
        <div className="glass-panel summary-panel">
          <h2>Today's Summary</h2>
          <div className="summary-stats">
            <div className="stat-row"><span>Total Sales:</span><span className="value text-primary">{currency}{todayRevenue.toFixed(2)}</span></div>
            <div className="stat-row"><span>Total Cost:</span><span className="value text-secondary">{currency}{Number(todayCost || 0).toFixed(2)}</span></div>
            <div className="stat-row"><span>Total Profit:</span><span className="value text-success">{currency}{todayProfit.toFixed(2)}</span></div>
            <div className="stat-row"><span>Non-Cash Payments:</span><span className="value text-secondary">{currency}{nonCashPayments.toFixed(2)}</span></div>
            <div className="divider"></div>
            <div className="stat-row total-expected"><span>Expected Cash in Drawer:</span><span className="value">{currency}{expectedCashInDrawer.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="glass-panel calc-panel">
          <h2>Cash Drawer Count</h2>
          <div className="input-group">
            <label className="input-label">Actual Cash Counted ({currency.trim()})</label>
            <div className="search-bar cash-input-wrapper">
              <DollarSign size={18} className="text-secondary" />
              <input type="number" className="search-input" placeholder="0.00" value={actualCash} onChange={(e) => { setActualCash(e.target.value); setIsCalculated(false); }} />
            </div>
          </div>
          <button className="btn btn-primary w-full mt-4" onClick={() => setIsCalculated(true)} disabled={!actualCash}>Calculate Discrepancy</button>

          {isCalculated && (
            <div className={`discrepancy-result glass-card animate-fade-in ${discrepancy === 0 ? 'perfect' : discrepancy > 0 ? 'overage' : 'shortage'}`}>
              {discrepancy === 0 ? (
                <><CheckCircle size={32} className="text-success" /><h3>Drawer is perfectly balanced!</h3></>
              ) : discrepancy > 0 ? (
                <><AlertTriangle size={32} className="text-warning" /><h3>Cash Overage</h3><p className="amount">+{currency}{Math.abs(discrepancy).toFixed(2)}</p><span className="note text-secondary">You have more cash than expected.</span></>
              ) : (
                <><AlertTriangle size={32} className="text-danger" /><h3>Cash Shortage</h3><p className="amount text-danger">-{currency}{Math.abs(discrepancy).toFixed(2)}</p><span className="note text-secondary">You are missing cash from the drawer.</span></>
              )}
            </div>
          )}

          <div className="close-register-actions"><button className="btn btn-danger w-full" disabled={!isCalculated}>Close Register & End Day</button></div>
        </div>
      </div>
    </div>
  );
}
