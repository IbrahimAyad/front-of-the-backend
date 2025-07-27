'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class CheckoutErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('Checkout Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            retry={this.handleRetry}
          />
        );
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">
          We encountered an error while processing your checkout. Please try again.
        </p>
        
        <Alert variant="destructive" className="mb-4 text-left">
          <AlertDescription>
            {error.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          If the problem persists, please contact support.
        </p>
      </Card>
    </div>
  );
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  React.useEffect(() => {
    if (error) {
      // Log error to monitoring service
      console.error('Async Error:', error);
    }
  }, [error]);

  return {
    error,
    handleError,
    resetError,
    hasError: !!error,
  };
}

// Payment-specific error handler
export function usePaymentErrorHandler() {
  const { error, handleError, resetError, hasError } = useErrorHandler();

  const handlePaymentError = React.useCallback((error: any) => {
    let message = 'Payment processing failed';

    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.code) {
      // Handle Stripe-specific error codes
      switch (error.code) {
        case 'card_declined':
          message = 'Your card was declined. Please try a different payment method.';
          break;
        case 'insufficient_funds':
          message = 'Insufficient funds. Please try a different payment method.';
          break;
        case 'expired_card':
          message = 'Your card has expired. Please try a different payment method.';
          break;
        case 'incorrect_cvc':
          message = 'Your card\'s security code is incorrect.';
          break;
        case 'processing_error':
          message = 'An error occurred while processing your card. Please try again.';
          break;
        case 'rate_limit':
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        default:
          message = 'Payment processing failed. Please try again.';
      }
    }

    handleError(new Error(message));
  }, [handleError]);

  return {
    error,
    handlePaymentError,
    resetError,
    hasError,
  };
}

// Network error handler
export function useNetworkErrorHandler() {
  const { error, handleError, resetError, hasError } = useErrorHandler();

  const handleNetworkError = React.useCallback((error: any) => {
    let message = 'Network error occurred';

    if (error instanceof TypeError && error.message.includes('fetch')) {
      message = 'Unable to connect to our servers. Please check your internet connection and try again.';
    } else if (error?.status) {
      switch (error.status) {
        case 400:
          message = 'Invalid request. Please check your information and try again.';
          break;
        case 401:
          message = 'Authentication required. Please sign in and try again.';
          break;
        case 403:
          message = 'Access denied. Please contact support if this continues.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        case 503:
          message = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          message = `Request failed with status ${error.status}`;
      }
    }

    handleError(new Error(message));
  }, [handleError]);

  return {
    error,
    handleNetworkError,
    resetError,
    hasError,
  };
}