#!/bin/bash

# Comprehensive API Integration Test Script
# Tests all Terminal 1's routes and services integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
RESULTS_DIR="./integration-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${RESULTS_DIR}/${TIMESTAMP}/integration-test.log"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
TEST_USER_EMAIL="integration-test-$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPassword123!"

# Tokens
ADMIN_TOKEN=""
USER_TOKEN=""

echo -e "${BLUE}🚀 Starting Comprehensive API Integration Tests${NC}"
echo -e "${BLUE}Target: ${API_URL}${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"

# Create results directory
mkdir -p "${RESULTS_DIR}/${TIMESTAMP}"

# Function to log messages
log() {
    echo "$1" | tee -a "${LOG_FILE}"
}

# Function to make HTTP requests with detailed logging
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    
    local url="${API_URL}${endpoint}"
    local curl_cmd="curl -s -w '\n%{http_code}\n%{time_total}' -X ${method}"
    
    if [[ -n "$headers" ]]; then
        curl_cmd="${curl_cmd} ${headers}"
    fi
    
    if [[ -n "$data" ]]; then
        curl_cmd="${curl_cmd} -H 'Content-Type: application/json' -d '${data}'"
    fi
    
    curl_cmd="${curl_cmd} '${url}'"
    
    log "📡 ${method} ${endpoint}"
    log "🔍 Command: ${curl_cmd}"
    
    local response=$(eval $curl_cmd)
    local response_body=$(echo "$response" | head -n -2)
    local http_code=$(echo "$response" | tail -n -2 | head -n 1)
    local time_total=$(echo "$response" | tail -n 1)
    
    log "📊 Status: ${http_code} | Time: ${time_total}s"
    log "📄 Response: ${response_body}"
    
    if [[ "$http_code" == "$expected_status" ]]; then
        log "✅ PASS"
        ((PASSED_TESTS++))
    else
        log "❌ FAIL - Expected ${expected_status}, got ${http_code}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    log "---"
    
    echo "$response_body"
}

# Function to extract value from JSON response
extract_json_value() {
    local json=$1
    local key=$2
    echo "$json" | grep -o "\"${key}\":[^,}]*" | cut -d':' -f2 | tr -d '"' | tr -d ' '
}

# Function to test endpoint group
test_group() {
    local group_name=$1
    log ""
    log "🎯 Testing ${group_name}"
    log "========================================"
}

# Health check
test_health() {
    test_group "Health Check"
    make_request "GET" "/health" "" "" "200"
}

# Authentication tests
test_auth() {
    test_group "Authentication Endpoints"
    
    # Register new user
    local register_data="{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASSWORD}\",\"name\":\"Integration Test User\"}"
    local register_response=$(make_request "POST" "/api/auth/register" "$register_data" "" "201")
    
    # Extract user token
    USER_TOKEN=$(extract_json_value "$register_response" "token")
    if [[ -z "$USER_TOKEN" ]]; then
        USER_TOKEN=$(extract_json_value "$register_response" "accessToken")
    fi
    
    # Login admin
    local admin_login_data="{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}"
    local admin_response=$(make_request "POST" "/api/auth/login" "$admin_login_data" "" "200")
    
    # Extract admin token
    ADMIN_TOKEN=$(extract_json_value "$admin_response" "token")
    if [[ -z "$ADMIN_TOKEN" ]]; then
        ADMIN_TOKEN=$(extract_json_value "$admin_response" "accessToken")
    fi
    
    # Test auth/me endpoint
    make_request "GET" "/api/auth/me" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
    
    # Test logout
    make_request "POST" "/api/auth/logout" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
    
    # Test password change
    local change_pwd_data="{\"currentPassword\":\"${TEST_USER_PASSWORD}\",\"newPassword\":\"NewPassword123!\"}"
    make_request "PUT" "/api/auth/change-password" "$change_pwd_data" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
    
    # Test forgot password
    local forgot_data="{\"email\":\"${TEST_USER_EMAIL}\"}"
    make_request "POST" "/api/auth/forgot-password" "$forgot_data" "" "200"
    
    # Test refresh token (if endpoint exists)
    local refresh_data="{\"refreshToken\":\"dummy-refresh-token\"}"
    make_request "POST" "/api/auth/refresh" "$refresh_data" "" "400"
}

