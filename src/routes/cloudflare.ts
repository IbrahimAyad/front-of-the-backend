import { FastifyPluginAsync } from 'fastify';
import FormData from 'form-data';
import fetch from 'node-fetch';

const cloudflareRoutes: FastifyPluginAsync = async (fastify) => {
  // Get Cloudflare config from environment
  const CLOUDFLARE_CONFIG = {
    ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || 'ea644c4a47a499ad4721449cbac587f4',
    IMAGES_API_KEY: process.env.CLOUDFLARE_API_TOKEN || 'feda0b5504010de502b702700c9e403680105',
    ACCOUNT_HASH: 'QI-O2U_ayTU_H_Ilcb4c6Q',
    DELIVERY_URL: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q',
  };

  // Upload image to Cloudflare Images
  fastify.post('/upload', async (request: any, reply) => {
    console.log('📥 Upload endpoint hit!');
    console.log('📋 Headers:', request.headers);
    
    try {
      const parts = request.parts();
      let fileBuffer: Buffer | null = null;
      let filename = '';
      let mimetype = '';
      let metadata: any = {};

      // Process all parts
      for await (const part of parts) {
        if (part.type === 'file') {
          console.log('📁 File part received:', {
            filename: part.filename,
            mimetype: part.mimetype,
            fieldname: part.fieldname,
          });

          filename = part.filename || 'upload.jpg';
          mimetype = part.mimetype || 'image/jpeg';

          // Convert stream to buffer
          const chunks = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          console.log('📊 File buffer size:', fileBuffer.length);

        } else if (part.fieldname === 'metadata') {
          metadata = JSON.parse(part.value as string);
          console.log('📝 Metadata received:', metadata);
        }
      }

      if (!fileBuffer) {
        return reply.status(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      // Create FormData for Cloudflare API
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: mimetype,
      });

      // Add metadata if provided
      if (Object.keys(metadata).length > 0) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Log the configuration being used
      console.log('🔧 Cloudflare Config:', {
        ACCOUNT_ID: CLOUDFLARE_CONFIG.ACCOUNT_ID,
        API_KEY: CLOUDFLARE_CONFIG.IMAGES_API_KEY ? '***' + CLOUDFLARE_CONFIG.IMAGES_API_KEY.slice(-4) : 'NOT SET',
        URL: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1`
      });
      
      // Upload to Cloudflare
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
            // DO NOT set Content-Type - let fetch handle it with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        fastify.log.error('Cloudflare upload failed:', errorText);
        return reply.status(response.status).send({
          success: false,
          error: `Cloudflare upload failed: ${response.statusText}`,
          details: errorText,
        });
      }

      const result = await response.json();
      
      // Log the full response for debugging
      console.log('📸 Cloudflare API Response:', JSON.stringify(result, null, 2));
      
      // Check if the result has the expected structure
      if (!result.success || !result.result || !result.result.id) {
        fastify.log.error('Unexpected Cloudflare response structure:', result);
        return reply.status(500).send({
          success: false,
          error: 'Invalid response from Cloudflare',
          details: result.errors || 'No image ID returned'
        });
      }
      
      // Return success with image URLs
      return reply.send({
        success: true,
        data: {
          ...result,
          urls: {
            public: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/public`,
            thumbnail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=150,h=150,fit=cover,format=auto`,
            productCard: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=300,h=300,fit=cover,format=auto`,
            productDetail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=800,h=800,fit=cover,format=auto`,
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error uploading to Cloudflare:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to upload image',
        details: (error as Error).message,
      });
    }
  });

  // Upload from URL
  fastify.post('/upload-url', async (request: any, reply) => {
    try {
      const { url, metadata } = request.body;

      if (!url) {
        return reply.status(400).send({
          success: false,
          error: 'No URL provided'
        });
      }

      const body: any = { url };
      if (metadata) {
        body.metadata = metadata;
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return reply.status(response.status).send({
          success: false,
          error: `Cloudflare upload failed: ${response.statusText}`,
          details: errorText,
        });
      }

      const result = await response.json();
      
      return reply.send({
        success: true,
        data: {
          ...result,
          urls: {
            public: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/public`,
            thumbnail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=150,h=150,fit=cover,format=auto`,
            productCard: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=300,h=300,fit=cover,format=auto`,
            productDetail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=800,h=800,fit=cover,format=auto`,
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error uploading URL to Cloudflare:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to upload image from URL',
        details: (error as Error).message,
      });
    }
  });

  // Base64 upload endpoint (bypasses multipart issues)
  fastify.post('/upload-base64', async (request: any, reply) => {
    console.log('📥 Base64 upload endpoint hit!');
    
    try {
      const { image, filename, mimetype, metadata } = request.body;
      
      if (!image) {
        return reply.status(400).send({
          success: false,
          error: 'No image data provided'
        });
      }

      // Convert base64 to buffer
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      console.log('📊 Base64 buffer size:', fileBuffer.length);

      // Create FormData for Cloudflare API
      const FormData = await import('form-data');
      const formData = new FormData.default();
      formData.append('file', fileBuffer, {
        filename: filename || 'upload.jpg',
        contentType: mimetype || 'image/jpeg',
      });

      // Add metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Upload to Cloudflare
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Cloudflare error:', errorText);
        return reply.status(response.status).send({
          success: false,
          error: `Cloudflare upload failed: ${response.statusText}`,
          details: errorText,
        });
      }

      const result = await response.json();
      
      console.log('✅ Upload successful:', result.result.id);
      
      return reply.send({
        success: true,
        data: {
          ...result,
          urls: {
            public: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/public`,
            thumbnail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=150,h=150,fit=cover,format=auto`,
            productCard: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=300,h=300,fit=cover,format=auto`,
            productDetail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${result.result.id}/w=800,h=800,fit=cover,format=auto`,
          }
        }
      });

    } catch (error) {
      console.log('💥 Base64 upload error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to upload image',
        details: (error as Error).message,
      });
    }
  });

  // Delete image from Cloudflare
  fastify.delete('/images/:imageId', async (request: any, reply) => {
    try {
      const { imageId } = request.params;

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return reply.status(response.status).send({
          success: false,
          error: `Failed to delete image: ${response.statusText}`,
          details: errorText,
        });
      }

      return reply.send({
        success: true,
        message: 'Image deleted successfully'
      });

    } catch (error) {
      fastify.log.error('Error deleting image from Cloudflare:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete image',
        details: (error as Error).message,
      });
    }
  });

  // Get image details
  fastify.get('/images/:imageId', async (request: any, reply) => {
    try {
      const { imageId } = request.params;

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return reply.status(response.status).send({
          success: false,
          error: `Failed to get image details: ${response.statusText}`,
          details: errorText,
        });
      }

      const result = await response.json();
      
      return reply.send({
        success: true,
        data: {
          ...result,
          urls: {
            public: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/public`,
            thumbnail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/w=150,h=150,fit=cover,format=auto`,
            productCard: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/w=300,h=300,fit=cover,format=auto`,
            productDetail: `${CLOUDFLARE_CONFIG.DELIVERY_URL}/${imageId}/w=800,h=800,fit=cover,format=auto`,
          }
        }
      });

    } catch (error) {
      fastify.log.error('Error getting image details from Cloudflare:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get image details',
        details: (error as Error).message,
      });
    }
  });

  // List images
  fastify.get('/images', async (request: any, reply) => {
    try {
      const { page = 1, per_page = 25 } = request.query;

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.ACCOUNT_ID}/images/v1?page=${page}&per_page=${per_page}`,
        {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.IMAGES_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return reply.status(response.status).send({
          success: false,
          error: `Failed to list images: ${response.statusText}`,
          details: errorText,
        });
      }

      const result = await response.json();
      
      return reply.send({
        success: true,
        data: result
      });

    } catch (error) {
      fastify.log.error('Error listing images from Cloudflare:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to list images',
        details: (error as Error).message,
      });
    }
  });
};

export default cloudflareRoutes; 