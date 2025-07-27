import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/utils/api-response';
import { z } from 'zod';

const addressSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = addressSchema.parse(body);

    // Basic validation rules
    const errors: string[] = [];

    // Validate postal code format based on country
    if (address.country === 'US') {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      if (!usZipRegex.test(address.postalCode)) {
        errors.push('Invalid US postal code format');
      }
    } else if (address.country === 'CA') {
      const caPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      if (!caPostalRegex.test(address.postalCode)) {
        errors.push('Invalid Canadian postal code format');
      }
    }

    // Validate phone number (basic check)
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(address.phone.replace(/\s/g, ''))) {
      errors.push('Invalid phone number format');
    }

    // Check for PO Box in address (some items can't ship to PO Box)
    const poBoxRegex = /\b(?:P\.?\s*O\.?\s*Box|Post\s*Office\s*Box)\b/i;
    const isPOBox = poBoxRegex.test(address.address1) || 
                    (address.address2 ? poBoxRegex.test(address.address2) : false);

    if (errors.length > 0) {
      return createApiResponse(
        {
          valid: false,
          errors,
          suggestions: []
        },
        'Address validation failed',
        400
      );
    }

    // In a real implementation, you would:
    // 1. Call an address validation API (USPS, Google Maps, etc.)
    // 2. Standardize the address format
    // 3. Check if the address is deliverable
    // 4. Return suggestions for corrections

    // Mock response
    const standardizedAddress = {
      ...address,
      // Standardize formatting
      address1: address.address1.trim().toUpperCase(),
      city: address.city.trim().toUpperCase(),
      state: address.state.toUpperCase(),
      postalCode: address.postalCode.replace(/\s/g, '').toUpperCase(),
    };

    return createApiResponse({
      valid: true,
      standardized: standardizedAddress,
      isPOBox,
      deliverable: true,
      residential: !address.company,
      suggestions: [],
      metadata: {
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        timezone: 'America/New_York',
        county: 'New York County'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse(
        null,
        'Invalid address data',
        400
      );
    }

    console.error('Address validation error:', error);
    return createApiResponse(
      null,
      'Failed to validate address',
      500
    );
  }
}