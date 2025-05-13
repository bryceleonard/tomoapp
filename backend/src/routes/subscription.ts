import { Router, Request, Response } from 'express';
import { createPaymentIntent } from '../services/stripe';
import { getUserSubscription } from '../services/userSubscription';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const router = Router();

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

// Get user's subscription status
router.get('/status', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('=== Subscription Status Request ===');
    console.log('User ID:', req.user.uid);
    console.log('User:', req.user);
    
    const subscription = await getUserSubscription(req.user.uid);
    console.log('Subscription data:', JSON.stringify(subscription, null, 2));
    
    // Double check the subscription status in Firestore
    const doc = await db.collection('userSubscriptions').doc(req.user.uid).get();
    console.log('Raw Firestore data:', JSON.stringify(doc.data(), null, 2));
    
    res.json(subscription);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Create payment intent
router.post('/create-payment-intent', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await admin.auth().getUser(userId);
    const { clientSecret } = await createPaymentIntent(userId, user.email);
    res.json({ clientSecret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

export default router; 