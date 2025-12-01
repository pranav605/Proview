// OnboardingScreen.tsx
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { AuthContext } from "@/contexts/authContext";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { supabase } from "@/utils/supabaseClient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { CheckCircle, Eye, EyeOff, Smile } from "lucide-react-native";
import { useContext, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from "react-native";
const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const authContext = useContext(AuthContext);
    const colorScheme = useColorScheme();
    const [authFields, setAuthFields] = useState({
        email: "",
        password: "",
    });
    const [profileFields, setProfileFields] = useState({
        name: "",
        image: "",
        imageType: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [imageUri, setImageUri] = useState(null);

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Ask for permission to access media library
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
                return;
            }
        }

        // Launch image picker
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1], // square crop for profile image
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const pickedUri = result.assets[0].uri;
            setProfileFields((p) => ({ ...p, image: pickedUri, imageType: result.assets[0].type || 'image/jpeg' }));
        }

    };

    const goNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (step < TOTAL_STEPS) setStep(step + 1);
        else {
            authContext.completeOnboarding();
        }
    };

    const goBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step > 1) setStep(step - 1);
    };

    const [isChecking, setIsChecking] = useState(true);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (step === 4) {
            interval = setInterval(async () => {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) {
                    console.error("User verify check error:", error);
                    return;
                }
                if (user?.email_confirmed_at) {
                    setVerified(true);
                    setIsChecking(false);
                    clearInterval(interval);

                    // Redirect after short delay to let user see the check
                    setTimeout(() => {
                        // Your redirect logic, e.g.:
                        router.replace("/login"); // or authContext.logIn(...);
                    }, 1500);
                }
            }, 3000); // every 3 seconds

            return () => clearInterval(interval);
        }
    }, [step]);

    const callRegister = () => {
        const register = async () => {
            const result = await authContext.register(authFields.email, authFields.password, profileFields.name, profileFields.image, profileFields.imageType);
            if (!result.success) {
                alert(`Registration failed: ${result.message}`);
            } else {
                // success flow
                goNext();
            }
        }
        register();
    }

    const progress = step / TOTAL_STEPS;
    const passwordInputRef = useRef(null);
    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            // account for status bar + progress bar height
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            <ThemedView style={styles.container}>
                {/* Progress bar (overlaid on top) */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                { backgroundColor: Colors[colorScheme ?? "light"].tint },
                                { flex: progress },
                            ]}
                        />
                        <View style={{ flex: 1 - progress }} />
                    </View>
                    <ThemedText style={styles.stepText}>
                        Step {step} / {TOTAL_STEPS}
                    </ThemedText>
                </View>

                <ParallaxScrollView
                    headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
                    headerImage={step === 2 && profileFields.image ? (
                        <Image
                            source={{ uri: profileFields.image }}
                            style={{ width: 192, height: 192, borderRadius: 48 }}
                        />
                    ) : (
                        <Smile size={96} />
                    )}
                >
                    {/* STEP 1 */}
                    {step === 1 && (
                        <View style={styles.content}>
                            <ThemedText type="title">Welcome to ProView</ThemedText>
                            <ThemedText>
                                Get quick, AI-assisted summaries of product reviews so you can
                                decide faster.
                            </ThemedText>
                        </View>
                    )}

                    {/* STEP 2 (form) */}
                    {step === 2 && (
                        <View style={styles.content}>
                            <ThemedText type="title">Tell us about you</ThemedText>
                            <ThemedText>
                                Give us your full name and select a picture with your widest
                                smile.
                            </ThemedText>

                            <TextInput
                                value={profileFields.name}
                                onChangeText={(text) =>
                                    setProfileFields((p) => ({ ...p, name: text }))
                                }
                                placeholder="Name"
                                style={[
                                    styles.inputField,
                                    { color: Colors[colorScheme ?? "light"].text },
                                    {
                                        backgroundColor:
                                            Colors[colorScheme ?? "light"].background,
                                    },
                                ]}
                                keyboardType="name-phone-pad"
                                autoCapitalize="none"
                                autoComplete="name"
                            />
                            <Pressable
                                onPress={pickImage}
                                style={[
                                    styles.inputField,
                                    styles.imagePickerButton,
                                    { backgroundColor: Colors[colorScheme ?? "light"].background },
                                ]}
                            >
                                <ThemedText style={{ color: Colors[colorScheme ?? "light"].text, textAlign: "center" }}>
                                    {profileFields.image ? "Change image" : "Upload an image"}
                                </ThemedText>
                            </Pressable>
                        </View>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <View style={styles.content}>
                            <ThemedText type="title">Create a user account</ThemedText>
                            <ThemedText>
                                Register with a email and password, make sure you use a strong password
                                that you will remember
                            </ThemedText>

                            <TextInput
                                value={authFields.email}
                                onChangeText={(text) =>
                                    setAuthFields((p) => ({ ...p, email: text }))
                                }
                                placeholder="Email"
                                style={[
                                    styles.inputField,
                                    { color: Colors[colorScheme ?? "light"].text },
                                    {
                                        backgroundColor:
                                            Colors[colorScheme ?? "light"].background,
                                    },
                                ]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    // Focus on the password input when Next is pressed
                                    passwordInputRef.current?.focus();
                                }}
                                // you can add blurOnSubmit=false to avoid keyboard closing on submit
                                blurOnSubmit={false}
                            />
                            <View style={{ position: "relative", width: "100%" }}>
                                <TextInput
                                    value={authFields.password}
                                    onChangeText={(text) =>
                                        setAuthFields((p) => ({ ...p, password: text }))
                                    }
                                    placeholder="Password"
                                    style={[
                                        styles.inputField,
                                        {
                                            color: Colors[colorScheme ?? "light"].text,
                                            backgroundColor: Colors[colorScheme ?? "light"].background,
                                            paddingRight: 40, // space for the icon
                                        },
                                    ]}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    ref={passwordInputRef}
                                />

                                <Pressable
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPassword((prev) => !prev) }}
                                    style={{
                                        position: "absolute",
                                        right: 12,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                    hitSlop={8}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={Colors[colorScheme ?? "light"].text} />
                                    ) : (
                                        <Eye size={20} color={Colors[colorScheme ?? "light"].text} />
                                    )}
                                </Pressable>
                            </View>

                        </View>
                    )}

                    {/* STEP 4 */}
                    {step === 4 && (
                        <View style={styles.content}>
                            <ThemedText type="title">Check your email inbox</ThemedText>
                            {!verified ? (
                                <>
                                    <ThemedText>
                                        We have sent you an email, open it and click on the link to activate the account.
                                        Once done return to the app.
                                    </ThemedText>
                                    <ActivityIndicator size="large" style={{ marginTop: 20 }} />
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={48} color={Colors[colorScheme ?? "light"].tint} style={{ marginTop: 20, alignSelf: "center" }} />
                                    <ThemedText style={{ marginTop: 8, textAlign: "center" }}>
                                        Account verified! Redirecting...
                                    </ThemedText>
                                </>
                            )}
                        </View>
                    )}


                    {/* Bottom buttons */}
                    <View style={styles.footer}>
                        {step > 1 && (
                            <Pressable
                                onPress={goBack}
                                style={[
                                    styles.button,
                                    { backgroundColor: Colors[colorScheme ?? "light"].backgroundDark },
                                ]}
                            >
                                <ThemedText style={styles.buttonText}>Back</ThemedText>
                            </Pressable>
                        )}
                        <Pressable
                            onPress={step === 3 ? callRegister : goNext}
                            style={[
                                { backgroundColor: Colors[colorScheme ?? "light"].tint },
                                styles.button,
                            ]}
                        >
                            <ThemedText style={styles.buttonText}>
                                {step === TOTAL_STEPS ? "Finish" : "Continue"}
                            </ThemedText>
                        </Pressable>
                    </View>
                </ParallaxScrollView>
            </ThemedView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressContainer: {
        position: "absolute",
        top: 60,
        width: "100%",
        paddingHorizontal: 16,
        zIndex: 10,
    },
    progressTrack: {
        flexDirection: "row",
        height: 4,
        borderRadius: 4,
        backgroundColor: "#E2E4EA",
        overflow: "hidden",
    },
    stepText: {
        marginTop: 8,
    },
    content: {
        justifyContent: "center",
        gap: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 32,
        marginBottom: 32,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 999,
    },
    buttonText: {
        color: "#ffffff",
        fontWeight: "600",
    },
    inputField: {
        width: "100%",
        height: 50,
        padding: 8,
        borderWidth: 1,
        borderColor: "#3d3f3e94",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 50,
    },
    imagePickerButton: {
        justifyContent: "center",
        alignItems: "center",
        height: 50, // same height as inputs
        borderColor: "#3d3f3e94",
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 4,
    },

    imagePreview: {
        width: 50,
        height: 50,
        borderRadius: 8,
        borderColor: "#3d3f3e94",
        borderWidth: 1,
        marginTop: 4,
        alignSelf: "center",
    },

});
