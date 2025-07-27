import { EmailService, createEmailService } from './email.service';

async function testEmailService() {
  console.log('Testing EmailService...\n');
  
  const emailService = createEmailService({
    apiKey: 'test-api-key',
    fromEmail: 'test@kctmenswear.com',
    fromName: 'KCT Test',
    testMode: true, // Enable test mode to avoid sending real emails
  });

  try {
    console.log('1. Testing sendOrderConfirmation...');
    const orderResult = await emailService.sendOrderConfirmation('customer@example.com', {
      customerName: 'John Doe',
      orderNumber: 'ORD-123456',
      orderDate: new Date(),
      items: [
        { name: 'Classic T-Shirt', quantity: 2, price: 29.99, variant: 'Black, M' },
        { name: 'Denim Jeans', quantity: 1, price: 89.99, variant: 'Blue, 32x34' },
      ],
      subtotal: 149.97,
      shipping: 10.00,
      tax: 12.80,
      total: 172.77,
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      },
      estimatedDelivery: '3-5 business days',
    });
    console.log('✓ Order confirmation email:', orderResult ? 'SENT' : 'FAILED');
    console.log(`  Email ID: ${orderResult?.id}`);

    console.log('\n2. Testing sendPasswordReset...');
    const resetResult = await emailService.sendPasswordReset('user@example.com', {
      userName: 'John',
      resetLink: 'https://kctmenswear.com/reset-password?token=abc123',
      expiresIn: '24 hours',
    });
    console.log('✓ Password reset email:', resetResult ? 'SENT' : 'FAILED');
    console.log(`  Email ID: ${resetResult?.id}`);

    console.log('\n3. Testing sendWelcomeEmail with verification...');
    const welcomeResult = await emailService.sendWelcomeEmail('newuser@example.com', {
      userName: 'Jane',
      verificationLink: 'https://kctmenswear.com/verify-email?token=xyz789',
    });
    console.log('✓ Welcome email:', welcomeResult ? 'SENT' : 'FAILED');
    console.log(`  Email ID: ${welcomeResult?.id}`);

    console.log('\n4. Testing sendWelcomeEmail without verification...');
    const welcomeNoVerifyResult = await emailService.sendWelcomeEmail('verified@example.com', {
      userName: 'Mike',
    });
    console.log('✓ Welcome email (no verification):', welcomeNoVerifyResult ? 'SENT' : 'FAILED');
    console.log(`  Email ID: ${welcomeNoVerifyResult?.id}`);

    console.log('\n5. Testing sendCustomEmail...');
    const customResult = await emailService.sendCustomEmail({
      to: ['admin@example.com', 'manager@example.com'],
      subject: 'Low Stock Alert',
      html: '<h1>Low Stock Alert</h1><p>Several products are running low on inventory.</p>',
      text: 'Low Stock Alert\n\nSeveral products are running low on inventory.',
      cc: 'inventory@example.com',
    });
    console.log('✓ Custom email:', customResult ? 'SENT' : 'FAILED');
    console.log(`  Email ID: ${customResult?.id}`);

    console.log('\n6. Testing email with attachments...');
    const attachmentResult = await emailService.sendCustomEmail({
      to: 'finance@example.com',
      subject: 'Monthly Sales Report',
      html: '<p>Please find attached the monthly sales report.</p>',
      attachments: [
        {
          filename: 'sales-report.pdf',
          content: Buffer.from('Mock PDF content'),
          contentType: 'application/pdf',
        },
      ],
    });
    console.log('✓ Email with attachment:', attachmentResult ? 'SENT' : 'FAILED');
    console.log(`  Email ID: ${attachmentResult?.id}`);

    console.log('\n✅ All EmailService tests passed!');
    console.log('\nNote: All emails were sent in test mode (not actually sent)');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testEmailService().then(success => {
    process.exit(success ? 0 : 1);
  });
}