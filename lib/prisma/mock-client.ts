// Mock Prisma client for build time when DATABASE_URL is not available
export const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop === '$connect' || prop === '$disconnect') {
      return async () => {};
    }
    // Return a mock object for any model access
    return new Proxy({}, {
      get: () => async () => {
        throw new Error('Database operations not available during build');
      }
    });
  }
});

export default prisma;