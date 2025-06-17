import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema } from '../schemas/auth';
import { SERVER_CONFIG } from '../config/server';

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
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
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
        fastify.log.warn('❌ Login validation error:', error.details);
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const { email, password } = value;
      fastify.log.info(`🔍 Login attempt for email: ${email}`);

      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        fastify.log.warn(`❌ User not found: ${email}`);
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Verify password
      const isValidPassword = await fastify.comparePassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        fastify.log.warn(`❌ Invalid password for user: ${email}`);
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Generate tokens
      let tokens;
      try {
        tokens = fastify.generateTokens(user.id);
        fastify.log.info(`✅ Tokens generated for user: ${email}`);
      } catch (tokenError: any) {
        fastify.log.error('💥 Token generation failed:', tokenError);
        return reply.code(500).send({
          success: false,
          error: 'Token generation failed',
          details: process.env.NODE_ENV === 'development' ? tokenError?.message : undefined,
        });
      }

      // Save refresh token
      try {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: tokens.refreshToken },
        });
        fastify.log.info(`✅ Refresh token saved for user: ${email}`);
      } catch (dbError: any) {
        fastify.log.error('💥 Database update failed:', dbError);
        return reply.code(500).send({
          success: false,
          error: 'Database update failed',
          details: process.env.NODE_ENV === 'development' ? dbError?.message : undefined,
        });
      }

      fastify.log.info(`🎉 Login successful for user: ${email}`);
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
    } catch (error: any) {
      fastify.log.error('💥 Unexpected login error:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
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

  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { error, value } = refreshTokenSchema.validate(request.body);
      if (error) {
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          details: error.details,
        });
      }

      const { refreshToken } = value;

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, SERVER_CONFIG.JWT_REFRESH_SECRET);
      } catch (jwtError) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid refresh token',
        });
      }

      // Find user and verify refresh token
      const user = await fastify.prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          refreshToken: refreshToken,
        },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid refresh token',
        });
      }

      // Generate new tokens
      const tokens = fastify.generateTokens(user.id);

      // Update refresh token in database
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
