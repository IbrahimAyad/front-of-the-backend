/**
 * Payment error handling utilities
 */

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'rate_limit_error' | 'authentication_error';
  param?: string;
  decline_code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Standardize payment errors from different sources
 */
export function normalizePaymentError(error: any): PaymentError {
  // Stripe error
  if (error.type && error.code) {
    return {
      code: error.code,
      message: getStripeErrorMessage(error),
      type: error.type,
      param: error.param,
      decline_code: error.decline_code,
    };
  }

  // API error
  if (error.status) {
    return {
      code: `http_${error.status}`,
      message: getHttpErrorMessage(error.status),
      type: 'api_error',
    };
  }

  // Generic error
  return {
    code: 'unknown_error',
    message: error.message || 'An unexpected error occurred',
    type: 'api_error',
  };
}

/**
 * Get user-friendly error messages for Stripe errors
 */
export function getStripeErrorMessage(error: any): string {
  const { code, decline_code } = error;

  // Card decline reasons
  if (decline_code) {
    switch (decline_code) {
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'lost_card':
      case 'stolen_card':
        return 'Your card has been reported as lost or stolen. Please contact your bank.';
      case 'expired_card':
        return 'Your card has expired. Please try a different payment method.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect. Please check and try again.';
      case 'processing_error':
        return 'We encountered an error processing your card. Please try again.';
      case 'issuer_not_available':
        return 'Your card issuer is unavailable. Please try again later.';
      case 'try_again_later':
        return 'Please try again later.';
      default:
        return 'Your card was declined. Please try a different payment method.';
    }
  }

  // General error codes
  switch (code) {
    case 'card_declined':
      return 'Your card was declined. Please try a different payment method.';
    case 'expired_card':
      return 'Your card has expired. Please try a different payment method.';
    case 'incorrect_cvc':
      return 'Your card\'s security code is incorrect.';
    case 'incorrect_number':
      return 'Your card number is incorrect.';
    case 'invalid_expiry_month':
      return 'Your card\'s expiration month is invalid.';
    case 'invalid_expiry_year':
      return 'Your card\'s expiration year is invalid.';
    case 'invalid_cvc':
      return 'Your card\'s security code is invalid.';
    case 'processing_error':
      return 'An error occurred while processing your card. Please try again.';
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    case 'authentication_required':
      return 'Authentication required. Please complete the verification process.';
    case 'amount_too_large':
      return 'The payment amount is too large.';
    case 'amount_too_small':
      return 'The payment amount is too small.';
    case 'api_key_expired':
      return 'Service temporarily unavailable. Please try again later.';
    case 'balance_insufficient':
      return 'Insufficient funds available.';
    case 'charge_already_captured':
      return 'This payment has already been processed.';
    case 'charge_already_refunded':
      return 'This payment has already been refunded.';
    case 'charge_disputed':
      return 'This payment has been disputed.';
    case 'email_invalid':
      return 'The email address is invalid.';
    case 'payment_intent_authentication_failure':
      return 'Payment authentication failed. Please try again.';
    case 'payment_method_unactivated':
      return 'Your payment method is not activated. Please contact your bank.';
    case 'setup_attempt_failed':
      return 'Failed to set up payment method. Please try again.';
    default:
      return error.message || 'Payment processing failed. Please try again.';
  }
}

/**
 * Get user-friendly error messages for HTTP errors
 */
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your information and try again.';
    case 401:
      return 'Authentication required. Please sign in and try again.';
    case 403:
      return 'Access denied. Please contact support if this continues.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict detected. Please refresh and try again.';
    case 422:
      return 'Invalid data provided. Please check your information.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Validate form data and return validation errors
 */
export function validateCheckoutForm(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Email validation
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  }

  // Name validation
  if (!data.firstName?.trim()) {
    errors.push({
      field: 'firstName',
      message: 'First name is required',
    });
  }

  if (!data.lastName?.trim()) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required',
    });
  }

  // Address validation
  if (!data.address1?.trim()) {
    errors.push({
      field: 'address1',
      message: 'Address is required',
    });
  }

  if (!data.city?.trim()) {
    errors.push({
      field: 'city',
      message: 'City is required',
    });
  }

  if (!data.state?.trim()) {
    errors.push({
      field: 'state',
      message: 'State is required',
    });
  }

  if (!data.postalCode?.trim()) {
    errors.push({
      field: 'postalCode',
      message: 'Postal code is required',
    });
  }

  if (!data.country?.trim()) {
    errors.push({
      field: 'country',
      message: 'Country is required',
    });
  }

  // Phone validation
  if (!data.phone?.trim()) {
    errors.push({
      field: 'phone',
      message: 'Phone number is required',
    });
  } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push({
      field: 'phone',
      message: 'Please enter a valid phone number',
    });
  }

  return errors;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: PaymentError): boolean {
  const retryableCodes = [
    'processing_error',
    'rate_limit',
    'issuer_not_available',
    'try_again_later',
    'api_connection_error',
    'api_error',
  ];

  return retryableCodes.includes(error.code) || 
         (error.type === 'api_error' && error.code.startsWith('http_5'));
}

/**
 * Get retry delay based on error type
 */
export function getRetryDelay(error: PaymentError, attempt: number): number {
  if (error.code === 'rate_limit') {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
  }

  return Math.min(1000 * attempt, 5000); // Linear backoff, max 5s
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: PaymentError): string {
  // Remove technical details and make user-friendly
  let message = error.message;

  // Remove parameter information that might confuse users
  message = message.replace(/\s*\(.*?\)\s*/g, '');

  // Ensure proper capitalization
  message = message.charAt(0).toUpperCase() + message.slice(1);

  // Add period if missing
  if (!message.endsWith('.') && !message.endsWith('!') && !message.endsWith('?')) {
    message += '.';
  }

  return message;
}