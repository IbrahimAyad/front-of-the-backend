// Artillery processor for custom functions and data generation

module.exports = {
  authenticateAdmin,
  authenticateUser,
  generateTestData,
  logMetrics
};

// Authenticate as admin user
async function authenticateAdmin(context, events, done) {
  const axios = require('axios');
  
  try {
    const response = await axios.post(`${context.vars.target}/api/auth/login`, {
      email: context.vars.adminEmail,
      password: context.vars.adminPassword
    });

    if (response.status === 200) {
      context.vars.adminToken = response.data.token || response.data.accessToken;
      events.emit('counter', 'auth.admin.success', 1);
    } else {
      events.emit('counter', 'auth.admin.failure', 1);
    }
  } catch (error) {
    events.emit('counter', 'auth.admin.error', 1);
    console.error('Admin auth error:', error.message);
  }
  
  return done();
}

// Authenticate as regular user
async function authenticateUser(context, events, done) {
  const axios = require('axios');
  
  try {
    const response = await axios.post(`${context.vars.target}/api/auth/login`, {
      email: context.vars.userEmail,
      password: context.vars.userPassword
    });

    if (response.status === 200) {
      context.vars.userToken = response.data.token || response.data.accessToken;
      events.emit('counter', 'auth.user.success', 1);
    } else {
      events.emit('counter', 'auth.user.failure', 1);
    }
  } catch (error) {
    events.emit('counter', 'auth.user.error', 1);
    console.error('User auth error:', error.message);
  }
  
  return done();
}

// Generate test data for various scenarios
function generateTestData(context, events, done) {
  const timestamp = Date.now();
  
  // Generate random test data
  context.vars.testEmail = `test-${timestamp}@example.com`;
  context.vars.testName = `Test User ${timestamp}`;
  context.vars.testPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  
  // Product test data
  context.vars.testProductName = `Test Product ${timestamp}`;
  context.vars.testProductPrice = Math.floor(Math.random() * 500) + 100;
  context.vars.testSku = `TEST-${timestamp}`;
  
  // Search terms
  const searchTerms = ['wool', 'navy', 'italian', 'silk', 'cotton', 'black', 'grey'];
  context.vars.searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  // Categories
  const categories = ['Suits', 'Ties', 'Shirts', 'Accessories'];
  context.vars.category = categories[Math.floor(Math.random() * categories.length)];
  
  events.emit('counter', 'data.generated', 1);
  return done();
}

// Log performance metrics
function logMetrics(context, events, done) {
  const startTime = Date.now();
  
  context.vars.requestStart = startTime;
  
  // Custom metric tracking
  events.on('response', (data) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    events.emit('histogram', 'custom.response_time', duration);
    
    if (data.statusCode >= 400) {
      events.emit('counter', 'custom.errors', 1);
    } else {
      events.emit('counter', 'custom.success', 1);
    }
    
    // Track specific endpoint performance
    if (data.url.includes('/api/products')) {
      events.emit('histogram', 'products.response_time', duration);
    } else if (data.url.includes('/api/auth')) {
      events.emit('histogram', 'auth.response_time', duration);
    } else if (data.url.includes('/api/customers')) {
      events.emit('histogram', 'customers.response_time', duration);
    } else if (data.url.includes('/api/orders')) {
      events.emit('histogram', 'orders.response_time', duration);
    }
  });
  
  return done();
}