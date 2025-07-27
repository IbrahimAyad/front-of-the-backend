import { PrismaClient } from '@prisma/client'
import { createCacheInvalidationMiddleware } from '@/lib/cache/invalidation'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  
  // Add cache invalidation middleware
  client.$use(createCacheInvalidationMiddleware())
  
  return client
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma