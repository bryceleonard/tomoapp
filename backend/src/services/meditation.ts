import { generateMeditationText } from '../config/openai';
import { saveMeditation } from './meditationStorage';

export async function generateMeditation(feeling: string, duration: number, userId: string) {
  try {
    console.log('=== Meditation Service: Starting Generation ===');
    console.log('Input:', { feeling, duration, userId });

    // Generate meditation text using OpenAI
    console.log('Calling OpenAI to generate meditation text...');
    const meditationText = await generateMeditationText(feeling, duration);
    console.log('Received meditation text from OpenAI');

    // Save meditation to Firebase
    console.log('Saving meditation to Firebase...');
    const meditation = await saveMeditation({
      feeling,
      duration,
      userId,
      meditationText,
      createdAt: new Date()
    });
    console.log('Meditation saved successfully:', meditation);

    return meditation;
  } catch (error) {
    console.error('Error in meditation service:', error);
    throw error;
  }
} 