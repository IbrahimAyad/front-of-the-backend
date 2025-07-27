declare global {
  var prisma: any;
}

let PrismaClient: any;
let prisma: any;

try {
  // Try to import PrismaClient
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
  
  // Create the Prisma client instance
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    // In development, use a global variable to prevent multiple instances
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    prisma = global.prisma;
  }
} catch (e) {
  // If @prisma/client is not available (e.g., during build without DATABASE_URL),
  // create a mock client
  console.log('Prisma client not available, using mock');
  prisma = new Proxy({} as any, {
    get: (target, prop) => {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }
      // Return a mock object for any model access
      return new Proxy({}, {
        get: () => async () => {
          console.error('Database operations not available - Prisma client not initialized');
          return null;
        }
      });
    }
  });
}

export { prisma };
export default prisma;