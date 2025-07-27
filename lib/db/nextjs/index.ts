// Main export file for Next.js database utilities

// Core resilient client
export { 
  resilientDb,
  getResilientPrismaClient,
  type ResilientDb,
  type ResilientClientOptions
} from './resilient-client';

// Database wrapper utilities
export {
  withDatabase,
  withTransaction,
  batchOperation,
  dbQueries,
  checkDatabaseHealth
} from './database-wrapper';

// Monitoring exports (if needed for custom implementations)
export {
  ConnectionMonitor,
  withConnectionMonitoring,
  type ConnectionMetrics,
  type QueryMetrics
} from './connection-monitor';

// Circuit breaker exports removed - requires @vercel/kv

// Usage example for Next.js API routes:
/*
import { withDatabase, dbQueries } from '@/lib/db/nextjs';

export default async function handler(req, res) {
  try {
    // Using wrapper function
    const users = await withDatabase(async (db) => {
      return db.user.findMany({ take: 10 });
    });

    // Using query helper
    const user = await dbQueries.findUnique('user', { id: req.query.id });

    res.json({ users, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
*/