# Product endpoints
test_products() {
    test_group "Product Endpoints"
    
    # Get all products (public)
    local products_response=$(make_request "GET" "/api/products" "" "" "200")
    
    # Get products with pagination
    make_request "GET" "/api/products?page=1&limit=10" "" "" "200"
    
    # Get products with filters
    make_request "GET" "/api/products?category=Suits&minPrice=100&maxPrice=500" "" "" "200"
    
    # Search products
    make_request "GET" "/api/products?search=wool" "" "" "200"
    
    # Get product stats (admin)
    make_request "GET" "/api/products/stats" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Get best sellers (admin)
    make_request "GET" "/api/products/best-sellers" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Extract first product ID for detailed tests
    local product_id=$(echo "$products_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$product_id" ]]; then
        # Get specific product
        make_request "GET" "/api/products/${product_id}" "" "" "200"
        
        # Get product with includes
        make_request "GET" "/api/products/${product_id}?include=images,variants" "" "" "200"
        
        # Test stock operations (admin)
        local stock_data="{\"quantity\":-1,\"reason\":\"Test adjustment\"}"
        make_request "PUT" "/api/products/${product_id}/stock" "$stock_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Get stock history (admin)
        make_request "GET" "/api/products/${product_id}/stock-history" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    fi
    
    # Create new product (admin)
    local new_product_data="{\"name\":\"Test Product $(date +%s)\",\"price\":299.99,\"category\":\"Suits\",\"stock\":100,\"sku\":\"TEST-$(date +%s)\"}"
    local create_response=$(make_request "POST" "/api/products" "$new_product_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "201")
    
    local new_product_id=$(extract_json_value "$create_response" "id")
    
    if [[ -n "$new_product_id" ]]; then
        # Update product (admin)
        local update_data="{\"name\":\"Updated Test Product\",\"price\":399.99}"
        make_request "PUT" "/api/products/${new_product_id}" "$update_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Delete product (admin)
        make_request "DELETE" "/api/products/${new_product_id}" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    fi
    
    # Test bulk operations (admin)
    local bulk_data="name,price,category,stock,sku\nBulk Test 1,199.99,Suits,50,BULK-1\nBulk Test 2,299.99,Ties,30,BULK-2"
    local import_data="{\"data\":\"${bulk_data}\",\"format\":\"csv\"}"
    make_request "POST" "/api/products/import" "$import_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Export products (admin)
    make_request "GET" "/api/products/export?format=csv" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
}

