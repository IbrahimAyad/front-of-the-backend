import { EmailService } from './email.service';

export interface NotificationServiceDependencies {
  email: EmailService;
  sms?: {
    send: (to: string, message: string) => Promise<boolean>;
  };
  push?: {
    send: (userId: string, title: string, body: string, data?: any) => Promise<boolean>;
  };
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  lowStock: boolean;
  priceAlerts: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
}

export enum NotificationType {
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  LOW_STOCK = 'low_stock',
  PRICE_ALERT = 'price_alert',
  PROMOTION = 'promotion',
  ACCOUNT_UPDATE = 'account_update',
  SECURITY_ALERT = 'security_alert',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

export interface NotificationTemplate {
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
}

export interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  data?: any;
  channels?: NotificationChannel[];
  immediate?: boolean;
  scheduleAt?: Date;
}

export class NotificationService {
  private readonly email: EmailService;
  private readonly sms?: NotificationServiceDependencies['sms'];
  private readonly push?: NotificationServiceDependencies['push'];
  private readonly notifications: Map<string, Notification> = new Map();
  private readonly templates: Map<string, NotificationTemplate> = new Map();

  constructor(dependencies: NotificationServiceDependencies) {
    this.email = dependencies.email;
    this.sms = dependencies.sms;
    this.push = dependencies.push;
    this.initializeTemplates();
  }

  async sendNotification(options: SendNotificationOptions): Promise<Notification> {
    const notification: Notification = {
      id: this.generateId(),
      userId: options.userId,
      type: options.type,
      title: this.getNotificationTitle(options.type),
      message: this.getNotificationMessage(options.type, options.data),
      data: options.data,
      channels: options.channels || [NotificationChannel.EMAIL],
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
    };

    this.notifications.set(notification.id, notification);

    if (options.immediate !== false) {
      await this.processNotification(notification);
    } else if (options.scheduleAt) {
      this.scheduleNotification(notification, options.scheduleAt);
    }

    return notification;
  }

