export interface Meditation {
  id?: string;
  userId: string;
  feeling: string;
  duration: number;
  meditationText: string;
  audioUrl: string;
  audioDuration: number;
  createdAt: Date;
}

export interface MeditationResponse {
  id: string;
  meditationText: string;
  audioUrl: string;
  audioDuration: number;
  createdAt: Date;
} 