#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running Vercel prebuild script...');
console.log('Current directory:', process.cwd());
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
});

// Ensure we're in the right directory
const projectRoot = process.cwd();

// Ensure node_modules exists
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('Creating node_modules directory...');
  fs.mkdirSync(nodeModulesPath, { recursive: true });
}

// Ensure .prisma directory exists
const prismaClientPath = path.join(nodeModulesPath, '.prisma');
if (!fs.existsSync(prismaClientPath)) {
  console.log('Creating .prisma directory...');
  fs.mkdirSync(prismaClientPath, { recursive: true });
}

// Install dependencies with production=false
console.log('Installing dependencies...');
try {
  execSync('npm install --production=false', { 
    stdio: 'inherit',
    cwd: projectRoot
  });
} catch (error) {
  console.error('Failed to install dependencies:', error);
  process.exit(1);
}

// Check if @prisma/engines is installed
try {
  require.resolve('@prisma/engines');
  console.log('@prisma/engines is already installed');
} catch (error) {
  console.log('@prisma/engines not found, installing...');
  try {
    execSync('npm install @prisma/engines@5.6.0', { 
      stdio: 'inherit',
      cwd: projectRoot
    });
  } catch (installError) {
    console.error('Failed to install @prisma/engines:', installError);
  }
}

// Set required environment variables for Prisma
process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = 'true';

// Generate Prisma client with proper environment
console.log('Generating Prisma client...');
try {
  // Use a dummy DATABASE_URL if not set (Prisma needs it for generation)
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/db'
  };
  
  execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
    stdio: 'inherit',
    cwd: projectRoot,
    env: env
  });
} catch (error) {
  console.error('Failed to generate Prisma client:', error);
  process.exit(1);
}

console.log('Vercel prebuild completed successfully');