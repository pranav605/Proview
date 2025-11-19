import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MessagesSquare } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import HomeScreen from './index';
import ThreadScreen from './thread';

const Tab = createMaterialTopTabNavigator();

export default function ChatTabsLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ 
    chatid: string;
    chatName?: string;
  }>();
  
  const chatid = Array.isArray(params.chatid) ? params.chatid[0] : params.chatid;
  const chatName = Array.isArray(params.chatName) ? params.chatName[0] : params.chatName;
  
  // Log when params change
  useEffect(() => {
    console.log('📱 Layout: Params updated', { chatid, chatName });
  }, [chatid, chatName]);
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: chatName || `Chat ${chatid}`,
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
          headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push(`/(chats)/${chatid}/thread`)}
            style={{ marginRight: 15 }}
          >
            <MessagesSquare
              color={Colors[colorScheme ?? 'light'].text}
              size={22}
            />
          </TouchableOpacity>
        ),
      }}
      />
      <Tab.Navigator
        key={`${chatid}-${chatName}`} // Force remount on chatid change
        screenOptions={{
          swipeEnabled: true,
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            display: 'none'
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
          },
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        }}
      >
        <Tab.Screen
          name="index"
          component={HomeScreen}
          initialParams={{ chatid, chatName }}
        />
        <Tab.Screen
          name="thread"
          component={ThreadScreen}
          initialParams={{ chatid, chatName }}
        />
      </Tab.Navigator>
    </>
  );
}