  async sendOrderConfirmation(userId: string, orderData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.ORDER_CONFIRMATION,
      data: orderData,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
    });
  }

  async sendOrderShipped(userId: string, orderData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.ORDER_SHIPPED,
      data: orderData,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
    });
  }

  async sendOrderDelivered(userId: string, orderData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.ORDER_DELIVERED,
      data: orderData,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
    });
  }

  async sendPaymentConfirmation(userId: string, paymentData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      data: paymentData,
      channels: [NotificationChannel.EMAIL],
    });
  }

  async sendPaymentFailure(userId: string, paymentData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.PAYMENT_FAILED,
      data: paymentData,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
    });
  }

  async sendLowStockAlert(adminUserIds: string[], productData: any): Promise<Notification[]> {
    const notifications: Notification[] = [];
    
    for (const userId of adminUserIds) {
      const notification = await this.sendNotification({
        userId,
        type: NotificationType.LOW_STOCK,
        data: productData,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      });
      notifications.push(notification);
    }

    return notifications;
  }

  async sendPriceAlert(userId: string, productData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.PRICE_ALERT,
      data: productData,
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
    });
  }

  async sendPromotion(userIds: string[], promotionData: any): Promise<Notification[]> {
    const notifications: Notification[] = [];
    
    for (const userId of userIds) {
      const notification = await this.sendNotification({
        userId,
        type: NotificationType.PROMOTION,
        data: promotionData,
        channels: [NotificationChannel.EMAIL],
      });
      notifications.push(notification);
    }

    return notifications;
  }

  async sendSecurityAlert(userId: string, securityData: any): Promise<Notification> {
    return this.sendNotification({
      userId,
      type: NotificationType.SECURITY_ALERT,
      data: securityData,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
      immediate: true,
    });
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return false;
    }

    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;
    this.notifications.set(notificationId, notification);
    
    return true;
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.readAt)
      .length;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    return this.notifications.delete(notificationId);
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    // In a real implementation, this would persist to database
    const defaultPreferences: NotificationPreferences = {
      email: true,
      sms: false,
      push: true,
      orderUpdates: true,
      promotions: true,
      lowStock: false,
      priceAlerts: true,
    };

    return { ...defaultPreferences, ...preferences };
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // In a real implementation, this would fetch from database
    return {
      email: true,
      sms: false,
      push: true,
      orderUpdates: true,
      promotions: true,
      lowStock: false,
      priceAlerts: true,
    };
  }

  private async processNotification(notification: Notification): Promise<void> {
    const preferences = await this.getNotificationPreferences(notification.userId);
    
    for (const channel of notification.channels) {
      try {
        let success = false;

        switch (channel) {
          case NotificationChannel.EMAIL:
            if (preferences.email) {
              success = await this.sendEmail(notification);
            }
            break;
          case NotificationChannel.SMS:
            if (preferences.sms && this.sms) {
              success = await this.sendSMS(notification);
            }
            break;
          case NotificationChannel.PUSH:
            if (preferences.push && this.push) {
              success = await this.sendPush(notification);
            }
            break;
          case NotificationChannel.IN_APP:
            success = true; // In-app notifications are stored locally
            break;
        }

        if (success) {
          notification.status = NotificationStatus.SENT;
          notification.sentAt = new Date();
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
        notification.status = NotificationStatus.FAILED;
      }
    }

    this.notifications.set(notification.id, notification);
  }

  private async sendEmail(notification: Notification): Promise<boolean> {
    try {
      const template = this.getTemplate(notification.type, NotificationChannel.EMAIL);
      if (!template) {
        throw new Error(`No email template found for ${notification.type}`);
      }

      const emailContent = this.renderTemplate(template, notification.data);
      
      await this.email.sendEmail({
        to: notification.data?.email || '',
        subject: notification.title,
        html: emailContent,
      });

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  private async sendSMS(notification: Notification): Promise<boolean> {
    if (!this.sms) {
      return false;
    }

    try {
      const phoneNumber = notification.data?.phoneNumber || '';
      return await this.sms.send(phoneNumber, notification.message);
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      return false;
    }
  }

  private async sendPush(notification: Notification): Promise<boolean> {
    if (!this.push) {
      return false;
    }

    try {
      return await this.push.send(
        notification.userId,
        notification.title,
        notification.message,
        notification.data
      );
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  private scheduleNotification(notification: Notification, scheduleAt: Date): void {
    const delay = scheduleAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.processNotification(notification);
      }, delay);
    }
  }

  private getTemplate(type: NotificationType, channel: NotificationChannel): NotificationTemplate | undefined {
    const key = `${type}_${channel}`;
    return this.templates.get(key);
  }

  private renderTemplate(template: NotificationTemplate, data: any): string {
    let content = template.template;
    
    if (data) {
      template.variables.forEach(variable => {
        const value = data[variable] || '';
        content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });
    }

    return content;
  }

  private getNotificationTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.ORDER_CONFIRMATION]: 'Order Confirmed',
      [NotificationType.ORDER_SHIPPED]: 'Order Shipped',
      [NotificationType.ORDER_DELIVERED]: 'Order Delivered',
      [NotificationType.ORDER_CANCELLED]: 'Order Cancelled',
      [NotificationType.PAYMENT_SUCCESS]: 'Payment Successful',
      [NotificationType.PAYMENT_FAILED]: 'Payment Failed',
      [NotificationType.LOW_STOCK]: 'Low Stock Alert',
      [NotificationType.PRICE_ALERT]: 'Price Alert',
      [NotificationType.PROMOTION]: 'Special Offer',
      [NotificationType.ACCOUNT_UPDATE]: 'Account Update',
      [NotificationType.SECURITY_ALERT]: 'Security Alert',
    };

    return titles[type] || 'Notification';
  }

  private getNotificationMessage(type: NotificationType, data?: any): string {
    const messages: Record<NotificationType, string> = {
      [NotificationType.ORDER_CONFIRMATION]: `Your order #${data?.orderNumber || 'N/A'} has been confirmed.`,
      [NotificationType.ORDER_SHIPPED]: `Your order #${data?.orderNumber || 'N/A'} has been shipped.`,
      [NotificationType.ORDER_DELIVERED]: `Your order #${data?.orderNumber || 'N/A'} has been delivered.`,
      [NotificationType.ORDER_CANCELLED]: `Your order #${data?.orderNumber || 'N/A'} has been cancelled.`,
      [NotificationType.PAYMENT_SUCCESS]: `Payment of $${data?.amount || '0.00'} was successful.`,
      [NotificationType.PAYMENT_FAILED]: `Payment of $${data?.amount || '0.00'} failed.`,
      [NotificationType.LOW_STOCK]: `${data?.productName || 'Product'} is running low on stock.`,
      [NotificationType.PRICE_ALERT]: `${data?.productName || 'Product'} price has changed.`,
      [NotificationType.PROMOTION]: `Check out our latest promotion!`,
      [NotificationType.ACCOUNT_UPDATE]: `Your account has been updated.`,
      [NotificationType.SECURITY_ALERT]: `Security alert for your account.`,
    };

    return messages[type] || 'You have a new notification.';
  }

  private initializeTemplates(): void {
    // Order confirmation email template
    this.templates.set(`${NotificationType.ORDER_CONFIRMATION}_${NotificationChannel.EMAIL}`, {
      type: NotificationType.ORDER_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      subject: 'Order Confirmation - #{{orderNumber}}',
      template: `
        <h2>Thank you for your order!</h2>
        <p>Your order #{{orderNumber}} has been confirmed and is being processed.</p>
        <p><strong>Order Total:</strong> ${{total}}</p>
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        <p>You can track your order at any time by visiting your account.</p>
      `,
      variables: ['orderNumber', 'total', 'estimatedDelivery'],
    });

    // Order shipped email template
    this.templates.set(`${NotificationType.ORDER_SHIPPED}_${NotificationChannel.EMAIL}`, {
      type: NotificationType.ORDER_SHIPPED,
      channel: NotificationChannel.EMAIL,
      subject: 'Your Order Has Shipped - #{{orderNumber}}',
      template: `
        <h2>Your order is on its way!</h2>
        <p>Your order #{{orderNumber}} has been shipped.</p>
        <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
        <p><strong>Carrier:</strong> {{carrier}}</p>
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
      `,
      variables: ['orderNumber', 'trackingNumber', 'carrier', 'estimatedDelivery'],
    });

    // Low stock alert email template
    this.templates.set(`${NotificationType.LOW_STOCK}_${NotificationChannel.EMAIL}`, {
      type: NotificationType.LOW_STOCK,
      channel: NotificationChannel.EMAIL,
      subject: 'Low Stock Alert - {{productName}}',
      template: `
        <h2>Low Stock Alert</h2>
        <p>The product <strong>{{productName}}</strong> is running low on stock.</p>
        <p><strong>Current Stock:</strong> {{currentStock}} units</p>
        <p><strong>Threshold:</strong> {{threshold}} units</p>
        <p>Please consider restocking this item.</p>
      `,
      variables: ['productName', 'currentStock', 'threshold'],
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export function createNotificationService(dependencies: NotificationServiceDependencies): NotificationService {
  return new NotificationService(dependencies);
}