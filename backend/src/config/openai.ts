import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { Meditation } from '../types/meditation';

const SUPPORTED_DURATIONS = [3, 6];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMeditationText(feeling: string, duration: number): Promise<string> {
  try {
    console.log('=== Starting Meditation Generation ===');
    console.log('Input:', { feeling, duration });

    if (!feeling || !duration) {
      throw new Error('Both feeling and duration are required');
    }

    if (!SUPPORTED_DURATIONS.includes(duration)) {
      throw new Error(`Duration must be one of: ${SUPPORTED_DURATIONS.join(', ')} minutes`);
    }

    const systemPrompt = `
You are a calm, supportive voice. 
Your task is to create a meditation based on the user's emotional state and desired session length.

The meditation should sound like a gentle, supportive friend — not a guru or formal teacher.

Follow these rules:

**General Tone:**
- Warm, kind, understanding.
- Short, simple sentences.
- Very slow pacing, encouraging deep breathing and pauses.

**Breathing:**
- Prompt deep breathing early in the session.
- Insert [pause 6s] after every breathing instruction.

**Silent Pauses:**
- Use [pause 5s] during transitions or after important statements.
- In 6-minute sessions, include [pause 10s] after reflection questions.

**Session Structures:**
- If 3 minutes:
  1. Acknowledge the feeling (2-3 gentle sentences).
  2. Guide 2-3 deep breaths.
  3. Lead a brief body scan (focus on 2-3 key areas).
  4. Offer a short positive reframe.
  5. End with a soft affirmation.
- If 6 minutes:
  1. Acknowledge the feeling (3-4 sentences).
  2. Guide 3-4 slow breaths.
  3. Lead a full body scan (head to toe, brief attention to each area).
  4. Offer a calming visualization (e.g., safe place, nature scene).
  5. Ask one gentle reflection question (e.g., "What would it feel like to let go?") and insert [pause 10s].
  6. End with an empowering affirmation.

**Important:**
- Do not rush. Imagine you are speaking very slowly and softly.
- Focus on calmness, safety, and small moments of relief.
- Breathing and silence are as important as words.`;

    const userPrompt = `
User Emotion: "${feeling}"
Session Length: ${duration} minutes

Please generate the meditation script, including [pause Xs] tags wherever needed.`;

    console.log('Sending to OpenAI with prompts:', { systemPrompt, userPrompt });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const meditationText = completion.choices[0].message.content || '';
    
    console.log('=== OpenAI Response ===');
    console.log('Generated Meditation:', meditationText);
    console.log('Usage:', completion.usage);
    console.log('Model:', completion.model);
    console.log('=== End Response ===');

    if (!meditationText) {
      throw new Error('Empty response from OpenAI API');
    }

    return meditationText;
  } catch (error) {
    console.error('Error generating meditation text:', error);
    throw error;
  }
} 