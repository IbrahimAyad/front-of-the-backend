'use client';

import React, { useState } from 'react';
import { CreditCard, Wallet, Shield, Lock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PaymentMethodData {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  cardHolder?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  saveCard?: boolean;
}

interface PaymentMethodProps {
  onComplete: (data: PaymentMethodData) => void;
  savedCards?: Array<{
    id: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault?: boolean;
  }>;
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit or Debit Card',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Pay securely with your card',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Fast and secure checkout',
    badge: 'Popular',
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Pay with Touch ID or Face ID',
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Fast checkout with Google',
  },
];

export function PaymentMethod({ onComplete, savedCards = [] }: PaymentMethodProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [selectedCardId, setSelectedCardId] = useState<string>(
    savedCards.find(c => c.isDefault)?.id || 'new'
  );
  const [cardData, setCardData] = useState<Partial<PaymentMethodData>>({
    saveCard: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCard = () => {
    const newErrors: Record<string, string> = {};

    if (selectedMethod === 'card' && selectedCardId === 'new') {
      if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Invalid card number';
      }
      if (!cardData.cardHolder) {
        newErrors.cardHolder = 'Cardholder name is required';
      }
      if (!cardData.expiryMonth || !cardData.expiryYear) {
        newErrors.expiry = 'Expiry date is required';
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        newErrors.cvv = 'CVV is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (selectedMethod === 'card' && !validateCard()) {
      return;
    }

    const paymentData: PaymentMethodData = {
      type: selectedMethod as PaymentMethodData['type'],
      ...cardData,
    };

    onComplete(paymentData);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

        <RadioGroup
          value={selectedMethod}
          onValueChange={setSelectedMethod}
          className="space-y-3"
        >
          {paymentMethods.map((method) => (
            <Card key={method.id} className={cn(
              'relative overflow-hidden transition-all',
              selectedMethod === method.id && 'ring-2 ring-primary'
            )}>
              <label
                htmlFor={method.id}
                className="flex items-center gap-4 p-4 cursor-pointer"
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {method.icon}
                    <span className="font-medium">{method.name}</span>
                    {method.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                </div>
              </label>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* Card Details Form */}
      {selectedMethod === 'card' && (
        <div className="space-y-4 pt-4">
          {/* Saved Cards */}
          {savedCards.length > 0 && (
            <RadioGroup
              value={selectedCardId}
              onValueChange={setSelectedCardId}
              className="space-y-3 mb-4"
            >
              {savedCards.map((card) => (
                <Card key={card.id}>
                  <label
                    htmlFor={`card-${card.id}`}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <RadioGroupItem value={card.id} id={`card-${card.id}`} />
                    <CreditCard className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {card.expiryMonth}/{card.expiryYear}
                      </p>
                    </div>
                    {card.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </label>
                </Card>
              ))}
              
              <Card>
                <label
                  htmlFor="new-card"
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <RadioGroupItem value="new" id="new-card" />
                  <span className="font-medium">Use a new card</span>
                </label>
              </Card>
            </RadioGroup>
          )}

          {/* New Card Form */}
          {selectedCardId === 'new' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.cardNumber || ''}
                  onChange={(e) => setCardData({
                    ...cardData,
                    cardNumber: formatCardNumber(e.target.value)
                  })}
                  maxLength={19}
                  className={errors.cardNumber ? 'border-destructive' : ''}
                />
                {errors.cardNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cardHolder">Cardholder Name</Label>
                <Input
                  id="cardHolder"
                  placeholder="John Doe"
                  value={cardData.cardHolder || ''}
                  onChange={(e) => setCardData({
                    ...cardData,
                    cardHolder: e.target.value
                  })}
                  className={errors.cardHolder ? 'border-destructive' : ''}
                />
                {errors.cardHolder && (
                  <p className="text-sm text-destructive mt-1">{errors.cardHolder}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <div className="flex gap-2">
                    <Input
                      id="expiryMonth"
                      placeholder="MM"
                      maxLength={2}
                      value={cardData.expiryMonth || ''}
                      onChange={(e) => setCardData({
                        ...cardData,
                        expiryMonth: e.target.value
                      })}
                      className={cn(
                        'w-20',
                        errors.expiry ? 'border-destructive' : ''
                      )}
                    />
                    <span className="self-center">/</span>
                    <Input
                      id="expiryYear"
                      placeholder="YY"
                      maxLength={2}
                      value={cardData.expiryYear || ''}
                      onChange={(e) => setCardData({
                        ...cardData,
                        expiryYear: e.target.value
                      })}
                      className={cn(
                        'w-20',
                        errors.expiry ? 'border-destructive' : ''
                      )}
                    />
                  </div>
                  {errors.expiry && (
                    <p className="text-sm text-destructive mt-1">{errors.expiry}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cvv">
                    CVV
                    <span className="text-xs text-gray-500 ml-1">(3 digits)</span>
                  </Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardData.cvv || ''}
                    onChange={(e) => setCardData({
                      ...cardData,
                      cvv: e.target.value.replace(/\D/g, '')
                    })}
                    className={cn(
                      'w-24',
                      errors.cvv ? 'border-destructive' : ''
                    )}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-destructive mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveCard"
                  checked={cardData.saveCard}
                  onCheckedChange={(checked) => setCardData({
                    ...cardData,
                    saveCard: !!checked
                  })}
                />
                <Label
                  htmlFor="saveCard"
                  className="text-sm font-normal cursor-pointer"
                >
                  Save this card for future purchases
                </Label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Payment Methods */}
      {selectedMethod === 'paypal' && (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600 mb-4">
            You will be redirected to PayPal to complete your purchase
          </p>
          <img src="/paypal-logo.svg" alt="PayPal" className="h-8 mx-auto" />
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          <span>SSL Encrypted</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          <span>PCI Compliant</span>
        </div>
      </div>
    </div>
  );
}