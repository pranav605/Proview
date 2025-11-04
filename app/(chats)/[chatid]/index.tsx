// import { useLocalSearchParams } from 'expo-router';
// import React, { useState } from 'react';
// import { Text, View } from 'react-native';

// export default function Index() {
//   const { chatid } = useLocalSearchParams<{ chatid: string }>();

//  const [chats] = useState([
//   { 
//     id: '1', 
//     name: 'Iphone 17', 
//     review: "The iPhone 17 is widely praised as Apple's best standard iPhone in years, bringing features that used to be exclusive to the Pro models. It has a larger 6.3-inch Super Retina XDR OLED display with 120Hz ProMotion and Always-On functionality, delivering crisp and vibrant visuals with smooth scrolling. Powered by the A19 chip and 8GB RAM, it offers fast performance for everyday tasks, AI-enhanced photo processing, and improved wireless connectivity. The base storage starts at 256GB, doubling last year's entry level. The highlight of the iPhone 17 is its revamped camera system, especially the new 18MP 'Center Stage' front camera with a square sensor. This allows wide landscape-style selfies even when holding the phone vertically and supports dynamic group selfies by automatically adjusting the frame to fit multiple people. The rear camera setup features a 48MP Dual Fusion system with 2x optical telephoto and ultra-wide macro capabilities. Dual Capture mode lets users record front and rear cameras simultaneously, great for content creators and vlogging. In daily use, the iPhone 17 offers all-day battery life with up to 8 more hours of video playback compared to the previous generation. It has a sturdy Ceramic Shield 2 with better scratch resistance and retains IP68 water resistance. While gaming on the highest settings can cause some overheating due to the lack of specialized cooling seen in Pro models, the phone balances performance and comfort well. It is available in fresh colors like Sage, Mist Blue, and Lavender, making it a compelling and well-rounded choice for most users."
//   },
//   { 
//     id: '2', 
//     name: 'sony xm5 headphones', 
//     review: "The Sony WH-1000XM5 headphones represent a significant redesign with best-in-class active noise cancellation that outperforms competitors like Bose and even their predecessor, the XM4. With eight total microphones (four for ANC, four for voice calls), they excel at blocking out ambient noise from plane engines to office chatter, making them ideal for travel and noisy environments. The adaptive ANC automatically optimizes performance based on your surroundings, though proper fit is crucial for maximum effectiveness. Sound quality is impressive with sensational clarity, punchy delivery, and precise bass, though the stock tuning may need EQ adjustments for audiophile listeners who prefer a more neutral sound. The headphones feature a comfortable lightweight design perfect for long listening sessions, delivering 30 hours of battery life with ANC enabled (40 hours without). Quick charging provides 3 hours of playback from just 3 minutes of charging. The standout improvement is voice call quality—AI-powered noise reduction with four beamforming microphones makes calls crystal clear even in noisy streets with traffic and wind. The XM5 supports multipoint Bluetooth pairing for connecting two devices simultaneously, has intuitive touch controls on the right ear cup, and includes features like Speak-to-Chat and Quick Attention mode. While the new single-hinge design means they don't fold as compactly as the XM4, and some users report hinge material peeling over time, these remain the gold standard for wireless noise-cancelling headphones with an excellent balance of comfort, sound quality, and smart features."
//   },
// ]);

  
//   return (
//     <View style={{display:'flex', flex:1, backgroundColor:'#191a1a', padding:16}}>
//       <Text style={{color:'white'}}>{chats[Number(chatid)].review}</Text>
//     </View>
//   )
// }
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams } from 'expo-router';
import { SendHorizonal } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TypeWriter from 'react-native-typewriter';

type Message = {
  role: 'user' | 'ai';
  text: string;
  searchData?: any[];
};

