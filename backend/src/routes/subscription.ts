import { Router, Request, Response } from 'express';
import { createSetupIntent } from '../services/stripe';
import { getUserSubscription } from '../services/userSubscription';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

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

// Create payment intent
router.post('/create-payment-intent', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { email } = req.body;

    // Create or get Stripe customer
    let customerId;
    const userSubscription = await db.collection('userSubscriptions').doc(userId).get();
    const subscriptionData = userSubscription.data();

    if (subscriptionData?.stripeCustomerId) {
      customerId = subscriptionData.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId }
      });
      customerId = customer.id;
      
      // Save customer ID to Firestore
      await db.collection('userSubscriptions').doc(userId).set({
        stripeCustomerId: customerId,
        isPremium: false,
        meditationCount: 0,
        lastYearlyReset: new Date()
      }, { merge: true });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // $4.99
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: { userId }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get subscription status
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const subscription = await db.collection('userSubscriptions').doc(userId).get();
    res.json(subscription.data() || { isPremium: false });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Create setup intent
router.post('/create-setup-intent', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await admin.auth().getUser(userId);
    const { clientSecret, ephemeralKey } = await createSetupIntent(userId, user.email);

    res.json({
      clientSecret,
      ephemeralKey
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Create subscription
router.post('/create', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('=== Creating Subscription ===');
    console.log('User ID:', userId);

    // Get user's subscription data
    const userSubscription = await db.collection('userSubscriptions').doc(userId).get();
    const subscriptionData = userSubscription.data();
    console.log('User subscription data:', subscriptionData);

    if (!subscriptionData?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    // Check for existing active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: subscriptionData.stripeCustomerId,
      status: 'active',
      limit: 1
    });

    console.log('Active subscriptions found:', activeSubscriptions.data.length);
    console.log('Active subscriptions data:', JSON.stringify(activeSubscriptions.data, null, 2));

    if (activeSubscriptions.data.length > 0) {
      console.log('Found existing active subscription:', activeSubscriptions.data[0].id);
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: subscriptionData.stripeCustomerId,
      type: 'card'
    });

    console.log('Payment methods found:', paymentMethods.data.length);

    if (paymentMethods.data.length === 0) {
      return res.status(400).json({ error: 'No payment method found. Please add a payment method first.' });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: subscriptionData.stripeCustomerId,
      items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID }],
      payment_behavior: 'error_if_incomplete',
      payment_settings: { 
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      default_payment_method: paymentMethods.data[0].id,
      metadata: { userId }
    });

    console.log('Created new subscription:', subscription.id);

    // Update user's subscription status immediately
    try {
      await db.collection('userSubscriptions').doc(userId).set({
        isPremium: true,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.start_date * 1000),
        currentPeriodEnd: new Date((subscription.start_date + 30 * 24 * 60 * 60) * 1000),
        stripeCustomerId: subscriptionData.stripeCustomerId
      }, { merge: true });

      // Verify the update
      const updatedDoc = await db.collection('userSubscriptions').doc(userId).get();
      console.log('Updated user data:', updatedDoc.data());

      if (!updatedDoc.data()?.isPremium) {
        console.error('Failed to update isPremium status');
        throw new Error('Failed to update isPremium status');
      }
    } catch (error) {
      console.error('Error updating user subscription status:', error);
      // Don't throw here, as the subscription was created successfully
    }

    res.json({ subscriptionId: subscription.id });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

export default router; 