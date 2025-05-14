import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { auth } from '../firebase/firebaseConfig';
import { useStripe } from '@stripe/stripe-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Feather } from '@expo/vector-icons';

// TODO: Move this to a config file
const API_BASE_URL = 'http://192.168.0.33:3000';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Upgrade'>;

interface UpgradeScreenProps {
  navigation: NavigationProp;
}

export default function UpgradeScreen({ navigation }: UpgradeScreenProps) {
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      console.log('Starting subscription flow...');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user logged in');
        throw new Error('You must be logged in to upgrade');
      }

      // Step 1: Create setup intent
      console.log('Creating setup intent...');
      const setupResponse = await fetch(`${API_BASE_URL}/api/subscription/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json().catch(() => ({}));
        console.error('Setup intent error:', {
          status: setupResponse.status,
          statusText: setupResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to create setup intent: ${errorData.error || setupResponse.statusText}`);
      }

      const { clientSecret, ephemeralKey } = await setupResponse.json();
      console.log('Got setup intent client secret');

      // Step 2: Initialize payment sheet
      console.log('Initializing payment sheet...');
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tomo',
        customerId: ephemeralKey.customer,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          email: currentUser.email || undefined
        }
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        throw new Error(`Failed to initialize payment: ${initError.message}`);
      }

      // Step 3: Present payment sheet
      console.log('Presenting payment sheet...');
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
        console.error('Error presenting payment sheet:', presentError);
        throw new Error(`Payment failed: ${presentError.message}`);
      }

      // Step 4: Wait a moment for the payment method to be attached
      console.log('Payment successful, waiting for payment method attachment...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Create subscription
      console.log('Creating subscription...');
      const subscriptionResponse = await fetch(`${API_BASE_URL}/api/subscription/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json().catch(() => ({}));
        console.error('Subscription creation error:', {
          status: subscriptionResponse.status,
          statusText: subscriptionResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to create subscription: ${errorData.error || subscriptionResponse.statusText}`);
      }

      console.log('Subscription created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error in subscription flow:', error);
      // TODO: Show error to user
      alert(error instanceof Error ? error.message : 'An error occurred during the upgrade process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>Unlock your full potential</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Feather name="repeat" size={24} color="#2c3e50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Unlimited Meditations</Text>
                <Text style={styles.featureDescription}>Create up to 50 meditations per year</Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Feather name="clock" size={24} color="#2c3e50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Flexible Duration</Text>
                <Text style={styles.featureDescription}>Choose between short and long sessions</Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Feather name="heart" size={24} color="#2c3e50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Personalized Experience</Text>
                <Text style={styles.featureDescription}>Meditations tailored to your needs</Text>
              </View>
            </View>
          </View>

          <View style={styles.pricingContainer}>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.period}>per month</Text>
            <Text style={styles.pricingNote}>Cancel anytime</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2c3e50" style={styles.loader} />
          ) : (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 32,
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'JosefinSans-Regular',
    fontSize: 18,
    color: '#7f8c8d',
  },
  featuresContainer: {
    padding: 24,
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'JosefinSans-Regular',
    fontSize: 16,
    color: '#7f8c8d',
  },
  pricingContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
  },
  price: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 48,
    color: '#2c3e50',
  },
  period: {
    fontFamily: 'JosefinSans-Regular',
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 4,
  },
  pricingNote: {
    fontFamily: 'JosefinSans-Regular',
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
  },
  upgradeButton: {
    backgroundColor: '#AEE0B0',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    width: 280,
  },
  upgradeButtonText: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 18,
    color: '#111',
  },
  loader: {
    margin: 24,
  },
}); 