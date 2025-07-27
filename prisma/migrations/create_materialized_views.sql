-- Materialized views for common queries to improve performance

-- 1. Product catalog with aggregated data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_catalog AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.category,
  p.price,
  p.sku,
  p.featured,
  p.featured_order,
  p.status,
  p.metadata,
  p.created_at,
  p.updated_at,
  -- Aggregate variant data
  COUNT(DISTINCT pv.id) as variant_count,
  COALESCE(SUM(pv.inventory), 0) as total_inventory,
  MIN(pv.price) as min_variant_price,
  MAX(pv.price) as max_variant_price,
  -- First image
  (SELECT url FROM product_images WHERE product_id = p.id ORDER BY display_order LIMIT 1) as primary_image,
  -- Review aggregates
  COUNT(DISTINCT pr.id) as review_count,
  COALESCE(AVG(pr.rating), 0) as avg_rating,
  -- Sales data
  COUNT(DISTINCT oi.order_id) as order_count,
  COALESCE(SUM(oi.quantity), 0) as units_sold
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN product_reviews pr ON p.id = pr.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE p.status = 'ACTIVE'
GROUP BY p.id;

CREATE UNIQUE INDEX idx_mv_product_catalog_id ON mv_product_catalog(id);
CREATE INDEX idx_mv_product_catalog_category ON mv_product_catalog(category);
CREATE INDEX idx_mv_product_catalog_featured ON mv_product_catalog(featured) WHERE featured = true;
CREATE INDEX idx_mv_product_catalog_rating ON mv_product_catalog(avg_rating DESC);

-- 2. Customer purchase summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_summary AS
SELECT 
  c.id as customer_id,
  c.name,
  c.email,
  c.phone,
  c.created_at as customer_since,
  COUNT(DISTINCT o.id) as order_count,
  COALESCE(SUM(o.total_amount), 0) as lifetime_value,
  COALESCE(AVG(o.total_amount), 0) as avg_order_value,
  MAX(o.created_at) as last_order_date,
  -- Favorite category (most purchased)
  (
    SELECT oi_inner.product_category 
    FROM (
      SELECT p.category as product_category, COUNT(*) as category_count
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id IN (SELECT id FROM orders WHERE customer_id = c.id)
      GROUP BY p.category
      ORDER BY category_count DESC
      LIMIT 1
    ) oi_inner
  ) as favorite_category,
  -- Customer segment
  CASE 
    WHEN COUNT(DISTINCT o.id) >= 10 THEN 'VIP'
    WHEN COUNT(DISTINCT o.id) >= 5 THEN 'REGULAR'
    WHEN COUNT(DISTINCT o.id) >= 1 THEN 'OCCASIONAL'
    ELSE 'NEW'
  END as customer_segment
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.status != 'CANCELLED'
GROUP BY c.id;

CREATE UNIQUE INDEX idx_mv_customer_summary_id ON mv_customer_summary(customer_id);
CREATE INDEX idx_mv_customer_summary_segment ON mv_customer_summary(customer_segment);
CREATE INDEX idx_mv_customer_summary_lifetime_value ON mv_customer_summary(lifetime_value DESC);

-- 3. Daily sales summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales AS
SELECT 
  DATE(o.created_at) as sale_date,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value,
  SUM(oi.quantity) as total_items_sold,
  -- Top selling category
  (
    SELECT p.category
    FROM order_items oi_inner
    JOIN products p ON oi_inner.product_id = p.id
    WHERE DATE(oi_inner.created_at) = DATE(o.created_at)
    GROUP BY p.category
    ORDER BY SUM(oi_inner.quantity) DESC
    LIMIT 1
  ) as top_category
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'COMPLETED'
GROUP BY DATE(o.created_at);

CREATE UNIQUE INDEX idx_mv_daily_sales_date ON mv_daily_sales(sale_date);

-- 4. Product bundle recommendations
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_bundles AS
WITH bundle_pairs AS (
  SELECT 
    oi1.product_id as product_1,
    oi2.product_id as product_2,
    COUNT(DISTINCT oi1.order_id) as purchase_count
  FROM order_items oi1
  JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
  GROUP BY oi1.product_id, oi2.product_id
  HAVING COUNT(DISTINCT oi1.order_id) >= 5
)
SELECT 
  bp.product_1,
  bp.product_2,
  bp.purchase_count,
  p1.name as product_1_name,
  p1.category as product_1_category,
  p2.name as product_2_name,
  p2.category as product_2_category,
  (p1.price + p2.price) as bundle_price
FROM bundle_pairs bp
JOIN products p1 ON bp.product_1 = p1.id
JOIN products p2 ON bp.product_2 = p2.id
WHERE p1.status = 'ACTIVE' AND p2.status = 'ACTIVE'
ORDER BY bp.purchase_count DESC;

CREATE INDEX idx_mv_product_bundles_product_1 ON mv_product_bundles(product_1);
CREATE INDEX idx_mv_product_bundles_product_2 ON mv_product_bundles(product_2);

-- 5. Inventory status summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_status AS
SELECT 
  p.id as product_id,
  p.name,
  p.category,
  p.sku,
  SUM(pv.inventory) as total_inventory,
  COUNT(pv.id) as variant_count,
  COUNT(CASE WHEN pv.inventory = 0 THEN 1 END) as out_of_stock_variants,
  COUNT(CASE WHEN pv.inventory < 10 THEN 1 END) as low_stock_variants,
  MIN(pv.inventory) as min_variant_inventory,
  -- Recent sales velocity (last 30 days)
  (
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = p.id 
    AND o.created_at >= NOW() - INTERVAL '30 days'
    AND o.status = 'COMPLETED'
  ) as sales_last_30_days,
  -- Stock status
  CASE 
    WHEN SUM(pv.inventory) = 0 THEN 'OUT_OF_STOCK'
    WHEN SUM(pv.inventory) < 10 THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.status = 'ACTIVE'
GROUP BY p.id;

CREATE UNIQUE INDEX idx_mv_inventory_status_product_id ON mv_inventory_status(product_id);
CREATE INDEX idx_mv_inventory_status_stock_status ON mv_inventory_status(stock_status);
CREATE INDEX idx_mv_inventory_status_category ON mv_inventory_status(category, stock_status);

-- Refresh functions for materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_catalog;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_bundles;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_status;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-materialized-views', '*/15 * * * *', 'SELECT refresh_all_materialized_views();');