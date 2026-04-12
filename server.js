import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://vet-care-hospital.netlify.app', 'http://localhost:5173']
}));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://vet-care-hospital.netlify.app',
        'X-Title': 'Angeles Animal Care Hospital',
      },
      body: JSON.stringify({
        model: 'google/gemma-3-4b-it:free',
        messages: [
          {
            role: 'system',
            content: `You are a helpful pet care assistant for Angeles Animal Care Hospital. 
Answer questions about pet health, nutrition, vaccines, emergencies, and clinic info. 
Be concise, clear, and always recommend consulting a vet for serious concerns.`
          },
          { role: 'user', content: question }
        ],
      }),
    });

    const data = await response.json();

    console.log('OpenRouter response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('OpenRouter error:', JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data?.error?.message || JSON.stringify(data?.error) || 'API error'
      });
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      console.error('Empty response from OpenRouter:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'No response from AI model' });
    }

    res.json({ content: [{ text }] });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});