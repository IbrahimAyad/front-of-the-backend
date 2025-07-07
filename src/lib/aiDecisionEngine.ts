import { OpenAI } from 'openai'; // or use your preferred provider
import { PrismaClient } from '@prisma/client';

// Make OpenAI client optional to prevent server crashes
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const prisma = new PrismaClient();

export async function generateAiTasks(input: {
  campaigns?: any[];
  orders?: any[];
  leads?: any[];
  metrics?: any;
}) {
  // Return mock data if OpenAI is not configured
  if (!openai) {
    console.warn('OpenAI API key not configured, returning mock AI tasks');
    return [
      { action: 'review_campaign_performance', campaignId: 'mock-campaign-1' },
      { action: 'follow_up_leads', leadIds: ['mock-lead-1', 'mock-lead-2'] },
      { action: 'optimize_inventory', productCategories: ['suits', 'ties'] }
    ];
  }

  const systemPrompt = `
You are an AI Business Strategist for a menswear tailoring company. Based on current performance metrics, sales activity, and campaign data, generate actionable tasks.

Each task should be formatted as a JSON object like:
{ "action": "pause_campaign", "campaignId": "abc123" }

Only output an array of task objects. No explanations.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) },
      ],
      temperature: 0.4,
    });

    const jsonText = response.choices[0].message.content;
    return JSON.parse(jsonText || '[]');
  } catch (err) {
    console.error('Failed to get AI response:', err);
    // Return fallback mock data
    return [
      { action: 'review_performance', note: 'AI service unavailable' }
    ];
  }
}