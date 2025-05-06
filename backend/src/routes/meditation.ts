import { Router, Request, Response } from 'express';
import { generateMeditation } from '../services/meditation';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    console.log('=== Meditation Route: Received Request ===');
    console.log('Request body:', req.body);
    const { feeling, duration, userId } = req.body;

    if (!feeling || !duration || !userId) {
      console.log('Missing required fields:', { feeling, duration, userId });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          feeling: !feeling,
          duration: !duration,
          userId: !userId
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

export default router; 