import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";


SplashScreen.preventAutoHideAsync();

type RegisterResult =
  | { success: boolean }
  | { success: boolean; message: string };


type AuthState = {
  isReady: boolean;
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, image: string, imageType: string) => Promise<RegisterResult>;
  logOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  isReady: false,
  isLoggedIn: false,
  hasCompletedOnboarding: false,
  logIn: async () => { },
  register: async () => ({ success: false, message: 'Not implemented' }),
  logOut: async () => { },
  completeOnboarding: async () => { },
  resetOnboarding: async () => { },
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
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

  const register = async (email: string, password: string, name: string, image: string, imageType: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("No user returned from signUp");

      // Read the file as base64
      // const file = new FileSystem.File(image);
      // let base64 = '';
      // file.base64().then((base)=>{
      //   base64= base;
      // })

      // // Define unique file path
      // const fileExt = image.split('.').pop() || 'jpg';
      // const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      // const filePath = `profile-images/${fileName}`;

      // // Upload using Supabase Storage from base64 buffer
      // const { error: uploadError } = await supabase.storage
      //   .from('profile-images')
      //   .upload(filePath, base64, {
      //     cacheControl: '3600',
      //     upsert: false,
      //     contentType: imageType || 'image/jpeg',
      //   });

      // if (uploadError) throw uploadError;

      // const { error: profileError } = await supabase
      //   .from('profiles')
      //   .insert({
      //     id: user.id,
      //     name: name,
      //     image: filePath, // Save path, not the local image URI
      //   });

      // if (profileError) throw profileError;

      return { success: true };
    } catch (err: any) {
      console.error("Registration error:", err.message);
      return { success: false, message: err.message };
    }
    
  };



  const logOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.replace("/authPage");
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    router.replace("/authPage");
  }

  const resetOnboarding = async () => {
    setHasCompletedOnboarding(false);
    router.replace("/")
  }

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <AuthContext.Provider value={{ isReady, isLoggedIn, hasCompletedOnboarding, logIn, register, logOut, completeOnboarding, resetOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}
