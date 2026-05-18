import React, { useState } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    accountName: '',
    roleArn: '',
    region: 'us-east-2',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://cloud-cost-autopilot-server.onrender.com/api/aws/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        onLoginSuccess(data.account.account_id, formData.accountName);
      } else {
        setError(data.error || data.details || 'Failed to connect AWS account');
      }
    } catch {
      setError('Cannot reach backend. Make sure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Cloud Cost Autopilot</h2>
        <p className="login-sub">Connect your AWS account to start monitoring costs</p>

        <div className="form-group">
          <label>Account Name</label>
          <input
            type="text"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            placeholder="My AWS Account"
            required
          />
        </div>

        <div className="form-group">
          <label>IAM Role ARN</label>
          <input
            type="text"
            name="roleArn"
            value={formData.roleArn}
            onChange={handleChange}
            placeholder="arn:aws:iam::123456789012:role/RoleName"
            required
          />
        </div>

        <div className="form-group">
          <label>Region</label>
          <select name="region" value={formData.region} onChange={handleChange}>
            <option value="us-east-1">us-east-1 — N. Virginia</option>
            <option value="us-east-2">us-east-2 — Ohio</option>
            <option value="us-west-1">us-west-1 — N. California</option>
            <option value="us-west-2">us-west-2 — Oregon</option>
            <option value="eu-west-1">eu-west-1 — Ireland</option>
            <option value="ap-southeast-1">ap-southeast-1 — Singapore</option>
          </select>
        </div>

        {error && <div className="status-message error">{error}</div>}

        <button type="submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect AWS Account'}
        </button>
      </div>
    </div>
  );
}

export default Login;