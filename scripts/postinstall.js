#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Only run in Vercel environment
if (!process.env.VERCEL) {
  console.log('Not in Vercel environment, skipping postinstall');
  process.exit(0);
}

console.log('Running postinstall script in Vercel...');

try {
  // Set dummy DATABASE_URL if not present (required for prisma generate)
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
  }
  
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true'
    }
  });
  
  console.log('Postinstall completed successfully');
} catch (error) {
  console.error('Postinstall failed:', error.message);
  // Don't exit with error to prevent build failure
  console.log('Continuing despite error...');
}