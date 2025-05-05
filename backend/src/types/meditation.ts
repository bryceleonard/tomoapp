export interface Meditation {
  id?: string;
  userId: string;
  feeling: string;
  duration: number;
  meditationText: string;
  createdAt: Date;
}

export interface MeditationResponse {
  id: string;
  meditationText: string;
  createdAt: Date;
} 