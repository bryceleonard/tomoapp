import Stripe from 'stripe';
import { getUserSubscription, updateSubscriptionStatus, cancelSubscription } from './userSubscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID!;

export async function createPaymentIntent(userId: string, email?: string): Promise<{ clientSecret: string }> {
  const userSubscription = await getUserSubscription(userId);
  
  // Create or get Stripe customer
  let customerId = userSubscription.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
      email: email
    });
    customerId = customer.id;
  } else if (email) {
    await stripe.customers.update(customerId, { email });
  }

  // Cancel any existing incomplete subscriptions
  const existingSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'incomplete',
    limit: 1
  });

  if (existingSubscriptions.data.length > 0) {
    await stripe.subscriptions.cancel(existingSubscriptions.data[0].id);
  }

  // Create a SetupIntent to collect payment method
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    metadata: { userId }
  });

  return {
    clientSecret: setupIntent.client_secret!
  };
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Handling subscription created:', subscription);
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    throw new Error('No userId in subscription metadata');
  }
  
  console.log('Updating subscription status for user:', userId);
  await updateSubscriptionStatus(
    userId,
    subscription.customer as string,
    subscription.id
  );
  console.log('Subscription status updated successfully');
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    throw new Error('No userId in subscription metadata');
  }
  
  await cancelSubscription(userId);
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    throw new Error('No userId in subscription metadata');
  }

  console.log('Subscription status:', subscription.status);
  
  switch (subscription.status) {
    case 'active':
      await updateSubscriptionStatus(
        userId,
        subscription.customer as string,
        subscription.id
      );
      break;
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      await cancelSubscription(userId);
      break;
    case 'incomplete':
    case 'trialing':
      // Do nothing, wait for payment
      break;
    default:
      console.log('Unhandled subscription status:', subscription.status);
  }
}

export async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
  if (!setupIntent.metadata?.userId) {
    throw new Error('No userId in setup intent metadata');
  }
  const userId = setupIntent.metadata.userId;

  // Check for existing active or incomplete subscriptions
  const existingSubscriptions = await stripe.subscriptions.list({
    customer: setupIntent.customer as string,
    status: 'incomplete',
    limit: 1
  });

  if (existingSubscriptions.data.length > 0) {
    console.log('Cancelling existing incomplete subscription');
    await stripe.subscriptions.cancel(existingSubscriptions.data[0].id);
  }

  // Check for active subscriptions
  const activeSubscriptions = await stripe.subscriptions.list({
    customer: setupIntent.customer as string,
    status: 'active',
    limit: 1
  });

  if (activeSubscriptions.data.length > 0) {
    console.log('User already has an active subscription');
    return;
  }

  console.log('Creating subscription for user:', userId);
  
  // Create the subscription with immediate payment
  const subscription = await stripe.subscriptions.create({
    customer: setupIntent.customer as string,
    items: [{ price: PREMIUM_PRICE_ID }],
    payment_behavior: 'error_if_incomplete',
    payment_settings: { 
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription'
    },
    default_payment_method: setupIntent.payment_method as string,
    metadata: { userId }
  });

  console.log('Subscription created:', subscription.id);

  // Update user's subscription status
  await updateSubscriptionStatus(
    userId,
    setupIntent.customer as string,
    subscription.id
  );

  console.log('Subscription status updated for user:', userId);
} 