import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useNavigation } from 'expo-router'; 
import { CommonActions } from '@react-navigation/native';

const HeaderLeft = ({ goBack, title, onGoBack }) => {
    const router = useRouter();
    const navigation = useNavigation();

    const handleBackPress = () => {
        if (onGoBack) {
            // Sử dụng hàm callback tùy chỉnh nếu được cung cấp
            onGoBack();
        } else if (goBack) {
            // Nếu có goBack là đường dẫn cụ thể
            if (typeof goBack === 'string') {
                router.replace(goBack);
            } else {
                // Nếu goBack là object với pathname và params
                router.push(goBack);
            }
        } else {
            // Sử dụng goBack của navigation để quay lại màn hình trước đó theo stack
            navigation.goBack();
        }
        router.push(goBack);
    };

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FF7A1E',
            padding: 10,
            paddingLeft: 5
        }}>
            <TouchableOpacity onPress={handleBackPress} style={{ marginRight: 10 }}>
                <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            {title && <Text style={{
                color: '#fff', fontSize: 18,
                fontWeight: 'bold', fontWeight: 'bold',
                fontSize: 18,
                color: "#fff",
            }}>{title}</Text>}
        </View>
    );
};

export default HeaderLeft;
