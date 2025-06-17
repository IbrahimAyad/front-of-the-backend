#!/bin/bash

echo "🚀 Setting up KCT Menswear Backend API..."

# Create project structure
mkdir -p src/routes src/plugins src/schemas src/utils src/services prisma

echo "📁 Created project directories"

# Create package.json
cat > package.json << 'EOF'
{
  "name": "kct-menswear-backend",
  "version": "1.0.0",
  "description": "Luxury menswear tailoring business management system backend",
  "main": "dist/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@fastify/cors": "^8.4.0",
    "@fastify/jwt": "^7.2.4",
    "@fastify/websocket": "^8.3.1",
    "@fastify/multipart": "^7.6.0",
    "@fastify/rate-limit": "^8.0.3",
    "@prisma/client": "^5.6.0",
    "bcrypt": "^5.1.1",
    "joi": "^17.11.0",
    "redis": "^4.6.10",
    "@sendgrid/mail": "^7.7.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "ws": "^8.14.2",
    "fastify-plugin": "^4.5.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.10",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/ws": "^8.5.8",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1",
    "prisma": "^5.6.0"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create .env
cat > .env << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="kct-super-secret-jwt-key-2024"
JWT_REFRESH_SECRET="kct-refresh-secret-key-2024"

# Server
PORT=8000
NODE_ENV=development

# Redis
REDIS_URL="redis://localhost:6379"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@kctmenswear.com"

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH="./uploads"

# CORS
FRONTEND_URL="http://localhost:3001"
EOF

# Create Prisma schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String?
  passwordHash String
  role         String   @default("USER")
  avatar       String?
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}

model Customer {
  id            Int           @id @default(autoincrement())
  name          String
  email         String        @unique
  phone         String?
  address       String?
  dateOfBirth   DateTime?
  preferences   String?
  leads         Lead[]
  orders        Order[]
  measurements  Measurement[]
  appointments  Appointment[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("customers")
}

model Lead {
  id           Int       @id @default(autoincrement())
  customerId   Int
  customer     Customer  @relation(fields: [customerId], references: [id])
  source       String
  status       String    @default("new")
  score        Int       @default(50)
  occasion     String?
  budgetRange  String?
  notes        String?
  lastContact  DateTime?
  nextFollowUp DateTime?
  createdBy    Int?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("leads")
}

model Product {
  id           Int         @id @default(autoincrement())
  name         String
  sku          String      @unique
  category     String
  description  String?
  price        Float
  fabric       String?
  colors       String
  sizes        String
  stock        Int         @default(0)
  minimumStock Int         @default(5)
  images       String
  status       String      @default("active")
  orderItems   OrderItem[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@map("products")
}

model Order {
  id            String      @id @default(cuid())
  customerId    Int
  customer      Customer    @relation(fields: [customerId], references: [id])
  status        String      @default("new")
  total         Float
  paymentStatus String      @default("pending")
  dueDate       DateTime?
  notes         String?
  items         OrderItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@map("orders")
}

model OrderItem {
  id             Int     @id @default(autoincrement())
  orderId        String
  order          Order   @relation(fields: [orderId], references: [id])
  productId      Int
  product        Product @relation(fields: [productId], references: [id])
  quantity       Int     @default(1)
  price          Float
  customizations String?

  @@map("order_items")
}

model Measurement {
  id           Int      @id @default(autoincrement())
  customerId   Int
  customer     Customer @relation(fields: [customerId], references: [id])
  chest        Float?
  waist        Float?
  hips         Float?
  shoulders    Float?
  armLength    Float?
  inseam       Float?
  neck         Float?
  height       Float?
  weight       Float?
  notes        String?
  takenBy      Int?
  dateRecorded DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("measurements")
}

model Appointment {
  id         Int      @id @default(autoincrement())
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id])
  service    String
  date       DateTime
  time       String
  duration   Int      @default(60)
  status     String   @default("scheduled")
  notes      String?
  createdBy  Int?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("appointments")
}

model Notification {
  id        String    @id @default(cuid())
  userId    Int
  type      String
  title     String
  message   String
  read      Boolean   @default(false)
  readAt    DateTime?
  data      String?
  createdAt DateTime  @default(now())

  @@map("notifications")
}
EOF

# Create config utility
cat > src/utils/config.ts << 'EOF'
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '8000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@kctmenswear.com',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'),
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
};
EOF

