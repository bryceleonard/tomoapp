import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { auth } from '../firebase/firebaseConfig';
import { BlurView } from 'expo-blur';
import { useStripe } from '@stripe/stripe-react-native';

const API_URL = 'http://192.168.0.33:3000';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      console.log('Starting subscription flow...');

      // Step 1: Create setup intent
      const setupResponse = await fetch(`${API_URL}/api/subscription/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        console.error('Setup intent error:', errorData);
        throw new Error(`Setup intent error: ${errorData.error || setupResponse.statusText}`);
      }

      const { clientSecret, ephemeralKey } = await setupResponse.json();
      console.log('Got setup intent client secret');

      // Step 2: Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tomo',
        customerId: ephemeralKey.customer,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          email: auth.currentUser?.email || undefined
        }
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        return;
      }

      // Step 3: Present payment sheet
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
        console.error('Error presenting payment sheet:', presentError);
        return;
      }

      // Step 4: Wait a moment for the payment method to be attached
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Create subscription
      const subscriptionResponse = await fetch(`${API_URL}/api/subscription/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        console.error('Subscription creation error:', errorData);
        throw new Error(`Subscription creation error: ${errorData.error || subscriptionResponse.statusText}`);
      }

      console.log('Subscription created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error in subscription flow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            You're doing great. Want a little more support?
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            With Tomo Premium, you can create 50 meditations a year, anytime you need a breather, boost, or perspective shift.

            Just $4.99/month — no pressure, all peace.
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handleUpgrade}
                style={styles.button}
              >
                Upgrade to Premium
              </Button>
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.button}
              >
                Cancel
              </Button>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginVertical: 5,
  },
}); 