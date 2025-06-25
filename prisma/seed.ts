import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Entered main()');

  try {
    console.log('🧨 Clearing existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.measurement.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️ Cleared existing data');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Password hashed:', hashedPassword.slice(0, 8) + '...');

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: 'admin@kctmenswear.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created:', user.email);

    // Create sample customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: 'John Smith',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@email.com',
          phone: '+1-555-0101',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      }),
      prisma.customer.create({
        data: {
          name: 'Michael Johnson',
          firstName: 'Michael',
          lastName: 'Johnson',
          email: 'michael.johnson@email.com',
          phone: '+1-555-0102',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
        },
      }),
      prisma.customer.create({
        data: {
          name: 'David Wilson',
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@email.com',
          phone: '+1-555-0103',
          address: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
        },
      }),
      prisma.customer.create({
        data: {
          name: 'Robert Brown',
          firstName: 'Robert',
          lastName: 'Brown',
          email: 'robert.brown@email.com',
          phone: '+1-555-0104',
          address: '321 Elm St',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA',
        },
      }),
      prisma.customer.create({
        data: {
          name: 'James Davis',
          firstName: 'James',
          lastName: 'Davis',
          email: 'james.davis@email.com',
          phone: '+1-555-0105',
          address: '654 Maple Ave',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85001',
          country: 'USA',
        },
      }),
    ]);
    console.log('✅ Created', customers.length, 'customers');

    // Create sample products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Custom Three-Piece Suit',
          description: 'Luxury handcrafted three-piece suit with jacket, vest, and trousers',
          category: 'Suits',
          price: 2500.00,
          sku: 'SUIT-3PC-001',
          totalStock: 10,
          availableStock: 8,
          isPublished: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Wedding Tuxedo',
          description: 'Classic black-tie tuxedo perfect for weddings and formal events',
          category: 'Formal Wear',
          price: 1800.00,
          sku: 'TUX-WED-001',
          totalStock: 15,
          availableStock: 12,
          isPublished: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Business Suit',
          description: 'Professional two-piece business suit for corporate settings',
          category: 'Business',
          price: 1200.00,
          sku: 'SUIT-BUS-001',
          totalStock: 20,
          availableStock: 18,
          isPublished: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Casual Blazer',
          description: 'Versatile casual blazer for smart-casual occasions',
          category: 'Casual',
          price: 800.00,
          sku: 'BLZR-CAS-001',
          totalStock: 25,
          availableStock: 22,
          isPublished: true,
        },
      }),
    ]);
    console.log('✅ Created', products.length, 'products');

    // Create sample orders
    const orders = await Promise.all([
      prisma.order.create({
        data: {
          customerId: customers[0].id,
          total: 2500.00,
          totalAmount: 2500.00,
          status: 'COMPLETED',
          paymentStatus: 'paid',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: 'Wedding suit for June ceremony',
          items: {
            create: [
              {
                productId: products[0].id,
                quantity: 1,
                price: 2500.00,
                customizations: 'Navy blue, slim fit, peak lapels',
              },
            ],
          },
        },
      }),
      prisma.order.create({
        data: {
          customerId: customers[1].id,
          total: 1800.00,
          totalAmount: 1800.00,
          status: 'IN_PROGRESS',
          paymentStatus: 'paid',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          notes: 'Black tuxedo for gala event',
          items: {
            create: [
              {
                productId: products[1].id,
                quantity: 1,
                price: 1800.00,
                customizations: 'Classic black, satin lapels, bow tie included',
              },
            ],
          },
        },
      }),
      prisma.order.create({
        data: {
          customerId: customers[2].id,
          total: 1200.00,
          totalAmount: 1200.00,
          status: 'CONFIRMED',
          paymentStatus: 'pending',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          notes: 'Business suit for new job',
          items: {
            create: [
              {
                productId: products[2].id,
                quantity: 1,
                price: 1200.00,
                customizations: 'Charcoal gray, modern fit, notch lapels',
              },
            ],
          },
        },
      }),
      prisma.order.create({
        data: {
          customerId: customers[3].id,
          total: 800.00,
          totalAmount: 800.00,
          status: 'PENDING',
          paymentStatus: 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          notes: 'Casual blazer for weekend events',
          items: {
            create: [
              {
                productId: products[3].id,
                quantity: 1,
                price: 800.00,
                customizations: 'Light blue, unstructured, patch pockets',
              },
            ],
          },
        },
      }),
    ]);
    console.log('✅ Created', orders.length, 'orders');

    // Create sample leads
    const leads = await Promise.all([
      prisma.lead.create({
        data: {
          customerId: customers[4].id,
          source: 'WEBSITE',
          status: 'NEW',
          value: 3000.00,
          notes: 'Interested in custom wedding suits for groomsmen',
        },
      }),
      prisma.lead.create({
        data: {
          customerId: customers[0].id,
          source: 'REFERRAL',
          status: 'QUALIFIED',
          value: 1500.00,
          notes: 'Referred by existing customer, looking for business attire',
        },
      }),
      prisma.lead.create({
        data: {
          customerId: customers[1].id,
          source: 'SOCIAL_MEDIA',
          status: 'CONTACTED',
          value: 2200.00,
          notes: 'Saw Instagram post, interested in formal wear',
        },
      }),
      prisma.lead.create({
        data: {
          source: 'WALK_IN',
          status: 'NEW',
          value: 1800.00,
          notes: 'Walk-in customer, no contact info yet',
        },
      }),
    ]);
    console.log('✅ Created', leads.length, 'leads');

    // Create sample appointments
    const appointments = await Promise.all([
      prisma.appointment.create({
        data: {
          customerId: customers[0].id,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
          type: 'FITTING',
          status: 'SCHEDULED',
          notes: 'Final fitting for wedding suit',
        },
      }),
      prisma.appointment.create({
        data: {
          customerId: customers[1].id,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours later
          type: 'MEASUREMENT',
          status: 'CONFIRMED',
          notes: 'Initial measurements for tuxedo',
        },
      }),
      prisma.appointment.create({
        data: {
          customerId: customers[2].id,
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
          type: 'CONSULTATION',
          status: 'SCHEDULED',
          notes: 'Consultation for business suit options',
        },
      }),
    ]);
    console.log('✅ Created', appointments.length, 'appointments');

    // Create sample measurements
    const measurements = await Promise.all([
      prisma.measurement.create({
        data: {
          customerId: customers[0].id,
          dateRecorded: new Date(),
          chest: 42.0,
          waist: 34.0,
          hips: 38.0,
          inseam: 32.0,
          outseam: 44.0,
          shoulders: 18.0,
          armLength: 25.0,
          neckSize: 16.0,
          jacketLength: 30.0,
          notes: 'Standard measurements, athletic build',
        },
      }),
      prisma.measurement.create({
        data: {
          customerId: customers[1].id,
          dateRecorded: new Date(),
          chest: 40.0,
          waist: 32.0,
          hips: 36.0,
          inseam: 34.0,
          outseam: 46.0,
          shoulders: 17.5,
          armLength: 26.0,
          neckSize: 15.5,
          jacketLength: 31.0,
          notes: 'Tall and lean build, longer proportions',
        },
      }),
    ]);
    console.log('✅ Created', measurements.length, 'measurements');

    console.log('🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${orders.length} orders`);
    console.log(`   - ${leads.length} leads`);
    console.log(`   - ${appointments.length} appointments`);
    console.log(`   - ${measurements.length} measurements`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });