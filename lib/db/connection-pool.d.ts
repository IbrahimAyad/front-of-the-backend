import { Pool, PoolConfig } from 'pg';
import { PrismaClient } from '@prisma/client';
export interface DatabasePoolConfig {
    writer: PoolConfig;
    reader: PoolConfig;
}
export declare const poolConfig: DatabasePoolConfig;
export declare class DatabasePool {
    private static instance;
    private writePool;
    private readPool;
    private prismaWrite;
    private prismaRead;
    private healthCheckInterval?;
    private constructor();
    static getInstance(): DatabasePool;
    getPool(readonly?: boolean): Pool;
    getPrisma(readonly?: boolean): PrismaClient;
    query<T>(sql: string, params?: any[], readonly?: boolean): Promise<T[]>;
    transaction<T>(callback: (client: any) => Promise<T>, readonly?: boolean): Promise<T>;
    private startHealthCheck;
    checkHealth(): Promise<{
        write: {
            healthy: boolean;
            latency: number;
            connections: number;
        };
        read: {
            healthy: boolean;
            latency: number;
            connections: number;
        };
    }>;
    getStats(): Promise<{
        write: {
            total: number;
            idle: number;
            waiting: number;
        };
        read: {
            total: number;
            idle: number;
            waiting: number;
        };
    }>;
    shutdown(): Promise<void>;
}
export declare const getPool: () => DatabasePool;
//# sourceMappingURL=connection-pool.d.ts.map