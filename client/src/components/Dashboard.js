import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ accountId, accountName, onLogout }) {
  const [recommendations, setRecommendations] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [lastSynced, setLastSynced] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRecommendations();
    fetchLastSynced();
  }, []);

  async function fetchLastSynced() {
    try {
      const res = await fetch(`https://cloud-cost-autopilot-server.onrender.com${accountId}`);
      const data = await res.json();
      if (res.ok && data.last_synced) {
        setLastSynced(new Date(data.last_synced).toLocaleString());
      }
    } catch {
      // silently fail
    }
  }

  async function fetchRecommendations() {
    setLoading(true);
    try {
      const res = await fetch(`https://cloud-cost-autopilot-server.onrender.com${accountId}`);
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations || []);
        setTotalSavings(data.totalPotentialSavings || 0);
      } else {
        setError('Failed to load recommendations');
      }
    } catch {
      setError('Cannot reach backend.');
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    setScanning(true);
    setError('');
    setStatusMsg('Scanning EC2 instances...');
    try {
      const res = await fetch(`https://cloud-cost-autopilot-server.onrender.com${accountId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Found ${data.totalInstances} instances. Generating recommendations...`);
        const res2 = await fetch(`https://cloud-cost-autopilot-server.onrender.com${accountId}`, { method: 'POST' });
        const data2 = await res2.json();
        if (res2.ok) {
          setRecommendations(data2.recommendations || []);
          setTotalSavings(data2.totalPotentialSavings || 0);
          setStatusMsg(`Done! Found ${data2.count} recommendations.`);
          fetchLastSynced();
        } else {
          setError('Failed to generate recommendations');
          setStatusMsg('');
        }
      } else {
        setError(data.error || 'Scan failed');
        setStatusMsg('');
      }
    } catch {
      setError('Scan failed. Check your backend.');
      setStatusMsg('');
    } finally {
      setScanning(false);
      setTimeout(() => setStatusMsg(''), 4000);
    }
  }

  async function updateStatus(id, status) {
    try {
      await fetch(`https://cloud-cost-autopilot-server.onrender.com${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setRecommendations(prev =>
        prev.map(r => r.recommendation_id === id ? { ...r, status } : r)
      );
    } catch {
      setError('Failed to update recommendation');
    }
  }

  const pending = recommendations.filter(r => r.status === 'pending').length;
  const applied = recommendations.filter(r => r.status === 'applied').length;
  const dismissed = recommendations.filter(r => r.status === 'dismissed').length;

  const filteredRecommendations = recommendations.filter(r => {
    if (filter === 'all') return true;
    return r.recommendation_type === filter;
  });

  const filteredSavings = filteredRecommendations
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + Number(r.potential_savings), 0)
    .toFixed(2);

  return (
    <div className="dashboard">
      <div className="header">
        <span className="header-title">Cloud Cost Autopilot</span>
        <div className="header-right">
          <span className="header-account">{accountName}</span>
          <button className="scan-btn" onClick={handleScan} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
          <button className="logout-btn" onClick={onLogout}>Disconnect</button>
        </div>
      </div>

      <div className="content">
        {statusMsg && <div className="status-message success">{statusMsg}</div>}
        {error && <div className="status-message error">{error}</div>}

        {lastSynced && (
          <div className="last-synced">
            Last scan: {lastSynced}
          </div>
        )}

        <div className="stats">
          <div className="stat-card highlight">
            <div className="stat-label">Potential Monthly Savings</div>
            <div className="stat-value">${filter === 'all' ? Number(totalSavings).toFixed(2) : filteredSavings}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Applied</div>
            <div className="stat-value">{applied}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Dismissed</div>
            <div className="stat-value">{dismissed}</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h3>Recommendations</h3>
            <div className="filter-row">
              <span className="table-sub">Filter by type:</span>
              <select
                className="filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="idle_ec2">Idle EC2</option>
                <option value="ebs_unattached">Unattached EBS</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="empty">Loading...</p>
          ) : filteredRecommendations.length === 0 ? (
            <p className="empty">No recommendations yet. Click "Scan Now" to analyze your EC2 instances.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Resource ID</th>
                  <th>Type</th>
                  <th>Avg CPU (7d)</th>
                  <th>Est. Savings/mo</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecommendations.map(rec => (
                  <tr key={rec.recommendation_id}>
                    <td className="mono">{rec.resource_name || '—'}</td>
                    <td>
                      <span className={`type-badge type-${rec.recommendation_type}`}>
                        {rec.recommendation_type === 'idle_ec2' ? 'Idle EC2' : 'EBS Volume'}
                      </span>
                    </td>
                    <td>{rec.avg_cpu_7d ? `${Number(rec.avg_cpu_7d).toFixed(2)}%` : '—'}</td>
                    <td className="savings">${Number(rec.potential_savings).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${rec.status}`}>{rec.status}</span>
                    </td>
                    <td>
                      {rec.status !== 'applied' && (
                        <button className="btn-apply" onClick={() => updateStatus(rec.recommendation_id, 'applied')}>Apply</button>
                      )}
                      {rec.status !== 'dismissed' && (
                        <button className="btn-dismiss" onClick={() => updateStatus(rec.recommendation_id, 'dismissed')}>Dismiss</button>
                      )}
                      {(rec.status === 'applied' || rec.status === 'dismissed') && (
                        <button className="btn-reset" onClick={() => updateStatus(rec.recommendation_id, 'pending')}>Reset</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}