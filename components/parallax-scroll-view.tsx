// ParallaxScrollView.tsx
import type { PropsWithChildren, ReactElement } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
    interpolate,
    useAnimatedRef,
    useAnimatedStyle,
    useScrollOffset,
} from "react-native-reanimated";

import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// 30% of screen height for header
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.5;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const backgroundColor = useThemeColor({}, "background");
  const colorScheme = useColorScheme() ?? "light";
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor: headerBackgroundColor[colorScheme], flex: 1 }}
      scrollEventThrottle={16}
      // pad content so it starts *under* the header
      contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
    >
      {/* Parallax header (30%) */}
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}
      >
        {headerImage}
      </Animated.View>

      {/* Main content (70%) */}
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    minHeight: SCREEN_HEIGHT * 0.5, // ensure at least 70% of screen
    padding: 32,
    gap: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25
  },
});
