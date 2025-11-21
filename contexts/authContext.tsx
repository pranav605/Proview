import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient"; // update path as needed

SplashScreen.preventAutoHideAsync();

type AuthState = {
  isReady: boolean;
  isLoggedIn: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isReady: false,
  isLoggedIn: false,
  logIn: async () => {},
  register: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  // Listen to auth state changes
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data?.session?.user);
      setIsReady(true);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.log("Login error:", error.message);
      // TODO: Show user error feedback
      return;
    }
    setIsLoggedIn(true);
    router.replace("/");
  };

  const register = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.log("Registration error:", error.message);
      // TODO: Show user error feedback
      return;
    }
    setIsLoggedIn(true);
    router.replace("/");
  };

  const logOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.replace("/authPage");
  };

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <AuthContext.Provider value={{ isReady, isLoggedIn, logIn, register, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}
