// SMS Service for sending pickup notifications
// This is a placeholder implementation that can be easily replaced with Twilio or other SMS providers

export interface SMSMessage {
  to: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Mock SMS service - replace with actual implementation
export const sendSMS = async (smsData: SMSMessage): Promise<SMSResponse> => {
  try {
    // For development/testing - just log the message
    console.log(`📱 SMS to ${smsData.to}: ${smsData.message}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return success response
    return {
      success: true,
      messageId: `msg_${Date.now()}`
    };
    
    // TODO: Replace with actual SMS service implementation
    // Example Twilio implementation:
    /*
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData)
    });
    
    if (!response.ok) {
      throw new Error(`SMS API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      messageId: result.sid
    };
    */
    
  } catch (error) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to format pickup notification message
export const formatPickupMessage = (customerName: string, ticketNumber: string, physicalTicketNumber?: string, location?: string): string => {
  const physicalRef = physicalTicketNumber ? ` (Physical: ${physicalTicketNumber})` : '';
  const locationText = location ? ` at ${location}` : '';
  
  return `Hi ${customerName}! Your alterations are ready for pickup${locationText}. Ticket #${ticketNumber}${physicalRef}. Please bring your receipt. Thank you! - KCT Menswear`;
}; 