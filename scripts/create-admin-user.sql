-- Create Admin User with known password
-- Password: admin123

-- First, delete any existing admin user
DELETE FROM users WHERE email = 'admin@kctmenswear.com';

-- Create new admin user with proper password hash
-- This hash is for password: admin123
INSERT INTO users (
    id,
    email, 
    "passwordHash",
    "firstName",
    "lastName",
    name,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'cm3admin-0000-0000-0000-000000000001',
    'admin@kctmenswear.com',
    '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u',
    'Admin',
    'User',
    'Admin User',
    'ADMIN',
    true,
    NOW(),
    NOW()
);

-- Verify user was created
SELECT id, email, name, role, "isActive" 
FROM users 
WHERE email = 'admin@kctmenswear.com';

-- Also create a test customer user
-- Password: test123
INSERT INTO users (
    id,
    email,
    "passwordHash", 
    "firstName",
    "lastName",
    name,
    role,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'cm3test-0000-0000-0000-000000000002',
    'test@kctmenswear.com',
    '$2a$10$YGQnXPcQXYQQpUL0hqLSyO2xfe2jF7Ibkz9No8e8t1K2JrM4cjLRW',
    'Test',
    'Customer',
    'Test Customer',
    'CUSTOMER',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- List all users
SELECT id, email, name, role FROM users;