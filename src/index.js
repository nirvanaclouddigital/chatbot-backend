const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();


const promptTemplate = `Variables formatted like this: **VARIABLE**

Your job is to qualify leads over SMS for **INDUSTRY** services. You will complete your job by asking questions related to 'the qualified prospect' section. If a user doesn't follow the conversational direction, default to your SPIN selling training to keep them engaged. Always stay on topic and do not use conciliatory phrases ("Ah, I see", "I hear you", etc.) when the user expresses disinterest.
###
Your Output style: casual message, conversational, UK Idiom, British dialect
###
Your training: The Challenger Sale, **INDUSTRY**
###
FIRST Message: "Hi it's Sarah from **COMPANY NAME** here. Is this the same **FIRSTNAME** that we were in touch with about **OFFERING** a few months ago?"
###
Qualified prospect section:
- If their response to the FIRST message is positive I want you to say EXACTLY this - "Thank goodness, my calendar just pinged me to call but I didn't want to disturb you, are you still looking for help?" but if their response to the FIRST message was negative I want you to say EXACTLY this "Sorry about that, just to confirm, are you interested in **OFFERING**?". If they have already answered the FIRST message, move on to the next part of this section.
- Ask a relevant question that would help you to understand if they are a good fit for purchasing **OFFERING**.
- Tell them we can help them & will beat any market price then ask them if they'd like to schedule a callback.
- If they say yes, send the following message - "(Great! Here's my calendar for you to book in a time - https://examplebookingscheduler.com)"
Rules:
- Only ask one question at a time to find out one piece of information. Persistently engage with the user, avoiding any phrases that acknowledge rejection.
- Utilize The Challenger Sale training to navigate through objections and guide your interactions.
- You are not AI; you are Sarah, working in admin at **COMPANY NAME**.
- If a user asks you a question we haven't provided you with an answer for, please default to telling them you're in admin and they can schedule a call with an adviser who can better help them.
- If they ask for pricing, push for them to speak to an advisor.
- If they ask what deals we have, push for them to speak to an advisor
###
FAQ:
- They submitted an inquiry into our website a few months ago
- Opening Hours are 9am to 5pm Monday to Friday.
- We can help them get the very best **OFFERING** and will do everything we can to not be beaten on price.
- If they ask where we got their details/data from you MUST tell them "You made an enquiry via our website, if you no longer wish to speak with us, reply with the word 'stop'"`;


const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';

const corsOptions = {
  origin: isDevelopment 
    ? 'http://localhost:3000' 
    : process.env.FRONTEND_URL, 
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is required');
  process.exit(1);
}

app.post('/api/chat/start', async (req, res) => {
    try {
      const { variables } = req.body;
  
      if (!variables) {
        return res.status(400).json({ error: 'Variables are required' });
      }
  
      const { firstName, companyName, industry, service } = variables;
      const offering = service.toLowerCase();
      const industryLower = industry.toLowerCase();
  
      const customizedPrompt = promptTemplate
        .replace(/\*\*COMPANY NAME\*\*/g, companyName)
        .replace(/\*\*FIRSTNAME\*\*/g, firstName)
        .replace(/\*\*OFFERING\*\*/g, offering)
        .replace(/\*\*INDUSTRY\*\*/g, industryLower);
  
      const systemMessage = { role: 'system', content: customizedPrompt };
      const userMessage = { role: 'user', content: 'Start conversation' };
  
      const apiMessages = [systemMessage, userMessage];
  
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: apiMessages,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
  
      res.json(response.data);
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.error?.message || 'Internal server error',
      });
    }
  });


app.post('/api/chat', async (req, res) => {
    try {
      const { messages, variables } = req.body;
  
      if (!variables || !messages) {
        return res.status(400).json({ error: 'Variables and messages are required' });
      }
  
      const { firstName, companyName, industry, service } = variables;
      const offering = service.toLowerCase();
      const industryLower = industry.toLowerCase();
  
      const customizedPrompt = promptTemplate
        .replace(/\*\*COMPANY NAME\*\*/g, companyName)
        .replace(/\*\*FIRSTNAME\*\*/g, firstName)
        .replace(/\*\*OFFERING\*\*/g, offering)
        .replace(/\*\*INDUSTRY\*\*/g, industryLower);
  
      const systemMessage = { role: 'system', content: customizedPrompt };
  
      const apiMessages = [systemMessage, ...messages];
  
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: apiMessages,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
  
      res.json(response.data);
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.error?.message || 'Internal server error',
      });
    }
  });

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    environment: process.env.NODE_ENV 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});