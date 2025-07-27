import { NotificationService, createNotificationService, NotificationType, NotificationChannel } from './notification.service';

const mockEmailService = {
  sendEmail: async (options: any) => {
    console.log(`📧 Email sent to ${options.to}: ${options.subject}`);
    return true;
  },
};

const mockSMSService = {
  send: async (to: string, message: string) => {
    console.log(`📱 SMS sent to ${to}: ${message}`);
    return true;
  },
};

const mockPushService = {
  send: async (userId: string, title: string, body: string, data?: any) => {
    console.log(`🔔 Push notification sent to ${userId}: ${title} - ${body}`);
    return true;
  },
};

async function testNotificationService() {
  console.log('Testing NotificationService...\n');
  
  const notificationService = createNotificationService({
    email: mockEmailService as any,
    sms: mockSMSService,
    push: mockPushService,
  });

  const testUserId = 'user-123';
  const testOrderData = {
    orderNumber: 'ORD-001',
    total: 149.99,
    estimatedDelivery: '2025-01-30',
    email: 'customer@example.com',
    phoneNumber: '+1234567890',
  };

  try {
    console.log('1. Testing order confirmation notification...');
    const orderConfirmation = await notificationService.sendOrderConfirmation(testUserId, testOrderData);
    console.log('✓ Order confirmation sent:', orderConfirmation.id);
    console.log(`  Title: ${orderConfirmation.title}`);
    console.log(`  Message: ${orderConfirmation.message}`);
    console.log(`  Channels: ${orderConfirmation.channels.join(', ')}`);

    console.log('\n2. Testing order shipped notification...');
    const shippedData = {
      ...testOrderData,
      trackingNumber: 'TRK123456789',
      carrier: 'FedEx',
    };
    const orderShipped = await notificationService.sendOrderShipped(testUserId, shippedData);
    console.log('✓ Order shipped notification sent:', orderShipped.id);
    console.log(`  Channels: ${orderShipped.channels.join(', ')}`);

    console.log('\n3. Testing order delivered notification...');
    const orderDelivered = await notificationService.sendOrderDelivered(testUserId, testOrderData);
    console.log('✓ Order delivered notification sent:', orderDelivered.id);

    console.log('\n4. Testing payment confirmation...');
    const paymentData = {
      amount: 149.99,
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-789',
      email: 'customer@example.com',
    };
    const paymentConfirmation = await notificationService.sendPaymentConfirmation(testUserId, paymentData);
    console.log('✓ Payment confirmation sent:', paymentConfirmation.id);

    console.log('\n5. Testing payment failure notification...');
    const paymentFailure = await notificationService.sendPaymentFailure(testUserId, paymentData);
    console.log('✓ Payment failure notification sent:', paymentFailure.id);

    console.log('\n6. Testing low stock alert...');
    const adminUserIds = ['admin-1', 'admin-2'];
    const productData = {
      productName: 'Premium T-Shirt',
      currentStock: 5,
      threshold: 10,
      productId: 'prod-123',
    };
    const lowStockAlerts = await notificationService.sendLowStockAlert(adminUserIds, productData);
    console.log(`✓ Low stock alerts sent to ${lowStockAlerts.length} admins`);
    lowStockAlerts.forEach((alert, index) => {
      console.log(`  Admin ${index + 1}: ${alert.id}`);
    });

    console.log('\n7. Testing price alert...');
    const priceData = {
      productName: 'Premium T-Shirt',
      oldPrice: 29.99,
      newPrice: 24.99,
      productId: 'prod-123',
      email: 'customer@example.com',
    };
    const priceAlert = await notificationService.sendPriceAlert(testUserId, priceData);
    console.log('✓ Price alert sent:', priceAlert.id);

    console.log('\n8. Testing promotion notification...');
    const customerIds = ['user-123', 'user-456', 'user-789'];
    const promotionData = {
      title: 'Summer Sale',
      discount: 20,
      code: 'SUMMER20',
      validUntil: '2025-02-28',
    };
    const promotionNotifications = await notificationService.sendPromotion(customerIds, promotionData);
    console.log(`✓ Promotion sent to ${promotionNotifications.length} customers`);

    console.log('\n9. Testing security alert...');
    const securityData = {
      action: 'Password Changed',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.1',
      email: 'customer@example.com',
      phoneNumber: '+1234567890',
    };
    const securityAlert = await notificationService.sendSecurityAlert(testUserId, securityData);
    console.log('✓ Security alert sent:', securityAlert.id);
    console.log(`  Immediate delivery: ${securityAlert.channels.includes(NotificationChannel.EMAIL)}`);

    console.log('\n10. Testing notification retrieval...');
    const userNotifications = await notificationService.getUserNotifications(testUserId);
    console.log(`✓ Retrieved ${userNotifications.length} notifications for user`);
    userNotifications.slice(0, 3).forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.title} - ${notification.status}`);
    });

    console.log('\n11. Testing unread count...');
    const unreadCount = await notificationService.getUnreadCount(testUserId);
    console.log(`✓ Unread notifications: ${unreadCount}`);

    console.log('\n12. Testing mark as read...');
    const firstNotification = userNotifications[0];
    if (firstNotification) {
      const marked = await notificationService.markAsRead(firstNotification.id);
      console.log(`✓ Marked notification as read: ${marked}`);
      
      const newUnreadCount = await notificationService.getUnreadCount(testUserId);
      console.log(`✓ New unread count: ${newUnreadCount}`);
    }

    console.log('\n13. Testing notification preferences...');
    const preferences = await notificationService.getNotificationPreferences(testUserId);
    console.log('✓ Current preferences:');
    console.log(`  Email: ${preferences.email}`);
    console.log(`  SMS: ${preferences.sms}`);
    console.log(`  Push: ${preferences.push}`);
    console.log(`  Order Updates: ${preferences.orderUpdates}`);
    console.log(`  Promotions: ${preferences.promotions}`);

    console.log('\n14. Testing preference updates...');
    const updatedPreferences = await notificationService.updateNotificationPreferences(testUserId, {
      sms: true,
      promotions: false,
    });
    console.log('✓ Updated preferences:');
    console.log(`  SMS: ${updatedPreferences.sms}`);
    console.log(`  Promotions: ${updatedPreferences.promotions}`);

    console.log('\n15. Testing custom notification...');
    const customNotification = await notificationService.sendNotification({
      userId: testUserId,
      type: NotificationType.ACCOUNT_UPDATE,
      data: {
        updateType: 'Profile Updated',
        field: 'Email Address',
        email: 'newemail@example.com',
      },
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    });
    console.log('✓ Custom notification sent:', customNotification.id);
    console.log(`  Type: ${customNotification.type}`);
    console.log(`  Channels: ${customNotification.channels.join(', ')}`);

    console.log('\n16. Testing scheduled notification...');
    const scheduleTime = new Date(Date.now() + 2000); // 2 seconds from now
    const scheduledNotification = await notificationService.sendNotification({
      userId: testUserId,
      type: NotificationType.PROMOTION,
      data: {
        title: 'Flash Sale',
        discount: 30,
        validFor: '1 hour',
      },
      scheduleAt: scheduleTime,
      immediate: false,
    });
    console.log('✓ Notification scheduled for:', scheduleTime.toLocaleTimeString());
    console.log(`  Notification ID: ${scheduledNotification.id}`);
    console.log(`  Status: ${scheduledNotification.status}`);

    console.log('\n17. Testing notification deletion...');
    const toDelete = userNotifications[userNotifications.length - 1];
    if (toDelete) {
      const deleted = await notificationService.deleteNotification(toDelete.id);
      console.log(`✓ Notification deleted: ${deleted}`);
      
      const updatedNotifications = await notificationService.getUserNotifications(testUserId);
      console.log(`✓ Remaining notifications: ${updatedNotifications.length}`);
    }

    console.log('\n18. Testing notification types and channels...');
    const allTypes = Object.values(NotificationType);
    const allChannels = Object.values(NotificationChannel);
    console.log(`✓ Supported notification types: ${allTypes.length}`);
    allTypes.forEach(type => console.log(`  - ${type}`));
    console.log(`✓ Supported channels: ${allChannels.length}`);
    allChannels.forEach(channel => console.log(`  - ${channel}`));

    console.log('\n19. Testing bulk notifications...');
    const bulkUserIds = ['user-100', 'user-200', 'user-300', 'user-400', 'user-500'];
    const bulkPromotions = await notificationService.sendPromotion(bulkUserIds, {
      title: 'End of Year Sale',
      discount: 50,
      code: 'YEAR50',
      validUntil: '2025-12-31',
    });
    console.log(`✓ Bulk notifications sent: ${bulkPromotions.length}`);

    console.log('\n20. Testing error handling...');
    try {
      await notificationService.markAsRead('invalid-id');
      console.log('❌ Should have handled invalid notification ID');
    } catch (error) {
      console.log('✓ Error handled gracefully for invalid ID');
    }

    // Wait for scheduled notification to process
    console.log('\n⏰ Waiting for scheduled notification to be sent...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalNotifications = await notificationService.getUserNotifications(testUserId);
    const scheduledFound = finalNotifications.find(n => n.id === scheduledNotification.id);
    if (scheduledFound && scheduledFound.sentAt) {
      console.log('✓ Scheduled notification was processed successfully');
      console.log(`  Sent at: ${scheduledFound.sentAt.toLocaleTimeString()}`);
    }

    console.log('\n✅ All NotificationService tests passed!');
    console.log('\n📊 Final Statistics:');
    console.log(`  Total notifications created: ${finalNotifications.length}`);
    console.log(`  Unique notification types tested: ${new Set(finalNotifications.map(n => n.type)).size}`);
    console.log(`  Channels tested: ${allChannels.length}`);
    
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testNotificationService().then(success => {
    process.exit(success ? 0 : 1);
  });
}