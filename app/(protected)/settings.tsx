import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { AuthContext } from '@/contexts/authContext'
import React, { useContext, useEffect, useState } from 'react'
import { Button, Image, StyleSheet, TouchableOpacity } from 'react-native'

const settings = () => {
  const authContext = useContext(AuthContext);
  const [username, setUserName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  const handleLogOut = () => {
    authContext.logOut();
  }

  useEffect(() => {
    if (authContext.user) {
      setUserName(authContext.user.name);
      if (authContext.user?.avatar_url) {
        setProfileUrl(authContext.user?.avatar_url);
      }
    }
  }, [authContext.isReady, authContext.user])
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.profileSection}>
        <Image source={{ uri: profileUrl }} height={80} width={80} style={[styles.profileImage]}></Image>
        <ThemedView style={styles.profileDetails}>
          <ThemedText type='default'>{username}</ThemedText>
          <TouchableOpacity>
            <ThemedText type='link'>Update Profile</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
      <Button title='Logout' color={'red'} onPress={handleLogOut}></Button>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 32
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    borderRadius: 100,
  },
  profileDetails: {
    flex: 1,
    flexDirection: 'column',
    gap: 0,
    justifyContent: 'center',
  }
})
export default settings