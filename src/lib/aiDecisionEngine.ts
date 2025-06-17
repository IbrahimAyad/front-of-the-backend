import { OpenAI } from 'openai'; // or use your preferred provider
import { PrismaClient } from '@prisma/client';

// Only initialize OpenAI if API key is provided and not a dummy key
const openai = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('dummy') 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const prisma = new PrismaClient();

export async function generateAiTasks(input: {
  campaigns?: any[];
  orders?: any[];
  leads?: any[];
  metrics?: any;
}) {
  // If OpenAI is not available, return empty array
  if (!openai) {
    console.log('OpenAI not configured, returning empty AI tasks');
    return [];
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

    try {
      return JSON.parse(jsonText || '[]');
    } catch (err) {
      console.error('Failed to parse AI output:', err);
      return [];
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return [];
  }
}