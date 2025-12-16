import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { AuthContext } from '@/contexts/authContext';
import { ChatProvider, useChats } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import * as NavigationBar from 'expo-navigation-bar';
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

  const [profileUrl, setProfileUrl] = useState('https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Katherine');
  const [userName, setuserName] = useState('Jane Doe');
  const authContext = useContext(AuthContext);
  
  useEffect(() => {
    const fetchProfileUrl = async () => {

      try {
        if(authContext.user?.name){
          setuserName(authContext.user?.name);
        }
        if (authContext.user?.avatar_url) {
          setProfileUrl(authContext.user?.avatar_url);
        } else {
          setProfileUrl('https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=Katherine');
        }
      } catch (error) {
        console.error('Error fetching avatar_url:', error);
      }
    };
    fetchProfileUrl();
  }, [authContext.isReady, authContext.user]);

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
              uri: profileUrl ,
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
          //TODO: Enable full screen width swipe for drawer
          //      resolve the conflicts with chat screen getsure handler
          // swipeEdgeWidth: Dimensions.get('window').width
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

  useEffect(() => {
  NavigationBar.setVisibilityAsync('hidden');        // hide nav bar
  NavigationBar.setBehaviorAsync('inset-touch'); // swipe-to-reveal
}, []);

  if (!authState.isLoggedIn) {
    return <Redirect href="/authPage" />
  }
  return (
    <ChatProvider>
      <DrawerNavigator />
    </ChatProvider>
  );
}

