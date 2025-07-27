import { ProductService, createProductService } from './product.service';

const mockPrisma = {
  product: {
    findMany: async (args?: any) => {
      const products = [
        {
          id: '1',
          name: 'Classic T-Shirt',
          description: 'Comfortable cotton t-shirt',
          price: 29.99,
          category: 'Shirts',
          imageUrl: '/images/tshirt.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Denim Jeans',
          description: 'Premium denim jeans',
          price: 89.99,
          category: 'Pants',
          imageUrl: '/images/jeans.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      if (args?.include?.variants) {
        return products.map(p => ({
          ...p,
          variants: [
            { id: `${p.id}-S`, productId: p.id, size: 'S', color: 'Black', stock: 10, sku: `${p.id}-S-BLK` },
            { id: `${p.id}-M`, productId: p.id, size: 'M', color: 'Black', stock: 15, sku: `${p.id}-M-BLK` },
            { id: `${p.id}-L`, productId: p.id, size: 'L', color: 'Black', stock: 5, sku: `${p.id}-L-BLK` },
          ],
        }));
      }
      
      return products;
    },
    findUnique: async (args: any) => {
      const product = {
        id: args.where.id,
        name: 'Classic T-Shirt',
        description: 'Comfortable cotton t-shirt',
        price: 29.99,
        category: 'Shirts',
        imageUrl: '/images/tshirt.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (args.include?.variants) {
        return {
          ...product,
          variants: [
            { id: '1-S', productId: '1', size: 'S', color: 'Black', stock: 10, sku: '1-S-BLK' },
            { id: '1-M', productId: '1', size: 'M', color: 'Black', stock: 15, sku: '1-M-BLK' },
            { id: '1-L', productId: '1', size: 'L', color: 'Black', stock: 5, sku: '1-L-BLK' },
          ],
        };
      }
      
      return product;
    },
    create: async (args: any) => {
      const newProduct = {
        id: '3',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (args.include?.variants) {
        return { ...newProduct, variants: [] };
      }
      
      return newProduct;
    },
    update: async (args: any) => {
      const updated = {
        id: args.where.id,
        name: args.data.name || 'Updated Product',
        description: args.data.description || 'Updated description',
        price: args.data.price || 39.99,
        category: args.data.category || 'Shirts',
        imageUrl: args.data.imageUrl || '/images/updated.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (args.include?.variants) {
        return { ...updated, variants: [] };
      }
      
      return updated;
    },
    delete: async (args: any) => {
      const deleted = {
        id: args.where.id,
        name: 'Deleted Product',
        description: 'This product was deleted',
        price: 0,
        category: 'Deleted',
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (args.include?.variants) {
        return { ...deleted, variants: [] };
      }
      
      return deleted;
    },
  },
  productVariant: {
    updateMany: async () => ({ count: 1 }),
  },
};

async function testProductService() {
  console.log('Testing ProductService...\n');
  
  const productService = createProductService({ prisma: mockPrisma });

  try {
    console.log('1. Testing findAll...');
    const products = await productService.findAll();
    console.log('✓ Found products:', products.data.length);
    console.log(`  Total pages: ${products.totalPages}`);
    console.log(`  First product: ${products.data[0]?.name}`);

    console.log('\n2. Testing findAll with filters...');
    const filteredProducts = await productService.findAll({ category: 'Shirts', minPrice: 20 });
    console.log('✓ Filtered products:', filteredProducts.data.length);

    console.log('\n3. Testing findById...');
    const product = await productService.findById('1');
    console.log('✓ Found product:', product?.name);
    console.log(`  Variants: ${product?.variants.length}`);

    console.log('\n4. Testing calculateTotalStock...');
    if (product) {
      const totalStock = productService.calculateTotalStock(product);
      console.log('✓ Total stock:', totalStock);
    }

    console.log('\n5. Testing create...');
    const newProduct = await productService.create({
      name: 'New Product',
      description: 'A brand new product',
      price: 49.99,
      category: 'Accessories',
      imageUrl: '/images/new.jpg',
    });
    console.log('✓ Created product:', newProduct.name);

    console.log('\n6. Testing update...');
    const updatedProduct = await productService.update('1', {
      name: 'Updated T-Shirt',
      price: 34.99,
    });
    console.log('✓ Updated product:', updatedProduct.name);

    console.log('\n7. Testing delete...');
    const deletedProduct = await productService.delete('1');
    console.log('✓ Deleted product:', deletedProduct.id);

    console.log('\n8. Testing checkLowStock...');
    const lowStockProducts = await productService.checkLowStock();
    console.log('✓ Low stock products:', lowStockProducts.length);

    console.log('\n9. Testing getCategories...');
    const categories = await productService.getCategories();
    console.log('✓ Categories:', categories.join(', '));

    console.log('\n✅ All ProductService tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testProductService().then(success => {
    process.exit(success ? 0 : 1);
  });
}