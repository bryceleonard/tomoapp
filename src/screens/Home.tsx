import React from 'react';
import { View, Text, Button } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

export default function Home() {
  return (
    <View>
      <Text>Welcome! You are logged in.</Text>
      <Button title="Logout" onPress={() => signOut(auth)} />
    </View>
  );
}
