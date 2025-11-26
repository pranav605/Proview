import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthContext } from "@/contexts/authContext";
import { useContext } from "react";
import { Button, StyleSheet } from "react-native";

export default function OnboardingFinalScreen(){
    const authContext = useContext(AuthContext);
    return (
        <ThemedView style={styles.container}>
            <ThemedText type='title'>Register</ThemedText>
            <Button title="Proceed to login" onPress={authContext.completeOnboarding}/>
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