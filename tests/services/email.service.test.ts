import { describe, it, expect, beforeEach, vi } from 'vitest'
import nodemailer from 'nodemailer'
import { EmailService } from '../../lib/services/email.service'

// Mock nodemailer
vi.mock('nodemailer')

describe('EmailService', () => {
  let emailService: EmailService
  let mockTransporter: any

  beforeEach(() => {
    // Setup mock transporter
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    }

    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter)

    // Set environment variables
    process.env.SMTP_HOST = 'smtp.test.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASS = 'test-password'
    process.env.EMAIL_FROM = 'noreply@example.com'

    emailService = new EmailService()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
      })
    })

    it('should use secure connection for port 465', () => {
      process.env.SMTP_PORT = '465'
      new EmailService()

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        })
      )
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const to = 'newuser@example.com'
      const name = 'New User'

      await emailService.sendWelcomeEmail(to, name)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to,
        subject: 'Welcome to Our Platform!',
        html: expect.stringContaining(`Hello ${name}`),
        text: expect.stringContaining(`Hello ${name}`),
      })
    })

    it('should handle send errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'))

      // Should not throw
      await expect(
        emailService.sendWelcomeEmail('user@example.com', 'User')
      ).resolves.toBeUndefined()
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const to = 'user@example.com'
      const resetToken = 'reset-token-123'

      await emailService.sendPasswordResetEmail(to, resetToken)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to,
        subject: 'Password Reset Request',
        html: expect.stringContaining(resetToken),
        text: expect.stringContaining(resetToken),
      })
    })

    it('should include reset link in email', async () => {
      const to = 'user@example.com'
      const resetToken = 'reset-token-123'

      await emailService.sendPasswordResetEmail(to, resetToken)

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0]
      expect(sendMailCall.html).toContain(`/reset-password?token=${resetToken}`)
      expect(sendMailCall.text).toContain(`/reset-password?token=${resetToken}`)
    })
  })

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email successfully', async () => {
      const to = 'customer@example.com'
      const orderId = 'order-123'
      const orderDetails = {
        items: [
          { name: 'Product 1', quantity: 2, price: 29.99 },
          { name: 'Product 2', quantity: 1, price: 49.99 },
        ],
        total: 109.97,
        shippingAddress: '123 Main St, City, State 12345',
      }

      await emailService.sendOrderConfirmationEmail(to, orderId, orderDetails)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to,
        subject: `Order Confirmation - ${orderId}`,
        html: expect.stringContaining(orderId),
        text: expect.stringContaining(orderId),
      })

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0]
      expect(sendMailCall.html).toContain('Product 1')
      expect(sendMailCall.html).toContain('Product 2')
      expect(sendMailCall.html).toContain('$109.97')
      expect(sendMailCall.text).toContain('Total: $109.97')
    })
  })

  describe('sendEmail', () => {
    it('should send generic email successfully', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
      }

      await emailService.sendEmail(options)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        ...options,
      })
    })

    it('should allow custom from address', async () => {
      const options = {
        from: 'custom@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
      }

      await emailService.sendEmail(options)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(options)
    })

    it('should support CC and BCC', async () => {
      const options = {
        to: 'recipient@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Email',
        text: 'Test content',
      }

      await emailService.sendEmail(options)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        ...options,
      })
    })

    it('should support attachments', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email with Attachment',
        text: 'See attached file',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('PDF content'),
          },
        ],
      }

      await emailService.sendEmail(options)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        ...options,
      })
    })
  })

  describe('verifyConnection', () => {
    it('should verify SMTP connection successfully', async () => {
      const result = await emailService.verifyConnection()

      expect(mockTransporter.verify).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false on connection error', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'))

      const result = await emailService.verifyConnection()

      expect(result).toBe(false)
    })
  })

  describe('sendBulkEmails', () => {
    it('should send multiple emails successfully', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Newsletter',
          text: 'Newsletter content',
        },
        {
          to: 'user2@example.com',
          subject: 'Newsletter',
          text: 'Newsletter content',
        },
      ]

      await emailService.sendBulkEmails(emails)

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2)
      expect(mockTransporter.sendMail).toHaveBeenNthCalledWith(1, {
        from: 'noreply@example.com',
        ...emails[0],
      })
      expect(mockTransporter.sendMail).toHaveBeenNthCalledWith(2, {
        from: 'noreply@example.com',
        ...emails[1],
      })
    })

    it('should continue sending if one email fails', async () => {
      const emails = [
        { to: 'user1@example.com', subject: 'Test', text: 'Content' },
        { to: 'user2@example.com', subject: 'Test', text: 'Content' },
        { to: 'user3@example.com', subject: 'Test', text: 'Content' },
      ]

      // Make second email fail
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'id1' })
        .mockRejectedValueOnce(new Error('Send failed'))
        .mockResolvedValueOnce({ messageId: 'id3' })

      await emailService.sendBulkEmails(emails)

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3)
    })
  })

  describe('Email templates', () => {
    it('should generate valid HTML for welcome email', async () => {
      await emailService.sendWelcomeEmail('user@example.com', 'John Doe')

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0]
      expect(sendMailCall.html).toContain('<!DOCTYPE html>')
      expect(sendMailCall.html).toContain('<html>')
      expect(sendMailCall.html).toContain('</html>')
      expect(sendMailCall.html).toContain('John Doe')
    })

    it('should generate valid HTML for password reset email', async () => {
      await emailService.sendPasswordResetEmail('user@example.com', 'token123')

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0]
      expect(sendMailCall.html).toContain('<!DOCTYPE html>')
      expect(sendMailCall.html).toContain('Password Reset')
      expect(sendMailCall.html).toContain('token123')
    })

    it('should include both HTML and text versions', async () => {
      await emailService.sendWelcomeEmail('user@example.com', 'User')

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0]
      expect(sendMailCall.html).toBeDefined()
      expect(sendMailCall.text).toBeDefined()
      expect(sendMailCall.html).not.toEqual(sendMailCall.text)
    })
  })
})