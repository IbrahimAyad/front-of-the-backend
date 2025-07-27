import { getDatabaseMonitor, DatabaseSchemaMetrics, ConnectionPoolMetrics } from './database.monitor';
import { logger } from '../../src/utils/logger';

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  resolved?: Date;
  data?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: AlertCondition;
  cooldownMs: number;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertType {
  DATABASE = 'database',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  HEALTH = 'health',
}

export enum NotificationChannel {
  WEBHOOK = 'webhook',
  EMAIL = 'email',
  SLACK = 'slack',
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  threshold: number | string;
  duration?: number; // Duration in seconds for sustained alerts
}

export interface NotificationConfig {
  webhook?: {
    url: string;
    headers?: Record<string, string>;
  };
  email?: {
    to: string[];
    subject?: string;
  };
  slack?: {
    webhook: string;
    channel?: string;
  };
}

export class AlertingService {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private lastTriggered: Map<string, Date> = new Map();
  private notificationConfig: NotificationConfig = {};
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(config: NotificationConfig = {}) {
    this.notificationConfig = config;
    this.initializeDatabaseAlertRules();
  }

  private initializeDatabaseAlertRules() {
    // Connection pool exhaustion alert
    this.addRule({
      id: 'db-pool-exhaustion',
      name: 'Database Connection Pool Exhaustion',
      description: 'Alerts when connection pool utilization is critically high',
      type: AlertType.DATABASE,
      severity: AlertSeverity.CRITICAL,
      condition: {
        metric: 'connectionPool.utilization',
        operator: 'gte',
        threshold: 90,
        duration: 30,
      },
      cooldownMs: 300000, // 5 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    });

    // High connection pool utilization warning
    this.addRule({
      id: 'db-pool-warning',
      name: 'High Database Connection Pool Usage',
      description: 'Warns when connection pool utilization is high',
      type: AlertType.DATABASE,
      severity: AlertSeverity.WARNING,
      condition: {
        metric: 'connectionPool.utilization',
        operator: 'gte',
        threshold: 75,
        duration: 60,
      },
      cooldownMs: 600000, // 10 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK],
    });

    // Schema accessibility issues
    this.addRule({
      id: 'schema-unhealthy',
      name: 'Database Schema Unhealthy',
      description: 'Alerts when any database schema is in an unhealthy state',
      type: AlertType.DATABASE,
      severity: AlertSeverity.ERROR,
      condition: {
        metric: 'schema.status',
        operator: 'eq',
        threshold: 'unhealthy',
      },
      cooldownMs: 180000, // 3 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    });

    // Schema degraded performance
    this.addRule({
      id: 'schema-degraded',
      name: 'Database Schema Performance Degraded',
      description: 'Warns when database schema performance is degraded',
      type: AlertType.DATABASE,
      severity: AlertSeverity.WARNING,
      condition: {
        metric: 'schema.status',
        operator: 'eq',
        threshold: 'degraded',
      },
      cooldownMs: 300000, // 5 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK],
    });

    // Slow query detection
    this.addRule({
      id: 'slow-queries-high',
      name: 'High Number of Slow Queries',
      description: 'Alerts when there are many slow queries in a schema',
      type: AlertType.DATABASE,
      severity: AlertSeverity.WARNING,
      condition: {
        metric: 'schema.slowQueries',
        operator: 'gte',
        threshold: 10,
        duration: 120,
      },
      cooldownMs: 300000, // 5 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    });

    // Critical slow query performance
    this.addRule({
      id: 'avg-query-time-critical',
      name: 'Critical Average Query Time',
      description: 'Alerts when average query time is critically high',
      type: AlertType.DATABASE,
      severity: AlertSeverity.CRITICAL,
      condition: {
        metric: 'schema.avgQueryTime',
        operator: 'gte',
        threshold: 5000, // 5 seconds
        duration: 60,
      },
      cooldownMs: 180000, // 3 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    });

    // Failed health checks
    this.addRule({
      id: 'health-check-failed',
      name: 'Health Check Failed',
      description: 'Alerts when health check endpoints are failing',
      type: AlertType.HEALTH,
      severity: AlertSeverity.ERROR,
      condition: {
        metric: 'health.status',
        operator: 'eq',
        threshold: 'unhealthy',
      },
      cooldownMs: 120000, // 2 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    });

    // Connection errors
    this.addRule({
      id: 'connection-errors',
      name: 'Database Connection Errors',
      description: 'Alerts when there are multiple database connection errors',
      type: AlertType.DATABASE,
      severity: AlertSeverity.ERROR,
      condition: {
        metric: 'connectionPool.errors',
        operator: 'gte',
        threshold: 5,
        duration: 60,
      },
      cooldownMs: 300000, // 5 minutes
      enabled: true,
      notificationChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
    logger.info('Alert rule added', { ruleId: rule.id, name: rule.name });
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      logger.info('Alert rule removed', { ruleId });
      return true;
    }
    return false;
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      logger.info('Alert rule updated', { ruleId, updates });
      return true;
    }
    return false;
  }

  enableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: true });
  }

  disableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: false });
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    logger.info('Starting alerting service monitoring');

    // Check alerts every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        logger.error('Error checking alerts:', error);
      }
    }, 30000);

    // Initial check
    await this.checkAlerts();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    logger.info('Stopped alerting service monitoring');
  }

  private async checkAlerts(): Promise<void> {
    const databaseMonitor = getDatabaseMonitor();
    
    try {
      // Get current metrics
      const healthCheck = await databaseMonitor.performHealthCheck();
      const connectionPool = await databaseMonitor.getConnectionPoolMetrics();
      const schemas = await databaseMonitor.getSchemaMetrics();

      // Check each rule
      for (const rule of this.rules.filter(r => r.enabled)) {
        try {
          await this.evaluateRule(rule, {
            connectionPool,
            schemas,
            health: healthCheck,
          });
        } catch (error) {
          logger.error('Error evaluating alert rule', { ruleId: rule.id, error });
        }
      }
    } catch (error) {
      logger.error('Error collecting metrics for alerts:', error);
    }
  }

  private async evaluateRule(rule: AlertRule, data: {
    connectionPool: ConnectionPoolMetrics;
    schemas: DatabaseSchemaMetrics[];
    health: any;
  }): Promise<void> {
    const { condition } = rule;
    let shouldAlert = false;
    let alertData: any = {};

    // Check cooldown
    const lastTriggered = this.lastTriggered.get(rule.id);
    if (lastTriggered && Date.now() - lastTriggered.getTime() < rule.cooldownMs) {
      return;
    }

    switch (condition.metric) {
      case 'connectionPool.utilization':
        shouldAlert = this.evaluateCondition(data.connectionPool.utilization, condition);
        alertData = { utilization: data.connectionPool.utilization };
        break;

      case 'connectionPool.errors':
        shouldAlert = this.evaluateCondition(data.connectionPool.errors, condition);
        alertData = { errors: data.connectionPool.errors };
        break;

      case 'schema.status':
        for (const schema of data.schemas) {
          if (this.evaluateCondition(schema.status, condition)) {
            shouldAlert = true;
            alertData = { schema: schema.schemaName, status: schema.status, errors: schema.errors };
            break;
          }
        }
        break;

      case 'schema.slowQueries':
        for (const schema of data.schemas) {
          if (this.evaluateCondition(schema.slowQueries, condition)) {
            shouldAlert = true;
            alertData = { schema: schema.schemaName, slowQueries: schema.slowQueries };
            break;
          }
        }
        break;

      case 'schema.avgQueryTime':
        for (const schema of data.schemas) {
          if (this.evaluateCondition(schema.avgQueryTime, condition)) {
            shouldAlert = true;
            alertData = { schema: schema.schemaName, avgQueryTime: schema.avgQueryTime };
            break;
          }
        }
        break;

      case 'health.status':
        shouldAlert = this.evaluateCondition(data.health.overall, condition);
        alertData = { 
          status: data.health.overall, 
          issues: data.health.issues,
          schemas: data.health.schemas.filter((s: any) => s.status !== 'healthy').map((s: any) => s.schemaName)
        };
        break;
    }

    if (shouldAlert) {
      await this.triggerAlert(rule, alertData);
    }
  }

  private evaluateCondition(value: any, condition: AlertCondition): boolean {
    const { operator, threshold } = condition;

    switch (operator) {
      case 'gt':
        return Number(value) > Number(threshold);
      case 'gte':
        return Number(value) >= Number(threshold);
      case 'lt':
        return Number(value) < Number(threshold);
      case 'lte':
        return Number(value) <= Number(threshold);
      case 'eq':
        return value === threshold;
      case 'contains':
        return String(value).includes(String(threshold));
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, data: any): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.buildAlertMessage(rule, data),
      timestamp: new Date(),
      data,
    };

    this.alerts.push(alert);
    this.lastTriggered.set(rule.id, new Date());

    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    logger.warn('Alert triggered', {
      ruleId: rule.id,
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message,
    });

    // Send notifications
    await this.sendNotifications(alert, rule);
  }

