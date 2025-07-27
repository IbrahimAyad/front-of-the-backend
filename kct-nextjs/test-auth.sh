#!/bin/bash

# Test script for NextAuth implementation with AuthService integration

echo "🔐 Testing NextAuth + AuthService Integration"
echo "==========================================="

# Base URL
BASE_URL="http://localhost:3001"

# Test credentials (update these based on your seed data)
TEST_EMAIL="admin@kctmenswear.com"
TEST_PASSWORD="admin123"

echo -e "\n📍 1. Testing Login Endpoint"
echo "------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

echo "Response: $LOGIN_RESPONSE"

# Extract token using grep and sed
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
else
  echo "✅ Login successful - Token received"
fi

echo -e "\n📍 2. Testing Protected Route with Token"
echo "------------------------------"
PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/api/auth/profile \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $PROFILE_RESPONSE"

if [[ $PROFILE_RESPONSE == *"user"* ]]; then
  echo "✅ Protected route access successful"
else
  echo "❌ Protected route access failed"
fi

echo -e "\n📍 3. Testing Token Refresh"
echo "------------------------------"
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $REFRESH_RESPONSE"

NEW_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$NEW_TOKEN" ]; then
  echo "❌ Token refresh failed"
else
  echo "✅ Token refresh successful"
fi

echo -e "\n📍 4. Testing Change Password"
echo "------------------------------"
CHANGE_PWD_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\": \"$TEST_PASSWORD\", \"newPassword\": \"newPassword123\"}")

echo "Response: $CHANGE_PWD_RESPONSE"

echo -e "\n📍 5. Testing Admin Route Access"
echo "------------------------------"
ADMIN_RESPONSE=$(curl -s -X GET $BASE_URL/api/admin/test \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ADMIN_RESPONSE"

echo -e "\n📍 6. Testing Backward Compatibility"
echo "------------------------------"
echo "If you have an existing Fastify JWT token, test it here:"
echo "curl -X GET $BASE_URL/api/auth/profile -H \"Authorization: Bearer YOUR_FASTIFY_TOKEN\""

echo -e "\n✅ Auth integration tests complete!"