# Customer endpoints
test_customers() {
    test_group "Customer Endpoints"
    
    # Get customers (admin only)
    local customers_response=$(make_request "GET" "/api/customers" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200")
    
    # Get customers with pagination
    make_request "GET" "/api/customers?page=1&limit=10" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Search customers
    make_request "GET" "/api/customers?search=test" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Get customer stats
    make_request "GET" "/api/customers/stats" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Get customer segments
    make_request "GET" "/api/customers/segments" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Create new customer (admin)
    local customer_data="{\"email\":\"test-customer-$(date +%s)@example.com\",\"name\":\"Test Customer\",\"phone\":\"+1234567890\"}"
    local create_customer_response=$(make_request "POST" "/api/customers" "$customer_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "201")
    
    local customer_id=$(extract_json_value "$create_customer_response" "id")
    
    if [[ -n "$customer_id" ]]; then
        # Get specific customer
        make_request "GET" "/api/customers/${customer_id}" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Update customer
        local update_customer_data="{\"name\":\"Updated Test Customer\",\"phone\":\"+0987654321\"}"
        make_request "PUT" "/api/customers/${customer_id}" "$update_customer_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Add customer note
        local note_data="{\"content\":\"Test note\",\"type\":\"general\"}"
        make_request "POST" "/api/customers/${customer_id}/notes" "$note_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "201"
        
        # Get customer notes
        make_request "GET" "/api/customers/${customer_id}/notes" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Send email to customer
        local email_data="{\"subject\":\"Test Email\",\"template\":\"test\",\"data\":{\"name\":\"Test\"}}"
        make_request "POST" "/api/customers/${customer_id}/email" "$email_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Get communication history
        make_request "GET" "/api/customers/${customer_id}/communications" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
        
        # Delete customer (soft delete)
        make_request "DELETE" "/api/customers/${customer_id}" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    fi
    
    # Test bulk import
    local bulk_customer_data="email,name,phone\nbulk1@test.com,Bulk Customer 1,+1111111111\nbulk2@test.com,Bulk Customer 2,+2222222222"
    local import_customer_data="{\"data\":\"${bulk_customer_data}\",\"format\":\"csv\"}"
    make_request "POST" "/api/customers/import" "$import_customer_data" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Export customers
    make_request "GET" "/api/customers/export?format=csv" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Test access control - regular user should not access customers
    make_request "GET" "/api/customers" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "403"
}

# Order endpoints
test_orders() {
    test_group "Order Endpoints"
    
    # Get orders as user (should only see own orders)
    make_request "GET" "/api/orders" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
    
    # Get orders as admin (should see all orders)
    local orders_response=$(make_request "GET" "/api/orders" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200")
    
    # Get user's order stats
    make_request "GET" "/api/orders/my-stats" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
    
    # Get admin order stats
    make_request "GET" "/api/orders/stats" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Create test order (need product first)
    local products_for_order=$(make_request "GET" "/api/products?limit=1" "" "" "200")
    local product_id_for_order=$(echo "$products_for_order" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$product_id_for_order" ]]; then
        local order_data="{\"items\":[{\"productId\":\"${product_id_for_order}\",\"quantity\":1}],\"shippingAddress\":{\"name\":\"Test User\",\"street\":\"123 Test St\",\"city\":\"Test City\",\"state\":\"CA\",\"zipCode\":\"90210\",\"country\":\"USA\"}}"
        local create_order_response=$(make_request "POST" "/api/orders" "$order_data" "-H 'Authorization: Bearer ${USER_TOKEN}'" "201")
        
        local order_id=$(extract_json_value "$create_order_response" "id")
        
        if [[ -n "$order_id" ]]; then
            # Get specific order
            make_request "GET" "/api/orders/${order_id}" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
            
            # Update order status (admin only)
            local status_update="{\"status\":\"processing\"}"
            make_request "PUT" "/api/orders/${order_id}" "$status_update" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
            
            # Cancel order
            local cancel_data="{\"reason\":\"Customer request\"}"
            make_request "POST" "/api/orders/${order_id}/cancel" "$cancel_data" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
        fi
    fi
    
    # Export orders (admin)
    make_request "GET" "/api/orders/export?format=csv" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
}

# Analytics endpoints
test_analytics() {
    test_group "Analytics Endpoints"
    
    # Customer analytics (admin only)
    make_request "GET" "/api/customers/analytics/growth?period=monthly" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    make_request "GET" "/api/customers/analytics/retention" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Product analytics (admin only)
    make_request "GET" "/api/products/price-distribution" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
    
    # Order analytics (admin only)  
    make_request "GET" "/api/orders/stats" "" "-H 'Authorization: Bearer ${ADMIN_TOKEN}'" "200"
}

# Cart and Checkout endpoints
test_cart_checkout() {
    test_group "Cart and Checkout Endpoints"
    
    # These might be client-side only, but test if server endpoints exist
    make_request "GET" "/api/cart" "" "-H 'Authorization: Bearer ${USER_TOKEN}'" "200"
    
    # Test checkout validation
    local checkout_data="{\"items\":[],\"shippingAddress\":{}}"
    make_request "POST" "/api/checkout/validate" "$checkout_data" "" "400"
    
    # Test shipping rates
    local shipping_data="{\"address\":{\"city\":\"Test City\",\"state\":\"CA\",\"zipCode\":\"90210\",\"country\":\"USA\"}}"
    make_request "POST" "/api/checkout/shipping-rates" "$shipping_data" "" "200"
}

# Rate limiting tests
test_rate_limiting() {
    test_group "Rate Limiting"
    
    log "🚀 Testing rate limiting with rapid requests..."
    
    local rate_limit_hit=false
    for i in {1..25}; do
        local response=$(make_request "POST" "/api/auth/login" "{\"email\":\"invalid@test.com\",\"password\":\"wrong\"}" "" "401")
        local http_code=$(echo "$response" | tail -n -2 | head -n 1)
        
        if [[ "$http_code" == "429" ]]; then
            rate_limit_hit=true
            log "✅ Rate limiting triggered at request ${i}"
            break
        fi
        
        sleep 0.1
    done
    
    if [[ "$rate_limit_hit" == "false" ]]; then
        log "⚠️  Rate limiting not triggered - check configuration"
    fi
}

# Error handling tests
test_error_handling() {
    test_group "Error Handling"
    
    # Test 404 endpoints
    make_request "GET" "/api/nonexistent" "" "" "404"
    make_request "GET" "/api/products/nonexistent-id" "" "" "404"
    
    # Test invalid JSON
    make_request "POST" "/api/auth/login" "invalid-json" "" "400"
    
    # Test missing authentication
    make_request "GET" "/api/customers" "" "" "401"
    
    # Test invalid authentication
    make_request "GET" "/api/customers" "" "-H 'Authorization: Bearer invalid-token'" "401"
    
    # Test insufficient permissions
    make_request "POST" "/api/products" "{\"name\":\"Unauthorized\"}" "-H 'Authorization: Bearer ${USER_TOKEN}'" "403"
}

# Main test execution
main() {
    log "🏁 Starting API Integration Tests at $(date)"
    
    # Check if API is responding
    if ! curl -f -s "${API_URL}/health" > /dev/null 2>&1; then
        log "❌ API not responding at ${API_URL}"
        log "Please ensure the server is running"
        exit 1
    fi
    
    log "✅ API health check passed"
    
    # Run all test groups
    test_health
    test_auth
    test_products
    test_customers
    test_orders
    test_analytics
    test_cart_checkout
    test_rate_limiting
    test_error_handling
    
    # Generate summary
    log ""
    log "📊 TEST SUMMARY"
    log "=============="
    log "Total Tests: ${TOTAL_TESTS}"
    log "Passed: ${PASSED_TESTS}"
    log "Failed: ${FAILED_TESTS}"
    log "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    
    # Create summary file
    cat > "${RESULTS_DIR}/${TIMESTAMP}/summary.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "api_url": "${API_URL}",
  "total_tests": ${TOTAL_TESTS},
  "passed_tests": ${PASSED_TESTS},
  "failed_tests": ${FAILED_TESTS},
  "success_rate": $(( PASSED_TESTS * 100 / TOTAL_TESTS )),
  "test_groups": [
    "health",
    "auth",
    "products", 
    "customers",
    "orders",
    "analytics",
    "cart_checkout",
    "rate_limiting",
    "error_handling"
  ]
}
EOF
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        log "🎉 All tests passed!"
        exit 0
    else
        log "❌ ${FAILED_TESTS} tests failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Usage: $0 [test_group]"
        echo ""
        echo "Test groups:"
        echo "  health       - Health check endpoint"
        echo "  auth         - Authentication endpoints"
        echo "  products     - Product CRUD and search"
        echo "  customers    - Customer management"
        echo "  orders       - Order processing"
        echo "  analytics    - Analytics endpoints"
        echo "  cart         - Cart and checkout"
        echo "  rate         - Rate limiting"
        echo "  errors       - Error handling"
        echo ""
        echo "Environment variables:"
        echo "  API_URL      - Base API URL (default: http://localhost:3000)"
        exit 0
        ;;
    "health")
        test_health
        ;;
    "auth")
        test_auth
        ;;
    "products")
        test_products
        ;;
    "customers")
        test_customers
        ;;
    "orders")
        test_orders
        ;;
    "analytics")
        test_analytics
        ;;
    "cart")
        test_cart_checkout
        ;;
    "rate")
        test_rate_limiting
        ;;
    "errors")
        test_error_handling
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown test group: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac