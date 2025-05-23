import { StyleSheet, View, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import { YStack, Text, XStack, Button, Image } from 'tamagui'
import HeaderLeft from '../../../components/header/HeaderLeft'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSelector, useDispatch } from 'react-redux'
import { getSearchByPhone } from '../../../redux/thunks/friend'

const AddFriend = () => {
    const { goBackTo } = useLocalSearchParams()
    const [searchText, setSearchText] = React.useState('');
    const { profile } = useSelector(state => state.profile)
    const dispatch = useDispatch()
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            const response = await dispatch(getSearchByPhone(searchText)).unwrap();
            console.log("res tim ",response)

            if (!response || response.data.length === 0) {
                Alert.alert('Thông báo', 'Không tìm thấy người dùng');
                return;
            }

            // Remove the first router.push() and fix the navigation
            router.push({
                pathname: 'profile/[id]',
                params: {
                    id: response.data[0].id,
                    goBack: '/friend/addFriend',
                },
            });
        } catch (error) {
            console.error('Error searching for user:', error);
            Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi tìm kiếm');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 50}
        >
            <View style={styles.container}>
                <HeaderLeft goBack={goBackTo} title="Thêm bạn bè" />

                <YStack padding={20} space="$4" alignItems="center">


                    {/* Search Section */}
                    <YStack width="100%" space="$3">

                        <XStack space="$2" width="100%">
                            <XStack
                                flex={1}
                                borderWidth={1}
                                borderColor="$gray7"
                                borderRadius="$4"
                                padding="$2"
                                alignItems="center"
                                backgroundColor="white"
                            >
                                <Ionicons name="search" size={20} color="#666" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập số điện thoại"
                                    value={searchText}
                                    onChangeText={setSearchText}
                                />
                                {searchText ? (
                                    <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color="#666"
                                        onPress={() => setSearchText('')}
                                    />
                                ) : null}
                            </XStack>
                            <Button
                                size={50}
                                disabled={!searchText || isLoading}
                                backgroundColor={searchText && !isLoading ? "$orange10" : "$gray8"}
                                onPress={handleSearch}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Ionicons name="arrow-forward" size={24} color="white" />
                                )}
                            </Button>
                        </XStack>
                    </YStack>

                    {/* QR Code Section */}
                    <YStack space="$2" alignItems="center">
                        <Text fontSize={20} fontWeight="700" marginTop={20}>THÔNG TIN CỦA TÔI</Text>
                        <View style={styles.qrContainer} space="$2" alignItems="center">
                            {/* <View style={styles.qrPlaceholder} /> */}
                            <Image src={{ uri: profile?.avatar }} width={280} height={220} borderRadius={10} />
                            <Text fontSize={16} fontWeight="700" marginTop={5}>{profile?.name}</Text>
                            <Text marginTop={5}>@{profile?.username}</Text>
                            <Text marginTop={5}>{profile?.phone}</Text>
                        </View>
                        <Text color="$gray11">Quét mã để thêm bạn với tôi</Text>
                    </YStack>

                    {/* QR Scanner Button */}
                    <Button
                        marginTop={20}
                        size="$4"
                        backgroundColor="transparent"
                        color="$orange10"
                        borderColor="$orange10"
                        borderWidth={1}
                        icon={<Ionicons name="qr-code" size={24} color="#FF7A1E" />}
                        onPress={() => {/* handle QR scan */ }}
                    >
                        Quét mã QR
                    </Button>
                </YStack>
            </View>
        </KeyboardAvoidingView>
    )
}

export default AddFriend

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    qrContainer: {
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#000',
        paddingVertical: 4
    },
    qrPlaceholder: {
        width: 200,
        height: 200,
        backgroundColor: '#FF7A1E',
        borderRadius: 8
    }
})