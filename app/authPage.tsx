import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { AuthContext } from '@/contexts/authContext';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import * as Haptics from 'expo-haptics';
import React, { useContext } from 'react';
import {
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

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    authState.logIn();
    // Your login logic here
  };

  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Your Google sign-in logic here
  };

  const handleAppleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Your Apple sign-in logic here
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
            <ThemedText type="title">ProView</ThemedText>
            <SafeAreaView style={styles.inputContainer}>
              <TextInput value="" id="username" placeholder="Email" style={styles.inputField} />
              <TextInput value="" id="password" placeholder="Password" secureTextEntry style={styles.inputField} />
              <TouchableOpacity
                onPress={handleLogin}
                style={[{ backgroundColor: Colors[colorScheme ?? 'light'].tint }, styles.loginButton]}
              >
                <Text style={{ color: Colors[colorScheme ?? 'light'].background }}>Login</Text>
              </TouchableOpacity>

              {/* Social Login Buttons */}
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  style={[styles.socialButton, { backgroundColor: '#DB4437' }]}
                >
                  <Text style={styles.socialButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAppleSignIn}
                  style={[styles.socialButton, { backgroundColor: '#000000' }]}
                >
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
  },
  socialButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
