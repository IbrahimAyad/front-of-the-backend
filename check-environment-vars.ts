import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔍 Checking Environment Variables Configuration${colors.reset}\n`);

// Load .env files
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log(`${colors.green}✅ Found .env.local file${colors.reset}`);
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log(`${colors.yellow}⚠️  Using .env file (no .env.local found)${colors.reset}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`${colors.red}❌ No environment file found!${colors.reset}`);
}

// Define required variables and their purposes
const requiredVars = {
  // Database
  DATABASE_URL: {
    purpose: 'PostgreSQL connection string',
    example: 'postgresql://user:pass@host:port/database',
    checkFn: (val: string) => val.startsWith('postgresql://') && !val.includes('${{')
  },
  
  // JWT/Auth
  JWT_SECRET: {
    purpose: 'JWT token signing secret',
    example: 'your-secret-key-here',
    checkFn: (val: string) => val.length >= 32
  },
  
  // Cloudflare Images (Backend)
  CLOUDFLARE_ACCOUNT_ID: {
    purpose: 'Cloudflare account identifier',
    example: 'abc123def456...',
    checkFn: (val: string) => val.length > 10 && !val.includes(' ')
  },
  CLOUDFLARE_API_TOKEN: {
    purpose: 'Cloudflare API token with Images permissions',
    example: 'v1.0-abc123...',
    checkFn: (val: string) => val.length > 20 && !val.includes(' ')
  },
  
  // Frontend Cloudflare (if different)
  VITE_CLOUDFLARE_ACCOUNT_ID: {
    purpose: 'Frontend Cloudflare account ID',
    example: 'Same as CLOUDFLARE_ACCOUNT_ID',
    checkFn: (val: string) => val.length > 10 && !val.includes(' '),
    optional: true
  },
  VITE_CLOUDFLARE_API_TOKEN: {
    purpose: 'Frontend Cloudflare API token',
    example: 'Same as CLOUDFLARE_API_TOKEN',
    checkFn: (val: string) => val.length > 20 && !val.includes(' '),
    optional: true
  },
  
  // API Configuration
  VITE_API_URL: {
    purpose: 'Backend API URL for frontend',
    example: 'http://localhost:8000 or https://your-api.com',
    checkFn: (val: string) => val.startsWith('http'),
    optional: true
  },
  
  // Port Configuration
  PORT: {
    purpose: 'Backend server port',
    example: '8000',
    checkFn: (val: string) => !isNaN(Number(val)),
    optional: true
  }
};

console.log(`\n${colors.blue}📋 Environment Variables Check:${colors.reset}`);
console.log('=====================================\n');

let hasErrors = false;
let hasWarnings = false;

// Check each variable
Object.entries(requiredVars).forEach(([varName, config]) => {
  const value = process.env[varName];
  const exists = value !== undefined && value !== '';
  
  if (!exists) {
    if (config.optional) {
      console.log(`${colors.yellow}⚠️  ${varName}:${colors.reset} Not set (optional)`);
      console.log(`   Purpose: ${config.purpose}`);
      console.log(`   Example: ${config.example}\n`);
      hasWarnings = true;
    } else {
      console.log(`${colors.red}❌ ${varName}:${colors.reset} Missing (required)`);
      console.log(`   Purpose: ${config.purpose}`);
      console.log(`   Example: ${config.example}\n`);
      hasErrors = true;
    }
  } else {
    // Check if value is valid
    const isValid = config.checkFn ? config.checkFn(value) : true;
    
    if (isValid) {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('PASSWORD')) {
        displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      } else if (varName.includes('DATABASE_URL')) {
        // Parse and mask database URL
        try {
          const url = new URL(value);
          displayValue = `postgresql://${url.username}:****@${url.host}${url.pathname}`;
        } catch {
          displayValue = value.substring(0, 20) + '...';
        }
      }
      
      console.log(`${colors.green}✅ ${varName}:${colors.reset} ${displayValue}`);
      console.log(`   Purpose: ${config.purpose}\n`);
    } else {
      console.log(`${colors.red}❌ ${varName}:${colors.reset} Invalid value`);
      console.log(`   Current: ${value}`);
      console.log(`   Purpose: ${config.purpose}`);
      console.log(`   Example: ${config.example}\n`);
      hasErrors = true;
    }
  }
});

