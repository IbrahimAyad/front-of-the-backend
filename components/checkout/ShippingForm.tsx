'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { MapPin, User, Mail, Phone, Building, Save } from 'lucide-react';
import { ShippingAddress, shippingAddressSchema } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ShippingFormProps {
  onComplete: (data: ShippingAddress) => void;
  savedAddresses?: Array<ShippingAddress & { id: string; isDefault?: boolean }>;
  initialData?: ShippingAddress;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
];

const states = {
  US: [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    // Add more states as needed
  ],
  CA: [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    // Add more provinces
  ],
  MX: [
    { code: 'AGU', name: 'Aguascalientes' },
    { code: 'BCN', name: 'Baja California' },
    // Add more states
  ],
};

export function ShippingForm({ onComplete, savedAddresses = [], initialData }: ShippingFormProps) {
  const { data: session } = useSession();
  const [useNewAddress, setUseNewAddress] = useState(!savedAddresses.length);
  const [selectedAddressId, setSelectedAddressId] = useState(
    savedAddresses.find(a => a.isDefault)?.id || savedAddresses[0]?.id || ''
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: initialData || {
      email: session?.user?.email || '',
      country: 'US',
      saveAddress: false,
    },
  });

  const selectedCountry = watch('country');

  // Load selected saved address
  useEffect(() => {
    if (!useNewAddress && selectedAddressId) {
      const address = savedAddresses.find(a => a.id === selectedAddressId);
      if (address) {
        Object.entries(address).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'isDefault') {
            setValue(key as keyof ShippingAddress, value);
          }
        });
      }
    }
  }, [selectedAddressId, savedAddresses, setValue, useNewAddress]);

  const onSubmit = async (data: ShippingAddress) => {
    try {
      // Validate address with API
      const response = await fetch('/api/checkout/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Address validation failed');
      }

      onComplete(data);
    } catch (error) {
      console.error('Failed to validate address:', error);
      // For now, proceed anyway
      onComplete(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="mb-6">
            <RadioGroup
              value={useNewAddress ? 'new' : selectedAddressId}
              onValueChange={(value) => {
                if (value === 'new') {
                  setUseNewAddress(true);
                } else {
                  setUseNewAddress(false);
                  setSelectedAddressId(value);
                }
              }}
            >
              {savedAddresses.map((address) => (
                <Card key={address.id} className="mb-3">
                  <label
                    htmlFor={address.id}
                    className="flex items-start gap-3 p-4 cursor-pointer"
                  >
                    <RadioGroupItem value={address.id} id={address.id} />
                    <div className="flex-1">
                      <p className="font-medium">
                        {address.firstName} {address.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.address1}
                        {address.address2 && `, ${address.address2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      {address.isDefault && (
                        <span className="text-xs text-primary font-medium">Default</span>
                      )}
                    </div>
                  </label>
                </Card>
              ))}
              
              <Card>
                <label
                  htmlFor="new-address"
                  className="flex items-center gap-3 p-4 cursor-pointer"
                >
                  <RadioGroupItem value="new" id="new-address" />
                  <span className="font-medium">Use a new address</span>
                </label>
              </Card>
            </RadioGroup>
          </div>
        )}

        {/* Address Form */}
        <div className={cn(
          'space-y-4',
          !useNewAddress && savedAddresses.length > 0 && 'opacity-50 pointer-events-none'
        )}>
          {/* Email (for guest checkout) */}
          {!session?.user && (
            <div>
              <Label htmlFor="email">
                <Mail className="inline-block h-4 w-4 mr-1" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your@email.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                <User className="inline-block h-4 w-4 mr-1" />
                First Name
              </Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Company (Optional) */}
          <div>
            <Label htmlFor="company">
              <Building className="inline-block h-4 w-4 mr-1" />
              Company (Optional)
            </Label>
            <Input
              id="company"
              {...register('company')}
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address1">
              <MapPin className="inline-block h-4 w-4 mr-1" />
              Address
            </Label>
            <Input
              id="address1"
              {...register('address1')}
              placeholder="123 Main Street"
              className={errors.address1 ? 'border-destructive' : ''}
            />
            {errors.address1 && (
              <p className="text-sm text-destructive mt-1">{errors.address1.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address2">Apartment, suite, etc. (Optional)</Label>
            <Input
              id="address2"
              {...register('address2')}
              placeholder="Apartment 4B"
            />
          </div>

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-6 sm:col-span-3">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>

            <div className="col-span-3 sm:col-span-2">
              <Label htmlFor="state">State / Province</Label>
              <Select
                value={watch('state')}
                onValueChange={(value) => setValue('state', value)}
              >
                <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {states[selectedCountry as keyof typeof states]?.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
              )}
            </div>

            <div className="col-span-3 sm:col-span-1">
              <Label htmlFor="postalCode">ZIP</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                className={errors.postalCode ? 'border-destructive' : ''}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={watch('country')}
              onValueChange={(value) => setValue('country', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">
              <Phone className="inline-block h-4 w-4 mr-1" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Save Address */}
          {session?.user && useNewAddress && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveAddress"
                checked={watch('saveAddress')}
                onCheckedChange={(checked) => setValue('saveAddress', !!checked)}
              />
              <Label
                htmlFor="saveAddress"
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save this address for future orders
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Validating...' : 'Continue to Shipping Method'}
        </Button>
      </div>
    </form>
  );
}