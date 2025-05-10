import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

const HeaderNavigation = ({ onGoBack, title }) => {
    // Luôn khởi tạo hooks ngay từ đầu, không để trong điều kiện
    const router = useRouter();
    const navigation = useNavigation();

    // Hàm xử lý khi nhấn nút back
    const handleBackPress = () => {
        // if (onGoBack) {
        //     onGoBack(); 
        // } else {
            navigation.goBack();
        // }
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
            {title ? (
                <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: "#fff",
                }}>{title}</Text>
            ) : null}
        </View>
    );
};

export default HeaderNavigation;
