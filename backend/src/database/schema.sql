-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    auth_id VARCHAR(255) UNIQUE NOT NULL, -- External Auth ID
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'USER',
    
    -- Wallet
    master_wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Bank Details
    account_holder_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    upi_id VARCHAR(50),
    bank_details_locked BOOLEAN DEFAULT FALSE,
    
    -- Nominee Details
    nominee_name VARCHAR(255),
    nominee_relation VARCHAR(100),

    -- Profile
    profile_image VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. NODES TABLE
-- ==========================================
CREATE TYPE node_status AS ENUM ('INACTIVE', 'ACTIVE');

CREATE TABLE IF NOT EXISTS Nodes (
    id SERIAL PRIMARY KEY,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    owner_user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    
    -- Genealogy
    sponsor_node_id INTEGER REFERENCES Nodes(id), -- Direct Sponsor
    self_pool_parent_id INTEGER REFERENCES Nodes(id), -- 3x10 Tree Parent
    auto_pool_parent_id INTEGER REFERENCES Nodes(id), -- Global Auto Pool Parent
    
    -- State
    status node_status DEFAULT 'INACTIVE',
    direct_referrals_count INTEGER DEFAULT 0,
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    current_level INT DEFAULT 1,
    
    -- Rebirth Logic
    is_rebirth BOOLEAN DEFAULT FALSE,
    origin_node_id INTEGER REFERENCES Nodes(id), -- If rebirth, points to original node
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. TRANSACTIONS TABLE
-- ==========================================
CREATE TYPE transaction_type AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED');

CREATE TABLE IF NOT EXISTS Transactions (
    id SERIAL PRIMARY KEY,
    wallet_owner_id INTEGER REFERENCES Users(id), -- Owner of the wallet being credited/debited
    node_id INTEGER REFERENCES Nodes(id), -- Optional: If specific to a Node Wallet
    
    amount DECIMAL(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    status transaction_status DEFAULT 'COMPLETED',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. LEVEL PROGRESS (Financial System)
-- ==========================================
CREATE TABLE IF NOT EXISTS LevelProgress (
    id SERIAL PRIMARY KEY,
    node_id INT REFERENCES Nodes(id) NOT NULL,
    level INT NOT NULL,
    pool_type VARCHAR(10) DEFAULT 'SELF' CHECK (pool_type IN ('SELF', 'AUTO')),
    
    total_revenue NUMERIC(15, 2) DEFAULT 0.00,
    buckets JSONB DEFAULT '{}', -- Tracks granular payments like { "1": 50, "2": 50 }
    is_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(node_id, level, pool_type)
);

-- ==========================================
-- 5. WITHDRAWALS (Payouts)
-- ==========================================
CREATE TABLE IF NOT EXISTS Withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    transaction_id INTEGER REFERENCES Transactions(id), -- Link to the DEBIT transaction
    
    amount DECIMAL(10, 2) NOT NULL, -- Requested Amount
    service_charge DECIMAL(10, 2) DEFAULT 0,
    tds_charge DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL, -- Amount to be paid
    
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'REJECTED')),
    admin_note TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. FUND REQUESTS (Add Funds)
-- ==========================================
CREATE TABLE IF NOT EXISTS FundRequests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    
    amount DECIMAL(15, 2) NOT NULL,
    utr_number VARCHAR(50) UNIQUE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 7. TICKETS (Support)
-- ==========================================
CREATE TABLE IF NOT EXISTS Tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    admin_response TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 8. NEWS
-- ==========================================
CREATE TABLE IF NOT EXISTS News (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_urgent BOOLEAN DEFAULT FALSE, -- Legacy support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. GALLERY
-- ==========================================
CREATE TABLE IF NOT EXISTS Gallery (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 10. DOCUMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS Documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 11. FAST TRACK BENEFITS
-- ==========================================
CREATE TABLE IF NOT EXISTS FastTrackBenefits (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL REFERENCES Nodes(id),
    user_id INTEGER NOT NULL REFERENCES Users(id),
    achieved_tier_referrals INTEGER DEFAULT 0,
    reward_value DECIMAL(10, 2) NOT NULL,
    product_codes TEXT,
    status VARCHAR(20) DEFAULT 'ELIGIBLE', -- ELIGIBLE, CLAIMED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP,
    UNIQUE(node_id)
);

-- ==========================================
-- 12. EMAIL VERIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS EmailVerifications (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(6) NOT NULL, 
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 13. SYSTEM SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS SystemSettings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_mobile ON Users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON Users(auth_id);
CREATE INDEX IF NOT EXISTS idx_nodes_referral_code ON Nodes(referral_code);
CREATE INDEX IF NOT EXISTS idx_nodes_owner_user_id ON Nodes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_sponsor_node_id ON Nodes(sponsor_node_id);
