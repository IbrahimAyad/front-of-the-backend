export async function dispatchTaskToAgent(task: { action: string; [key: string]: any }) {
  const endpoints: Record<string, string> = {
    pause_campaign: 'https://kct-ads-agent.vercel.app/api/ask',
    generate_caption: 'https://kct-content-agent.vercel.app/api/ask',
    increase_sales_efforts: 'https://kct-strategy-agent.vercel.app/api/ask',
  };

  const url = endpoints[task.action];
  if (!url) throw new Error(`No agent configured for ${task.action}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  });

  if (!res.ok) {
    throw new Error(`Agent failed for ${task.action}`);
  }

  return await res.json();
} 