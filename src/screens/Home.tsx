import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking, Keyboard } from 'react-native';
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
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        console.log(`Fetching subscription status (attempt ${attempt}/${MAX_RETRIES})...`);
        const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
          headers: {
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Subscription status error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Failed to fetch subscription status: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Subscription data:', data);
        setSubscription(data);
        return; // Success, exit the retry loop
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === MAX_RETRIES) {
          console.error('All retry attempts failed');
          return;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  };

  const handleUpgradeSuccess = () => {
    setUpgradeModalVisible(false);
    fetchSubscriptionStatus();
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

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {auth.currentUser?.displayName || 'there'}</Text>
        {!subscription?.isPremium && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => setUpgradeModalVisible(true)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Describe a feeling or situation</Text>
        <TextInput
          style={styles.textInput}
          value={feeling}
          onChangeText={setFeeling}
          placeholder="e.g., feeling anxious about work, struggling with sleep..."
          placeholderTextColor="#686868"
          multiline={false}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          blurOnSubmit={true}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  greeting: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 28,
    color: '#111',
  },
  upgradeButton: {
    backgroundColor: '#AEE0B0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 16,
    color: '#111',
  },
  formContainer: {
    padding: 24,
  },
  label: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 16,
    color: '#111',
    marginBottom: 25,
  },
  textInput: {
    backgroundColor: '#f1f1f1',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 18,
    fontFamily: 'JosefinSans-Regular',
    fontSize: 16,
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#686868',
    color: '#222',
    minHeight: 55,
  },
  toggleContainer: {
    alignItems: 'stretch',
    marginBottom: 32,
  },
  toggleBackground: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#686868',
    overflow: 'hidden',
    height: 55,
    width: '100%',
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#EEEAAF',
  },
  toggleText: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 16,
    color: '#686868',
  },
  toggleTextActive: {
    color: '#111',
  },
  generateButton: {
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    width: 280,
    alignSelf: 'center',
    marginTop: 150,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
});
