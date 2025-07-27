import { Resend } from 'resend';

export interface EmailServiceConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  testMode?: boolean;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  orderDate: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    variant?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
}

export interface PasswordResetData {
  userName: string;
  resetLink: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  userName: string;
  verificationLink?: string;
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;
  private replyTo: string;
  private testMode: boolean;

  constructor(config: EmailServiceConfig) {
    this.resend = new Resend(config.apiKey);
    this.fromEmail = config.fromEmail || 'noreply@kctmenswear.com';
    this.fromName = config.fromName || 'KCT Menswear';
    this.replyTo = config.replyTo || this.fromEmail;
    this.testMode = config.testMode || false;
  }

  private async send(options: EmailOptions): Promise<{ id: string } | null> {
    try {
      if (this.testMode) {
        console.log('TEST MODE - Email would be sent:', {
          from: `${this.fromName} <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          replyTo: options.replyTo || this.replyTo,
        });
        return { id: 'test-' + Date.now() };
      }

      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        reply_to: options.replyTo || this.replyTo,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType,
        })),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<{ id: string } | null> {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.name}${item.variant ? ` (${item.variant})` : ''}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          $${(item.quantity * item.price).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">Order Confirmation</h1>
          
          <p>Dear ${data.customerName},</p>
          
          <p>Thank you for your order! We're excited to get your items to you.</p>
          
          <div style="background: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p><strong>Order Date:</strong> ${data.orderDate.toLocaleDateString()}</p>
            ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
          </div>
          
          <h2 style="color: #2c3e50;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f4f4f4;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right;">
            <p><strong>Subtotal:</strong> $${data.subtotal.toFixed(2)}</p>
            <p><strong>Shipping:</strong> $${data.shipping.toFixed(2)}</p>
            <p><strong>Tax:</strong> $${data.tax.toFixed(2)}</p>
            <hr style="border: 1px solid #eee;">
            <p style="font-size: 1.2em;"><strong>Total:</strong> $${data.total.toFixed(2)}</p>
          </div>
          
          <h2 style="color: #2c3e50;">Shipping Address</h2>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
            <p style="margin: 0;">${data.shippingAddress.street}</p>
            <p style="margin: 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}</p>
            <p style="margin: 0;">${data.shippingAddress.country}</p>
          </div>
          
          <p style="margin-top: 30px;">If you have any questions about your order, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The KCT Menswear Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Confirmation

Dear ${data.customerName},

Thank you for your order! We're excited to get your items to you.

Order Number: ${data.orderNumber}
Order Date: ${data.orderDate.toLocaleDateString()}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ''}

Order Details:
${data.items.map(item => `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity} - $${(item.quantity * item.price).toFixed(2)}`).join('\n')}

Subtotal: $${data.subtotal.toFixed(2)}
Shipping: $${data.shipping.toFixed(2)}
Tax: $${data.tax.toFixed(2)}
Total: $${data.total.toFixed(2)}

Shipping Address:
${data.shippingAddress.street}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

If you have any questions about your order, please don't hesitate to contact us.

Best regards,
The KCT Menswear Team
    `;

    return this.send({
      to,
      subject: `Order Confirmation - #${data.orderNumber}`,
      html,
      text,
    });
  }

  async sendPasswordReset(to: string, data: PasswordResetData): Promise<{ id: string } | null> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">Password Reset Request</h1>
          
          <p>Hi ${data.userName},</p>
          
          <p>We received a request to reset the password for your KCT Menswear account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${data.resetLink}</p>
          
          <p><strong>This link will expire in ${data.expiresIn}.</strong></p>
          
          <p>If you didn't request a password reset, you can ignore this email. Your password won't be changed.</p>
          
          <p>Best regards,<br>The KCT Menswear Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hi ${data.userName},

We received a request to reset the password for your KCT Menswear account.

Click the link below to reset your password:
${data.resetLink}

This link will expire in ${data.expiresIn}.

If you didn't request a password reset, you can ignore this email. Your password won't be changed.

Best regards,
The KCT Menswear Team
    `;

    return this.send({
      to,
      subject: 'Password Reset Request - KCT Menswear',
      html,
      text,
    });
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<{ id: string } | null> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to KCT Menswear</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">Welcome to KCT Menswear!</h1>
          
          <p>Hi ${data.userName},</p>
          
          <p>Thank you for creating an account with KCT Menswear. We're thrilled to have you as part of our community!</p>
          
          ${data.verificationLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationLink}" style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Your Email</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${data.verificationLink}</p>
          ` : ''}
          
          <h2 style="color: #2c3e50;">What's Next?</h2>
          <ul>
            <li>Browse our latest collection of premium menswear</li>
            <li>Add items to your wishlist for easy shopping later</li>
            <li>Enjoy exclusive member-only discounts and early access to sales</li>
            <li>Track your orders and manage your account preferences</li>
          </ul>
          
          <div style="background: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">New Customer Offer</h3>
            <p>As a welcome gift, enjoy 10% off your first order with code: <strong>WELCOME10</strong></p>
          </div>
          
          <p>If you have any questions or need assistance, our customer service team is here to help.</p>
          
          <p>Happy shopping!</p>
          
          <p>Best regards,<br>The KCT Menswear Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to KCT Menswear!

Hi ${data.userName},

Thank you for creating an account with KCT Menswear. We're thrilled to have you as part of our community!

${data.verificationLink ? `Please verify your email by clicking this link:
${data.verificationLink}` : ''}

What's Next?
- Browse our latest collection of premium menswear
- Add items to your wishlist for easy shopping later
- Enjoy exclusive member-only discounts and early access to sales
- Track your orders and manage your account preferences

New Customer Offer
As a welcome gift, enjoy 10% off your first order with code: WELCOME10

If you have any questions or need assistance, our customer service team is here to help.

Happy shopping!

Best regards,
The KCT Menswear Team
    `;

    return this.send({
      to,
      subject: 'Welcome to KCT Menswear',
      html,
      text,
    });
  }

  async sendCustomEmail(options: EmailOptions): Promise<{ id: string } | null> {
    return this.send(options);
  }
}

export function createEmailService(config: EmailServiceConfig): EmailService {
  return new EmailService(config);
}