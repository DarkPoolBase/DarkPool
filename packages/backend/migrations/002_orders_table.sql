-- Orders table for Sorrowz's Orders Module
-- Run against the darkpool database

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  gpu_type VARCHAR(20) NOT NULL,
  quantity INT NOT NULL CHECK (quantity >= 1 AND quantity <= 1000),
  price_per_hour DECIMAL(18,6) NOT NULL CHECK (price_per_hour > 0),
  duration INT NOT NULL CHECK (duration >= 1 AND duration <= 720),
  escrow_amount DECIMAL(18,6) NOT NULL CHECK (escrow_amount > 0),
  commitment_hash VARCHAR(66) NOT NULL,
  encrypted_details TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED')),
  batch_id INT,
  clearing_price DECIMAL(18,6),
  tx_hash VARCHAR(66),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_gpu_type ON orders(gpu_type);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_gpu_status ON orders(gpu_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
