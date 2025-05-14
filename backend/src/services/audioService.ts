import { storage } from '../config/firebase';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ELEVEN_LABS_API_KEY, ELEVEN_LABS_VOICE_ID } from '../config/elevenLabs';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface AudioGenerationResult {
  audioUrl: string;
  duration: number;
}

export async function generateAudio(text: string): Promise<AudioGenerationResult> {
  console.log('=== Starting Audio Generation ===');
  console.log('Text length:', text.length);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${MAX_RETRIES}`);
      
      // For development, use test text to save credits
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`,
        {
          text: 'test', // Hardcoded for development
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVEN_LABS_API_KEY
          },
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          maxContentLength: 10 * 1024 * 1024, // 10MB max
          maxBodyLength: 10 * 1024 * 1024 // 10MB max
        }
      );

      console.log('Eleven Labs API Response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length']
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Empty response from Eleven Labs API');
      }

      // Create a unique filename
      const filename = `meditation_${uuidv4()}.mp3`;
      const tempFilePath = join(tmpdir(), filename);
      console.log('Created temp file path:', tempFilePath);

      // Save audio to temp file
      console.log('Saving audio to temp file...');
      await writeFile(tempFilePath, response.data);
      console.log('Audio saved to temp file');

      // Get audio duration using ffmpeg
      console.log('Getting audio duration...');
      const duration = await getAudioDuration(tempFilePath);
      console.log('Audio duration:', duration);

      // Upload to Firebase Storage
      console.log('=== Uploading to Firebase Storage ===');
      console.log('Storage instance:', !!storage);
      const bucket = storage.bucket();
      console.log('Bucket instance:', !!bucket);
      console.log('Bucket name:', bucket.name);
      console.log('File path:', `meditations/${filename}`);
      
      const file = bucket.file(`meditations/${filename}`);
      console.log('File instance created:', !!file);
      
      try {
        console.log('Starting file upload...');
        await file.save(response.data);
        console.log('File uploaded successfully');
      } catch (error) {
        console.error('=== Error during file upload ===');
        console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error Message:', error instanceof Error ? error.message : error);
        if (error instanceof Error) {
          console.error('Error Stack:', error.stack);
        }
        throw error;
      }

      // Get signed URL
      console.log('=== Getting signed URL ===');
      let audioUrl: string;
      try {
        [audioUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500'
        });
        console.log('Signed URL generated successfully');
        console.log('URL length:', audioUrl.length);
      } catch (error) {
        console.error('=== Error getting signed URL ===');
        console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error Message:', error instanceof Error ? error.message : error);
        if (error instanceof Error) {
          console.error('Error Stack:', error.stack);
        }
        throw error;
      }

      // Clean up temp file
      console.log('Cleaning up temp file...');
      await unlink(tempFilePath);
      console.log('Temp file cleaned up');

      return {
        audioUrl,
        duration,
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      if (error instanceof Error) {
        // If it's a memory error, wait longer before retrying
        if (error.message.includes('ENOMEM')) {
          console.log('Memory error detected, waiting longer before retry...');
          await delay(RETRY_DELAY * 2);
        } else {
          await delay(RETRY_DELAY);
        }
      }
    }
  }

  console.error('=== Error in Audio Generation ===');
  console.error('Eleven Labs API Error:', {
    status: lastError?.name,
    statusText: lastError?.message,
    data: lastError?.stack
  });
  
  throw new Error(`Failed to generate audio after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

interface FFprobeData {
  format: {
    duration?: number;
  };
}

async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: FFprobeData) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

export async function playAudio(url: string): Promise<void> {
  // Implementation for playing audio
}

export async function pauseAudio(): Promise<void> {
  // Implementation for pausing audio
}

export async function stopAudio(): Promise<void> {
  // Implementation for stopping audio
}

export async function setVolume(volume: number): Promise<void> {
  // Implementation for setting volume
} 