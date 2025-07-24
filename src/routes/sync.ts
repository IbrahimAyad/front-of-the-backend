import { FastifyPluginAsync } from 'fastify';

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  // Pull Endpoint (for manual sync)
  fastify.get('/pull-from-admin', async (request, reply) => {
    try {
      const adminApiKey = process.env.MACOS_ADMIN_API_KEY;
      
      if (!adminApiKey) {
        return reply.code(500).send({
          success: false,
          message: 'MACOS_ADMIN_API_KEY not configured'
        });
      }

      // Fetch from MacOS Admin (Backend authenticates TO MacOS Admin)
      const response = await fetch('http://localhost:8080/api/products', {
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      if (response.ok) {
        const products = await response.json();

        // Update your database with these products
        // Route to appropriate database (suits/shirts/ties) based on category
        let updatedCount = 0;

        for (const product of products) {
          try {
            // Determine category and update accordingly
            const category = product.category?.toLowerCase() || 'unknown';
            
            // Create or update product in your database
            await fastify.prisma.product.upsert({
              where: { 
                sku: product.sku || `admin-${product.id}` 
              },
              update: {
                name: product.name,
                description: product.description,
                price: product.price,
                category: category,
                inStock: product.inStock || 0,
                updatedAt: new Date(),
              },
              create: {
                sku: product.sku || `admin-${product.id}`,
                name: product.name,
                description: product.description || '',
                price: product.price,
                category: category,
                inStock: product.inStock || 0,
                isActive: true,
              }
            });
            updatedCount++;
          } catch (productError) {
            fastify.log.error(`Failed to sync product ${product.id}:`, productError);
          }
        }

        reply.send({ 
          success: true, 
          updated: updatedCount,
          total: products.length 
        });
      } else {
        reply.send({ 
          success: false, 
          message: 'MacOS Admin not running' 
        });
      }
    } catch (error: any) {
      fastify.log.error('Sync error:', error);
      reply.send({ 
        success: false, 
        message: 'Could not connect to MacOS Admin',
        error: error.message 
      });
    }
  });

  // Webhook Receiver (for push updates)
  fastify.post('/products', async (request: any, reply) => {
    try {
      const { products } = request.body;

      if (!products || !Array.isArray(products)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid payload: products array required'
        });
      }

      let updatedCount = 0;

      // Update your database
      for (const product of products) {
        try {
          // Save to appropriate database based on category
          const category = product.category?.toLowerCase() || 'unknown';
          
          await fastify.prisma.product.upsert({
            where: { 
              sku: product.sku || `admin-${product.id}` 
            },
            update: {
              name: product.name,
              description: product.description,
              price: product.price,
              category: category,
              inStock: product.inStock || 0,
              updatedAt: new Date(),
            },
            create: {
              sku: product.sku || `admin-${product.id}`,
              name: product.name,
              description: product.description || '',
              price: product.price,
              category: category,
              inStock: product.inStock || 0,
              isActive: true,
            }
          });
          updatedCount++;
        } catch (productError) {
          fastify.log.error(`Failed to update product ${product.id}:`, productError);
        }
      }

      reply.send({ 
        success: true,
        updated: updatedCount,
        total: products.length
      });
    } catch (error: any) {
      fastify.log.error('Webhook error:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  // Additional sync endpoints for other data types
  fastify.get('/pull-inventory', async (request, reply) => {
    try {
      const adminApiKey = process.env.MACOS_ADMIN_API_KEY;
      
      if (!adminApiKey) {
        return reply.code(500).send({
          success: false,
          message: 'MACOS_ADMIN_API_KEY not configured'
        });
      }

      const response = await fetch('http://localhost:8080/api/inventory', {
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      if (response.ok) {
        const inventory = await response.json();
        
        // Update inventory levels
        let updatedCount = 0;
        for (const item of inventory) {
          try {
            await fastify.prisma.product.updateMany({
              where: { sku: item.sku },
              data: { inStock: item.quantity }
            });
            updatedCount++;
          } catch (error) {
            fastify.log.error(`Failed to update inventory for ${item.sku}:`, error);
          }
        }

        reply.send({ 
          success: true, 
          updated: updatedCount,
          total: inventory.length 
        });
      } else {
        reply.send({ 
          success: false, 
          message: 'MacOS Admin not running' 
        });
      }
    } catch (error: any) {
      fastify.log.error('Inventory sync error:', error);
      reply.send({ 
        success: false, 
        message: 'Could not connect to MacOS Admin',
        error: error.message 
      });
    }
  });

  fastify.get('/pull-customers', async (request, reply) => {
    try {
      const adminApiKey = process.env.MACOS_ADMIN_API_KEY;
      
      if (!adminApiKey) {
        return reply.code(500).send({
          success: false,
          message: 'MACOS_ADMIN_API_KEY not configured'
        });
      }

      const response = await fetch('http://localhost:8080/api/customers', {
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      if (response.ok) {
        const customers = await response.json();
        
        let updatedCount = 0;
        for (const customer of customers) {
          try {
            await fastify.prisma.customer.upsert({
              where: { email: customer.email },
              update: {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                updatedAt: new Date(),
              },
              create: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone || '',
                address: customer.address || '',
              }
            });
            updatedCount++;
          } catch (error) {
            fastify.log.error(`Failed to sync customer ${customer.email}:`, error);
          }
        }

        reply.send({ 
          success: true, 
          updated: updatedCount,
          total: customers.length 
        });
      } else {
        reply.send({ 
          success: false, 
          message: 'MacOS Admin not running' 
        });
      }
    } catch (error: any) {
      fastify.log.error('Customer sync error:', error);
      reply.send({ 
        success: false, 
        message: 'Could not connect to MacOS Admin',
        error: error.message 
      });
    }
  });

  fastify.get('/pull-orders', async (request, reply) => {
    try {
      const adminApiKey = process.env.MACOS_ADMIN_API_KEY;
      
      if (!adminApiKey) {
        return reply.code(500).send({
          success: false,
          message: 'MACOS_ADMIN_API_KEY not configured'
        });
      }

      const response = await fetch('http://localhost:8080/api/orders', {
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      if (response.ok) {
        const orders = await response.json();
        
        let updatedCount = 0;
        for (const order of orders) {
          try {
            // Find customer first
            const customer = await fastify.prisma.customer.findFirst({
              where: { email: order.customerEmail }
            });

            if (customer) {
              await fastify.prisma.order.upsert({
                where: { id: order.id || `admin-${order.orderNumber}` },
                update: {
                  status: order.status,
                  totalAmount: order.totalAmount,
                  updatedAt: new Date(),
                },
                create: {
                  id: order.id || `admin-${order.orderNumber}`,
                  customerId: customer.id,
                  status: order.status || 'pending',
                  totalAmount: order.totalAmount,
                  paymentStatus: order.paymentStatus || 'pending',
                }
              });
              updatedCount++;
            }
          } catch (error) {
            fastify.log.error(`Failed to sync order ${order.id}:`, error);
          }
        }

        reply.send({ 
          success: true, 
          updated: updatedCount,
          total: orders.length 
        });
      } else {
        reply.send({ 
          success: false, 
          message: 'MacOS Admin not running' 
        });
      }
    } catch (error: any) {
      fastify.log.error('Orders sync error:', error);
      reply.send({ 
        success: false, 
        message: 'Could not connect to MacOS Admin',
        error: error.message 
      });
    }
  });
};

export default syncRoutes; 