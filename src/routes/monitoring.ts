import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';
import { getDatabaseMonitor } from '../../lib/monitoring/database.monitor';
import { getAlertingService } from '../../lib/monitoring/alerting.service';

async function monitoringRoutes(fastify: FastifyInstance) {
  // Monitoring dashboard data endpoint
  fastify.get('/monitoring/dashboard', async (request, reply) => {
    try {
      const databaseMonitor = getDatabaseMonitor();
      const alertingService = getAlertingService();

      // Get all monitoring data
      const [
        healthCheck,
        connectionPool,
        schemas,
        slowQueries,
        recentQueries,
        activeAlerts,
        recentAlerts
      ] = await Promise.all([
        databaseMonitor.performHealthCheck(),
        databaseMonitor.getConnectionPoolMetrics(),
        databaseMonitor.getSchemaMetrics(),
        databaseMonitor.getSlowQueries(1000, 20),
        databaseMonitor.getQueryMetrics(100),
        alertingService.getActiveAlerts(),
        alertingService.getAlerts(50)
      ]);

      // Calculate performance metrics
      const avgQueryTime = recentQueries.length > 0 
        ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length 
        : 0;

      const queryDistribution = {
        SELECT: recentQueries.filter(q => q.type === 'SELECT').length,
        INSERT: recentQueries.filter(q => q.type === 'INSERT').length,
        UPDATE: recentQueries.filter(q => q.type === 'UPDATE').length,
        DELETE: recentQueries.filter(q => q.type === 'DELETE').length,
        OTHER: recentQueries.filter(q => q.type === 'OTHER').length,
      };

      // Schema health summary
      const schemaHealth = {
        healthy: schemas.filter(s => s.status === 'healthy').length,
        degraded: schemas.filter(s => s.status === 'degraded').length,
        unhealthy: schemas.filter(s => s.status === 'unhealthy').length,
        total: schemas.length,
      };

      // Alert summary by severity
      const alertSummary = {
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        error: activeAlerts.filter(a => a.severity === 'error').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length,
        info: activeAlerts.filter(a => a.severity === 'info').length,
        total: activeAlerts.length,
      };

      // Recent alert trends (last 24 hours)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAlertTrends = recentAlerts
        .filter(a => a.timestamp >= last24Hours)
        .reduce((acc, alert) => {
          const hour = new Date(alert.timestamp).getHours();
          if (!acc[hour]) acc[hour] = 0;
          acc[hour]++;
          return acc;
        }, {} as Record<number, number>);

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        overview: {
          overallHealth: healthCheck.overall,
          totalIssues: healthCheck.issues.length,
          activeAlerts: alertSummary.total,
          criticalAlerts: alertSummary.critical,
        },
        database: {
          connectionPool: {
            utilization: connectionPool.utilization,
            activeConnections: connectionPool.activeConnections,
            maxConnections: connectionPool.maxConnections,
            errors: connectionPool.errors,
            waitingCount: connectionPool.waitingCount,
          },
          performance: {
            avgQueryTime: Math.round(avgQueryTime * 100) / 100,
            totalQueries: recentQueries.length,
            slowQueries: slowQueries.length,
            criticalSlowQueries: slowQueries.filter(q => q.executionTime > 5000).length,
          },
          schemas: {
            summary: schemaHealth,
            details: schemas.map(schema => ({
              name: schema.schemaName,
              status: schema.status,
              tableCount: schema.tableCount,
              size: schema.schemaSize,
              avgQueryTime: Math.round(schema.avgQueryTime * 100) / 100,
              slowQueries: schema.slowQueries,
              issues: schema.errors.length,
            })),
          },
        },
        queries: {
          distribution: queryDistribution,
          recent: recentQueries.slice(0, 10).map(q => ({
            type: q.type,
            executionTime: q.executionTime,
            timestamp: q.timestamp.toISOString(),
            schema: q.schema,
            isSlow: q.executionTime > 1000,
          })),
          slowQueries: slowQueries.slice(0, 10).map(q => ({
            query: q.query.substring(0, 150) + (q.query.length > 150 ? '...' : ''),
            executionTime: q.executionTime,
            timestamp: q.timestamp.toISOString(),
            schema: q.schema,
            type: q.type,
          })),
        },
        alerts: {
          summary: alertSummary,
          active: activeAlerts.slice(0, 10).map(alert => ({
            id: alert.id,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
            data: alert.data,
          })),
          trends: recentAlertTrends,
          recent: recentAlerts.slice(0, 20).map(alert => ({
            id: alert.id,
            severity: alert.severity,
            title: alert.title,
            timestamp: alert.timestamp.toISOString(),
            resolved: alert.resolved?.toISOString(),
          })),
        },
        systemHealth: {
          issues: healthCheck.issues,
          lastUpdated: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
        },
      };

      reply.send(response);
    } catch (error) {
      logger.error('Monitoring dashboard data failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        timestamp: new Date().toISOString(),
        error: 'Failed to retrieve monitoring dashboard data',
        message: (error as Error).message,
      });
    }
  });

  // Monitoring alerts endpoint
  fastify.get('/monitoring/alerts', async (request, reply) => {
    try {
      const alertingService = getAlertingService();
      const { limit = 50, active = false } = request.query as { limit?: number; active?: boolean };

      const alerts = active 
        ? alertingService.getActiveAlerts()
        : alertingService.getAlerts(Number(limit));

      reply.send({
        success: true,
        timestamp: new Date().toISOString(),
        alerts: alerts.map(alert => ({
          id: alert.id,
          ruleId: alert.ruleId,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          resolved: alert.resolved?.toISOString(),
          data: alert.data,
        })),
        total: alerts.length,
      });
    } catch (error) {
      logger.error('Get alerts failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to retrieve alerts',
        message: (error as Error).message,
      });
    }
  });

  // Resolve alert endpoint
  fastify.post('/monitoring/alerts/:alertId/resolve', async (request, reply) => {
    try {
      const alertingService = getAlertingService();
      const { alertId } = request.params as { alertId: string };

      const resolved = alertingService.resolveAlert(alertId);
      
      if (resolved) {
        reply.send({
          success: true,
          message: 'Alert resolved successfully',
          alertId,
        });
      } else {
        reply.status(404).send({
          success: false,
          error: 'Alert not found or already resolved',
          alertId,
        });
      }
    } catch (error) {
      logger.error('Resolve alert failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to resolve alert',
        message: (error as Error).message,
      });
    }
  });

  // Alert rules management
  fastify.get('/monitoring/alert-rules', async (request, reply) => {
    try {
      const alertingService = getAlertingService();
      const rules = alertingService.getRules();

      reply.send({
        success: true,
        timestamp: new Date().toISOString(),
        rules: rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          severity: rule.severity,
          enabled: rule.enabled,
          condition: rule.condition,
          cooldownMs: rule.cooldownMs,
          notificationChannels: rule.notificationChannels,
        })),
        total: rules.length,
      });
    } catch (error) {
      logger.error('Get alert rules failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to retrieve alert rules',
        message: (error as Error).message,
      });
    }
  });

  // Enable/disable alert rule
  fastify.post('/monitoring/alert-rules/:ruleId/toggle', async (request, reply) => {
    try {
      const alertingService = getAlertingService();
      const { ruleId } = request.params as { ruleId: string };
      const { enabled } = request.body as { enabled: boolean };

      const success = enabled 
        ? alertingService.enableRule(ruleId)
        : alertingService.disableRule(ruleId);
      
      if (success) {
        reply.send({
          success: true,
          message: `Alert rule ${enabled ? 'enabled' : 'disabled'} successfully`,
          ruleId,
          enabled,
        });
      } else {
        reply.status(404).send({
          success: false,
          error: 'Alert rule not found',
          ruleId,
        });
      }
    } catch (error) {
      logger.error('Toggle alert rule failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to toggle alert rule',
        message: (error as Error).message,
      });
    }
  });

  // Database monitoring report
  fastify.get('/monitoring/reports/database', async (request, reply) => {
    try {
      const databaseMonitor = getDatabaseMonitor();
      const alertingService = getAlertingService();

      const [healthReport, alertsReport] = await Promise.all([
        databaseMonitor.performHealthCheck(),
        alertingService.getAlertsReport(),
      ]);

      const reportText = `Database Monitoring Report
========================================
Generated: ${new Date().toISOString()}

Overall Health: ${healthReport.overall}
Total Issues: ${healthReport.issues.length}

Connection Pool:
- Utilization: ${healthReport.connectionPool.utilization.toFixed(1)}%
- Active Connections: ${healthReport.connectionPool.activeConnections}
- Errors: ${healthReport.connectionPool.errors}

Schema Health:
${healthReport.schemas.map(s => 
  `- ${s.schemaName}: ${s.status} (${s.tableCount} tables, ${s.slowQueries} slow queries)`
).join('\n')}

Issues:
${healthReport.issues.length > 0 ? healthReport.issues.map(issue => `- ${issue}`).join('\n') : 'No issues detected'}

${alertsReport}
`;

      reply
        .header('Content-Type', 'text/plain')
        .send(reportText);
    } catch (error) {
      logger.error('Generate database report failed', { error: (error as Error).message });
      reply.status(500).send({
        success: false,
        error: 'Failed to generate database monitoring report',
        message: (error as Error).message,
      });
    }
  });
}

export default monitoringRoutes;