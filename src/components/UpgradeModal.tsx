import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Button, Text } from 'react-native-paper';
import { auth } from '../firebase/firebaseConfig';

const API_URL = 'http://192.168.0.33:3000';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });
      const data = await response.json();
      console.log('Fetched subscription status:', data);
      return data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      
      // Get the client secret from your backend
      const response = await fetch(`${API_URL}/api/subscription/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });
      
      const { clientSecret } = await response.json();
      console.log('Got client secret:', clientSecret);

      // Initialize the Payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Tomo',
        setupIntentClientSecret: clientSecret,
        returnURL: 'tomo://stripe-redirect',
        defaultBillingDetails: {
          name: auth.currentUser?.displayName || undefined,
          email: auth.currentUser?.email || undefined,
        },
        allowsDelayedPaymentMethods: true,
        style: 'automatic'
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        return;
      }

      // Present the Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.error('Error presenting payment sheet:', presentError);
      } else {
        console.log('Payment successful!');
        
        // Wait for backend to process the payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fetch subscription status multiple times to ensure it's updated
        let attempts = 0;
        let subscriptionData = null;
        
        while (attempts < 3) {
          console.log(`Fetching subscription status (attempt ${attempts + 1})...`);
          subscriptionData = await fetchSubscriptionStatus();
          
          if (subscriptionData?.isPremium) {
            console.log('Premium status confirmed:', subscriptionData);
            break;
          }
          
          attempts++;
          if (attempts < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (subscriptionData?.isPremium) {
          onSuccess();
        } else {
          console.error('Subscription status not updated after payment');
        }
      }
    } catch (error) {
      console.error('Error in payment flow:', error);
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