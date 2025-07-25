import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

interface DebugParams {
  productId: string;
}

const debugRoutes: FastifyPluginAsync = async (fastify) => {
  // Debug endpoint to check variant data structure for a specific product
  fastify.get<{ Params: DebugParams }>('/variants/:productId', async (request: FastifyRequest<{ Params: DebugParams }>, reply: FastifyReply) => {
    try {
      const { productId } = request.params;
      
      const product = await fastify.prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: true,
          images: true
        }
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
          totalVariants: product.variants.length
        },
        variants: product.variants.map((variant, index) => ({
          index,
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
          isActive: variant.isActive,
          hasSize: variant.size !== null && variant.size !== undefined && variant.size !== '',
          hasColor: variant.color !== null && variant.color !== undefined && variant.color !== ''
        })),
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.altText
        }))
      };
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to fetch product variants',
        details: (error as Error).message 
      });
    }
  });

  // Debug endpoint to check tie colors specifically
  fastify.get('/ties-colors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tieProducts = await fastify.prisma.product.findMany({
        where: {
          OR: [
            { category: { contains: 'Tie', mode: 'insensitive' } },
            { name: { contains: 'tie', mode: 'insensitive' } },
            { name: { contains: 'bow', mode: 'insensitive' } }
          ]
        },
        include: {
          variants: true
        }
      });

      const colorAnalysis = tieProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        totalVariants: product.variants.length,
        uniqueColors: [...new Set(product.variants.map(v => v.color).filter(Boolean))],
        nullColors: product.variants.filter(v => !v.color || v.color === '').length,
        variantSample: product.variants.slice(0, 3).map(v => ({
          id: v.id,
          name: v.name,
          size: v.size,
          color: v.color,
          sku: v.sku
        }))
      }));

      return {
        success: true,
        totalTieProducts: tieProducts.length,
        products: colorAnalysis,
        summary: {
          totalVariants: tieProducts.reduce((sum, p) => sum + p.variants.length, 0),
          productsWithVariants: tieProducts.filter(p => p.variants.length > 0).length,
          variantsWithColors: tieProducts.reduce((sum, p) => sum + p.variants.filter(v => v.color && v.color !== '').length, 0)
        }
      };
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to fetch tie colors',
        details: (error as Error).message 
      });
    }
  });

  // Debug endpoint to check suit sizes specifically
  fastify.get('/suits-sizes', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const suitProducts = await fastify.prisma.product.findMany({
        where: {
          OR: [
            { category: { contains: 'Suit', mode: 'insensitive' } },
            { name: { contains: 'suit', mode: 'insensitive' } }
          ]
        },
        include: {
          variants: true
        }
      });

      const sizeAnalysis = suitProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        totalVariants: product.variants.length,
        uniqueSizes: [...new Set(product.variants.map(v => v.size).filter(Boolean))],
        nullSizes: product.variants.filter(v => !v.size || v.size === '').length,
        variantSample: product.variants.slice(0, 5).map(v => ({
          id: v.id,
          name: v.name,
          size: v.size,
          color: v.color,
          sku: v.sku
        }))
      }));

      return {
        success: true,
        totalSuitProducts: suitProducts.length,
        products: sizeAnalysis,
        summary: {
          totalVariants: suitProducts.reduce((sum, p) => sum + p.variants.length, 0),
          productsWithVariants: suitProducts.filter(p => p.variants.length > 0).length,
          variantsWithSizes: suitProducts.reduce((sum, p) => sum + p.variants.filter(v => v.size && v.size !== '').length, 0)
        }
      };
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to fetch suit sizes',
        details: (error as Error).message 
      });
    }
  });

  // Debug endpoint to check admin user exists
  fastify.get('/check-admin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminUser = await fastify.prisma.user.findFirst({
        where: {
          email: 'admin@kct.com'
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      return {
        success: true,
        adminExists: !!adminUser,
        adminData: adminUser
      };
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to check admin user',
        details: (error as Error).message 
      });
    }
  });

  // Debug endpoint to check image persistence
  fastify.get('/images-check', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const productsWithImages = await fastify.prisma.product.findMany({
        where: {
          images: {
            some: {}
          }
        },
        include: {
          images: true
        },
        take: 10
      });

      return {
        success: true,
        totalProductsWithImages: productsWithImages.length,
        imageAnalysis: productsWithImages.map(product => ({
          id: product.id,
          name: product.name,
          imageCount: product.images.length,
          images: product.images.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.altText,
            isCloudflareUrl: img.url.includes('imagedelivery.net'),
            urlLength: img.url.length
          }))
        }))
      };
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to check images',
        details: (error as Error).message 
      });
    }
  });
};

export default debugRoutes;