# Create database plugin
cat > src/plugins/database.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(databasePlugin);
export { databasePlugin };
EOF

# Create auth plugin
cat > src/plugins/auth.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    hashPassword: (password: string) => Promise<string>;
    comparePassword: (password: string, hash: string) => Promise<boolean>;
    generateTokens: (userId: number) => { accessToken: string; refreshToken: string };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        reply.code(401).send({ success: false, error: 'No token provided' });
        return;
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        reply.code(401).send({ success: false, error: 'Invalid token' });
        return;
      }

      request.user = user;
    } catch (error) {
      reply.code(401).send({ success: false, error: 'Invalid token' });
    }
  });

  fastify.decorate('hashPassword', async (password: string) => {
    return bcrypt.hash(password, 12);
  });

  fastify.decorate('comparePassword', async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  });

  fastify.decorate('generateTokens', (userId: number) => {
    const accessToken = jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  });
};

export default fp(authPlugin);
export { authPlugin };
EOF

# Create websocket plugin
cat > src/plugins/websocket.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    broadcast: (event: string, data: any) => void;
  }
}

const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  const connections = new Set();

  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      connections.add(connection);
      
      connection.on('close', () => {
        connections.delete(connection);
      });

      connection.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('WebSocket message:', data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    });
  });

  fastify.decorate('broadcast', (event: string, data: any) => {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    connections.forEach((connection: any) => {
      if (connection.readyState === 1) {
        connection.send(message);
      }
    });
  });
};

export default fp(websocketPlugin);
export { websocketPlugin };
EOF

# Create validation schemas
cat > src/schemas/auth.ts << 'EOF'
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'STAFF', 'USER').default('USER'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2),
  avatar: Joi.string().uri(),
});
EOF

cat > src/schemas/customer.ts << 'EOF'
import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  preferences: Joi.string().optional(),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2),
  email: Joi.string().email(),
  phone: Joi.string(),
  address: Joi.string(),
  dateOfBirth: Joi.date(),
  preferences: Joi.string(),
});
EOF

cat > src/schemas/lead.ts << 'EOF'
import Joi from 'joi';

export const createLeadSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  source: Joi.string().valid('referral', 'website', 'social_media', 'walk_in').required(),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost').default('new'),
  score: Joi.number().integer().min(0).max(100).default(50),
  occasion: Joi.string().valid('wedding', 'business', 'prom', 'general').optional(),
  budgetRange: Joi.string().optional(),
  notes: Joi.string().optional(),
  nextFollowUp: Joi.date().optional(),
});

