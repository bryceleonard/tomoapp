import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import MeditationScreen from '../screens/MeditationScreen';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import Library from '../screens/Library';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Signup" 
          component={Signup}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Library" 
          component={Library}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Meditation" 
          component={MeditationScreen}
          options={{ 
            title: 'Meditation',
            headerStyle: {
              backgroundColor: '#f8f9fa',
            },
            headerTintColor: '#000',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 