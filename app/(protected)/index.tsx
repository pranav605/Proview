import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useChats } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { SendHorizonal } from 'lucide-react-native';
import { useRef, useState } from 'react';
import TypeWriter from 'react-native-typewriter';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const products = [
    { name: "Apple iPhone 17 Pro Max" }, { name: "Samsung Galaxy S25 Ultra" }, 
    { name: "Google Pixel 9 Pro" }, { name: "Apple MacBook Air (M3, 2024)" }, 
    { name: "Apple MacBook Pro 16-inch (M4, 2025)" }, { name: "Microsoft Surface Pro 11" }, 
    { name: "Dell XPS 15 (2025)" }, { name: "HP Spectre x360 14 (2025)" }, 
    { name: "Lenovo ThinkPad X1 Carbon Gen 12" }, { name: "Asus ROG Zephyrus G16 (2025)" },
    { name: "Sony PlayStation 5 Slim" }, { name: "Microsoft Xbox Series X" }, 
    { name: "Nintendo Switch OLED Model" }, { name: "Valve Steam Deck OLED" }, 
    { name: "Meta Quest 3" }, { name: "Apple iPad Pro 13-inch (M4, 2025)" }, 
    { name: "Samsung Galaxy Tab S10 Ultra" }, { name: "Amazon Kindle Oasis (2024)" }, 
    { name: "Remarkable 2 Paper Tablet" }, { name: "Wacom Cintiq Pro 27" }, 
    { name: "Apple Watch Series 11" }, { name: "Samsung Galaxy Watch 7 Classic LTE" }, 
    { name: "Garmin Fenix 8" }, { name: "Fitbit Charge 7" }, { name: "Whoop 5.0 Strap" }, 
    { name: "Sony WH-1000XM5" }, { name: "Apple AirPods Pro (3rd Gen)" }, 
    { name: "Bose QuietComfort Ultra" }, { name: "Sennheiser Momentum 4 Wireless" }, 
    { name: "Jabra Elite 10" }, { name: "Canon EOS R5 Mark II" }, { name: "Nikon Z8" }, 
    { name: "GoPro Hero 13 Black" }, { name: "DJI Mavic 4 Pro" }, { name: "Insta360 X4" }, 
    { name: "Apple AirTag 2" }, { name: "Google Nest Cam (2025)" }, 
    { name: "Amazon Echo Show 15 (3rd Gen)" }, { name: "Philips Hue Bridge v3" }, 
    { name: "iRobot Roomba Combo j9+" }, { name: "Raspberry Pi 5" }, 
    { name: "Framework Laptop 2025" }, { name: "Valve Index 2 VR Kit" }, 
    { name: "Logitech MX Master 4" }, { name: "Corsair K100 RGB Optical-Mechanical" }, 
    { name: "Sony Aibo ERS-1000" }, { name: "Anker Nebula Capsule 4" }, 
    { name: "Withings Body Scan" }, { name: "Dyson Gen5detect" }, { name: "Oral-B iO Series 10" }
  ];

  const [query, setQuery] = useState('');
  const colorScheme = useColorScheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const animatedHeight = useRef(new Animated.Value(40)).current;
  const { addChat } = useChats();

  // Split products into rows
  const rows = [];
  const numRows = 20;
  const itemsPerRow = Math.ceil(products.length / numRows);
  for (let i = 0; i < numRows; i++) {
    rows.push(products.slice(i * itemsPerRow, (i + 1) * itemsPerRow));
  }

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(event.nativeEvent.contentSize.height + 20, 150);
    Animated.timing(animatedHeight, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleSend = async () => {
    if (!query.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const userQuery = query.trim();
    
    // Generate a new chat ID
    const newChatId = Date.now().toString();
    
    // Create a chat name (truncate if too long)
    const chatName = userQuery.length > 30 
      ? userQuery.substring(0, 30) + '...' 
      : userQuery;
    
    // Add chat to context (will appear in drawer immediately)
    addChat({ id: newChatId, name: chatName });
    
    // Clear the input
    setQuery('');
    
    // Navigate to the new chat route with the initial query
    router.push({
      pathname: '/(protected)/(chats)/[chatid]',
      params: { 
        chatid: newChatId,
        chatName: chatName,
        initialQuery: userQuery,
      }
    });

    setIsSubmitting(false);
  };

  const handleProductClick = (productName: string) => {
    setQuery(productName);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background, margin: 0, padding: 0 }]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.flex1}>
          <ThemedView style={styles.titleContainer}>
            <ThemedView style={styles.chatContainer}>
              {/* Static product rows */}
              <View style={styles.productRowsWrapper}>
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.productRow}>
                    {row.map((item, k) => (
                      <Pressable
                        key={k}
                        style={styles.productItem}
                        onPress={() => handleProductClick(item.name)}
                      >
                        <Text style={[styles.productText, { color: Colors[colorScheme ?? 'light'].text }, {backgroundColor:Colors[ colorScheme ?? 'light' ].background}]}>
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>

              {/* Foreground Proview Text */}
              <TypeWriter
                typing={1}
                style={[styles.proviewText, {color:Colors[ colorScheme ?? 'light' ].text}]}
                minDelay={20}
                maxDelay={60}
              >
                {'Proview'}
              </TypeWriter>
            </ThemedView>

            {/* Input Bar */}
            <View style={styles.inputWrapper} pointerEvents='box-none'>
              <Animated.View style={[styles.inputContainer, { height: animatedHeight }]}>
                <View style={styles.row}>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="What are you looking for..."
                    placeholderTextColor="#888"
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }, {backgroundColor:Colors[ colorScheme ?? 'light' ].background}]}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    onContentSizeChange={handleContentSizeChange}
                    multiline
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleSend}
                    disabled={isSubmitting || !query.trim()}
                  >
                    <SendHorizonal
                      color={query.trim() ? Colors[colorScheme ?? 'light'].tint : '#888'}
                      size={22}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </ThemedView>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  titleContainer: { flex: 1, paddingTop: 10, paddingBottom: 80 },
  chatContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  productRowsWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15, zIndex: 1 },
  productRow: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  productItem: { borderWidth: 1, borderColor: '#555', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, marginHorizontal: 6, backgroundColor: 'transparent' },
  productText: { color: '#e8e8e3', fontSize: 12 },
  proviewText: { color: '#fff', fontSize: 48, fontWeight: 'bold', textAlign: 'center', zIndex: 2 },
  inputWrapper: { position: 'absolute', bottom: 20, left: 10, right: 10, justifyContent: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3d3f3e', borderRadius: 25, paddingHorizontal: 12, paddingVertical: 6, minHeight: 50 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, textAlignVertical: 'top', fontSize: 16, maxHeight: 150 },
  button: { width: 38, height: 38, borderRadius: 100, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
});
