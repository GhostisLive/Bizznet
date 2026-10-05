-- Migration: Add RFQ and Orders tables
-- Created: 2026-10-04

-- RFQs table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    quantity_required FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    budget_min FLOAT,
    budget_max FLOAT,
    currency VARCHAR(3) DEFAULT 'INR',
    delivery_deadline TIMESTAMP WITH TIME ZONE,
    delivery_location JSONB,
    provenance_requirement VARCHAR(50),
    additional_requirements JSONB,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RFQ Bids table
CREATE TABLE IF NOT EXISTS rfq_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    price_per_unit FLOAT NOT NULL,
    total_price FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    quantity_offered FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    lead_time_days INTEGER,
    delivery_terms TEXT,
    provenance_grade VARCHAR(50),
    technical_proposal TEXT,
    validity_days INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    negotiation_id UUID REFERENCES negotiations(id) ON DELETE SET NULL,
    rfq_bid_id UUID REFERENCES rfq_bids(id) ON DELETE SET NULL,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    quantity FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    delivery_deadline TIMESTAMP WITH TIME ZONE,
    delivery_location JSONB,
    payment_terms TEXT,
    provenance_snapshot JSONB,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Order Status History table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Documents table
CREATE TABLE IF NOT EXISTS order_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_id ON rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_category ON rfqs(category);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON rfqs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rfq_bids_rfq_id ON rfq_bids(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_supplier_id ON rfq_bids(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_bids_status ON rfq_bids(status);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_timestamp ON order_status_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON order_documents(order_id);

-- Add comments for documentation
COMMENT ON TABLE rfqs IS 'Request for Quote - buyers post requirements, suppliers bid';
COMMENT ON TABLE rfq_bids IS 'Supplier bids on RFQs';
COMMENT ON TABLE orders IS 'Confirmed orders from locked negotiations or awarded RFQ bids';
COMMENT ON TABLE order_status_history IS 'Audit trail of order status changes';
COMMENT ON TABLE order_documents IS 'Documents attached to orders (invoices, shipping docs, etc.)';
