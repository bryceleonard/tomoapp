export interface Meditation {
  id: string;
  userId: string;
  feeling: string;
  duration: number;
  meditationText: string;
  audioUrl: string;
  audioDuration: number;
  createdAt: Date;
}

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Library: undefined;
  Meditation: { feeling: string; duration: number } | { meditation: Meditation };
}; 