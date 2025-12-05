import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";


SplashScreen.preventAutoHideAsync();

type RegisterResult = { success: boolean; message: string };

type UserProfile = {
  id: string,
  name: string,
  avatar_url: string | null | undefined,
  email: string,
}

type AuthState = {
  isReady: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
  hasCompletedOnboarding: boolean;
  logIn: (email: string, password: string, redirect: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  logOut: () => Promise<void>;
  updateProfile: (name: string, avatar_url?: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isReady: false,
  isLoggedIn: false,
  user: null,
  hasCompletedOnboarding: false,
  logIn: async () => { },
  register: async () => ({ success: false, message: 'Not implemented' }),
  logOut: async () => { },
  updateProfile: async () => { },
  completeOnboarding: async () => { },
  resetOnboarding: async () => { },
});

const ONBOARDING_KEY = "@proview_onboarding_completed";

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const router = useRouter();

  // Load onboarding state from AsyncStorage
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasCompletedOnboarding(!!completed);
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      }
    };
    loadOnboardingState();
  }, []);


  // Listen to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session?.user);

      if (session?.user) {
        // Fetch user profile from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, updated_at')
          .eq('id', session.user.id)
          .single();


        const { data: urlData } = supabase.storage
          .from('profile-images') // replace with your actual bucket name
          .getPublicUrl(profile?.avatar_url);

        setUser(profile ? {
          ...profile,
          avatar_url: urlData.publicUrl,
          email: session.user.email || ''
        } : null);
      } else {
        setUser(null);
      }


    });

    return () => subscription.unsubscribe();
  }, []);

  const logIn = async (email: string, password: string, redirect: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.log("Login error:", error.message);
      throw error;
    }
    setIsLoggedIn(true);
    { redirect && router.replace("/"); }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      return { success: true, message: "success" };
    } catch (err: any) {
      console.error("Registration error:", err.message);
      return { success: false, message: err.message };
    }

  };

  const updateProfile = async (name: string, avatar_url?: string) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user!.id, name, avatar_url }, { onConflict: 'id' });
    if (error) throw error;

    setUser(prev => prev ? { ...prev, name, avatar_url } : null);
  };

  const logOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    router.replace("/authPage");
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
  }

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  }

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <AuthContext.Provider value={{ isReady, isLoggedIn, user, hasCompletedOnboarding, logIn, register, logOut, updateProfile, completeOnboarding, resetOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}
