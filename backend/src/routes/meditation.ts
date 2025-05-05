import { Router, Request, Response } from 'express';
import { generateMeditation } from '../services/meditation';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    console.log('=== Meditation Route: Received Request ===');
    const { feeling, duration, userId } = req.body;
    console.log('Request body:', { feeling, duration, userId });

    if (!feeling || !duration || !userId) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Calling meditation service...');
    const meditation = await generateMeditation(feeling, duration, userId);
    console.log('Meditation generated successfully, sending response');
    
    res.status(200).json(meditation);
  } catch (error) {
    console.error('Error generating meditation:', error);
    res.status(500).json({ error: 'Failed to generate meditation' });
  }
});

export default router; 