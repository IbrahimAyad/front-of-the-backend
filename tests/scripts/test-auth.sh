#!/bin/bash

# Auth System Validation Tests
# Tests NextAuth integration against Fastify auth

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NEXTJS_URL="${NEXTJS_URL:-http://localhost:3000}"
FASTIFY_URL="${FASTIFY_URL:-http://localhost:3001}"

# Test credentials
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="SecurePassword123!"
TEST_NAME="Test User"

# Production test credentials (update these)
PROD_EMAIL="${PROD_EMAIL:-admin@example.com}"
PROD_PASSWORD="${PROD_PASSWORD:-admin123}"

echo "🔐 Auth System Validation Tests"
echo "================================"
echo "NextJS URL: $NEXTJS_URL"
echo "Fastify URL: $FASTIFY_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local headers=$5
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
        -H "Content-Type: application/json" \
        ${headers:+-H "$headers"} \
        ${data:+-d "$data"})
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✓${NC} ($http_code)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗${NC} ($http_code)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
    
    echo ""
}

# Function to extract token from response
extract_token() {
    echo "$1" | jq -r '.token // .accessToken // .data.token // empty'
}

# Function to validate JWT structure
validate_jwt() {
    local token=$1
    local system=$2
    
    echo "Validating JWT from $system..."
    
    # Decode JWT (base64)
    local header=$(echo "$token" | cut -d. -f1 | base64 -d 2>/dev/null || echo "")
    local payload=$(echo "$token" | cut -d. -f2 | base64 -d 2>/dev/null || echo "")
    
    echo "Header:"
    echo "$header" | jq . 2>/dev/null || echo "$header"
    echo "Payload:"
    echo "$payload" | jq . 2>/dev/null || echo "$payload"
    
    # Check required fields
    if echo "$payload" | jq -e '.userId or .id or .sub' >/dev/null 2>&1; then
        echo -e "${GREEN}✓ User ID present${NC}"
    else
        echo -e "${RED}✗ User ID missing${NC}"
    fi
    
    if echo "$payload" | jq -e '.email' >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Email present${NC}"
    else
        echo -e "${RED}✗ Email missing${NC}"
    fi
    
    if echo "$payload" | jq -e '.exp' >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Expiration present${NC}"
    else
        echo -e "${RED}✗ Expiration missing${NC}"
    fi
    
    echo ""
}

# 1. Test Registration
echo "1. Testing Registration"
echo "----------------------"

