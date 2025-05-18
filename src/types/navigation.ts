export interface Meditation {
  id: string;
  text: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  DrawerNav: {
    screen?: string;
  };
  Meditation: {
    meditation?: Meditation;
    isLoading?: boolean;
    feeling?: string;
    duration?: number;
    userId?: string;
  };
  Upgrade: undefined;
  Home: undefined;
  Library: undefined;
  Logout: undefined;
}; 