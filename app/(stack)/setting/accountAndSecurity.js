import { StyleSheet } from 'react-native'
import React, { useCallback, useEffect } from 'react'
import { Avatar, YStack, XStack, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSelector, useDispatch } from 'react-redux'
import Ionicons from '@expo/vector-icons/Ionicons'
import { getProfile } from "../../../redux/thunks/profile";
import { formatDate } from "../../utils/formatDate";

const AccountAndSecurity = () => {
    const dispatch = useDispatch();
    const { profile } = useSelector((state) => state.profile);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            dispatch(getProfile());
        }, [dispatch])
    );

    const handleNavigateToUpdate = () => {
        router.push({
            pathname: '/setting/update/updateProfile',
            params: { goBackTo: '/setting/accountAndSecurity' }, // Truyền tham số goBackTo
        });
    };
    const handleNavigateChangePassword = () => {
        router.push({
            pathname: '/setting/security/changePassword',
            params: { goBackTo: '/setting/accountAndSecurity' }, 
        });
    };

    const accountGroup = [
        {
            type: "profile",
            icon: "person-outline",
            image: profile?.avatar,
            title: "Chỉnh sửa thông tin",
            name: profile?.name,
            birthday: profile?.birthday ? formatDate(profile?.birthday) : '',
            description: "null",
            action: () => handleNavigateToUpdate(),
        },
        {
            icon: "call-outline",
            title: "Số điện thoại",
            description: profile?.phone,
            action: () => router.push('/phone'),
        },
        {
            icon: "mail-outline",
            title: "Email",
            description: profile?.email || 'Chưa liên kết',
            action: () => router.push('/email'),
        },
        {
            icon: "qr-code-outline",
            title: "Mã QR của tôi",
            description: null,
            action: () => router.push('/qr-code'),
        },
    ]

    const securityGroup = [
        {
            icon: "phone-portrait-outline",
            title: "Thiết bị đăng nhập",
            description: "Quản lý thiết bị đăng nhập",
            descriptionColor: "$yellow10",
            action: () => router.push('/security-check'),
        },
        {
            icon: "lock-closed-outline",
            title: "Mật khẩu",
            description: "Đổi mật khẩu đăng nhập",
            descriptionColor: "$yellow10",
            action: () => handleNavigateChangePassword()
        },
    ]

    const renderItem = (item) => (
        <XStack
            key={item.title}
            backgroundColor={item.type == "profile" ? "#eaeaea" : "#ffffff"}
            borderWidth={1}
            padding="$3"
            alignItems="center"
            space="$3"
            pressStyle={{ opacity: 0.7 }}
            onPress={item.action}
            marginBottom={item.type == "profile" ? 20 : 10}
            borderRadius={15}
            paddingVertical={15}
            paddingHorizontal={15}
            borderColor="#E8E8E8"
        >
            {item.type === "profile" ? (
                <Avatar circular size="$6" marginRight={10}>
                    <Avatar.Image source={{ uri: item.image }} />
                    <Avatar.Fallback backgroundColor="$gray5">
                        <Ionicons name={item.icon} size={24} color="#666" />
                    </Avatar.Fallback>
                </Avatar>
            ) : (
                <Ionicons name={item.icon} size={24} color="#666" />
            )}
            <YStack flex={1} >
                <Text fontSize="$5">{item.title}</Text>
                {item.description && (
                    <Text marginTop={6} fontSize="$4" color={item.descriptionColor || "$gray10"}>
                        {item.type == "profile" ?
                            <Text
                                fontWeight={700}
                                fontSize={16}

                            >{item.name}</Text>
                            : item.description}
                    </Text>
                )}
            </YStack>
            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
        </XStack>
    )

    const renderGroup = (title, items) => (
        <>
            <Text
                color="$blue10"
                fontSize="$6"
                fontWeight="bold"
                marginTop={title === "Bảo mật" ? "$3" : 0}
                marginBottom={10}
            >
                {title}
            </Text>
            {items.map(renderItem)}
        </>
    )

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <YStack flex={1} backgroundColor="$gray2" paddingTop={10} paddingHorizontal="$1">
                <YStack padding="$2" space="$4">
                    {renderGroup("Tài khoản", accountGroup)}
                    {renderGroup("Bảo mật", securityGroup)}
                </YStack>
            </YStack>
        </SafeAreaView>
    )
}

export default AccountAndSecurity

const styles = StyleSheet.create({})