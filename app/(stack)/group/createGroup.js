import { YStack, XStack, Text, Input, Button, ScrollView, Image } from 'tamagui'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'expo-router'
import HeaderLeft from '../../../components/header/HeaderLeft';
import { useLocalSearchParams } from 'expo-router';
import InputField from '../../../components/InputField';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getFriendList } from '../../../redux/thunks/friend'
import { createGroup as createGroupAction } from '../../../redux/thunks/group'
import { ActivityIndicator } from 'react-native';

const DEFAULT_AVATAR = "https://res.cloudinary.com/dubwmognz/image/upload/v1744715587/profile-avatars/profile_67fe2aaf936aacebb59fb978.png";
const DEFAULT_GROUP_IMAGE = "https://i.ibb.co/jvVzkvBm/bgr-default.png";

const GroupInfo = ({ groupName, setGroupName }) => {
    return (
        <XStack
            paddingLeft="$4"
            paddingRight="$4"
            paddingBottom="$0"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            alignItems="center">
            <InputField
                id="avatar"
                type="image"
                width={50}
                height={50}
                isNodeTapped={false}
                style={{ top: 15 }}
                source={{ uri: DEFAULT_GROUP_IMAGE }}
            />
            <Input
                value={groupName}
                onChangeText={setGroupName}
                name="groupName"
                flex={1}
                marginLeft="$4"
                size="$4"
                placeholder="Đặt tên nhóm"
                placeholderTextColor="$gray10"
                maxLength={50}
            />
        </XStack>
    );
};

const SearchBar = ({ searchText, setSearchText }) => {
    return (
        <XStack
            margin="$4"
            padding="$4"
            marginBottom="$0"
            backgroundColor="$gray4"
            borderRadius="$4"
            alignItems="center"
        >
            <Input
                flex={1}
                marginRight="$4"
                size="$4"
                placeholder="Tìm tên hoặc số điện thoại"
                placeholderTextColor="$gray10"
                value={searchText}
                onChangeText={setSearchText}
            />
            <Ionicons name="search" size={20} color="#666" />
        </XStack>
    );
};

const createGroup = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { friends } = useSelector(state => state.friend);
    const { profile } = useSelector(state => state.profile); // Thêm profile selector
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');
    const { goBackTo } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        dispatch(getFriendList());
    }, [dispatch]);

    const toggleUserSelection = (user) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const removeSelectedUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
    };

    const handleCreateGroup = async () => {
        try {
            if (!groupName.trim()) {
                setError('Vui lòng nhập tên nhóm');
                return;
            }

            if (selectedUsers.length < 2) {
                setError('Vui lòng chọn ít nhất 2 thành viên');
                return;
            }

            setIsLoading(true);
            setError('');

            const groupData = {
                name: groupName.trim(),
                participantIds: selectedUsers.map(user => user.profileId || user.id).filter(Boolean),
                isGroup: true,
            };

            // console.log('Sending group data:', JSON.stringify(groupData));

            const result = await dispatch(createGroupAction(groupData)).unwrap();

            if (result?.id) {
                router.replace({
                    pathname: '/chat/chatDetail',
                    params: {
                        groupId: result.id,
                        profileId: profile?.id,
                        goBack: '/chat'
                    }
                });
            }
        } catch (err) {
            console.error('Create group error:', err);
            setError(err.message || 'Có lỗi xảy ra khi tạo nhóm');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <YStack flex={1} backgroundColor="$background">
            <YStack flex={1}>
                <HeaderLeft goBack={goBackTo} title="Tạo Nhóm" />
                <GroupInfo groupName={groupName} setGroupName={setGroupName} />
                {error && (
                    <Text color="$red10" padding="$2" textAlign="center">
                        {error}
                    </Text>
                )}
                <SearchBar searchText={searchText} setSearchText={setSearchText} />

                <XStack padding="$4" borderBottomWidth={2} borderBottomColor="$borderColor">
                    <Text color="$blue10" fontWeight="bold" marginRight="$4">Danh sách bạn bè</Text>
                    {/* <Text color="$gray10">DANH BẠ</Text> */}
                </XStack>

                <ScrollView
                    flex={1}
                    contentContainerStyle={{ paddingBottom: selectedUsers.length > 0 ? 100 : 0 }}
                    backgroundColor="$background"
                >
                    {friends.map(user => (
                        <Button
                            key={user.id}
                            onPress={() => toggleUserSelection(user)}
                            flexDirection="row"
                            alignItems="center"
                            padding="$4"
                            borderBottomWidth={1}
                            borderBottomColor="$gray5"
                            backgroundColor="#ffffff"
                            pressStyle={{ transform: [{ scale: 0.99 }], }}
                            height={70}
                        >
                            <Image
                                source={{ uri: user.avatar || 'https://i.ibb.co/jvVzkvBm/bgr-default.png' }}
                                width={46}
                                height={46}
                                borderRadius={23}
                            />
                            <YStack flex={1} marginLeft="$4" background="#ffffff">
                                <Text fontSize={16} fontWeight="500" color="$color">
                                    {user.name}
                                </Text>
                                <Text fontSize={14} color="#cccccc" marginTop="$1">
                                    1 tiếng trước
                                </Text>
                            </YStack>
                            <XStack
                                width={24}
                                height={24}
                                borderRadius={12}
                                borderWidth={1}
                                borderColor={selectedUsers.find(u => u.id === user.id) ? '$blue10' : '#bcbcbc'}
                                backgroundColor={selectedUsers.find(u => u.id === user.id) ? '$blue10' : 'transparent'}
                                justifyContent="center"
                                alignItems="center"
                            >
                                {selectedUsers.find(u => u.id === user.id) && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </XStack>
                        </Button>
                    ))}
                </ScrollView>
            </YStack>

            {selectedUsers.length > 0 && (
                <XStack
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    backgroundColor="$background"
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                    alignItems="center"
                    padding="$2"
                    elevation={5}
                >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} flex={1}>
                        {selectedUsers.map(user => (
                            <YStack key={user.id} marginRight="$3">
                                <Image source={{ uri: user.avatar }} width={50} height={50} borderRadius={25} />
                                <Button
                                    position="absolute"
                                    top={0}
                                    right={-5}
                                    width={20}
                                    height={20}
                                    borderRadius={10}
                                    backgroundColor="#E94057"
                                    onPress={() => removeSelectedUser(user.id)}
                                    padding={0}
                                    minWidth={0}
                                    minHeight={0}
                                    overflow='hidden'
                                    pressStyle={{
                                        backgroundColor: '#f7caad',
                                        borderWidth: 0,
                                        scale: 0.98,
                                    }}
                                >
                                    <Ionicons name="close-outline" size={18} color="#fff" />
                                </Button>

                            </YStack>
                        ))}
                    </ScrollView>
                    {selectedUsers.length >= 2 && (
                        <Button
                            backgroundColor="$blue10"
                            width={50}
                            height={50}
                            borderRadius={25}
                            alignItems="center"
                            onPress={handleCreateGroup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Ionicons name="arrow-forward" size={21} color="#fff" marginLeft={-5} />
                            )}
                        </Button>
                    )}
                </XStack>
            )}
        </YStack>
    );
}

export default createGroup