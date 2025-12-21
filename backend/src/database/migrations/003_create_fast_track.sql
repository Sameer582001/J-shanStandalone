CREATE TYPE fast_track_status AS ENUM ('ELIGIBLE', 'CLAIMED');

CREATE TABLE FastTrackBenefits (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL REFERENCES Nodes(id),
    user_id INTEGER NOT NULL REFERENCES Users(id),
    achieved_tier_referrals INTEGER DEFAULT 0,
    reward_value DECIMAL(10, 2) NOT NULL,
    product_codes TEXT,
    status fast_track_status DEFAULT 'ELIGIBLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_node_fast_track UNIQUE (node_id)
);
