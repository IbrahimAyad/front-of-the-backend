import express from 'express';
import tiesApiService from '../services/tiesApiService.js';

const router = express.Router();

// GET /api/products - Unified endpoint for all products
router.get('/', async (req, res) => {
  try {
    const { include, page = 1, limit = 10, category, source } = req.query;
    let allProducts = [];
    let sourceStats = {
      native: 0,
      suits: 0,
      ties: 0
    };

    // Include ties if requested
    if (include && include.includes('ties')) {
      try {
        // Use the enhanced tiesApiService which includes color families and variants
        const tiesResult = await tiesApiService.getProductsWithColors(1, 100);
        
        if (tiesResult && tiesResult.products) {
          allProducts = [...allProducts, ...tiesResult.products];
          sourceStats.ties = tiesResult.products.length;
          
          console.log(`✅ Loaded ${tiesResult.products.length} ties products`);
          console.log(`✅ Color families available: ${tiesResult.colorFamilies?.length || 0}`);
        }
      } catch (tiesError) {
        console.error('❌ Ties service error:', tiesError.message);
        // Continue without ties products rather than failing completely
      }
    }

    // Apply filters
    let filteredProducts = allProducts;
    
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (source && source !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.source === source
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit), 
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit)
      },
      stats: {
        total: allProducts.length,
        filtered: filteredProducts.length,
        sources: sourceStats
      },
      meta: {
        timestamp: new Date().toISOString(),
        sources_status: {
          ties: include && include.includes('ties') ? 'included' : 'not_requested'
        }
      }
    });

  } catch (error) {
    console.error('❌ Products API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