// Check for extra environment variables that might be typos
console.log(`\n${colors.blue}🔍 Checking for potential typos:${colors.reset}`);
console.log('================================\n');

const allEnvVars = Object.keys(process.env);
const expectedPrefixes = ['DATABASE', 'JWT', 'CLOUDFLARE', 'VITE', 'PORT', 'NODE', 'RAILWAY'];

const suspiciousVars = allEnvVars.filter(varName => {
  // Check if it might be a typo of our required vars
  const isKnown = Object.keys(requiredVars).includes(varName);
  const hasKnownPrefix = expectedPrefixes.some(prefix => varName.startsWith(prefix));
  
  if (!isKnown && !hasKnownPrefix) {
    // Check for common typos
    const lowerVar = varName.toLowerCase();
    return lowerVar.includes('cloud') || 
           lowerVar.includes('data') || 
           lowerVar.includes('jwt') ||
           lowerVar.includes('api') ||
           lowerVar.includes('vite');
  }
  return false;
});

if (suspiciousVars.length > 0) {
  console.log(`${colors.yellow}Found potentially misnamed variables:${colors.reset}`);
  suspiciousVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  hasWarnings = true;
} else {
  console.log(`${colors.green}No suspicious variable names found${colors.reset}`);
}

// Railway-specific checks
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log(`\n${colors.blue}🚂 Railway Environment Detected:${colors.reset}`);
  console.log('=================================\n');
  
  console.log(`Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  console.log(`Project ID: ${process.env.RAILWAY_PROJECT_ID || 'Not set'}`);
  console.log(`Service ID: ${process.env.RAILWAY_SERVICE_ID || 'Not set'}`);
  
  // Check if DATABASE_URL uses internal URL
  if (process.env.DATABASE_URL?.includes('.railway.internal')) {
    console.log(`${colors.green}✅ Using Railway internal database URL${colors.reset}`);
  } else if (process.env.DATABASE_URL?.includes('proxy.rlwy.net')) {
    console.log(`${colors.yellow}⚠️  Using Railway proxy URL (external)${colors.reset}`);
  }
}

// Final summary
console.log(`\n${colors.cyan}📊 Summary:${colors.reset}`);
console.log('===========\n');

if (hasErrors) {
  console.log(`${colors.red}❌ Configuration has errors that need to be fixed${colors.reset}`);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  Configuration is functional but has warnings${colors.reset}`);
} else {
  console.log(`${colors.green}✅ All environment variables are properly configured!${colors.reset}`);
}

// Check if backend can connect to database
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('${{')) {
  console.log(`\n${colors.blue}🔗 Testing Database Connection:${colors.reset}`);
  
  import('@prisma/client').then(({ PrismaClient }) => {
    const prisma = new PrismaClient();
    
    prisma.$connect()
      .then(() => {
        console.log(`${colors.green}✅ Database connection successful!${colors.reset}`);
        return prisma.$disconnect();
      })
      .catch((error) => {
        console.log(`${colors.red}❌ Database connection failed:${colors.reset}`);
        console.log(`   ${error.message}`);
      });
  }).catch(() => {
    console.log(`${colors.yellow}⚠️  Could not test database connection (Prisma not available)${colors.reset}`);
  });
}

// Export findings for use in other scripts
export const envCheck = {
  hasErrors,
  hasWarnings,
  missingVars: Object.entries(requiredVars)
    .filter(([varName, config]) => !config.optional && !process.env[varName])
    .map(([varName]) => varName)
};