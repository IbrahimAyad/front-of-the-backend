#!/bin/bash

# Product API Comparison Tests
# Compares Fastify vs Next.js product endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NEXTJS_URL="${NEXTJS_URL:-http://localhost:3000}"
FASTIFY_URL="${FASTIFY_URL:-http://localhost:3001}"

# Results file
RESULTS_FILE="product-comparison-results-$(date +%Y%m%d-%H%M%S).json"

echo "🛍️ Product API Comparison Tests"
echo "================================"
echo "NextJS URL: $NEXTJS_URL"
echo "Fastify URL: $FASTIFY_URL"
echo "Results will be saved to: $RESULTS_FILE"
echo ""

# Initialize results
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"tests\":[]}" > "$RESULTS_FILE"

# Function to compare endpoints
compare_endpoint() {
    local test_name=$1
    local method=$2
    local path=$3
    local data=$4
    local headers=$5
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    echo "----------------------------------------"
    
    # Test NextJS
    echo -n "NextJS: "
    nextjs_start=$(date +%s%N)
    nextjs_response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X $method "$NEXTJS_URL$path" \
        -H "Content-Type: application/json" \
        ${headers:+-H "$headers"} \
        ${data:+-d "$data"})
    nextjs_end=$(date +%s%N)
    
    nextjs_body=$(echo "$nextjs_response" | head -n-2)
    nextjs_code=$(echo "$nextjs_response" | tail -n2 | head -n1)
    nextjs_time=$(echo "$nextjs_response" | tail -n1)
    nextjs_duration=$((($nextjs_end - $nextjs_start) / 1000000))
    
    if [[ $nextjs_code -ge 200 && $nextjs_code -lt 300 ]]; then
        echo -e "${GREEN}✓${NC} ($nextjs_code) - ${nextjs_duration}ms"
    else
        echo -e "${RED}✗${NC} ($nextjs_code) - ${nextjs_duration}ms"
    fi
    
    # Test Fastify
    echo -n "Fastify: "
    fastify_start=$(date +%s%N)
    fastify_response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X $method "$FASTIFY_URL$path" \
        -H "Content-Type: application/json" \
        ${headers:+-H "$headers"} \
        ${data:+-d "$data"})
    fastify_end=$(date +%s%N)
    
    fastify_body=$(echo "$fastify_response" | head -n-2)
    fastify_code=$(echo "$fastify_response" | tail -n2 | head -n1)
    fastify_time=$(echo "$fastify_response" | tail -n1)
    fastify_duration=$((($fastify_end - $fastify_start) / 1000000))
    
    if [[ $fastify_code -ge 200 && $fastify_code -lt 300 ]]; then
        echo -e "${GREEN}✓${NC} ($fastify_code) - ${fastify_duration}ms"
    else
        echo -e "${RED}✗${NC} ($fastify_code) - ${fastify_duration}ms"
    fi
    
    # Compare response structures
    echo ""
    echo "Response Comparison:"
    
    # Status codes
    if [ "$nextjs_code" = "$fastify_code" ]; then
        echo -e "  Status Codes: ${GREEN}✓ Match${NC} ($nextjs_code)"
    else
        echo -e "  Status Codes: ${RED}✗ Mismatch${NC} (NextJS: $nextjs_code, Fastify: $fastify_code)"
    fi
    
    # Response time
    speed_ratio=$(echo "scale=2; $nextjs_duration / $fastify_duration" | bc)
    if (( $(echo "$speed_ratio < 2" | bc -l) )); then
        echo -e "  Performance: ${GREEN}✓ Acceptable${NC} (NextJS: ${nextjs_duration}ms, Fastify: ${fastify_duration}ms, Ratio: ${speed_ratio}x)"
    else
        echo -e "  Performance: ${YELLOW}⚠ Slow${NC} (NextJS: ${nextjs_duration}ms, Fastify: ${fastify_duration}ms, Ratio: ${speed_ratio}x)"
    fi
    
    # Data structure comparison
    if [ "$nextjs_code" = "200" ] && [ "$fastify_code" = "200" ]; then
        # Extract key counts
        nextjs_keys=$(echo "$nextjs_body" | jq -r 'keys | length' 2>/dev/null || echo "0")
        fastify_keys=$(echo "$fastify_body" | jq -r 'keys | length' 2>/dev/null || echo "0")
        
        if [ "$nextjs_keys" = "$fastify_keys" ]; then
            echo -e "  Structure: ${GREEN}✓ Similar${NC} (Both have $nextjs_keys top-level keys)"
        else
            echo -e "  Structure: ${YELLOW}⚠ Different${NC} (NextJS: $nextjs_keys keys, Fastify: $fastify_keys keys)"
        fi
        
        # Show sample data
        echo ""
        echo "  NextJS Response Sample:"
        echo "$nextjs_body" | jq -c 'if type == "array" then .[0:2] else . end' 2>/dev/null | head -c 200
        echo ""
        echo ""
        echo "  Fastify Response Sample:"
        echo "$fastify_body" | jq -c 'if type == "array" then .[0:2] else . end' 2>/dev/null | head -c 200
        echo ""
    fi
    
    # Save results
    jq --arg name "$test_name" \
       --arg method "$method" \
       --arg path "$path" \
       --arg ncode "$nextjs_code" \
       --arg fcode "$fastify_code" \
       --arg ntime "$nextjs_duration" \
       --arg ftime "$fastify_duration" \
       --arg ratio "$speed_ratio" \
       '.tests += [{
           name: $name,
           method: $method,
           path: $path,
           nextjs: {code: $ncode, time: $ntime},
           fastify: {code: $fcode, time: $ftime},
           speedRatio: $ratio
       }]' "$RESULTS_FILE" > tmp.json && mv tmp.json "$RESULTS_FILE"
    
    echo ""
    echo ""
}

