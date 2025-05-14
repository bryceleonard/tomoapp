import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Meditation } from '../types/navigation';
import { playAudio, pauseAudio, stopAudio, setVolume } from '../services/audioService';
import { auth } from '../firebase/firebaseConfig';

const API_BASE_URL = 'http://192.168.0.33:3000';

type MeditationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Meditation'>;
type MeditationScreenRouteProp = RouteProp<RootStackParamList, 'Meditation'>;

export default function MeditationScreen() {
  const navigation = useNavigation<MeditationScreenNavigationProp>();
  const route = useRoute<MeditationScreenRouteProp>();
  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMeditation = async () => {
      // If we have a complete meditation object, use it directly
      if ('meditation' in route.params) {
        setMeditation(route.params.meditation);
        return;
      }

      // Otherwise, generate a new meditation
      try {
        setIsLoading(true);
        setError(null);
        const { feeling, duration } = route.params;
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError('You must be logged in to generate a meditation.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/meditation/generate`, {
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const meditationData = await response.json();
        setMeditation(meditationData);
        await setVolume(1.0);
      } catch (err) {
        setError('Failed to generate meditation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMeditation();
    return () => {
      stopAudio();
    };
  }, [route.params]);

  const handlePlayPause = async () => {
    if (!meditation) return;
    try {
      if (isPlaying) {
        await pauseAudio();
      } else {
        await playAudio(meditation.audioUrl);
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      setError('Failed to control audio playback');
    }
  };

  const handleStop = async () => {
    try {
      await stopAudio();
      setIsPlaying(false);
    } catch (err) {
      setError('Failed to stop audio playback');
    }
  };

  const handleViewLibrary = () => {
    navigation.navigate('Library');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 20 }}>Generating your meditation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!meditation) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meditation</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handlePlayPause}>
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleStop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.button, styles.libraryButton]} onPress={handleViewLibrary}>
        <Text style={styles.buttonText}>View Library</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  libraryButton: {
    backgroundColor: '#2c3e50',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 