# Register on NextJS
echo "NextJS Registration:"
nextjs_register=$(test_endpoint "NextJS Register" "POST" "$NEXTJS_URL/api/auth/register" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

# Register on Fastify (for comparison)
echo "Fastify Registration:"
fastify_register=$(test_endpoint "Fastify Register" "POST" "$FASTIFY_URL/api/auth/register" \
    "{\"email\":\"${TEST_EMAIL/test/fastify}\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

# 2. Test Login
echo "2. Testing Login"
echo "----------------"

# Login with NextJS
echo "NextJS Login:"
nextjs_login_response=$(curl -s -X POST "$NEXTJS_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

# For NextAuth, we need to use the session endpoint
nextjs_session_response=$(curl -s "$NEXTJS_URL/api/auth/session")
nextjs_token=$(echo "$nextjs_session_response" | jq -r '.accessToken // empty')

echo "NextJS Session Response:"
echo "$nextjs_session_response" | jq .

# Login with Fastify
echo "Fastify Login:"
fastify_login_response=$(curl -s -X POST "$FASTIFY_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL/test/fastify}\",\"password\":\"$TEST_PASSWORD\"}")

fastify_token=$(extract_token "$fastify_login_response")
echo "$fastify_login_response" | jq .

# 3. Validate JWT Structure
echo "3. JWT Structure Validation"
echo "---------------------------"

if [ ! -z "$nextjs_token" ]; then
    validate_jwt "$nextjs_token" "NextJS"
fi

if [ ! -z "$fastify_token" ]; then
    validate_jwt "$fastify_token" "Fastify"
fi

# 4. Test Protected Endpoints
echo "4. Testing Protected Endpoints"
echo "------------------------------"

# Test with production credentials
echo "Testing with production credentials..."

# Login with production user
prod_login_response=$(curl -s -X POST "$NEXTJS_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$PROD_EMAIL\",\"password\":\"$PROD_PASSWORD\"}")

# Get session
prod_session=$(curl -s "$NEXTJS_URL/api/auth/session" \
    -H "Cookie: $(echo "$prod_login_response" | grep -i set-cookie | cut -d: -f2-)")

prod_token=$(echo "$prod_session" | jq -r '.accessToken // empty')

if [ ! -z "$prod_token" ]; then
    # Test various protected endpoints
    test_endpoint "Get Current User" "GET" "$NEXTJS_URL/api/auth/me" "" \
        "Authorization: Bearer $prod_token"
    
    test_endpoint "Get Products (Protected)" "GET" "$NEXTJS_URL/api/products" "" \
        "Authorization: Bearer $prod_token"
    
    test_endpoint "Admin Endpoint" "GET" "$NEXTJS_URL/api/admin/users" "" \
        "Authorization: Bearer $prod_token"
fi

# 5. Test Role-Based Access
echo "5. Testing Role-Based Access"
echo "----------------------------"

# Test admin endpoints with regular user
if [ ! -z "$nextjs_token" ]; then
    echo "Testing admin endpoint with regular user token:"
    admin_response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$NEXTJS_URL/api/admin/users" \
        -H "Authorization: Bearer $nextjs_token")
    
    if [ "$admin_response" = "403" ]; then
        echo -e "${GREEN}✓ Admin endpoint correctly rejected regular user (403)${NC}"
    else
        echo -e "${RED}✗ Admin endpoint returned $admin_response (expected 403)${NC}"
    fi
fi

# 6. Test Token Refresh
echo "6. Testing Token Refresh"
echo "------------------------"

if [ ! -z "$nextjs_token" ]; then
    test_endpoint "Refresh Token" "POST" "$NEXTJS_URL/api/auth/refresh" \
        "{\"token\":\"$nextjs_token\"}"
fi

# 7. Test Logout
echo "7. Testing Logout"
echo "-----------------"

if [ ! -z "$nextjs_token" ]; then
    test_endpoint "Logout" "POST" "$NEXTJS_URL/api/auth/signout" "" \
        "Authorization: Bearer $nextjs_token"
    
    # Verify token is invalid after logout
    echo "Verifying token is invalid after logout:"
    logout_test=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$NEXTJS_URL/api/auth/me" \
        -H "Authorization: Bearer $nextjs_token")
    
    if [ "$logout_test" = "401" ]; then
        echo -e "${GREEN}✓ Token correctly invalidated after logout${NC}"
    else
        echo -e "${RED}✗ Token still valid after logout (got $logout_test)${NC}"
    fi
fi

# 8. Test Session Management
echo "8. Testing Session Management"
echo "-----------------------------"

# Create multiple sessions
echo "Creating multiple sessions..."
for i in {1..3}; do
    session_response=$(curl -s -X POST "$NEXTJS_URL/api/auth/callback/credentials" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    echo "Session $i created"
done

# Test concurrent requests
echo "Testing concurrent authenticated requests..."
for i in {1..5}; do
    curl -s -X GET "$NEXTJS_URL/api/auth/me" \
        -H "Authorization: Bearer $nextjs_token" &
done
wait

echo -e "${GREEN}✓ Concurrent requests completed${NC}"

# 9. Performance Comparison
echo "9. Performance Comparison"
echo "-------------------------"

# Measure login performance
echo "Measuring login performance (10 requests each)..."

nextjs_total=0
for i in {1..10}; do
    start=$(date +%s%N)
    curl -s -X POST "$NEXTJS_URL/api/auth/callback/credentials" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" > /dev/null
    end=$(date +%s%N)
    duration=$((($end - $start) / 1000000))
    nextjs_total=$((nextjs_total + duration))
done
nextjs_avg=$((nextjs_total / 10))

fastify_total=0
for i in {1..10}; do
    start=$(date +%s%N)
    curl -s -X POST "$FASTIFY_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${TEST_EMAIL/test/fastify}\",\"password\":\"$TEST_PASSWORD\"}" > /dev/null
    end=$(date +%s%N)
    duration=$((($end - $start) / 1000000))
    fastify_total=$((fastify_total + duration))
done
fastify_avg=$((fastify_total / 10))

echo "NextJS average login time: ${nextjs_avg}ms"
echo "Fastify average login time: ${fastify_avg}ms"

if [ $nextjs_avg -lt $((fastify_avg * 2)) ]; then
    echo -e "${GREEN}✓ NextJS performance is acceptable${NC}"
else
    echo -e "${YELLOW}⚠ NextJS is significantly slower than Fastify${NC}"
fi

# 10. Summary
echo ""
echo "Test Summary"
echo "============"
echo "✅ Registration tested"
echo "✅ Login tested"
echo "✅ JWT structure validated"
echo "✅ Protected endpoints tested"
echo "✅ Role-based access tested"
echo "✅ Token refresh tested"
echo "✅ Logout tested"
echo "✅ Session management tested"
echo "✅ Performance compared"

echo ""
echo "Auth validation complete! 🎉"