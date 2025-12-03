import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { AuthContext } from '@/contexts/authContext';
import { ChatProvider, useChats } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabaseClient';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { EditIcon, MessageCircle, Settings } from 'lucide-react-native';
import { useContext, useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';


function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const { chats } = useChats();

  // Use React Navigation state instead of pathname
  const currentRoute = props.state.routes[props.state.index];
  const currentChatId = currentRoute.params?.chatid;

  const [profileUrl, setProfileUrl] = useState('');
  const [userName, setuseName] = useState('Jane Doe')

  useEffect(() => {
    const fetchProfileUrl = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error(userError);
        return;
      }
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, name')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if(data.name){
          setuseName(data.name);
        }

        if (data.avatar_url) {
          const { data: urlData } = supabase.storage
            .from('profile-images') // replace with your actual bucket name
            .getPublicUrl(data.avatar_url);
            
          setProfileUrl(urlData.publicUrl);
        } else {
          setProfileUrl('');
        }
      } catch (error) {
        console.error('Error fetching avatar_url:', error);
      }
    };
    fetchProfileUrl();
  }, []);

  return (
    <ThemedView style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItem
          label="New Search"
          onPress={() => {
            props.navigation.navigate('index');
          }}
          icon={({ color, size }) => <EditIcon color={color} size={size} />}
          activeTintColor={Colors[colorScheme ?? 'light'].tint}
          inactiveTintColor={Colors[colorScheme ?? 'light'].text}
          focused={currentRoute.name === 'index'}
          style={{ borderRadius: 12 }}
        />

        {chats.map((chat) => (
          <DrawerItem
            key={chat.id}
            label={chat.name}
            onPress={() => {
              console.log('🎯 Drawer: Navigating to chat', chat.id);
              props.navigation.navigate('(chats)/[chatid]', {
                chatid: chat.id,
                chatName: chat.name,
              });
            }}
            icon={({ color, size }) => <MessageCircle color={color} size={size} />}
            activeTintColor={Colors[colorScheme ?? 'light'].tint}
            inactiveTintColor={Colors[colorScheme ?? 'light'].text}
            focused={currentChatId === chat.id}
          />
        ))}


      </DrawerContentScrollView>
      <DrawerItem
        label={() => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemedText style={{ color: Colors[colorScheme ?? 'light'].text }}>{userName}</ThemedText>
            <Settings color={Colors[colorScheme ?? 'light'].tint} size={24} />
          </View>
        )}
        onPress={() => {
          console.log('🎯 Drawer: Navigating to settings');
          props.navigation.navigate('settings');
        }}
        icon={({ color, size }) => (
          <Image
            source={{
              uri: profileUrl || 'https://variety.com/wp-content/uploads/2021/10/Evan-Spiegel-Snap-chief-executive-officer.png',
            }}
            alt="user"
            style={{ width: 35, height: 35, borderRadius: 25 }}
          />
        )}
        activeTintColor={Colors[colorScheme ?? 'light'].tint}
        inactiveTintColor={Colors[colorScheme ?? 'light'].text}
        focused={currentRoute.name === 'profile'}
        style={{ borderRadius: 0, paddingBottom: 30, paddingTop: 15, backgroundColor: Colors[colorScheme ?? 'light'].backgroundDark }}
      />
    </ThemedView>
  );
}


function DrawerNavigator() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            width: 250,
          },
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
          drawerItemStyle: {
            borderRadius: 4,
          },
        }}
      >
        <Drawer.Screen
          name='index'
          options={{
            title: 'New Search',
          }}
        />

        <Drawer.Screen
          name='(chats)/[chatid]'
          getId={({ params }) => `chat-${params?.chatid}`}
          options={{
            headerShown: false,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}


export default function ProtectedLayout() {

  const authState = useContext(AuthContext);

  if (!authState.isReady) {
    return null;
  }

  if (!authState.isLoggedIn) {
    return <Redirect href="/authPage" />
  }
  return (
    <ChatProvider>
      <DrawerNavigator />
    </ChatProvider>
  );
}

