import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log('=== Processing Webhook Event ===');
    console.log('Event type:', event.type);
    console.log('Event data:', JSON.stringify(event.data.object, null, 2));

    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          return res.status(400).json({ error: 'No userId in subscription metadata' });
        }

        console.log(`Processing subscription creation for user ${userId}`);
        console.log('Subscription status:', subscription.status);

        try {
          // Get current user data
          const userDoc = await db.collection('userSubscriptions').doc(userId).get();
          console.log('Current user data:', userDoc.data());

          // Update user's subscription status
          const updateData = {
            isPremium: true,
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            currentPeriodStart: new Date(subscription.start_date * 1000),
            currentPeriodEnd: new Date((subscription.start_date + 30 * 24 * 60 * 60) * 1000)
          };

          console.log('Updating user with data:', updateData);
          
          // Use set with merge: true to ensure we don't overwrite other fields
          await db.collection('userSubscriptions').doc(userId).set({
            ...updateData,
            stripeCustomerId: userDoc.data()?.stripeCustomerId // Preserve existing customer ID
          }, { merge: true });

          // Verify the update
          const updatedDoc = await db.collection('userSubscriptions').doc(userId).get();
          console.log('Updated user data:', updatedDoc.data());

          if (!updatedDoc.data()?.isPremium) {
            console.error('Failed to update isPremium status');
            throw new Error('Failed to update isPremium status');
          }

          console.log(`Successfully updated subscription for user ${userId}`);
        } catch (error) {
          console.error('Error updating user subscription:', error);
          throw error;
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          return res.status(400).json({ error: 'No userId in subscription metadata' });
        }

        console.log(`Processing subscription update for user ${userId}`);
        console.log('Subscription status:', subscription.status);

        try {
          // Get current user data
          const userDoc = await db.collection('userSubscriptions').doc(userId).get();
          console.log('Current user data:', userDoc.data());

          // Update user's subscription status
          const updateData = {
            isPremium: subscription.status === 'active',
            subscriptionStatus: subscription.status,
            currentPeriodStart: new Date(subscription.start_date * 1000),
            currentPeriodEnd: new Date((subscription.start_date + 30 * 24 * 60 * 60) * 1000)
          };

          console.log('Updating user with data:', updateData);
          
          // Use set with merge: true to ensure we don't overwrite other fields
          await db.collection('userSubscriptions').doc(userId).set({
            ...updateData,
            stripeCustomerId: userDoc.data()?.stripeCustomerId // Preserve existing customer ID
          }, { merge: true });

          // Verify the update
          const updatedDoc = await db.collection('userSubscriptions').doc(userId).get();
          console.log('Updated user data:', updatedDoc.data());

          if (subscription.status === 'active' && !updatedDoc.data()?.isPremium) {
            console.error('Failed to update isPremium status');
            throw new Error('Failed to update isPremium status');
          }

          console.log(`Successfully updated subscription for user ${userId}`);
        } catch (error) {
          console.error('Error updating user subscription:', error);
          throw error;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId in subscription metadata');
          return res.status(400).json({ error: 'No userId in subscription metadata' });
        }

        console.log(`Processing subscription deletion for user ${userId}`);

        try {
          // Get current user data
          const userDoc = await db.collection('userSubscriptions').doc(userId).get();
          console.log('Current user data:', userDoc.data());

          // Update user's subscription status
          const updateData = {
            isPremium: false,
            subscriptionStatus: 'canceled',
            subscriptionId: null
          };

          console.log('Updating user with data:', updateData);
          
          // Use set with merge: true to ensure we don't overwrite other fields
          await db.collection('userSubscriptions').doc(userId).set({
            ...updateData,
            stripeCustomerId: userDoc.data()?.stripeCustomerId // Preserve existing customer ID
          }, { merge: true });

          // Verify the update
          const updatedDoc = await db.collection('userSubscriptions').doc(userId).get();
          console.log('Updated user data:', updatedDoc.data());

          if (updatedDoc.data()?.isPremium) {
            console.error('Failed to update isPremium status');
            throw new Error('Failed to update isPremium status');
          }

          console.log(`Successfully canceled subscription for user ${userId}`);
        } catch (error) {
          console.error('Error updating user subscription:', error);
          throw error;
        }
        break;
      }

      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const userId = setupIntent.metadata?.userId;

        if (!userId) {
          console.error('No userId in setup intent metadata');
          return res.status(400).json({ error: 'No userId in setup intent metadata' });
        }

        console.log(`Processing setup intent success for user ${userId}`);
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router; 