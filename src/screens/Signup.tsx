import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }
      
      console.log('Attempting to sign up with:', { email });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful:', userCredential.user);
      setError(''); // Clear any previous errors on success
    } catch (err: any) {
      console.error('Signup error:', err);
      let errorMessage = 'An error occurred during signup';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled';
            break;
          default:
            errorMessage = err.message || 'An unknown error occurred';
        }
      }
      
      setError(errorMessage);
    }
  };

  return (
    <View>
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <Button title="Sign Up" onPress={handleSignup} />
      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
    </View>
  );
}
