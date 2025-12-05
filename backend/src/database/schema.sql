-- Enable UUID extension if needed (though we are using Serial/Integer IDs based on spec, but good to have)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    auth_id VARCHAR(255) UNIQUE NOT NULL, -- External Auth ID (e.g., from Firebase/Auth0 if used, or internal)
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    master_wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nodes Table
CREATE TYPE pool_type AS ENUM ('SELF', 'AUTO');
CREATE TYPE node_status AS ENUM ('INACTIVE', 'ACTIVE');

CREATE TABLE Nodes (
    id SERIAL PRIMARY KEY,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    owner_user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    sponsor_node_id INTEGER REFERENCES Nodes(id), -- Nullable for Root
    parent_node_id INTEGER REFERENCES Nodes(id), -- Nullable for Root
    pool_type pool_type NOT NULL,
    status node_status DEFAULT 'INACTIVE',
    direct_referrals_count INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    origin_node_id INTEGER REFERENCES Nodes(id), -- Points to the main node if this is a rebirth/clone
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TYPE transaction_type AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE Transactions (
    id SERIAL PRIMARY KEY,
    wallet_owner_id INTEGER REFERENCES Users(id), -- Or Nodes(id) depending on wallet type, assuming Master Wallet for now based on spec "Transactions (id, wallet_owner_id...)"
    -- If we need to track Node Wallet transactions, we might need a separate table or a polymorphic relationship.
    -- Given the spec says "Transactions (id, wallet_owner_id...)", I will assume this is for the Master Wallet or general logging.
    -- However, the spec mentions "Local Node Wallet" and "Master Wallet".
    -- Let's add a node_id column to be precise if it's a node transaction.
    node_id INTEGER REFERENCES Nodes(id),
    amount DECIMAL(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    status transaction_status DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ClaimRequests Table
CREATE TYPE claim_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE ClaimRequests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    node_id INTEGER REFERENCES Nodes(id),
    claim_type VARCHAR(50), -- e.g., 'FAST_TRACK_BONUS'
    amount DECIMAL(15, 2),
    status claim_status DEFAULT 'PENDING',
    admin_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News Table
CREATE TABLE News (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SystemSettings Table
CREATE TABLE SystemSettings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SupportTickets Table
CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TABLE SupportTickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    subject VARCHAR(255) NOT NULL,
    status ticket_status DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SupportMessages Table
CREATE TABLE SupportMessages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES SupportTickets(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES Users(id), -- Null if system message? Or Admin user.
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_mobile ON Users(mobile);
CREATE INDEX idx_nodes_referral_code ON Nodes(referral_code);
CREATE INDEX idx_nodes_owner_user_id ON Nodes(owner_user_id);
CREATE INDEX idx_nodes_sponsor_node_id ON Nodes(sponsor_node_id);
CREATE INDEX idx_nodes_parent_node_id ON Nodes(parent_node_id);
