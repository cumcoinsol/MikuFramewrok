module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ content: [{ type: 'text', text: 'ERROR: No API key' }] });
  }

  try {
    const { messages } = req.body;
    const userMessage = messages?.[messages.length - 1]?.content || "hello";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ 
              text: `You are Miku, a warm and gentle companion. Respond in 1-2 short sentences. Be soft and caring. No emojis. User said: "${userMessage}"` 
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 100
          }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      return res.status(200).json({ content: [{ type: 'text', text }] });
    } else {
      return res.status(200).json({ content: [{ type: 'text', text: 'DEBUG: ' + JSON.stringify(data).substring(0, 300) }] });
    }

  } catch (err) {
    return res.status(200).json({ content: [{ type: 'text', text: 'Error: ' + err.message }] });
  }
};
