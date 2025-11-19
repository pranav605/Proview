import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

type AuthState = {
    isReady: boolean,
    isLoggedIn: boolean,
    logIn: () => void,
    logOut: () => void,
}

export const AuthContext = createContext<AuthState>({
    isReady: false,
    isLoggedIn: false,
    logIn: () => { },
    logOut: () => { },
});

const authStorageKey = "auth-key";

export function AuthProvider({ children }: PropsWithChildren) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();
    const AsyncStorage = useAsyncStorage(authStorageKey);
    const storeAuthState = async (newState: { isLoggedIn: boolean }) => {
        try {
            const jsonValue = JSON.stringify(newState);
            await AsyncStorage.setItem(jsonValue);
        } catch (error) {
            console.log("Error Saving", error);
        }
    }

    const logIn = () => {
        setIsLoggedIn(true);
        storeAuthState({ isLoggedIn: true })
        router.replace("/")
    }
    const logOut = () => {
        setIsLoggedIn(false);
        storeAuthState({ isLoggedIn: false })
        router.replace("/authPage");
    }

    useEffect(() => {
        const getAuthFromStorage = async () => {
            //simulating delay to check splash screen
            await new Promise((res) => setTimeout(() => res(null), 1000));
            try {
                const value = await AsyncStorage.getItem();
                if (value !== null) {
                    const auth = JSON.parse(value);
                    setIsLoggedIn(auth.isLoggedIn);
                }
            } catch (error) {
                console.log("Error fetching auth state from storage", error);
            }
            setIsReady(true);
        };
        getAuthFromStorage();
    }, []);

    useEffect(()=>{
        if(isReady){
            SplashScreen.hide();
        }
    }, [isReady])

    return <AuthContext value={{ isReady, isLoggedIn, logIn, logOut }}>
        {children}
    </AuthContext>
}