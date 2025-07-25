#!/bin/bash

echo "🧪 Testing backend file upload..."
echo ""

# Create a test file
echo "test content" > test-upload.txt

# Test multipart upload
echo "Testing multipart upload to Railway backend..."
curl -X POST https://front-of-the-backend-production.up.railway.app/api/cloudflare/upload \
  -F "file=@test-upload.txt" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  --max-time 10 \
  -v 2>&1 | grep -E "(< HTTP|{|error|Error|Status:|Time:)"

# Clean up
rm test-upload.txt

echo ""
echo "If this times out or returns 502, the multipart middleware isn't working on Railway."