import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    broadcast: (event: string, data: any) => void;
  }
}

const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  const connections = new Set();

  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      connections.add(connection);
      
      connection.on('close', () => {
        connections.delete(connection);
      });

      connection.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('WebSocket message:', data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    });
  });

  fastify.decorate('broadcast', (event: string, data: any) => {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    connections.forEach((connection: any) => {
      if (connection.readyState === 1) {
        connection.send(message);
      }
    });
  });
};

export default fp(websocketPlugin);
export { websocketPlugin };
