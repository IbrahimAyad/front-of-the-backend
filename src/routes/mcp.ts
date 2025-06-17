import { FastifyPluginAsync } from 'fastify';
import { generateAiTasks } from '../lib/aiDecisionEngine';
import { dispatchTaskToAgent } from '../lib/agentRouter';

const mcpRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/mcp/execute-tasks', async (request, reply) => {
    const { campaigns, orders, leads, metrics } = request.body as any;

    const tasks = await generateAiTasks({ campaigns, orders, leads, metrics });

    for (const task of tasks) {
      // Save the task to the database
      const dbTask = await fastify.prisma.aiAction.create({
        data: {
          agent: 'decision-engine',
          input: request.body as any,
          output: task as any,
          status: 'executed',
        },
      });

      // Try to dispatch to agent
      try {
        await dispatchTaskToAgent(task);
        await fastify.prisma.aiAction.update({
          where: { id: dbTask.id },
          data: { status: 'dispatched' },
        });
      } catch (err) {
        await fastify.prisma.aiAction.update({
          where: { id: dbTask.id },
          data: { status: 'failed' },
        });
      }
    }

    reply.send({ success: true, tasks });
  });
};

export default mcpRoutes;