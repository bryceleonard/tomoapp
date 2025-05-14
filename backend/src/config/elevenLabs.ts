import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

if (!process.env.ELEVEN_LABS_API_KEY) {
  throw new Error('ELEVEN_LABS_API_KEY is not set in environment variables');
}

export const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
export const ELEVEN_LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice ID (Rachel)

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
}

export async function getAvailableVoices(): Promise<Voice[]> {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY
      }
    });
    return response.data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
} 