// Simulated database - stores chat messages in memory
const simulatedDB: Record<string, { chatName: string; messages: Message[] }> = {};

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    chatid: string;
    chatName?: string;
    initialQuery?: string;
  }>();
  
  // Extract chatid - force it to be a string for comparison
  const chatid = Array.isArray(params.chatid) ? params.chatid[0] : params.chatid;
  const chatName = Array.isArray(params.chatName) ? params.chatName[0] : params.chatName;
  const initialQuery = Array.isArray(params.initialQuery) ? params.initialQuery[0] : params.initialQuery;
  
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const animatedHeight = useRef(new Animated.Value(50)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // Track the last loaded chat ID
  const lastLoadedChatId = useRef<string>('');

  // Reset and load chat whenever chatid changes
  useEffect(() => {
    console.log('🔄 Chat ID changed to:', chatid);
    
    // Only proceed if chatid actually changed
    if (lastLoadedChatId.current === chatid) {
      console.log('⏭️  Same chat ID, skipping reload');
      return;
    }
    
    lastLoadedChatId.current = chatid;
    
    // Reset all state
    console.log('🧹 Resetting state for new chat');
    setMessages([]);
    setQuery('');
    setLoading(false);
    setShowReferences(false);
    
    // Load the appropriate chat
    if (initialQuery) {
      console.log('🆕 New chat with initial query:', initialQuery);
      handleSendMessage(initialQuery, true);
    } else {
      console.log('📂 Loading existing chat from DB');
      fetchChatHistory();
    }
  }, [chatid]); // Only depend on chatid

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    
    console.log('📥 Fetching chat history for:', chatid);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Check if chat exists in simulated DB
      const chatData = simulatedDB[chatid];
      
      if (chatData && chatData.messages.length > 0) {
        console.log('✅ Found', chatData.messages.length, 'messages in DB');
        setMessages(chatData.messages);
        // Scroll to bottom after loading
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } else {
        console.log('❌ No messages found for this chat');
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(event.nativeEvent.contentSize.height + 20, 150);
    Animated.timing(animatedHeight, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleSendMessage = async (messageText?: string, isInitialQuery: boolean = false) => {
    const textToSend = messageText || query.trim();
    if (!textToSend || loading) return;

    // const userMessage: Message = { role: 'user', text: textToSend };
    // setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setShowReferences(false);

    try {
      console.log('🤖 Calling AI API for:', textToSend);
      
      // Call your REAL API
      const res = await fetch('http://192.168.2.117:5000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });
      const data = await res.json();
      
      const aiMessage: Message = {
        role: 'ai',
        text: data.response || 'No response received.',
        searchData: data.searchData,
      };
      
      setMessages((prev) => [...prev, aiMessage]);

      // Save to simulated database (in-memory storage)
      saveMessagesToDatabase([aiMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = { 
        role: 'ai', 
        text: '⚠️ Something went wrong. Try again.' 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const saveMessagesToDatabase = (newMessages: Message[]) => {
    try {
      // Initialize chat in simulated DB if it doesn't exist
      if (!simulatedDB[chatid]) {
        simulatedDB[chatid] = {
          chatName: chatName || `Chat ${chatid}`,
          messages: [],
        };
      }
      
      // Append new messages
      simulatedDB[chatid].messages.push(...newMessages);
      
      console.log(`✅ Saved ${newMessages.length} messages to chat ${chatid}`);
      console.log(`💾 Total chats in memory:`, Object.keys(simulatedDB).length);
    } catch (err) {
      console.error('Failed to save messages:', err);
    }
  };

  const renderReferences = (searchData: any) => (
    <MotiView style={styles.referencesWrapper}>
      {searchData?.map((src: any, idx: number) => (
        <ExternalLink href={src.link} key={idx} style={styles.referenceItem}>
          <ThemedText type='reference'>
            {idx + 1}.{" "}
            {src.link.includes(".com")
              ? src.link.split(".com")[0].split(".").at(-1)
              : src.link.split("www.")[1]?.split(".").at(0)}
          </ThemedText>
        </ExternalLink>
      ))}
    </MotiView>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isLastAiMessage = item.role === 'ai' && index === messages.length - 1;
    
    return (
      <MotiView
        from={{
          opacity: 0,
          translateX: item.role === 'user' ? 20 : -10,
          translateY: item.role === 'user' ? 40 : -40,
        }}
        animate={{ opacity: 1, translateY: 0, translateX: 0 }}
        transition={{ duration: 250 }}
        style={[
          styles.messageContainer,
          item.role === 'user' ? styles.userAlign : styles.aiAlign,
        ]}
      >
        <View
          style={[
            styles.bubble,
            item.role === 'user' ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {item.role === 'ai' ? (
            <>
              <TypeWriter
                typing={1}
                minDelay={1}
                maxDelay={1}
                style={styles.messageText}
                onTypingEnd={() => isLastAiMessage && setShowReferences(true)}
              >
                {item.text}
              </TypeWriter>
              {showReferences && isLastAiMessage && renderReferences(item.searchData)}
            </>
          ) : (
            <Text style={styles.messageText}>{item.text}</Text>
          )}
        </View>
      </MotiView>
    );
  };

  // Show loading state while fetching history
  if (isLoadingHistory) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Loading chat...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={loading ? [...messages, { role: 'ai', text: 'Thinking...' }] : messages}
          keyExtractor={(_, i) => `${chatid}-${i}`}
          renderItem={renderMessage}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          style={styles.flex1}
        />

        {/* Input Bar */}
        <View style={styles.inputWrapper}>
          <Animated.View style={[
            styles.inputContainer,
            { 
              height: animatedHeight,
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].tint,
            }
          ]}>
            <View style={styles.row}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Ask a follow-up..."
                placeholderTextColor="#888"
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
                onContentSizeChange={handleContentSizeChange}
                multiline
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => handleSendMessage()}
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
                ) : (
                  <SendHorizonal
                    color={query.trim() ? Colors[colorScheme ?? 'light'].tint : '#888'}
                    size={22}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  messageContainer: { marginVertical: 8, flexDirection: 'row', paddingHorizontal: 10 },
  userAlign: { justifyContent: 'flex-end' },
  aiAlign: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '100%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  userBubble: { backgroundColor: '#303030', maxWidth: '75%' },
  aiBubble: { width: '100%', textAlign: 'justify' },
  messageText: { fontSize: 16, color: '#e8e8e3' },
  referencesWrapper: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 8 },
  referenceItem: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: "#404040" },
  flatListContent: { paddingVertical: 16, paddingBottom: 120, flexGrow: 1 },
  inputWrapper: { position: 'absolute', bottom: 20, left: 10, right: 10 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 25, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    minHeight: 50 
  },
  row: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  input: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    fontSize: 16, 
    maxHeight: 150 
  },
  button: { 
    width: 38, 
    height: 38, 
    borderRadius: 100, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 6 
  },
});

