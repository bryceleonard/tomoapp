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
  const { feeling, duration } = route.params;
  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeditation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const currentUser = auth.currentUser;
        const userId = currentUser ? currentUser.uid : undefined;
        if (!userId) {
          setError('You must be logged in to generate a meditation.');
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/meditation/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feeling,
            duration,
            userId,
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const meditationData = await response.json();
        setMeditation(meditationData);
        await setVolume(1.0);
        setIsLoading(false);
      } catch (err: any) {
        setError('Failed to generate meditation. Please try again.');
        setIsLoading(false);
      }
    };
    fetchMeditation();
    return () => {
      stopAudio();
    };
  }, [feeling, duration]);

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
      <Text style={styles.text}>{meditation.text}</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handlePlayPause}>
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleStop}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
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