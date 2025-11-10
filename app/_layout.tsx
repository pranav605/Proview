// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
// import { Drawer } from 'expo-router/drawer';
// import { EditIcon, MessageCircle } from 'lucide-react-native';
// import { useState } from 'react';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import 'react-native-reanimated';

// function CustomDrawerContent(props: any) {
//   const colorScheme = useColorScheme();
//   const [chats] = useState([
//     { id: '1', name: 'Iphone 17' },
//     { id: '2', name: 'sony xm5 headphones' },
//   ]);

//   const currentRoute = props.state.routes[props.state.index];
//   const currentChatId = currentRoute.params?.chatid;

//   return (
//     <DrawerContentScrollView {...props}>
//       <DrawerItem
//         label="New Search"
//         onPress={() => {
//           props.navigation.navigate('index');
//         }}
//         icon={({ color, size }) => <EditIcon color={color} size={size} />}
//         activeTintColor={Colors[colorScheme ?? 'light'].tint}
//         inactiveTintColor={Colors[colorScheme ?? 'light'].text}
//         focused={currentRoute.name === 'index'}
//       />

//       {chats.map((chat) => (
//         <DrawerItem
//           key={chat.id}
//           label={chat.name}
//           onPress={() => {
//             props.navigation.navigate('(chats)/[chatid]', {
//               chatid: chat.id,
//             });
//           }}
//           icon={({ color, size }) => <MessageCircle color={color} size={size} />}
//           activeTintColor={Colors[colorScheme ?? 'light'].tint}
//           inactiveTintColor={Colors[colorScheme ?? 'light'].text}
//           focused={currentChatId === chat.id}
//         />
//       ))}
//     </DrawerContentScrollView>
//   );
// }


// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Drawer
//         drawerContent={(props) => <CustomDrawerContent {...props} />}
//         screenOptions={{
//           drawerStyle: {
//             backgroundColor: Colors[colorScheme ?? 'light'].background,
//             width: '100%',
//           },
//           headerStyle: {
//             backgroundColor: Colors[colorScheme ?? 'light'].background,
//           },
//           headerTintColor: Colors[colorScheme ?? 'light'].text,
//         }}
//       >
//         <Drawer.Screen
//           name='index'
//           options={{
//             title: 'New Search',
//           }}
//         />

//         <Drawer.Screen
//           name='(chats)/[chatid]'
//           options={{
//             headerShown: false,
//           }}
//         />
//       </Drawer>
//     </GestureHandlerRootView>
//   )
// }
// v2
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ChatProvider, useChats } from '@/contexts/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { EditIcon, MessageCircle } from 'lucide-react-native';
import { Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';


function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const { chats } = useChats();

  // Use React Navigation state instead of pathname
  const currentRoute = props.state.routes[props.state.index];
  const currentChatId = currentRoute.params?.chatid;

  return (
    <ThemedView style={{flex:1}}>
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
        label={"Jane Doe"}
        onPress={() => {
          alert("Settings")
        }}
        icon={({ color, size }) => <Image source={{
        uri: 'https://variety.com/wp-content/uploads/2021/10/Evan-Spiegel-Snap-chief-executive-officer.png',
      }} alt='user' style={{ width: 35, height: 35, borderRadius: 25 }}/>}
        activeTintColor={Colors[colorScheme ?? 'light'].tint}
        inactiveTintColor={Colors[colorScheme ?? 'light'].text}
        focused={currentRoute.name === 'profile'}
        style={{ borderRadius: 0, paddingBottom: 30, paddingTop: 15, backgroundColor:'#272929ff' }}
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
            width: 240,
          },
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
          drawerItemStyle: {
            borderRadius: 4,
          }
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


export default function RootLayout() {
  return (
    <ChatProvider>
      <DrawerNavigator />
    </ChatProvider>
  );
}

