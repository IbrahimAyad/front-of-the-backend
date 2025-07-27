export interface DatabaseSchemaMetrics {
    schemaName: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    connectionCount: number;
    activeQueries: number;
    slowQueries: number;
    avgQueryTime: number;
    maxQueryTime: number;
    schemaSize: number;
    tableCount: number;
    indexCount: number;
    lastAccessTime: Date;
    errors: string[];
}
export interface ConnectionPoolMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingCount: number;
    maxConnections: number;
    utilization: number;
    avgWaitTime: number;
    timeouts: number;
    errors: number;
}
export interface QueryMetrics {
    query: string;
    executionTime: number;
    timestamp: Date;
    schema: string;
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
    rowsAffected?: number;
    error?: string;
}
export declare class DatabaseMonitoringService {
    private prisma;
    private queryMetrics;
    private connectionPoolStats;
    private schemaMetrics;
    private monitoringInterval;
    private isMonitoring;
    constructor();
    private setupQueryLogging;
    private extractSchemaFromQuery;
    private getQueryType;
    private extractRowsAffected;
    startMonitoring(): Promise<void>;
    stopMonitoring(): void;
    private updateConnectionPoolMetrics;
    private updateSchemaMetrics;
    private getTableCountForSchema;
    getSchemaMetrics(): Promise<DatabaseSchemaMetrics[]>;
    getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics>;
    getQueryMetrics(limit?: number): Promise<QueryMetrics[]>;
    getSlowQueries(threshold?: number, limit?: number): Promise<QueryMetrics[]>;
    checkSchemaHealth(schemaName: string): Promise<DatabaseSchemaMetrics | null>;
    performHealthCheck(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        schemas: DatabaseSchemaMetrics[];
        connectionPool: ConnectionPoolMetrics;
        issues: string[];
    }>;
    disconnect(): Promise<void>;
}
export declare function getDatabaseMonitor(): DatabaseMonitoringService;
//# sourceMappingURL=database.monitor.d.ts.map