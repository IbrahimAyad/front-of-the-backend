const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Test Cloudflare Images API directly
async function testCloudflareUpload() {
  const ACCOUNT_ID = 'ea644c4a47a499ad4721449cbac587f4';
  const API_TOKEN = 'feda0b5504010de502b702700c9e403680105';
  
  console.log('🧪 Testing Cloudflare Images API directly...\n');
  
  // Create a test image (1x1 pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');
  
  const formData = new FormData();
  formData.append('file', testImageBuffer, {
    filename: 'test.png',
    contentType: 'image/png'
  });
  
  try {
    console.log('📤 Uploading test image to Cloudflare...');
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          // NO Content-Type header!
        },
        body: formData
      }
    );
    
    const responseText = await response.text();
    console.log('\n📨 Response Status:', response.status);
    console.log('📨 Response Headers:', response.headers.raw());
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\n📨 Response Body:', JSON.stringify(responseJson, null, 2));
      
      if (responseJson.success) {
        console.log('\n✅ SUCCESS! Image uploaded successfully!');
        console.log('🖼️  Image ID:', responseJson.result.id);
        console.log('🌐 Image URL:', `https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/${responseJson.result.id}/public`);
      } else {
        console.log('\n❌ API returned error:', responseJson.errors);
      }
    } catch (e) {
      console.log('\n❌ Response is not JSON:', responseText);
    }
    
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testCloudflareUpload();