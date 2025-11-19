import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { AuthContext } from '@/contexts/authContext'
import React, { useContext } from 'react'
import { Button, StyleSheet } from 'react-native'

const settings = () => {
  const authContext = useContext(AuthContext);

  const handleLogOut = () => {
    authContext.logOut();
  }
  return (
    <ThemedView style={styles.container}>
        <ThemedText type='subtitle'>Settings</ThemedText>
        <Button title='Logout' color={'red'} onPress={handleLogOut}></Button>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        padding:18
    }
})
export default settings