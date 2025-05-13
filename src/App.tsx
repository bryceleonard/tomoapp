import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import Home from './screens/Home';
import Login from './screens/Login';
import MeditationScreen from './screens/MeditationScreen';
import Library from './screens/Library';
import { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider>
      <StripeProvider
        publishableKey={process.env.STRIPE_PUBLISHABLE_KEY!}
        urlScheme="tomo"
      >
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Meditation" component={MeditationScreen} />
            <Stack.Screen name="Library" component={Library} />
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </PaperProvider>
  );
} 