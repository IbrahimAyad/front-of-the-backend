import * as winston from 'winston';

// Create logger configuration
const loggerConfig: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'kct-menswear-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
};

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  const fileTransports = [
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ];
  
  (loggerConfig.transports as winston.transport[]).push(...fileTransports);
}

// Create logger instance
export const logger = winston.createLogger(loggerConfig);

// Custom log methods for different contexts
export const apiLogger = {
  request: (req: any, res: any) => {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      requestId: req.id
    });
  },
  
  response: (req: any, res: any, responseTime: number) => {
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      requestId: req.id
    });
  },
  
  error: (req: any, error: Error) => {
    logger.error('API Error', {
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      requestId: req.id
    });
  }
};

export const dbLogger = {
  query: (query: string, duration: number) => {
    logger.debug('Database Query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      duration: `${duration}ms`
    });
  },
  
  error: (query: string, error: Error) => {
    logger.error('Database Error', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      error: error.message,
      stack: error.stack
    });
  }
};

export const businessLogger = {
  order: (action: string, orderId: string, details: any) => {
    logger.info('Order Event', {
      action,
      orderId,
      ...details
    });
  },
  
  inventory: (action: string, productId: string, details: any) => {
    logger.info('Inventory Event', {
      action,
      productId,
      ...details
    });
  },
  
  payment: (action: string, details: any) => {
    logger.info('Payment Event', {
      action,
      amount: details.amount,
      currency: details.currency,
      paymentMethod: details.paymentMethod
    });
  }
};

export default logger; 