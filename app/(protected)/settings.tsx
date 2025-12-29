import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { AuthContext } from '@/contexts/authContext'
import React, { useContext, useEffect, useState } from 'react'
import { Button, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'

const settings = () => {
  const authContext = useContext(AuthContext)
  const [username, setUserName] = useState("")
  const [profileUrl, setProfileUrl] = useState("")

  const handleLogOut = () => {
    authContext.logOut()
  }

  useEffect(() => {
    if (authContext.user) {
      setUserName(authContext.user.name)
      if (authContext.user?.avatar_url) {
        setProfileUrl(authContext.user.avatar_url)
      }
    }
  }, [authContext.isReady, authContext.user])

  const SettingItem = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <TouchableOpacity style={styles.settingItem}>
      <ThemedView style={styles.settingText}>
        <ThemedText type="default">{title}</ThemedText>
        {subtitle && <ThemedText type="default">{subtitle}</ThemedText>}
      </ThemedView>
      <ThemedText type="default">›</ThemedText>
    </TouchableOpacity>
  )

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{padding:0, margin:0}} showsVerticalScrollIndicator={false}>
      {/* Profile */}
      <ThemedView style={styles.profileSection}>
        <Image source={{ uri: profileUrl }} height={80} width={80} style={styles.profileImage} />
        <ThemedView style={styles.profileDetails}>
          <ThemedText type="default">{username}</ThemedText>
          <TouchableOpacity>
            <ThemedText type="link">Update Profile</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Account */}
      <ThemedView style={styles.section}>
        <ThemedText type="default">Account</ThemedText>
        <SettingItem title="Privacy" subtitle="Blocked contacts, read receipts" />
        <SettingItem title="Security" subtitle="Change password, 2FA" />
        <SettingItem title="Notifications" subtitle="Message & call alerts" />
      </ThemedView>

      {/* Preferences */}
      <ThemedView style={styles.section}>
        <ThemedText type="default">Preferences</ThemedText>
        <SettingItem title="Theme" subtitle="Light / Dark" />
        <SettingItem title="Language" subtitle="English" />
        <SettingItem title="Chat Wallpaper" />
      </ThemedView>

      {/* Support */}
      <ThemedView style={styles.section}>
        <ThemedText type="default">Support</ThemedText>
        <SettingItem title="Help Center" />
        <SettingItem title="Terms & Privacy Policy" />
        <SettingItem title="About App" subtitle="Version 1.0.0" />
      </ThemedView>

      {/* Logout */}
      <Button title="Logout" color="red" onPress={handleLogOut} />
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 24,
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
    justifyContent: 'center',
  },
  section: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  settingText: {
    gap: 2,
  },
})

export default settings
