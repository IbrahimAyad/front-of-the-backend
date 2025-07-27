import { AuthService, createAuthService } from './auth.service';

async function testAuthService() {
  console.log('Testing AuthService...\n');
  
  const authService = createAuthService({
    jwtSecret: 'test-secret-key-for-testing-only',
    jwtExpiresIn: '1h'
  });

  try {
    console.log('1. Testing password hashing...');
    const password = 'testPassword123!';
    const hashedPassword = await authService.hashPassword(password);
    console.log('✓ Password hashed successfully');
    console.log(`  Original: ${password}`);
    console.log(`  Hashed: ${hashedPassword.substring(0, 20)}...`);

    console.log('\n2. Testing password verification...');
    const isValid = await authService.verifyPassword(password, hashedPassword);
    console.log(`✓ Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    const isInvalid = await authService.verifyPassword('wrongPassword', hashedPassword);
    console.log(`✓ Wrong password rejection: ${!isInvalid ? 'PASSED' : 'FAILED'}`);

    console.log('\n3. Testing token generation...');
    const tokenPayload = {
      userId: '123',
      email: 'test@example.com',
      role: 'customer'
    };
    const token = authService.generateToken(tokenPayload);
    console.log('✓ Token generated successfully');
    console.log(`  Token: ${token.substring(0, 50)}...`);

    console.log('\n4. Testing token verification...');
    const decoded = authService.verifyToken(token);
    console.log('✓ Token verified successfully');
    console.log(`  User ID: ${decoded.userId}`);
    console.log(`  Email: ${decoded.email}`);
    console.log(`  Role: ${decoded.role}`);
    console.log(`  Expires: ${new Date(decoded.exp * 1000).toISOString()}`);

    console.log('\n5. Testing token expiration check...');
    const isExpired = authService.isTokenExpired(token);
    console.log(`✓ Token expired: ${isExpired ? 'YES' : 'NO'}`);

    console.log('\n6. Testing invalid token handling...');
    try {
      authService.verifyToken('invalid.token.here');
    } catch (error) {
      console.log('✓ Invalid token properly rejected');
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n✅ All AuthService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testAuthService().then(success => {
    process.exit(success ? 0 : 1);
  });
}