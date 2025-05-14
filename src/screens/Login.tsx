import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }} />
      <View style={styles.centered}>
        <Text style={styles.logo}>Tomo</Text>
        <Text style={styles.subtitle}>meditations for the moment you are in</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>login</Text>
        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#222"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#222"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
          <Text style={styles.signInButtonText}>sign in</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
      </View>
      <View style={{ flex: 2 }} />
      <View style={styles.signupAbsoluteContainer}>
        <Text style={styles.signupPrompt}>Not a Tomo Member? No Problem!</Text>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => (navigation as any).replace('Signup')}
        >
          <Text style={styles.signupButtonText}>Create Free Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 24,
  },
  centered: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 16,
  },
  logo: {
    fontFamily: 'JosefinSlab-Bold',
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'JosefinSans-Regular',
    fontSize: 18,
    color: '#222',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 28,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginBottom: 35,
    color: '#111',
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 18,
    fontFamily: 'JosefinSans-Regular',
    fontSize: 16,
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#686868',
    color: '#222',
    height: 55,
  },
  signInButton: {
    backgroundColor: '#f1f1f1',
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#686868',
  },
  signInButtonText: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 18,
    color: '#111',
    fontWeight: 'bold',
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  divider: {
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#000',
    width: '100%',
  },
  signupAbsoluteContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  signupPrompt: {
    fontFamily: 'JosefinSans-Regular',
    fontSize: 18,
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#AEE0B0',
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    height: 55,
    justifyContent: 'center',
  },
  signupButtonText: {
    fontFamily: 'JosefinSans-Bold',
    fontSize: 18,
    color: '#111',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#dc3545',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'JosefinSans-Regular',
  },
});
