import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// TODO: Move this to a config file
const API_BASE_URL = 'http://192.168.0.33:3000';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Meditation {
  id: string;
  text: string;
  audioUrl: string;
  audioDuration: number;
  createdAt: Date;
}

export default function Home() {
  const [feeling, setFeeling] = useState('');
  const [duration, setDuration] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setIsReady(true);
    }
  }, [isFocused]);

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

      console.log('Generating meditation for:', { feeling, duration });
      
      console.log('Making API request...');
      const response = await fetch(`${API_BASE_URL}/api/meditation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeling,
          duration,
          userId: currentUser.uid,
        }),
      });

      console.log('Response received:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const meditation = await response.json();
      console.log('Meditation generated:', meditation);
      
      // Navigate to meditation screen with the generated meditation
      navigation.navigate('Meditation', { feeling, duration });
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
        <Text style={styles.title}>Tomo Meditation</Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    </ScrollView>
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
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#6c757d',
    fontSize: 16,
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
