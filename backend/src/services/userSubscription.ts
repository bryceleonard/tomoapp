import { db } from '../config/firebase';
import { UserSubscription, UserMeditationCount } from '../types/user';
import * as admin from 'firebase-admin';

const FREE_MEDITATION_LIMIT = 2;
const PREMIUM_YEARLY_LIMIT = 50;
const PREMIUM_YEARLY_RESET = 50;

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  console.log('Getting subscription for user:', userId);
  const doc = await db.collection('userSubscriptions').doc(userId).get();
  
  if (!doc.exists) {
    console.log('No subscription found, creating default');
    // Create default free subscription
    const defaultSubscription: UserSubscription = {
      userId,
      isPremium: false,
      meditationCount: 0,
      lastYearlyReset: new Date()
    };
    await db.collection('userSubscriptions').doc(userId).set(defaultSubscription);
    return defaultSubscription;
  }
  
  const data = doc.data() as UserSubscription;
  console.log('Found subscription:', data);
  return {
    ...data,
    meditationCount: data.meditationCount || 0
  };
}

export async function canGenerateMeditation(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription.isPremium) {
    return subscription.meditationCount < FREE_MEDITATION_LIMIT;
  }
  
  // Check if we need to reset yearly count
  const now = new Date();
  const lastReset = subscription.lastYearlyReset || new Date(0);
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  if (lastReset < oneYearAgo) {
    // Reset yearly count
    await db.collection('userSubscriptions').doc(userId).update({
      meditationCount: 0,
      lastYearlyReset: now
    });
    return true;
  }
  
  return subscription.meditationCount < PREMIUM_YEARLY_LIMIT;
}

export async function incrementMeditationCount(userId: string): Promise<void> {
  await db.collection('userSubscriptions').doc(userId).update({
    meditationCount: admin.firestore.FieldValue.increment(1)
  });
}

export async function updateSubscriptionStatus(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
): Promise<void> {
  console.log('Updating subscription status:', {
    userId,
    stripeCustomerId,
    stripeSubscriptionId
  });

  const subscriptionRef = db.collection('userSubscriptions').doc(userId);
  const subscription = await subscriptionRef.get();
  console.log('Current subscription data:', subscription.data());

  await subscriptionRef.update({
    isPremium: true,
    subscriptionStartDate: new Date(),
    stripeCustomerId,
    stripeSubscriptionId,
    lastYearlyReset: new Date()
  });

  const updatedSubscription = await subscriptionRef.get();
  console.log('Updated subscription data:', updatedSubscription.data());
}

export async function cancelSubscription(userId: string): Promise<void> {
  await db.collection('userSubscriptions').doc(userId).update({
    isPremium: false,
    stripeSubscriptionId: null
  });
} 