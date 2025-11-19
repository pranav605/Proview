import { AuthProvider } from "@/contexts/authContext";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout(){
    return (
        <AuthProvider>
            <Stack>
                <Stack.Screen name="(protected)" options={{
                    headerShown: false,
                    animation:'fade'
                }}/>
                <Stack.Screen name="authPage" options={{
                    headerShown: false,
                    animation:'fade'
                }}/>
            </Stack>
        </AuthProvider>
    )
}