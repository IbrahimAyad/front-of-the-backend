import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdminUser() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@kct.com'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@kct.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdminUser();