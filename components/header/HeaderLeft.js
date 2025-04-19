import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'; // Sử dụng useRouter thay vì useRoute

const HeaderLeft = ({ goBack, title }) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (goBack) {
            router.push(goBack);
        } else {
            router.back()
        }
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
                <Ionicons name="chevron-back" size={26} color="#fff" />
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