export const updateLeadSchema = Joi.object({
  source: Joi.string().valid('referral', 'website', 'social_media', 'walk_in'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost'),
  score: Joi.number().integer().min(0).max(100),
  occasion: Joi.string().valid('wedding', 'business', 'prom', 'general'),
  budgetRange: Joi.string(),
  notes: Joi.string(),
  nextFollowUp: Joi.date(),
});
EOF

# Create main server file
cat > src/server.ts << 'EOF'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './utils/config';
import { databasePlugin } from './plugins/database';
import { authPlugin } from './plugins/auth';
import { websocketPlugin } from './plugins/websocket';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import leadsRoutes from './routes/leads';
import customersRoutes from './routes/customers';
import ordersRoutes from './routes/orders';
import appointmentsRoutes from './routes/appointments';
import productsRoutes from './routes/products';
import measurementsRoutes from './routes/measurements';
import analyticsRoutes from './routes/analytics';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function start() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: [config.FRONTEND_URL, 'http://localhost:3001'],
      credentials: true,
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    await fastify.register(jwt, {
      secret: config.JWT_SECRET,
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: config.UPLOAD_MAX_SIZE,
      },
    });

    await fastify.register(websocket);

    // Register custom plugins
    await fastify.register(databasePlugin);
    await fastify.register(authPlugin);
    await fastify.register(websocketPlugin);

    // Health check routes
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    fastify.get('/health/database', async (request, reply) => {
      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', database: 'connected' };
      } catch (error: any) {
        reply.code(503);
        return { status: 'error', database: 'disconnected', error: error.message };
      }
    });

    // API Info
    fastify.get('/', async () => {
      return {
        message: 'KCT Menswear Backend API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          auth: '/api/auth/*',
          dashboard: '/api/dashboard/*',
          customers: '/api/customers/*',
          leads: '/api/leads/*',
          orders: '/api/orders/*',
          products: '/api/products/*',
          measurements: '/api/measurements/*',
          appointments: '/api/appointments/*',
          analytics: '/api/analytics/*',
        },
      };
    });

    // Register API routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await fastify.register(leadsRoutes, { prefix: '/api/leads' });
    await fastify.register(customersRoutes, { prefix: '/api/customers' });
    await fastify.register(ordersRoutes, { prefix: '/api/orders' });
    await fastify.register(appointmentsRoutes, { prefix: '/api/appointments' });
    await fastify.register(productsRoutes, { prefix: '/api/products' });
    await fastify.register(measurementsRoutes, { prefix: '/api/measurements' });
    await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
      
      if (error.validation) {
        reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.validation,
        });
        return;
      }

      if (error.statusCode) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
        });
        return;
      }

      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    });

    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
EOF

# Create all route files
cat > src/routes/auth.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema } from '../schemas/auth';
import { config } from '../utils/config';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { error, value } = registerSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const { email, password, name, role } = value;

      // Check if user already exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User already exists',
        });
      }

      // Hash password
      const passwordHash = await fastify.hashPassword(password);

      // Create user
      const user = await fastify.prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = fastify.generateTokens(user.id);

      // Save refresh token
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      reply.send({
        success: true,
        data: {
          user,
          ...tokens,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { error, value } = loginSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const { email, password } = value;

      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Verify password
      const isValidPassword = await fastify.comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Generate tokens
      const tokens = fastify.generateTokens(user.id);

      // Save refresh token
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          ...tokens,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get profile
  fastify.get('/profile', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    reply.send({
      success: true,
      data: request.user,
    });
  });

  // Logout
  fastify.post('/logout', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: { refreshToken: null },
      });

      reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default authRoutes;
EOF

cat > src/routes/dashboard.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // Dashboard statistics
  fastify.get('/stats', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const [
        totalCustomers,
        totalOrders,
        totalLeads,
        pendingAppointments,
        recentOrders,
      ] = await Promise.all([
        fastify.prisma.customer.count(),
        fastify.prisma.order.count(),
        fastify.prisma.lead.count(),
        fastify.prisma.appointment.count({
          where: { status: 'scheduled' },
        }),
        fastify.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true } },
          },
        }),
      ]);

      reply.send({
        success: true,
        data: {
          totalCustomers,
          totalOrders,
          totalLeads,
          pendingAppointments,
          recentOrders,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Recent activities
  fastify.get('/recent', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const [recentOrders, recentLeads, recentAppointments] = await Promise.all([
        fastify.prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
          },
        }),
        fastify.prisma.lead.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
          },
        }),
        fastify.prisma.appointment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
          },
        }),
      ]);

      reply.send({
        success: true,
        data: {
          recentOrders,
          recentLeads,
          recentAppointments,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default dashboardRoutes;
EOF

cat > src/routes/customers.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customer';

const customersRoutes: FastifyPluginAsync = async (fastify) => {
  // Get customers with pagination
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      const [customers, total] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.customer.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new customer
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createCustomerSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const customer = await fastify.prisma.customer.create({
        data: value,
      });

      reply.code(201).send({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Customer with this email already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Get customer details
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;

      const customer = await fastify.prisma.customer.findUnique({
        where: { id: parseInt(id) },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          leads: {
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
          appointments: {
            orderBy: { date: 'desc' },
            take: 5,
          },
          measurements: {
            orderBy: { dateRecorded: 'desc' },
            take: 1,
          },
        },
      });

      if (!customer) {
        return reply.code(404).send({
          success: false,
          error: 'Customer not found',
        });
      }

      reply.send({
        success: true,
        data: customer,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default customersRoutes;
EOF

cat > src/routes/leads.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import { createLeadSchema, updateLeadSchema } from '../schemas/lead';

const leadsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get leads with filters and pagination
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, status, source, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (source) where.source = source;
      if (search) {
        where.OR = [
          { customer: { name: { contains: search } } },
          { customer: { email: { contains: search } } },
          { notes: { contains: search } },
        ];
      }

      const [leads, total] = await Promise.all([
        fastify.prisma.lead.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { updatedAt: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        }),
        fastify.prisma.lead.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          leads,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new lead
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createLeadSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const lead = await fastify.prisma.lead.create({
        data: {
          ...value,
          createdBy: request.user.id,
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      // Broadcast new lead event
      fastify.broadcast('lead_created', lead);

      reply.code(201).send({
        success: true,
        data: lead,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default leadsRoutes;
EOF

cat > src/routes/orders.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createOrderSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().required(),
      customizations: Joi.string().optional(),
    })
  ).min(1).required(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional(),
});

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  // Get orders with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, status, paymentStatus, search } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (search) {
        where.OR = [
          { id: { contains: search } },
          { customer: { name: { contains: search } } },
          { customer: { email: { contains: search } } },
        ];
      }

      const [orders, total] = await Promise.all([
        fastify.prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
            items: {
              include: {
                product: {
                  select: { name: true, sku: true, category: true },
                },
              },
            },
          },
        }),
        fastify.prisma.order.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new order
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createOrderSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const { customerId, items, dueDate, notes } = value;

      // Calculate total
      const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      // Create order with items
      const order = await fastify.prisma.order.create({
        data: {
          customerId,
          total,
          dueDate,
          notes,
          items: {
            create: items,
          },
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      });

      // Broadcast new order event
      fastify.broadcast('order_created', order);

      reply.code(201).send({
        success: true,
        data: order,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default ordersRoutes;
EOF

cat > src/routes/products.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  sku: Joi.string().required(),
  category: Joi.string().valid('suits', 'tuxedos', 'shirts', 'accessories').required(),
  description: Joi.string().optional(),
  price: Joi.number().positive().required(),
  fabric: Joi.string().optional(),
  colors: Joi.string().default(''),
  sizes: Joi.string().default(''),
  stock: Joi.number().integer().min(0).default(0),
  minimumStock: Joi.number().integer().min(0).default(5),
  images: Joi.string().default(''),
});

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get products with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, category, status, search, lowStock } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (status) where.status = status;
      if (lowStock === 'true') {
        where.stock = { lte: 5 };
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { sku: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const [products, total] = await Promise.all([
        fastify.prisma.product.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.product.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Create new product
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const { error, value } = createProductSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const product = await fastify.prisma.product.create({
        data: value,
      });

      reply.code(201).send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          error: 'Product with this SKU already exists',
        });
      }
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default productsRoutes;
EOF

cat > src/routes/measurements.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createMeasurementSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  chest: Joi.number().positive().optional(),
  waist: Joi.number().positive().optional(),
  hips: Joi.number().positive().optional(),
  shoulders: Joi.number().positive().optional(),
  armLength: Joi.number().positive().optional(),
  inseam: Joi.number().positive().optional(),
  neck: Joi.number().positive().optional(),
  height: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  notes: Joi.string().optional(),
});

const measurementsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get measurements
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, customerId } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (customerId) where.customerId = parseInt(customerId);

      const [measurements, total] = await Promise.all([
        fastify.prisma.measurement.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { dateRecorded: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        fastify.prisma.measurement.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          measurements,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Record new measurements
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createMeasurementSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const measurement = await fastify.prisma.measurement.create({
        data: {
          ...value,
          takenBy: request.user.id,
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      reply.code(201).send({
        success: true,
        data: measurement,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default measurementsRoutes;
EOF

cat > src/routes/appointments.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';
import Joi from 'joi';

const createAppointmentSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  service: Joi.string().valid('consultation', 'measurements', 'fitting', 'pickup').required(),
  date: Joi.date().required(),
  time: Joi.string().required(),
  duration: Joi.number().integer().min(15).default(60),
  notes: Joi.string().optional(),
});

const appointmentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get appointments with filters
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 10, status, service, date, customerId } = request.query;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (service) where.service = service;
      if (customerId) where.customerId = parseInt(customerId);
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        where.date = {
          gte: startDate,
          lt: endDate,
        };
      }

      const [appointments, total] = await Promise.all([
        fastify.prisma.appointment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date: 'asc' },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        }),
        fastify.prisma.appointment.count({ where }),
      ]);

      reply.send({
        success: true,
        data: {
          appointments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Schedule new appointment
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { error, value } = createAppointmentSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const appointment = await fastify.prisma.appointment.create({
        data: {
          ...value,
          createdBy: request.user.id,
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      // Broadcast new appointment event
      fastify.broadcast('appointment_scheduled', appointment);

      reply.code(201).send({
        success: true,
        data: appointment,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default appointmentsRoutes;
EOF

cat > src/routes/analytics.ts << 'EOF'
import { FastifyPluginAsync } from 'fastify';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // Sales analytics
  fastify.get('/sales', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { period = '30d' } = request.query;
      
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const totalSales = await fastify.prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: {
          createdAt: { gte: startDate },
          paymentStatus: 'paid',
        },
      });

      const salesByStatus = await fastify.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
        where: { createdAt: { gte: startDate } },
      });

      reply.send({
        success: true,
        data: {
          totalSales: totalSales._sum.total || 0,
          totalOrders: totalSales._count,
          salesByStatus,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });

  // Lead conversion analytics
  fastify.get('/leads', {
    preHandler: fastify.authenticate,
  }, async (request: any, reply) => {
    try {
      const { period = '30d' } = request.query;
      
      let startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const leadsByStatus = await fastify.prisma.lead.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      });

      const leadsBySource = await fastify.prisma.lead.groupBy({
        by: ['source'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      });

      reply.send({
        success: true,
        data: {
          leadsByStatus,
          leadsBySource,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
      });
    }
  });
};

export default analyticsRoutes;
EOF

# Create seed file
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kctmenswear.com' },
    update: {},
    create: {
      email: 'admin@kctmenswear.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101',
        address: '123 Main St, New York, NY 10001',
        dateOfBirth: new Date('1985-06-15'),
        preferences: JSON.stringify({
          style: 'classic',
          fabric: 'wool',
          color: 'navy',
        }),
      },
    }),
    prisma.customer.upsert({
      where: { email: 'michael.smith@example.com' },
      update: {},
      create: {
        name: 'Michael Smith',
        email: 'michael.smith@example.com',
        phone: '+1-555-0102',
        address: '456 Oak Ave, Los Angeles, CA 90210',
        dateOfBirth: new Date('1990-03-22'),
        preferences: JSON.stringify({
          style: 'modern',
          fabric: 'cotton',
          color: 'charcoal',
        }),
      },
    }),
  ]);

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SUIT-001' },
      update: {},
      create: {
        name: 'Classic Navy Suit',
        sku: 'SUIT-001',
        category: 'suits',
        description: 'Elegant navy blue suit perfect for business and formal occasions',
        price: 1299.99,
        fabric: 'Premium Wool',
        colors: 'Navy,Charcoal,Black',
        sizes: '36R,38R,40R,42R,44R',
        stock: 25,
        minimumStock: 5,
        images: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SHIRT-001' },
      update: {},
      create: {
        name: 'White Dress Shirt',
        sku: 'SHIRT-001',
        category: 'shirts',
        description: 'Crisp white cotton dress shirt with French cuffs',
        price: 189.99,
        fabric: 'Egyptian Cotton',
        colors: 'White,Light Blue,Pink',
        sizes: '14.5,15,15.5,16,16.5,17',
        stock: 50,
        minimumStock: 10,
        images: 'https://images.pexels.com/photos/1043475/pexels-photo-1043475.jpeg',
      },
    }),
  ]);

  // Create sample leads
  await prisma.lead.create({
    data: {
      customerId: customers[0].id,
      source: 'website',
      status: 'hot',
      score: 85,
      occasion: 'wedding',
      budgetRange: '$2000-3000',
      notes: 'Interested in custom tuxedo for wedding in June',
      nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: admin.id,
    },
  });

  // Create sample measurements
  await prisma.measurement.create({
    data: {
      customerId: customers[0].id,
      chest: 42.0,
      waist: 36.0,
      hips: 40.0,
      shoulders: 18.5,
      armLength: 25.0,
      inseam: 32.0,
      neck: 16.0,
      height: 72.0,
      weight: 180.0,
      notes: 'Athletic build, prefers slim fit',
      takenBy: admin.id,
    },
  });

  // Create sample appointment
  await prisma.appointment.create({
    data: {
      customerId: customers[0].id,
      service: 'consultation',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '10:00',
      duration: 60,
      status: 'scheduled',
      notes: 'Initial consultation for wedding tuxedo',
      createdBy: admin.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin login: admin@kctmenswear.com');
  console.log('🔑 Admin password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

# Create README
cat > README.md << 'EOF'
# KCT Menswear Backend API

A complete Fastify backend for a luxury menswear tailoring business management system with real-time features, authentication, and comprehensive business logic.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