# Get auth token for protected endpoints
echo "Getting auth token..."
AUTH_RESPONSE=$(curl -s -X POST "$NEXTJS_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}')

SESSION_RESPONSE=$(curl -s "$NEXTJS_URL/api/auth/session")
AUTH_TOKEN=$(echo "$SESSION_RESPONSE" | jq -r '.accessToken // empty')

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}Warning: Could not get auth token. Some tests may fail.${NC}"
fi

# 1. Test GET /api/products
compare_endpoint "List All Products" "GET" "/api/products"

# 2. Test GET /api/products with pagination
compare_endpoint "List Products (Page 2)" "GET" "/api/products?page=2&limit=10"

# 3. Test GET /api/products with filters
compare_endpoint "List Products (Filtered)" "GET" "/api/products?category=Suits&minPrice=100&maxPrice=500"

# 4. Test GET /api/products/:id
# First, get a product ID
PRODUCT_ID=$(curl -s "$NEXTJS_URL/api/products?limit=1" | jq -r '.products[0].id // empty' 2>/dev/null)

if [ ! -z "$PRODUCT_ID" ]; then
    compare_endpoint "Get Single Product" "GET" "/api/products/$PRODUCT_ID"
else
    echo -e "${YELLOW}Skipping single product test - no product ID found${NC}"
fi

# 5. Test GET /api/products/stats/dashboard
compare_endpoint "Product Dashboard Stats" "GET" "/api/products/stats/dashboard" "" \
    "Authorization: Bearer $AUTH_TOKEN"

# 6. Test GET /api/products/search
compare_endpoint "Search Products" "GET" "/api/products/search?q=suit"

# 7. Test GET /api/products/category/:category
compare_endpoint "Products by Category" "GET" "/api/products/category/Suits"

# 8. Test protected product endpoints
if [ ! -z "$AUTH_TOKEN" ]; then
    # Test POST /api/products (create)
    NEW_PRODUCT='{
        "name": "Test Product Comparison",
        "description": "Product for API comparison test",
        "price": 299.99,
        "category": "Suits",
        "stock": 50,
        "sku": "TEST-COMP-001"
    }'
    
    compare_endpoint "Create Product (Admin)" "POST" "/api/products" "$NEW_PRODUCT" \
        "Authorization: Bearer $AUTH_TOKEN"
    
    # Get the created product ID
    CREATED_ID=$(curl -s "$NEXTJS_URL/api/products?limit=10" \
        -H "Authorization: Bearer $AUTH_TOKEN" | \
        jq -r '.products[] | select(.name == "Test Product Comparison") | .id' 2>/dev/null | head -1)
    
    if [ ! -z "$CREATED_ID" ]; then
        # Test PUT /api/products/:id
        UPDATE_PRODUCT='{"price": 349.99, "stock": 75}'
        compare_endpoint "Update Product (Admin)" "PUT" "/api/products/$CREATED_ID" "$UPDATE_PRODUCT" \
            "Authorization: Bearer $AUTH_TOKEN"
        
        # Test DELETE /api/products/:id
        compare_endpoint "Delete Product (Admin)" "DELETE" "/api/products/$CREATED_ID" "" \
            "Authorization: Bearer $AUTH_TOKEN"
    fi
fi

# 9. Test image URL handling
echo -e "${BLUE}Testing Image URL Handling${NC}"
echo "----------------------------------------"

# Get products with images
PRODUCTS_WITH_IMAGES=$(curl -s "$NEXTJS_URL/api/products?limit=5" | \
    jq -r '.products[] | select(.images != null and .images != []) | .id' 2>/dev/null)

