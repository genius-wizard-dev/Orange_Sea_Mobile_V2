import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';

const ChatHeaderComponent = ({ goBack, title, dataDetail }) => {
    const router = useRouter();
    const navigation = useNavigation();

    const handleBackPress = () => {
        // Đơn giản hóa logic back: nếu có goBack thì sử dụng, nếu không thì router.back()
        if (goBack) {
            router.push(goBack);
        } else {
            router.back();
        }
    };

    const handleOpenGroupDetail = () => {
        navigation.navigate('group/groupDetail', {
            dataDetail,
            fromScreen: 'chat/chatDetail',
            directFromChat: true,
            timestamp: Date.now() // Thêm timestamp để đảm bảo params là duy nhất
        });
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={25} color="#fff" />
                <Text style={styles.title}>{title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenGroupDetail} style={styles.btnDetail}>
                <Ionicons name="list-outline" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default ChatHeaderComponent;

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FF7A1E',
        padding: 10,
        justifyContent: 'space-between',
        flexDirection: 'row',
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
    },
    btnDetail: {

    }
});