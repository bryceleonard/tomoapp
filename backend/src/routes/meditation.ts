import { Router, Request, Response } from 'express';
import { generateMeditation } from '../services/meditation';
import { getUserMeditations } from '../services/meditationStorage';
import { auth } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

const router = Router();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

// Authentication middleware
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/generate', authenticateUser, async (req: Request, res: Response) => {
  try {
    console.log('=== Meditation Route: Received Request ===');
    console.log('Request body:', req.body);
    const { feeling, duration } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.uid;

    if (!feeling || !duration) {
      console.log('Missing required fields:', { feeling, duration });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          feeling: !feeling,
          duration: !duration
        }
      });
    }

    console.log('Calling meditation service with:', { feeling, duration, userId });
    const meditation = await generateMeditation(feeling, duration, userId);
    console.log('Meditation generated successfully:', { 
      id: meditation.id,
      audioUrl: meditation.audioUrl ? 'present' : 'missing',
      duration: meditation.duration
    });
    
    res.status(200).json(meditation);
  } catch (error) {
    console.error('=== Error in Meditation Route ===');
    console.error('Error details:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Send more detailed error response
    res.status(500).json({ 
      error: 'Failed to generate meditation',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/history', authenticateUser, async (req: Request, res: Response) => {
  try {
    console.log('=== Meditation Route: Fetching History ===');
    console.log('Request headers:', req.headers);
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.uid;
    console.log('Authenticated user ID:', userId);

    console.log('Fetching meditations for user:', userId);
    const meditations = await getUserMeditations(userId);
    console.log(`Successfully fetched ${meditations.length} meditations`);
    console.log('First meditation (if any):', meditations[0]);
    
    res.status(200).json(meditations);
  } catch (error: unknown) {
    console.error('=== Error in Meditation History Route ===');
    if (error && typeof error === 'object' && 'constructor' in error) {
      console.error('Error type:', error.constructor.name);
    }
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    res.status(500).json({ 
      error: 'Failed to fetch meditation history',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 