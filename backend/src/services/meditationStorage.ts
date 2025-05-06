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
    const snapshot = await db
      .collection('meditations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Meditation[];
  } catch (error) {
    console.error('Error fetching user meditations:', error);
    throw error;
  }
} 