  private buildAlertMessage(rule: AlertRule, data: any): string {
    let message = rule.description;

    switch (rule.id) {
      case 'db-pool-exhaustion':
      case 'db-pool-warning':
        message += ` Current utilization: ${data.utilization?.toFixed(1)}%`;
        break;
      case 'schema-unhealthy':
      case 'schema-degraded':
        message += ` Schema: ${data.schema}, Status: ${data.status}`;
        if (data.errors?.length > 0) {
          message += `, Errors: ${data.errors.join(', ')}`;
        }
        break;
      case 'slow-queries-high':
        message += ` Schema: ${data.schema}, Slow queries: ${data.slowQueries}`;
        break;
      case 'avg-query-time-critical':
        message += ` Schema: ${data.schema}, Avg time: ${data.avgQueryTime?.toFixed(2)}ms`;
        break;
      case 'health-check-failed':
        message += ` Status: ${data.status}`;
        if (data.issues?.length > 0) {
          message += `, Issues: ${data.issues.join(', ')}`;
        }
        break;
      case 'connection-errors':
        message += ` Error count: ${data.errors}`;
        break;
    }

    return message;
  }

  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channel of rule.notificationChannels) {
      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        logger.error('Failed to send notification', { 
          channel, 
          alertId: alert.id, 
          error: (error as Error).message 
        });
      }
    }
  }

  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    switch (channel) {
      case NotificationChannel.WEBHOOK:
        await this.sendWebhookNotification(alert);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(alert);
        break;
      case NotificationChannel.SLACK:
        await this.sendSlackNotification(alert);
        break;
    }
  }

  private async sendWebhookNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.webhook?.url) {
      return;
    }

    const payload = {
      alert_id: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      data: alert.data,
      source: 'database-monitoring',
    };

    const response = await fetch(this.notificationConfig.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.notificationConfig.webhook.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.email?.to?.length) {
      return;
    }

    // This would integrate with your email service
    logger.info('Email notification would be sent', {
      to: this.notificationConfig.email.to,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      message: alert.message,
    });
  }

  private async sendSlackNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.slack?.webhook) {
      return;
    }

    const color = {
      [AlertSeverity.INFO]: '#36a64f',
      [AlertSeverity.WARNING]: '#ff9500',
      [AlertSeverity.ERROR]: '#ff4444',
      [AlertSeverity.CRITICAL]: '#cc0000',
    }[alert.severity];

    const payload = {
      channel: this.notificationConfig.slack.channel,
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
          ],
          footer: 'Database Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    const response = await fetch(this.notificationConfig.slack.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  }

  getAlerts(limit = 100): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = new Date();
      logger.info('Alert resolved', { alertId });
      return true;
    }
    return false;
  }

  getRules(): AlertRule[] {
    return [...this.rules];
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.find(rule => rule.id === ruleId);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateNotificationConfig(config: Partial<NotificationConfig>): void {
    this.notificationConfig = { ...this.notificationConfig, ...config };
    logger.info('Notification config updated');
  }

  async getAlertsReport(): Promise<string> {
    const activeAlerts = this.getActiveAlerts();
    const recentAlerts = this.getAlerts(50);
    
    let report = `Database Monitoring Alerts Report
========================================
Generated: ${new Date().toISOString()}

Active Alerts: ${activeAlerts.length}
Recent Alerts (Last 50): ${recentAlerts.length}

Alert Rules:
-----------
`;

    for (const rule of this.rules) {
      const status = rule.enabled ? 'ENABLED' : 'DISABLED';
      report += `[${status}] ${rule.name} (${rule.severity})\n`;
      report += `  Description: ${rule.description}\n`;
      report += `  Cooldown: ${rule.cooldownMs / 1000}s\n\n`;
    }

    if (activeAlerts.length > 0) {
      report += `Active Alerts:
--------------
`;
      for (const alert of activeAlerts) {
        report += `[${alert.severity.toUpperCase()}] ${alert.title}\n`;
        report += `  Time: ${alert.timestamp.toISOString()}\n`;
        report += `  Message: ${alert.message}\n\n`;
      }
    }

    return report;
  }
}

// Singleton instance
let alertingService: AlertingService | null = null;

export function getAlertingService(config?: NotificationConfig): AlertingService {
  if (!alertingService) {
    alertingService = new AlertingService(config);
  }
  return alertingService;
}