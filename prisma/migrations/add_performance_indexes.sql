-- Performance optimization indexes for KCT Menswear

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category, status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_inventory ON product_variants(inventory) WHERE inventory > 0;

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_product_collections_product_id ON product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection_id ON product_collections(collection_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers USING gin(to_tsvector('english', name));

-- Pricing rules indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC) WHERE active = true;

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Measurements indexes
CREATE INDEX IF NOT EXISTS idx_measurements_customer_id ON measurements(customer_id);
CREATE INDEX IF NOT EXISTS idx_measurements_updated_at ON measurements(updated_at DESC);

-- Analytics indexes for customer profiles
CREATE INDEX IF NOT EXISTS idx_customer_profiles_segment ON customer_profiles(segment);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_lifetime_value ON customer_profiles(lifetime_value DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_purchase ON customer_profiles(last_purchase_date DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category, price) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_products_full_text ON products USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, ''))
);

-- Performance analysis views
CREATE OR REPLACE VIEW v_product_performance AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  COUNT(DISTINCT oi.order_id) as order_count,
  SUM(oi.quantity) as total_sold,
  AVG(pr.rating) as avg_rating,
  COUNT(DISTINCT pr.id) as review_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN product_reviews pr ON p.id = pr.product_id
WHERE p.status = 'ACTIVE'
GROUP BY p.id, p.name, p.category, p.price;

-- Category performance view
CREATE OR REPLACE VIEW v_category_performance AS
SELECT 
  p.category,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT oi.order_id) as order_count,
  SUM(oi.quantity * oi.price) as total_revenue,
  AVG(p.price) as avg_price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE p.status = 'ACTIVE'
GROUP BY p.category;

-- Update statistics for query planner
ANALYZE products;
ANALYZE product_variants;
ANALYZE orders;
ANALYZE order_items;
ANALYZE customers;
ANALYZE customer_profiles;