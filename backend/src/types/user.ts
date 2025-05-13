export interface UserSubscription {
  userId: string;
  isPremium: boolean;
  meditationCount: number;
  subscriptionStartDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  lastYearlyReset?: Date;
}

export interface UserMeditationCount {
  totalMeditations: number;
  meditationsThisYear: number;
  lastYearlyReset: Date;
} 