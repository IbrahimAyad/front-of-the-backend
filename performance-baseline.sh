#!/bin/bash
# performance-baseline.sh - Terminal 1 Performance Baseline Testing
# Establishes performance baselines for all migrated endpoints

set -e

echo "📈 KCT Performance Baseline Testing"
echo "==================================="

# Configuration
BASE_URL="http://localhost:3001"
TEST_RUNS=50
CONCURRENT_REQUESTS=5

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check dependencies
check_dependencies() {
  echo "🔧 Checking dependencies..."
  
  for cmd in curl jq bc; do
    if ! command -v $cmd &> /dev/null; then
      echo -e "${RED}❌ $cmd is required but not installed${NC}"
      exit 1
    fi
  done
  
  echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

# Get auth token
get_auth_token() {
  echo "🔐 Getting authentication token..."
  
  TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@kct.com","password":"admin123"}' \
    | jq -r '.token // empty')
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Authentication successful${NC}"
  export AUTH_HEADER="Authorization: Bearer $TOKEN"
}

# Test single endpoint
test_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local auth_required=${3:-false}
  local payload=${4:-""}
  
  echo -n "Testing $method /api/$endpoint... "
  
  local times=()
  local status_codes=()
  local errors=0
  
  for i in $(seq 1 $TEST_RUNS); do
    local headers=()
    if [ "$auth_required" = "true" ]; then
      headers+=("-H" "$AUTH_HEADER")
    fi
    
    if [ "$method" = "POST" ] && [ -n "$payload" ]; then
      headers+=("-H" "Content-Type: application/json")
      headers+=("-d" "$payload")
    fi
    
    local start_time=$(date +%s%N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" \
      "${headers[@]}" \
      "$BASE_URL/api/$endpoint" 2>/dev/null || echo "000")
    local end_time=$(date +%s%N)
    
    local duration=$(( (end_time - start_time) / 1000000 ))
    times+=($duration)
    status_codes+=($response)
    
    if [[ ! "$response" =~ ^2[0-9][0-9]$ ]]; then
      errors=$((errors + 1))
    fi
  done
  
  # Calculate statistics
  local total=0
  local min=999999
  local max=0
  
  for time in "${times[@]}"; do
    total=$((total + time))
    if [ $time -lt $min ]; then min=$time; fi
    if [ $time -gt $max ]; then max=$time; fi
  done
  
  local avg=$((total / TEST_RUNS))
  local success_rate=$(( (TEST_RUNS - errors) * 100 / TEST_RUNS ))
  
  # Calculate percentiles (simplified)
  IFS=$'\n' sorted_times=($(sort -n <<<"${times[*]}"))
  local p50_index=$((TEST_RUNS / 2))
  local p95_index=$((TEST_RUNS * 95 / 100))
  local p50=${sorted_times[$p50_index]}
  local p95=${sorted_times[$p95_index]}
  
  # Determine status
  local status_color=$GREEN
  local status_text="✅ Good"
  
  if [ $avg -gt 200 ] || [ $success_rate -lt 95 ]; then
    status_color=$YELLOW
    status_text="⚠️  Acceptable"
  fi
  
  if [ $avg -gt 500 ] || [ $success_rate -lt 90 ]; then
    status_color=$RED
    status_text="❌ Needs attention"
  fi
  
  echo -e "$status_color$status_text${NC}"
  echo "  Avg: ${avg}ms | Min: ${min}ms | Max: ${max}ms | P50: ${p50}ms | P95: ${p95}ms | Success: ${success_rate}%"
  
  # Return data for summary
  echo "$endpoint,$method,$avg,$min,$max,$p50,$p95,$success_rate" >> /tmp/perf_results.csv
}

# Test concurrent requests
test_concurrent() {
  local endpoint=$1
  local concurrent=${2:-5}
  
  echo -n "Testing concurrent requests to /api/$endpoint ($concurrent concurrent)... "
  
  local pids=()
  local start_time=$(date +%s%N)
  
  # Start concurrent requests
  for i in $(seq 1 $concurrent); do
    curl -s -o /dev/null \
      -H "$AUTH_HEADER" \
      "$BASE_URL/api/$endpoint" &
    pids+=($!)
  done
  
  # Wait for all to complete
  for pid in "${pids[@]}"; do
    wait $pid
  done
  
  local end_time=$(date +%s%N)
  local total_duration=$(( (end_time - start_time) / 1000000 ))
  local avg_per_request=$((total_duration / concurrent))
  
  if [ $total_duration -lt 1000 ]; then
    echo -e "${GREEN}✅ ${total_duration}ms total (${avg_per_request}ms avg)${NC}"
  elif [ $total_duration -lt 2000 ]; then
    echo -e "${YELLOW}⚠️  ${total_duration}ms total (${avg_per_request}ms avg)${NC}"
  else
    echo -e "${RED}❌ ${total_duration}ms total (${avg_per_request}ms avg)${NC}"
  fi
}

# Memory and cache testing
test_memory_impact() {
  echo "🧠 Testing memory impact and cache efficiency..."
  
  # Test cache warming
  echo -n "Cache warming (10 requests to /api/products)... "
  for i in {1..10}; do
    curl -s -o /dev/null "$BASE_URL/api/products" &
  done
  wait
  echo -e "${GREEN}✅ Complete${NC}"
  
  # Test cache hits
  echo -n "Testing cache efficiency... "
  local cache_test_times=()
  
  for i in {1..5}; do
    local start_time=$(date +%s%N)
    curl -s -o /dev/null "$BASE_URL/api/products"
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    cache_test_times+=($duration)
  done
  
  local total=0
  for time in "${cache_test_times[@]}"; do
    total=$((total + time))
  done
  local avg_cached=$((total / 5))
  
  if [ $avg_cached -lt 50 ]; then
    echo -e "${GREEN}✅ Excellent cache performance (${avg_cached}ms avg)${NC}"
  elif [ $avg_cached -lt 100 ]; then
    echo -e "${YELLOW}⚠️  Good cache performance (${avg_cached}ms avg)${NC}"
  else
    echo -e "${RED}❌ Cache may not be working effectively (${avg_cached}ms avg)${NC}"
  fi
}

# Generate performance report
generate_report() {
  echo ""
  echo "📊 Performance Baseline Report"
  echo "=============================="
  
  if [ -f /tmp/perf_results.csv ]; then
    echo "Endpoint Performance Summary:"
    echo "| Endpoint | Method | Avg(ms) | Min(ms) | Max(ms) | P50(ms) | P95(ms) | Success% |"
    echo "|----------|--------|---------|---------|---------|---------|---------|----------|"
    
    while IFS=',' read -r endpoint method avg min max p50 p95 success; do
      printf "| %-8s | %-6s | %-7s | %-7s | %-7s | %-7s | %-7s | %-8s |\n" \
        "$endpoint" "$method" "$avg" "$min" "$max" "$p50" "$p95" "$success"
    done < /tmp/perf_results.csv
    
    echo ""
    
    # Calculate overall metrics
    local total_endpoints=$(wc -l < /tmp/perf_results.csv)
    local avg_response_time=$(awk -F',' '{sum+=$3} END {print int(sum/NR)}' /tmp/perf_results.csv)
    local min_success_rate=$(awk -F',' '{if(min=="" || $8<min) min=$8} END {print min}' /tmp/perf_results.csv)
    
    echo -e "${BLUE}📈 Overall Performance Metrics:${NC}"
    echo "  Total endpoints tested: $total_endpoints"
    echo "  Average response time: ${avg_response_time}ms"
    echo "  Minimum success rate: ${min_success_rate}%"
    
    # Performance grade
    if [ $avg_response_time -lt 100 ] && [ $min_success_rate -ge 98 ]; then
      echo -e "  ${GREEN}🏆 Performance Grade: A (Excellent)${NC}"
    elif [ $avg_response_time -lt 200 ] && [ $min_success_rate -ge 95 ]; then
      echo -e "  ${YELLOW}⭐ Performance Grade: B (Good)${NC}"
    elif [ $avg_response_time -lt 500 ] && [ $min_success_rate -ge 90 ]; then
      echo -e "  ${YELLOW}⚠️  Performance Grade: C (Acceptable)${NC}"
    else
      echo -e "  ${RED}❌ Performance Grade: D (Needs Improvement)${NC}"
    fi
    
    # Cleanup
    rm -f /tmp/perf_results.csv
  fi
  
  echo ""
  echo "💡 Recommendations:"
  echo "1. Monitor these baselines in production"
  echo "2. Set up alerts for response times > 500ms"
  echo "3. Implement additional caching for slow endpoints"
  echo "4. Consider database query optimization"
  echo "5. Use CDN for static assets"
}

# Main execution
main() {
  echo "Starting performance baseline testing with $TEST_RUNS requests per endpoint..."
  echo ""
  
  check_dependencies
  get_auth_token
  
  # Initialize results file
  echo "endpoint,method,avg,min,max,p50,p95,success" > /tmp/perf_results.csv
  
  echo ""
  echo "🚀 Testing Core Endpoints..."
  echo "----------------------------"
  
  # Public endpoints
  test_endpoint "products" "GET" false
  test_endpoint "products/alerts/stock" "GET" true
  
  # Protected endpoints
  test_endpoint "customers" "GET" true
  test_endpoint "orders" "GET" true
  test_endpoint "dashboard" "GET" true
  test_endpoint "leads" "GET" true
  test_endpoint "appointments" "GET" true
  
  # Analytics endpoints
  test_endpoint "analytics/sales" "GET" true
  test_endpoint "analytics/customers" "GET" true
  test_endpoint "analytics/products" "GET" true
  
  echo ""
  echo "⚡ Testing Concurrent Load..."
  echo "----------------------------"
  
  test_concurrent "products" 10
  test_concurrent "orders" 5
  test_concurrent "dashboard" 3
  
  echo ""
  test_memory_impact
  
  generate_report
}

# Run the baseline testing
main "$@"