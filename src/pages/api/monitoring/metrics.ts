import { NextApiRequest, NextApiResponse } from 'next'
import { getMetricsCollector } from '@/lib/monitoring/metrics.collector'
import { CacheService } from '@/lib/services/cache.service'

const cacheService = new CacheService({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const metricsCollector = getMetricsCollector(cacheService)
    const metrics = await metricsCollector.collectSystemMetrics()

    res.status(200).json(metrics)
  } catch (error) {
    console.error('Failed to collect metrics:', error)
    res.status(500).json({ error: 'Failed to collect metrics' })
  }
}