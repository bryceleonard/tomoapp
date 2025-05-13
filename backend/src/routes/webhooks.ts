import { Router } from 'express';
import Stripe from 'stripe';
import { handleSubscriptionCreated, handleSubscriptionDeleted, handleSubscriptionUpdated, handleSetupIntentSucceeded } from '../services/stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

// Keep track of processed events to prevent duplicates
const processedEvents = new Set<string>();

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check if we've already processed this event
  if (processedEvents.has(event.id)) {
    console.log('Event already processed:', event.id);
    return res.status(200).send();
  }

  // Add event to processed set
  processedEvents.add(event.id);

  // Clean up old events (keep last 1000)
  if (processedEvents.size > 1000) {
    const oldestEvents = Array.from(processedEvents).slice(0, processedEvents.size - 1000);
    oldestEvents.forEach(id => processedEvents.delete(id));
  }

  console.log('Processing webhook event:', event.type, event.id);

  try {
    switch (event.type) {
      case 'setup_intent.succeeded':
        console.log('Processing setup intent success:', event.data.object);
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment intent succeeded:', event.data.object);
        // Payment was successful, but we'll wait for subscription events
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment intent failed:', event.data.object);
        // Payment failed, but we'll wait for subscription events
        break;

      case 'customer.subscription.created':
        console.log('Processing subscription created:', event.data.object);
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        console.log('Processing subscription deleted:', event.data.object);
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        console.log('Processing subscription updated:', event.data.object);
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.created':
      case 'customer.updated':
      case 'payment_method.attached':
      case 'payment_intent.created':
      case 'invoice.created':
      case 'invoice.finalized':
        // These events are handled automatically by Stripe
        console.log('Handled automatically by Stripe:', event.type);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).send('Webhook handler failed');
  }
});

export default router; 