export interface Meditation {
  id: string;
  text: string;
  audioUrl: string;
  audioDuration: number;
  createdAt: Date;
}

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Meditation: { feeling: string; duration: number };
}; 