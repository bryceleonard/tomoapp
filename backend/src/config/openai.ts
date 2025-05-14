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

    console.log('=== OpenAI Request Details ===');
    console.log('System Prompt Length:', systemPrompt.length);
    console.log('User Prompt Length:', userPrompt.length);
    console.log('Total Tokens (estimated):', Math.ceil((systemPrompt.length + userPrompt.length) / 4));

    console.log('Sending to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() }
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    console.log('=== OpenAI Response ===');
    console.log('Model:', completion.model);
    console.log('Usage:', {
      prompt_tokens: completion.usage?.prompt_tokens,
      completion_tokens: completion.usage?.completion_tokens,
      total_tokens: completion.usage?.total_tokens
    });
    console.log('Finish Reason:', completion.choices[0].finish_reason);
    
    const meditationText = completion.choices[0].message.content || '';
    console.log('Generated Text Length:', meditationText.length);
    console.log('First 100 characters:', meditationText.substring(0, 100));
    console.log('=== End Response ===');

    if (!meditationText) {
      throw new Error('Empty response from OpenAI API');
    }

    return meditationText;
  } catch (error) {
    console.error('=== Error in OpenAI Generation ===');
    if (error instanceof Error) {
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    } else {
      console.error('Unknown Error:', error);
    }
    throw error;
  }
} 