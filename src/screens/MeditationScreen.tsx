import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Meditation } from '../types/navigation';
import { playAudio, pauseAudio, stopAudio, setVolume, AudioStatus } from '../services/audioService';
import { auth } from '../firebase/firebaseConfig';
import LoadingAnimation from '../components/LoadingAnimation';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

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
  
  // Animated value for progress
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Constants for the circular progress
  const size = 180;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Update progress with animation
  const updateProgress = (newProgress: number) => {
    Animated.timing(progressAnim, {
      toValue: newProgress,
      duration: 100, // Short duration for smooth updates
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const initializeMeditation = async () => {
      console.log('=== Initializing Meditation ===');
      console.log('Route params:', route.params);

      // If we have a complete meditation object, use it directly
      if ('meditation' in route.params && route.params.meditation) {
        console.log('Using provided meditation:', route.params.meditation);
        setMeditation(route.params.meditation);
        return;
      }

      // Otherwise, generate a new meditation
      try {
        setIsLoading(true);
        setError(null);
        const { feeling, duration, userId } = route.params;
        console.log('Generation params:', { feeling, duration, userId });

        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error('No current user found');
          setError('You must be logged in to generate a meditation.');
          return;
        }

        console.log('Making API request to generate meditation...');
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

        console.log('API Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Failed to generate meditation: ${response.statusText}`);
        }

        const meditationData = await response.json();
        console.log('Meditation generated successfully:', meditationData);
        setMeditation(meditationData);
        await setVolume(1.0);
      } catch (err) {
        console.error('Error in initializeMeditation:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate meditation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMeditation();
    return () => {
      console.log('Cleaning up meditation screen...');
      stopAudio();
    };
  }, [route.params]);

  // Reset state when meditation completes
  const handleCompletion = () => {
    setIsPlaying(false);
    updateProgress(0);
  };

  const handlePlayPause = async () => {
    if (!meditation) return;
    try {
      if (isPlaying) {
        await pauseAudio();
        setIsPlaying(false);
      } else {
        await playAudio(meditation.audioUrl, (status: AudioStatus) => {
          updateProgress(status.progress);
          // Check if meditation has completed
          if (status.progress >= 1) {
            handleCompletion();
          }
        });
        setIsPlaying(true);
      }
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
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <LoadingAnimation />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('Going back due to error...');
            navigation.goBack();
          }}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!meditation) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerLogo}>Tomo</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerButtonText}>View My Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <View style={styles.playerContainer}>
        <Svg width={size} height={size} style={styles.progressCircle}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#63B4D1"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, 0]
            })}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={40} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Create an animated version of the Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeHeader: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingTop: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLogo: {
    fontSize: 40,
    color: '#111',
  },
  headerButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
  },
  playButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#63B4D1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
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
}); 