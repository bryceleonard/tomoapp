export interface Meditation {
  id: string;
  userId: string;
  feeling: string;
  duration: number;
  meditationText: string;
  audioUrl: string;
  audioDuration: number;
  createdAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  DrawerNav: {
    screen?: string;
  };
  Home: undefined;
  Library: undefined;
  Meditation: { meditation: Meditation };
  Upgrade: undefined;
  Logout: undefined;
}; 