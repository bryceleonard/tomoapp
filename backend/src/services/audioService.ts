import { storage } from '../config/firebase';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const ELEVEN_LABS_API_KEY = 'sk_b31b0fe8d0547b93c8dbcc4f6132486b86428c19b50fe8ad';
const ELEVEN_LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice ID

export interface AudioGenerationResult {
  audioUrl: string;
  duration: number;
}

export async function generateAudio(text: string): Promise<AudioGenerationResult> {
  try {
    console.log('=== Starting Audio Generation ===');
    console.log('Text length:', text.length);

    // Call Eleven Labs API
    console.log('Calling Eleven Labs API...');
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      data: {
        text: 'test', // Hardcoded for credit-saving during development
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      responseType: 'arraybuffer',
    });
    console.log('Eleven Labs API response received');

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
    console.log('Uploading to Firebase Storage...');
    const bucket = storage.bucket();
    const file = bucket.file(`meditations/${filename}`);
    await file.save(response.data);
    console.log('File uploaded to Firebase Storage');

    // Get signed URL
    console.log('Getting signed URL...');
    const [audioUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });
    console.log('Signed URL generated');

    // Clean up temp file
    console.log('Cleaning up temp file...');
    await unlink(tempFilePath);
    console.log('Temp file cleaned up');

    return {
      audioUrl,
      duration,
    };
  } catch (error) {
    console.error('=== Error in Audio Generation ===');
    if (axios.isAxiosError(error)) {
      console.error('Eleven Labs API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      console.error('Error details:', error);
    }
    throw error;
  }
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