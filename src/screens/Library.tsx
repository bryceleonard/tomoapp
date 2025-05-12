import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Meditation } from '../types/navigation';
import { auth } from '../firebase/firebaseConfig';

// TODO: Move this to a config file
const API_BASE_URL = 'http://192.168.0.33:3000';

type LibraryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Library'>;

export default function Library() {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<LibraryScreenNavigationProp>();

  useEffect(() => {
    fetchMeditations();
  }, []);

  const fetchMeditations = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const response = await fetch(`${API_BASE_URL}/api/meditation/history?userId=${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Sort meditations by date, most recent first
      const sortedMeditations = data.sort((a: Meditation, b: Meditation) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMeditations(sortedMeditations);
    } catch (error) {
      console.error('Error fetching meditations:', error);
      // TODO: Show error to user
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderMeditationItem = ({ item }: { item: Meditation }) => (
    <TouchableOpacity
      style={styles.meditationItem}
      onPress={() => navigation.navigate('Meditation', { 
        meditation: item
      })}
    >
      <View style={styles.meditationContent}>
        <View style={styles.meditationHeader}>
          <Text style={styles.meditationFeeling}>{item.feeling}</Text>
          <Text style={styles.caret}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Library</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3e50" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
      </View>

      {meditations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No meditations yet</Text>
          <Text style={styles.emptyStateSubtext}>Your meditation history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={meditations}
          renderItem={renderMeditationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
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
  listContainer: {
    padding: 16,
  },
  meditationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  meditationContent: {
    gap: 4,
  },
  meditationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meditationFeeling: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  caret: {
    fontSize: 24,
    color: '#6c757d',
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 