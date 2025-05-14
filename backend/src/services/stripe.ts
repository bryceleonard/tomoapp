import Stripe from 'stripe';
import { getUserSubscription, updateSubscriptionStatus, cancelSubscription } from './userSubscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID!;

export async function createSetupIntent(userId: string, email?: string): Promise<{ clientSecret: string; ephemeralKey: string }> {
  console.log('Creating setup intent for user:', { userId, email });
  
  const userSubscription = await getUserSubscription(userId);
  console.log('Current user subscription:', userSubscription);
  
  // Create or get Stripe customer
  let customerId = userSubscription.stripeCustomerId;
  if (!customerId) {
    console.log('Creating new Stripe customer...');
    const customer = await stripe.customers.create({
      metadata: { userId },
      email: email
    });
    customerId = customer.id;
    console.log('Created new Stripe customer:', customerId);
  } else if (email) {
    console.log('Updating existing customer email:', customerId);
    await stripe.customers.update(customerId, { email });
  }

  console.log('Creating ephemeral key for customer:', customerId);
  // Create ephemeral key with required permissions
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: '2025-04-30.basil' }
  );
  console.log('Created ephemeral key:', {
    keyLength: ephemeralKey.secret?.length,
    keyPrefix: ephemeralKey.secret?.substring(0, 10)
  });

  console.log('Creating setup intent...');
  // Create a SetupIntent with specific payment method types
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic'
      }
    },
    metadata: { userId }
  });
  console.log('Created setup intent:', {
    id: setupIntent.id,
    status: setupIntent.status,
    hasClientSecret: !!setupIntent.client_secret,
    paymentMethodTypes: setupIntent.payment_method_types
  });

  return {
    clientSecret: setupIntent.client_secret!,
    ephemeralKey: ephemeralKey.secret!
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