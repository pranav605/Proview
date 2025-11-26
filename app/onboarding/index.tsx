import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthContext } from "@/contexts/authContext";
import { Link } from "expo-router";
import { useContext } from "react";
import { Button, StyleSheet } from "react-native";

export default function OnboardingFirstScreen(){
    const authContext = useContext(AuthContext);
    return (
        <ThemedView style={styles.container}>
            <ThemedText type='title'>Welcome to ProView</ThemedText>
            <Link asChild push href={'/onboarding/final'} >
                <Button title="Continue ->"/>
            </Link>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})