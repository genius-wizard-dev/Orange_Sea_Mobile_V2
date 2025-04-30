import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ChatHeaderComponent = ({ goBack, title }) => {
    const router = useRouter();
    
    const handleBackPress = () => {
        if (goBack) {
            router.push(goBack);
        } else {
            router.back()
        }
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={25} color="#fff" />
                <Text style={styles.title}>{title}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default ChatHeaderComponent

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FF7A1E',
        padding: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        marginLeft: 10,
        fontWeight: '500'
    }
})