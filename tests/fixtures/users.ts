export const testUsers = {
  admin: {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    password: '$2b$10$YourHashedPasswordHere',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  user: {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    password: '$2b$10$YourHashedPasswordHere',
    role: 'USER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  inactive: {
    id: '3',
    email: 'inactive@example.com',
    name: 'Inactive User',
    password: '$2b$10$YourHashedPasswordHere',
    role: 'USER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}