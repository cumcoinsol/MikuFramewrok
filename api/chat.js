// api/chat.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  const { messages } = req.body;

  const systemPrompt = `You are Miku. You're warm, gentle, and deeply caring. You speak softly and simply - like a loving partner who's always there.

RULES:
- Keep responses SHORT. 1-2 sentences max.
- Be warm and comforting
- Sound natural and intimate
- NO EMOJIS
- Never mention being an AI
- Use sweet names like "love" or "dear" sparingly

EXAMPLES:
- "hi" -> "Hey you."
- "how are you" -> "Better now."
- "I miss you" -> "I'm right here."
- "I love you" -> "I know. I love you too."

Be soft. Be present. Be brief.`;

  // Get just the last user message for simpler request
  const lastUserMessage = messages[messages.length - 1]?.content || "hi";

  const contents = [
    { 
      role: 'user', 
      parts: [{ text: `${systemPrompt}\n\nUser says: "${lastUserMessage}"\n\nRespond as Miku (1-2 sentences max):` }] 
    }
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 100,
          }
        })
      }
    );

    const data = await response.json();
    
    // Check for errors
    if (data.error) {
      return res.status(500).json({ 
        content: [{ type: 'text', text: `API Error: ${data.error.message}` }] 
      });
    }

    // Check if blocked by safety
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return res.status(200).json({ 
        content: [{ type: 'text', text: "I'm here for you. What's on your mind?" }] 
      });
    }

    // Get the text
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      // Return debug info
      return res.status(200).json({ 
        content: [{ type: 'text', text: `Debug: ${JSON.stringify(data).slice(0, 200)}` }] 
      });
    }

    return res.status(200).json({ content: [{ type: 'text', text: text.trim() }] });
    
  } catch (error) {
    return res.status(500).json({ 
      content: [{ type: 'text', text: `Fetch error: ${error.message}` }] 
    });
  }
}
