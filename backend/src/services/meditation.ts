import { generateMeditationText } from '../config/openai';
import { saveMeditation } from './meditationStorage';
import { generateAudio } from './audioService';

export async function generateMeditation(feeling: string, duration: number, userId: string) {
  try {
    console.log('=== Meditation Service: Starting Generation ===');
    console.log('Input:', { feeling, duration, userId });

    // Generate meditation text using OpenAI
    console.log('Calling OpenAI to generate meditation text...');
    let meditationText: string;
    try {
      meditationText = await generateMeditationText(feeling, duration);
      console.log('Received meditation text from OpenAI');
    } catch (error) {
      console.error('Error generating meditation text:', error);
      throw new Error(`Failed to generate meditation text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Generate audio using Eleven Labs
    console.log('Generating audio with Eleven Labs...');
    let audioResult;
    try {
      audioResult = await generateAudio(meditationText);
      console.log('Audio generated successfully:', { 
        url: audioResult.audioUrl ? 'present' : 'missing',
        duration: audioResult.duration 
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      throw new Error(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Save meditation to Firebase
    console.log('Saving meditation to Firebase...');
    try {
      const meditation = await saveMeditation({
        feeling,
        duration,
        userId,
        meditationText,
        audioUrl: audioResult.audioUrl,
        audioDuration: audioResult.duration,
        createdAt: new Date()
      });
      console.log('Meditation saved successfully:', { id: meditation.id });
      return meditation;
    } catch (error) {
      console.error('Error saving meditation:', error);
      throw new Error(`Failed to save meditation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('=== Error in Meditation Service ===');
    console.error('Error details:', error);
    throw error; // Re-throw to be handled by the route
  }
} 