import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { AuthContext } from '@/contexts/authContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabaseClient';
import { useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

type Message = {
  text: string;
  searchData?: any[];
};

// Simulated database - stores chat messages in memory
const simulatedDB: Record<string, { chatName: string; message: Message }> = {};

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
  const [message, setMessage] = useState<Message>({ text: '', searchData: [] });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(false);
  const animatedHeight = useRef(new Animated.Value(50)).current;
  const flatListRef = useRef<FlatList>(null);
  const authContext = useContext(AuthContext);
  const [resendQuery, setResendQuery] = useState(initialQuery);

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
    setMessage({ text: '' });
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

    try {
      // Check if chat exists in simulated DB
      // const chatData = simulatedDB[chatid];
      // console.log(chatData)
      // if (chatData) {
      const { data, error } = await supabase.from('chats').select('summary, user_query').eq('id', chatid)

      if (error) {
        setMessage({ text: 'Failed to fetch chat history' });
        throw error;
      }


      if (!data[0].summary) {
        setResendQuery(data[0].user_query)
        setError(true);
      }

      const { data: sourceData, error: sourceDataError } = await supabase.from('chat_sources')
        .select(`link:source_url, snippet:source_snippet, title:source_name`)
        .eq('chat_id', chatid)
      if (sourceDataError) {
        throw sourceDataError;
      }

      setMessage({ text: data[0].summary, searchData: sourceData });
      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);

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
    setMessage({ text: '' });
    setLoading(true);
    setShowReferences(false);

    try {
      console.log('🤖 Calling AI API for:', textToSend);

      // Call your REAL API
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, chatId: chatid, userId: authContext.user?.id }),
      });
      const data = await res.json();

      const aiMessage: Message = {
        text: data.response || 'No response received.',
        searchData: data.searchData,
      };
      setError(false)
      setMessage(aiMessage);

      // Save to simulated database (in-memory storage)
      saveMessagesToDatabase(aiMessage);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setError(false);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        text: '⚠️ Something went wrong. Try again.'
      };
      setMessage(errorMessage);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const saveMessagesToDatabase = (newMessages: Message) => {
    try {
      // Initialize chat in simulated DB if it doesn't exist
      if (!simulatedDB[chatid]) {
        simulatedDB[chatid] = {
          chatName: chatName || `Chat ${chatid}`,
          message: { text: '', searchData: [] },
        };
      }

      // Append new messages
      simulatedDB[chatid].message = newMessages;

      console.log(`✅ Saved ${newMessages} messages to chat ${chatid}`);
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

  const renderMessage = ({ item }: { item: Message; }) => {

    return (
      <MotiView
        from={{
          opacity: 0,
          translateX: -10,
          translateY: -40,
        }}
        animate={{ opacity: 1, translateY: 0, translateX: 0 }}
        transition={{ duration: 250 }}
        style={[
          styles.messageContainer, styles.aiAlign,
        ]}
      >
        <View
          style={[
            styles.bubble, styles.aiBubble,
          ]}
        >
          <ThemedText>
            {item.text}
          </ThemedText>
          {renderReferences(item.searchData)}
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
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
     {!error && !loading && <ThemedText>
        {renderMessage({ item: message })}
      </ThemedText>}
      {/* Retry Button */}
      <View style={styles.inputWrapper}>
        {
          loading && !error && (
             <View
            style={{
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={ require('@/assets/images/loading.webp')}
              style={{
                width: 420,
                height: 420,
                resizeMode: "contain",
              }}
            />
            </View>
          )
        }
        {error && (
          <View
            style={{
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={loading ? require('@/assets/images/retrying.webp') : require('@/assets/images/swr.webp')}
              style={{
                width: 420,
                height: 420,
                resizeMode: "contain",
              }}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSendMessage(resendQuery)}
              disabled={loading || !resendQuery.trim()}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors[colorScheme ?? "light"].tint}
                />
              ) : (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 32,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                  borderRadius: 8,
                  gap: 4,
                }}>
                  <ThemedText type='default' style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: '600',
                  }} >Retry ?</ThemedText>
                </View>

              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
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
  messageContainer: { marginVertical: 8, flexDirection: 'row' },
  userAlign: { justifyContent: 'flex-end' },
  aiAlign: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '100%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  userBubble: { backgroundColor: '#303030', maxWidth: '75%' },
  aiBubble: { width: '100%', textAlign: 'justify' },
  messageText: { fontSize: 16 },
  referencesWrapper: { flexDirection: "row", flexWrap: "wrap", marginVertical: 16, gap: 8 },
  referenceItem: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: "#404040" },
  flatListContent: { paddingVertical: 16, paddingBottom: 120, flexGrow: 1 },
  inputWrapper: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
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
    height: 38,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
});

