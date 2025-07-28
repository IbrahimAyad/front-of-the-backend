#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running Vercel prebuild script...');

// Ensure node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('Creating node_modules directory...');
  fs.mkdirSync('node_modules', { recursive: true });
}

// Install dependencies with production=false
console.log('Installing dependencies...');
try {
  execSync('npm install --production=false', { stdio: 'inherit' });
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
    execSync('npm install @prisma/engines@5.6.0', { stdio: 'inherit' });
  } catch (installError) {
    console.error('Failed to install @prisma/engines:', installError);
  }
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to generate Prisma client:', error);
  process.exit(1);
}

console.log('Vercel prebuild completed successfully');