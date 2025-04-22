import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';

const ChatHeaderComponent = () => {
    const router = useRouter();
    return (
        <View>
            <TouchableOpacity onPress={() => router.push('/chat/chatSetting')} style={{ padding: 10, backgroundColor: '#1E90FF', borderRadius: 5, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="settings-outline" size={25} color="#fff" />
            </TouchableOpacity>
        </View>
    )
}

export default ChatHeaderComponent

const styles = StyleSheet.create({})