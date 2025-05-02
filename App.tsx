import React from 'react';
import { Text, View, StyleSheet, SafeAreaView } from 'react-native';
import { AuthProvider } from './src/auth/AuthProvider';
import { useAuth } from './src/auth/useAuth';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';
import Home from './src/screens/Home';

function Main() {
  const { user } = useAuth();
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Welcome to TomoApp</Text>
          <Login />
          <Signup />
        </View>
      </SafeAreaView>
    );
  }
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
});
