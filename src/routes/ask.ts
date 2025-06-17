import { FastifyPluginAsync } from 'fastify';

const askRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/ask', async (request, reply) => {
    console.log('Received agent task:', request.body);
    reply.send({ success: true, message: 'Simulated agent response' });
  });
};

export default askRoute; 