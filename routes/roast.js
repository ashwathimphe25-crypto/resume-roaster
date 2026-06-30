require('dotenv').config();
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'resumeText is required' });
    }

    if (resumeText.length < 200) {
      return res.status(400).json({ error: 'Resume text must be at least 200 characters.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Resume Roaster'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          {
            role: 'user',
            content: 'You are a witty, brutally honest resume reviewer. Read this resume and provide a short roast that is funny but also genuinely useful. End with one actionable tip.\n\n' + resumeText
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const roast = data.choices[0].message.content;
    res.status(200).json({ roast });

  } catch (error) {
    console.error('Roast error:', error);
    res.status(500).json({ error: 'Something went wrong roasting your resume.' });
  }
});

module.exports = router;