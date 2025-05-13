import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { UpgradeModal } from '../components/UpgradeModal';
import { Button, Text } from 'react-native-paper';

// TODO: Move this to a config file
const API_BASE_URL = 'http://192.168.0.33:3000';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface UserSubscription {
  isPremium: boolean;
  meditationCount: number;
}

export default function Home() {
  const [feeling, setFeeling] = useState('');
  const [duration, setDuration] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const isFocused = useIsFocused();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setIsReady(true);
      fetchSubscriptionStatus();
    }
  }, [isFocused]);

  const fetchSubscriptionStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      console.log('Fetching subscription status...');
      const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch subscription status');
      
      const data = await response.json();
      console.log('Subscription data:', data);
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const response = await fetch(`${API_BASE_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to create checkout session');
      
      const { url } = await response.json();
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleGenerate = async () => {
    console.log('=== Starting handleGenerate ===');
    setIsLoading(true);
    try {
      console.log('Checking current user...');
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        console.log('No user found, throwing error');
        throw new Error('No user logged in');
      }

      // Check if user can generate meditation
      const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }

      const subscription = await response.json();
      if (!subscription.isPremium && subscription.meditationCount >= 2) {
        throw new Error('Free trial limit reached. Please upgrade to continue.');
      }

      console.log('Generating meditation for:', { feeling, duration });
      
      console.log('Making API request...');
      const meditationResponse = await fetch(`${API_BASE_URL}/api/meditation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          feeling,
          duration,
          userId: currentUser.uid,
        }),
      });

      console.log('Response received:', meditationResponse.status);
      if (!meditationResponse.ok) {
        throw new Error(`HTTP error! status: ${meditationResponse.status}`);
      }

      const meditation = await meditationResponse.json();
      console.log('Meditation generated:', meditation);
      
      // Navigate to meditation screen with the generated meditation
      navigation.navigate('Meditation', { meditation });
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      // TODO: Show error to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeSuccess = () => {
    setUpgradeModalVisible(false);
    fetchSubscriptionStatus();
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Tomo</Text>
        <View style={styles.headerButtons}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('Library')}
            style={styles.headerButton}
          >
            Library
          </Button>
          {!subscription?.isPremium && (
            <Button
              mode="text"
              onPress={() => setUpgradeModalVisible(true)}
              style={styles.headerButton}
            >
              Upgrade
            </Button>
          )}
          <Button
            mode="text"
            onPress={() => signOut(auth)}
            style={styles.headerButton}
          >
            Logout
          </Button>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Describe a feeling or situation</Text>
        <TextInput
          style={styles.textInput}
          value={feeling}
          onChangeText={setFeeling}
          placeholder="e.g., feeling anxious about work, struggling with sleep..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Duration</Text>
        <View style={styles.toggleContainer}>
          <View style={styles.toggleBackground}>
            <TouchableOpacity
              style={[styles.toggleOption, duration === 3 && styles.toggleOptionActive]}
              onPress={() => setDuration(3)}
            >
              <Text style={[styles.toggleText, duration === 3 && styles.toggleTextActive]}>
                Short
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, duration === 6 && styles.toggleOptionActive]}
              onPress={() => setDuration(6)}
            >
              <Text style={[styles.toggleText, duration === 6 && styles.toggleTextActive]}>
                Long
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.generateButton, isLoading && styles.generateButtonDisabled]} 
          onPress={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Meditation</Text>
          )}
        </TouchableOpacity>
      </View>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#6c757d',
    fontSize: 16,
  },
  upgradeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 24,
    minHeight: 100,
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  toggleBackground: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  toggleOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#2c3e50',
  },
  toggleText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  generateButton: {
    backgroundColor: '#2c3e50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
