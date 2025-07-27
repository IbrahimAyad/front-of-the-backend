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
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export declare enum AlertType {
    DATABASE = "database",
    PERFORMANCE = "performance",
    SYSTEM = "system",
    HEALTH = "health"
}
export declare enum NotificationChannel {
    WEBHOOK = "webhook",
    EMAIL = "email",
    SLACK = "slack"
}
export interface AlertCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
    threshold: number | string;
    duration?: number;
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
export declare class AlertingService {
    private alerts;
    private rules;
    private lastTriggered;
    private notificationConfig;
    private monitoringInterval;
    private isMonitoring;
    constructor(config?: NotificationConfig);
    private initializeDatabaseAlertRules;
    addRule(rule: AlertRule): void;
    removeRule(ruleId: string): boolean;
    updateRule(ruleId: string, updates: Partial<AlertRule>): boolean;
    enableRule(ruleId: string): boolean;
    disableRule(ruleId: string): boolean;
    startMonitoring(): Promise<void>;
    stopMonitoring(): void;
    private checkAlerts;
    private evaluateRule;
    private evaluateCondition;
    private triggerAlert;
    private buildAlertMessage;
    private sendNotifications;
    private sendNotification;
    private sendWebhookNotification;
    private sendEmailNotification;
    private sendSlackNotification;
    getAlerts(limit?: number): Alert[];
    getActiveAlerts(): Alert[];
    resolveAlert(alertId: string): boolean;
    getRules(): AlertRule[];
    getRule(ruleId: string): AlertRule | undefined;
    private generateAlertId;
    updateNotificationConfig(config: Partial<NotificationConfig>): void;
    getAlertsReport(): Promise<string>;
}
export declare function getAlertingService(config?: NotificationConfig): AlertingService;
//# sourceMappingURL=alerting.service.d.ts.map