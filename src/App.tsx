import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import Login from './screens/Login';
import Signup from './screens/Signup';
import Home from './screens/Home';


function Main() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      {!user ? (
        <>
          <Login />
          <Signup />
        </>
      ) : (
        <Home />
      )}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
