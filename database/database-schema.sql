-- Cloud Cost Autopilot Database Schema
-- Created: January 2026

-- Enable UUID extension (for generating unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AWS Accounts table
CREATE TABLE aws_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    aws_account_id VARCHAR(12) NOT NULL,
    access_key_encrypted TEXT, -- Encrypted storage (or use IAM roles)
    region VARCHAR(50) DEFAULT 'us-east-1',
    is_active BOOLEAN DEFAULT true,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Data table (stores daily cost snapshots)
CREATE TABLE cost_data (
    cost_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES aws_accounts(account_id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    cost_amount DECIMAL(10, 2) NOT NULL,
    usage_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table
CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES aws_accounts(account_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- e.g., 'idle_resource', 'rightsizing', 'reserved_instance'
    resource_name VARCHAR(255),
    service_name VARCHAR(100),
    potential_savings DECIMAL(10, 2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table (for spending anomalies)
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES aws_accounts(account_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'budget_exceeded', 'unusual_spike', 'cost_anomaly'
    message TEXT NOT NULL,
    threshold_amount DECIMAL(10, 2),
    actual_amount DECIMAL(10, 2),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_cost_data_account ON cost_data(account_id);
CREATE INDEX idx_cost_data_date ON cost_data(start_date, end_date);
CREATE INDEX idx_recommendations_account ON recommendations(account_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_alerts_account ON alerts(account_id);
CREATE INDEX idx_alerts_read ON alerts(is_read);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE aws_accounts IS 'Connected AWS accounts for cost monitoring';
COMMENT ON TABLE cost_data IS 'Daily cost snapshots from AWS Cost Explorer';
COMMENT ON TABLE recommendations IS 'AI-generated cost-saving recommendations';
COMMENT ON TABLE alerts IS 'Spending alerts and anomaly notifications';