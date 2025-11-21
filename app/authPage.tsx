import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { AuthContext } from '@/contexts/authContext';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import * as Haptics from 'expo-haptics';
import React, { useContext, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const AuthPage = () => {
  const colorScheme = useColorScheme();
  const authState = useContext(AuthContext);
  const google = require('../assets/images/google.png');
  const apple = require('../assets/images/apple.png');
  const parrot = require('../assets/images/parrot.png');

  // Local state for form fields and mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await authState.logIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Your Google sign-in logic here (use Supabase OAuth)
  };

  const handleAppleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Your Apple sign-in logic here (use Supabase OAuth)
  };

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ThemedView style={styles.container}>
            <ThemedView style={styles.title}>
              <Image source={ parrot } style={styles.icon} />
              <ThemedText type="title">ProView</ThemedText>
            </ThemedView>
            <SafeAreaView style={styles.inputContainer}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                style={styles.inputField}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                style={styles.inputField}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />

              {error && <Text style={{ color: 'red', marginVertical: 8 }}>{error}</Text>}

              {/* Login/Register Button */}
              <TouchableOpacity
                onPress={handleLogin}
                style={[{ backgroundColor: Colors[colorScheme ?? 'light'].tint }, styles.loginButton]}
                disabled={loading}
              >
                <Text style={{ color: Colors[colorScheme ?? 'light'].background }}>
                  {'Login'}
                </Text>
              </TouchableOpacity>

              {/* Social Login Buttons */}
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  style={[styles.socialButton, { backgroundColor: colorScheme == 'light' ? '#000000' : '#ffffff' }]}
                >
                  <Image source={ google } style={styles.icon} />
                  <Text style={styles.socialButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAppleSignIn}
                  style={[styles.socialButton, { backgroundColor: colorScheme == 'light' ? '#000000' : '#ffffff' }]}
                >
                  <Image source={apple} style={styles.icon} />
                  <Text style={styles.socialButtonText}>Sign in with Apple</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </ThemedView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
};

export default AuthPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 10,
  },
  inputField: {
    width: '80%',
    height: 50,
    padding: 8,
    borderWidth: 1,
    borderColor: '#3d3f3e',
    borderRadius: 25,
    backgroundColor: '#1f2121',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 50,
  },
  loginButton: {
    width: '50%',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonsContainer: {
    marginTop: 20,
    width: '80%',
    rowGap: 12,
  },
  socialButton: {
    height: 48,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  socialButtonText: {
    fontWeight: 'bold',
  },
  icon: {
    maxHeight: 25,
    maxWidth: 25,
  },
  title: {
    flexDirection: 'row'
  }
});
