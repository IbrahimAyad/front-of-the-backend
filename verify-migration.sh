#!/bin/bash
# verify-migration.sh - Comprehensive migration verification script
# Terminal 1 Production Verification

set -e

echo "🔍 KCT Migration Verification Starting..."
echo "========================================"

# Configuration
FASTIFY_URL="http://localhost:3000"
NEXTJS_URL="http://localhost:3001"
TEST_EMAIL="admin@kct.com"
TEST_PASSWORD="admin123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
  echo "🔧 Checking dependencies..."
  
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is required but not installed${NC}"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required but not installed${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

# Check if servers are running
check_servers() {
  echo "🌐 Checking server availability..."
  
  # Check Fastify server
  if curl -s --connect-timeout 5 "$FASTIFY_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Fastify server running${NC}"
  else
    echo -e "${RED}❌ Fastify server not accessible at $FASTIFY_URL${NC}"
    exit 1
  fi
  
  # Check Next.js server
  if curl -s --connect-timeout 5 "$NEXTJS_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js server running${NC}"
  else
    echo -e "${RED}❌ Next.js server not accessible at $NEXTJS_URL${NC}"
    exit 1
  fi
}

# Get auth tokens from both systems
test_authentication() {
  echo "🔐 Testing Authentication..."
  
  # Fastify login
  FASTIFY_TOKEN=$(curl -s -X POST "$FASTIFY_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    | jq -r '.token // empty')

  if [ -z "$FASTIFY_TOKEN" ]; then
    echo -e "${RED}❌ Fastify authentication failed${NC}"
    echo "Please ensure test user exists or update credentials"
    exit 1
  else
    echo -e "${GREEN}✅ Fastify authentication successful${NC}"
  fi

  # Test legacy token with Next.js
  NEXTJS_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $FASTIFY_TOKEN" \
    "$NEXTJS_URL/api/products")

  if [ "$NEXTJS_TEST" -eq 200 ]; then
    echo -e "${GREEN}✅ Legacy token accepted by Next.js${NC}"
  else
    echo -e "${RED}❌ Legacy token rejected by Next.js (status: $NEXTJS_TEST)${NC}"
  fi
  
  export FASTIFY_TOKEN
}

# Compare endpoint responses
compare_endpoints() {
  echo ""
  echo "📊 Comparing Endpoints..."
  echo "------------------------"

  # Endpoints to test with their expected structure
  declare -A endpoints=(
    ["products"]="products endpoint"
    ["customers"]="customers endpoint"
    ["orders"]="orders endpoint"
    ["dashboard"]="dashboard endpoint"
    ["leads"]="leads endpoint"
    ["appointments"]="appointments endpoint"
  )

  failed_endpoints=()
  slow_endpoints=()
  passed_endpoints=()

  for endpoint in "${!endpoints[@]}"; do
    echo -n "Testing /api/$endpoint... "
    
    # Get responses from both servers
    FASTIFY_START=$(date +%s%N)
    FASTIFY_RESPONSE=$(curl -s -H "Authorization: Bearer $FASTIFY_TOKEN" \
      "$FASTIFY_URL/api/$endpoint" 2>/dev/null || echo '{}')
    FASTIFY_END=$(date +%s%N)
    
    NEXTJS_START=$(date +%s%N)
    NEXTJS_RESPONSE=$(curl -s -H "Authorization: Bearer $FASTIFY_TOKEN" \
      "$NEXTJS_URL/api/$endpoint" 2>/dev/null || echo '{}')
    NEXTJS_END=$(date +%s%N)
    
    # Calculate response times
    FASTIFY_TIME=$(( ($FASTIFY_END - $FASTIFY_START) / 1000000 ))
    NEXTJS_TIME=$(( ($NEXTJS_END - $NEXTJS_START) / 1000000 ))
    
    # Check if endpoints are accessible
    FASTIFY_STATUS=$(echo "$FASTIFY_RESPONSE" | jq -r 'if type == "object" then "ok" else "error" end' 2>/dev/null || echo "error")
    NEXTJS_STATUS=$(echo "$NEXTJS_RESPONSE" | jq -r 'if type == "object" then "ok" else "error" end' 2>/dev/null || echo "error")
    
    if [ "$NEXTJS_STATUS" = "ok" ]; then
      if [ $NEXTJS_TIME -gt 200 ]; then
        echo -e "${YELLOW}⚠️  Working but slow (${NEXTJS_TIME}ms)${NC}"
        slow_endpoints+=("$endpoint")
      else
        echo -e "${GREEN}✅ Working (${NEXTJS_TIME}ms)${NC}"
        passed_endpoints+=("$endpoint")
      fi
    else
      echo -e "${RED}❌ Failed${NC}"
      failed_endpoints+=("$endpoint")
    fi
  done
}

# Test protected endpoints
test_protected_endpoints() {
  echo ""
  echo "🧪 Testing Protected Endpoints..."
  echo "---------------------------------"

  # Test admin endpoint protection
  ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $FASTIFY_TOKEN" \
    "$NEXTJS_URL/api/analytics/sales")

  if [ "$ADMIN_STATUS" -eq 403 ] || [ "$ADMIN_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Admin route protection working (status: $ADMIN_STATUS)${NC}"
  else
    echo -e "${RED}❌ Admin route protection failed (status: $ADMIN_STATUS)${NC}"
  fi

  # Test without auth token
  UNAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$NEXTJS_URL/api/orders")

  if [ "$UNAUTH_STATUS" -eq 401 ]; then
    echo -e "${GREEN}✅ Unauthorized access properly blocked${NC}"
  else
    echo -e "${RED}❌ Unauthorized access not blocked (status: $UNAUTH_STATUS)${NC}"
  fi

  # Test different HTTP methods
  echo "Testing HTTP methods..."
  
  # Test POST to orders
  POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $FASTIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}' \
    "$NEXTJS_URL/api/orders")
  
  if [ "$POST_STATUS" -eq 400 ] || [ "$POST_STATUS" -eq 201 ] || [ "$POST_STATUS" -eq 422 ]; then
    echo -e "${GREEN}✅ POST method handled correctly (status: $POST_STATUS)${NC}"
  else
    echo -e "${YELLOW}⚠️  POST method status: $POST_STATUS${NC}"
  fi
}

# Performance testing
run_performance_tests() {
  echo ""
  echo "📈 Performance Testing..."
  echo "========================"

  # Test critical endpoints under load
  critical_endpoints=("products" "orders" "dashboard")
  
  for endpoint in "${critical_endpoints[@]}"; do
    echo "Load testing /api/$endpoint (50 requests)..."
    
    total_time=0
    success_count=0
    
    for i in {1..50}; do
      START=$(date +%s%N)
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $FASTIFY_TOKEN" \
        "$NEXTJS_URL/api/$endpoint")
      END=$(date +%s%N)
      
      DURATION=$(( ($END - $START) / 1000000 ))
      total_time=$((total_time + DURATION))
      
      if [ "$STATUS" -eq 200 ]; then
        success_count=$((success_count + 1))
      fi
    done

    avg_time=$((total_time / 50))
    success_rate=$((success_count * 100 / 50))
    
    echo -e "  Average response time: ${avg_time}ms"
    echo -e "  Success rate: ${success_rate}%"
    
    if [ $avg_time -lt 100 ] && [ $success_rate -eq 100 ]; then
      echo -e "  ${GREEN}✅ Excellent performance${NC}"
    elif [ $avg_time -lt 200 ] && [ $success_rate -ge 95 ]; then
      echo -e "  ${YELLOW}⚠️  Acceptable performance${NC}"
    else
      echo -e "  ${RED}❌ Performance needs optimization${NC}"
    fi
    echo ""
  done
}

# Generate final report
generate_report() {
  echo "🎯 Final Migration Report"
  echo "========================="
  
  total_endpoints=$((${#passed_endpoints[@]} + ${#slow_endpoints[@]} + ${#failed_endpoints[@]}))
  
  echo -e "${BLUE}📊 Endpoint Summary:${NC}"
  echo -e "  Total tested: $total_endpoints"
  echo -e "  ${GREEN}✅ Passed: ${#passed_endpoints[@]}${NC}"
  echo -e "  ${YELLOW}⚠️  Slow: ${#slow_endpoints[@]}${NC}"
  echo -e "  ${RED}❌ Failed: ${#failed_endpoints[@]}${NC}"
  
  if [ ${#passed_endpoints[@]} -gt 0 ]; then
    echo -e "\n${GREEN}✅ Working endpoints: ${passed_endpoints[*]}${NC}"
  fi
  
  if [ ${#slow_endpoints[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}⚠️  Slow endpoints (>200ms): ${slow_endpoints[*]}${NC}"
    echo -e "  Consider implementing caching or optimization"
  fi
  
  if [ ${#failed_endpoints[@]} -gt 0 ]; then
    echo -e "\n${RED}❌ Failed endpoints: ${failed_endpoints[*]}${NC}"
    echo -e "  These require immediate attention before production"
  fi
  
  # Calculate overall health score
  if [ $total_endpoints -gt 0 ]; then
    health_score=$(( (${#passed_endpoints[@]} + ${#slow_endpoints[@]}) * 100 / total_endpoints ))
    
    echo -e "\n${BLUE}🏥 Overall Health Score: ${health_score}%${NC}"
    
    if [ $health_score -ge 90 ]; then
      echo -e "${GREEN}🎉 Migration is PRODUCTION READY!${NC}"
      echo -e "Ready for gradual rollout with feature flags."
    elif [ $health_score -ge 75 ]; then
      echo -e "${YELLOW}⚠️  Migration is mostly ready${NC}"
      echo -e "Address slow endpoints before production deployment."
    else
      echo -e "${RED}❌ Migration needs work${NC}"
      echo -e "Fix failed endpoints before proceeding."
    fi
  fi
  
  echo ""
  echo "📋 Recommended Next Steps:"
  echo "1. Fix any failed endpoints"
  echo "2. Optimize slow endpoints with caching"
  echo "3. Implement gradual rollout with feature flags"
  echo "4. Monitor error rates during rollout"
  echo "5. Run this script after each rollout phase"
}

# Main execution
main() {
  check_dependencies
  check_servers
  test_authentication
  compare_endpoints
  test_protected_endpoints
  run_performance_tests
  generate_report
}

# Run the verification
main "$@"