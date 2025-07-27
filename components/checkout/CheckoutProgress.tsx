'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckoutStep {
  id: string;
  name: string;
  href: string;
  status: 'complete' | 'current' | 'upcoming';
}

const steps: Omit<CheckoutStep, 'status'>[] = [
  { id: 'cart', name: 'Cart', href: '/cart' },
  { id: 'shipping', name: 'Shipping', href: '/checkout/shipping' },
  { id: 'payment', name: 'Payment', href: '/checkout/payment' },
  { id: 'review', name: 'Review', href: '/checkout/review' },
  { id: 'confirm', name: 'Confirm', href: '/checkout/confirm' },
];

export function CheckoutProgress() {
  const pathname = usePathname();

  // Determine current step and status
  const getStepStatus = (step: typeof steps[0]): CheckoutStep['status'] => {
    const currentIndex = steps.findIndex(s => pathname.includes(s.id));
    const stepIndex = steps.findIndex(s => s.id === step.id);

    if (currentIndex === -1) return 'upcoming';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const stepsWithStatus: CheckoutStep[] = steps.map(step => ({
    ...step,
    status: getStepStatus(step),
  }));

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {stepsWithStatus.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              stepIdx !== stepsWithStatus.length - 1 ? 'pr-8 sm:pr-20' : '',
              'relative'
            )}
          >
            {/* Desktop View */}
            <div className="hidden sm:block">
              {step.status === 'complete' ? (
                <>
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-primary" />
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    <span className="sr-only">{step.name}</span>
                  </div>
                </>
              ) : step.status === 'current' ? (
                <>
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white"
                    aria-current="step"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{step.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-transparent"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{step.name}</span>
                  </div>
                </>
              )}
              <span
                className={cn(
                  'absolute top-10 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap',
                  step.status === 'current'
                    ? 'text-primary'
                    : step.status === 'complete'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                )}
              >
                {step.name}
              </span>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
              {step.status === 'complete' ? (
                <div className="flex items-center">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  {stepIdx !== stepsWithStatus.length - 1 && (
                    <div className="ml-4 h-0.5 w-full bg-primary" />
                  )}
                </div>
              ) : step.status === 'current' ? (
                <div className="flex items-center">
                  <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white"
                    aria-current="step"
                  >
                    <span className="text-xs font-semibold text-primary">
                      {stepIdx + 1}
                    </span>
                  </div>
                  {stepIdx !== stepsWithStatus.length - 1 && (
                    <div className="ml-4 h-0.5 w-full bg-gray-200" />
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                    <span className="text-xs font-semibold text-gray-500">
                      {stepIdx + 1}
                    </span>
                  </div>
                  {stepIdx !== stepsWithStatus.length - 1 && (
                    <div className="ml-4 h-0.5 w-full bg-gray-200" />
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Mobile Step Name */}
      <div className="mt-2 sm:hidden">
        <p className="text-sm font-medium text-gray-900">
          Step {stepsWithStatus.findIndex(s => s.status === 'current') + 1} of{' '}
          {stepsWithStatus.length}: {stepsWithStatus.find(s => s.status === 'current')?.name}
        </p>
      </div>
    </nav>
  );
}