if [ ! -z "$PRODUCTS_WITH_IMAGES" ]; then
    for pid in $PRODUCTS_WITH_IMAGES; do
        echo "Checking product $pid images..."
        
        nextjs_images=$(curl -s "$NEXTJS_URL/api/products/$pid" | \
            jq -r '.images[]?.url // empty' 2>/dev/null)
        
        fastify_images=$(curl -s "$FASTIFY_URL/api/products/$pid" | \
            jq -r '.images[]?.url // empty' 2>/dev/null)
        
        if [ ! -z "$nextjs_images" ]; then
            echo "NextJS image URLs:"
            echo "$nextjs_images" | head -3
        fi
        
        if [ ! -z "$fastify_images" ]; then
            echo "Fastify image URLs:"
            echo "$fastify_images" | head -3
        fi
        
        echo ""
        break # Just check one product
    done
else
    echo -e "${YELLOW}No products with images found${NC}"
fi

# 10. Performance load test
echo -e "${BLUE}Running Performance Load Test${NC}"
echo "----------------------------------------"
echo "Testing 50 concurrent requests to /api/products..."

# NextJS load test
nextjs_load_start=$(date +%s%N)
for i in {1..50}; do
    curl -s "$NEXTJS_URL/api/products?limit=10" > /dev/null &
done
wait
nextjs_load_end=$(date +%s%N)
nextjs_load_duration=$((($nextjs_load_end - $nextjs_load_start) / 1000000))

# Fastify load test
fastify_load_start=$(date +%s%N)
for i in {1..50}; do
    curl -s "$FASTIFY_URL/api/products?limit=10" > /dev/null &
done
wait
fastify_load_end=$(date +%s%N)
fastify_load_duration=$((($fastify_load_end - $fastify_load_start) / 1000000))

echo "NextJS: 50 requests completed in ${nextjs_load_duration}ms"
echo "Fastify: 50 requests completed in ${fastify_load_duration}ms"

load_ratio=$(echo "scale=2; $nextjs_load_duration / $fastify_load_duration" | bc)
echo "Load test ratio: ${load_ratio}x"

# Generate summary report
echo ""
echo -e "${BLUE}Generating Summary Report${NC}"
echo "========================================="

# Calculate statistics
total_tests=$(jq '.tests | length' "$RESULTS_FILE")
matching_codes=$(jq '[.tests[] | select(.nextjs.code == .fastify.code)] | length' "$RESULTS_FILE")
avg_ratio=$(jq '[.tests[].speedRatio | tonumber] | add / length' "$RESULTS_FILE")

echo "Total Tests Run: $total_tests"
echo "Matching Status Codes: $matching_codes/$total_tests"
echo "Average Speed Ratio: ${avg_ratio}x slower than Fastify"
echo ""

# Show slowest endpoints
echo "Slowest Endpoints (by ratio):"
jq -r '.tests | sort_by(.speedRatio | tonumber) | reverse | .[0:3] | .[] | 
    "\(.name): \(.speedRatio)x slower (\(.nextjs.time)ms vs \(.fastify.time)ms)"' "$RESULTS_FILE"

echo ""
echo "Full results saved to: $RESULTS_FILE"

# Create a visual HTML report
cat > "product-comparison-report.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Product API Comparison Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; }
        .warning { background-color: #fff3cd; }
        .error { background-color: #f8d7da; }
        canvas { max-width: 600px; margin: 20px auto; }
    </style>
</head>
<body>
    <h1>Product API Comparison Report</h1>
    <p>Generated: $(date)</p>
    
    <h2>Summary</h2>
    <ul>
        <li>Total Tests: $total_tests</li>
        <li>Matching Responses: $matching_codes</li>
        <li>Average Performance Ratio: ${avg_ratio}x</li>
        <li>Load Test Ratio: ${load_ratio}x</li>
    </ul>
    
    <h2>Performance Comparison</h2>
    <canvas id="perfChart"></canvas>
    
    <h2>Detailed Results</h2>
    <div id="results"></div>
    
    <script>
        const data = $(cat "$RESULTS_FILE");
        
        // Create performance chart
        const ctx = document.getElementById('perfChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.tests.map(t => t.name),
                datasets: [{
                    label: 'NextJS (ms)',
                    data: data.tests.map(t => parseInt(t.nextjs.time)),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                }, {
                    label: 'Fastify (ms)',
                    data: data.tests.map(t => parseInt(t.fastify.time)),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
                }]
            }
        });
        
        // Display results
        const resultsDiv = document.getElementById('results');
        data.tests.forEach(test => {
            const div = document.createElement('div');
            div.className = 'test ' + (test.nextjs.code === test.fastify.code ? 'success' : 'error');
            div.innerHTML = \`
                <h3>\${test.name}</h3>
                <p><strong>\${test.method} \${test.path}</strong></p>
                <p>NextJS: \${test.nextjs.code} - \${test.nextjs.time}ms</p>
                <p>Fastify: \${test.fastify.code} - \${test.fastify.time}ms</p>
                <p>Speed Ratio: \${test.speedRatio}x</p>
            \`;
            resultsDiv.appendChild(div);
        });
    </script>
</body>
</html>
EOF

echo ""
echo "HTML report generated: product-comparison-report.html"
echo ""
echo "Product API comparison complete! 🎉"