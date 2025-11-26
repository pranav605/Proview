import { AuthContext, AuthProvider } from "@/contexts/authContext";
import { Stack } from "expo-router";
import React, { useContext } from "react";

export default function RootLayout() {
  return (
    <AuthProvider>
      <InnerStack />
    </AuthProvider>
  );
}

function InnerStack() {
  const authContext = useContext(AuthContext);

  return (
    <Stack>
      <Stack.Protected guard={authContext.isLoggedIn}>
        <Stack.Screen name="(protected)" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!authContext.isLoggedIn && authContext.hasCompletedOnboarding}>
        <Stack.Screen name="authPage" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!authContext.hasCompletedOnboarding}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
