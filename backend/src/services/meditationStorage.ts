import { db } from '../config/firebase';
import { Meditation } from '../types/meditation';
import * as admin from 'firebase-admin';

export async function saveMeditation(meditation: Meditation): Promise<Meditation> {
  try {
    const docRef = await db.collection('meditations').add({
      ...meditation,
      createdAt: admin.firestore.Timestamp.fromDate(meditation.createdAt)
    });

    return {
      ...meditation,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error saving meditation:', error);
    throw error;
  }
}

export async function getUserMeditations(userId: string): Promise<Meditation[]> {
  try {
    console.log('=== MeditationStorage: Getting User Meditations ===');
    console.log('User ID:', userId);
    
    const snapshot = await db
      .collection('meditations')
      .where('userId', '==', userId)
      .limit(50)
      .select('id', 'feeling', 'createdAt', 'audioUrl')
      .get();

    console.log(`Found ${snapshot.docs.length} meditation documents`);
    
    const meditations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        feeling: data.feeling,
        createdAt: data.createdAt.toDate(),
        audioUrl: data.audioUrl
      } as Meditation;
    });

    return meditations;
  } catch (error: unknown) {
    console.error('=== Error in getUserMeditations ===');
    if (error && typeof error === 'object' && 'constructor' in error) {
      console.error('Error type:', error.constructor.name);
    }
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
} 