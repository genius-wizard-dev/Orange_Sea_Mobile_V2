import { YStack, XStack, Text, Input, Button, ScrollView, Image } from 'tamagui'
import React, { useState } from 'react'
import HeaderLeft from '../../../components/header/HeaderLeft';
import { useLocalSearchParams } from 'expo-router';
import InputField from '../../../components/InputField';
import Ionicons from '@expo/vector-icons/Ionicons';

const DEFAULT_AVATAR = "https://res.cloudinary.com/dubwmognz/image/upload/v1744715587/profile-avatars/profile_67fe2aaf936aacebb59fb978.png";


const users = [
    {
        _id: "6800e92dea67f133622dbf36",
        email: "nam@gmail.com",
        fullName: "Nguyen Van Nam",
        profilePic: "https://i.pravatar.cc/150?img=1",
        phoneNumber: "+84333222100",
        gender: "Male",
        backgroundImage: "",
        isActive: true,
        dateOfBirth: "2005-04-17T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "6800e92dea67f133622dbf37",
        email: "thu@gmail.com",
        fullName: "Nguyen Thu Ha",
        profilePic: "https://i.pravatar.cc/150?img=2",
        phoneNumber: "+84333222101",
        gender: "Female",
        backgroundImage: "",
        isActive: true,
        dateOfBirth: "2000-05-20T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "6800e92dea67f133622dbf38",
        email: "minh@gmail.com",
        fullName: "Tran Minh Duc",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222102",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "6800e92dea67f133622dbf66",
        email: "minh@gmail.com",
        fullName: "Tran Minh Da",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222102",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "6800e92dea67f133622dbf92",
        email: "minh@gmail.com",
        fullName: "da Minh Hao",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222102",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "6800e92dea62f133622dbf33",
        email: "minh@gmail.com",
        fullName: "Tran NGuyec",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222101",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "6200e92dea62f133622dbf33",
        email: "minh@gmail.com",
        fullName: "Tran NGuyec",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222101",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "68g0e92dea62f133622dbf33",
        email: "minh@gmail.com",
        fullName: "Tran NGuyec",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222101",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "68g0e92dea62fdd622dbf33",
        email: "minh@gmail.com",
        fullName: "Tran NGuyec",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222101",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
    {
        _id: "68g0e92dea62f1qqqqdbf33",
        email: "minh@gmail.com",
        fullName: "Tran NGuyec",
        profilePic: "https://i.pravatar.cc/150?img=3",
        phoneNumber: "+84333222101",
        gender: "Male",
        backgroundImage: "",
        isActive: false,
        dateOfBirth: "1995-08-12T00:00:00.000Z",
        lastSeen: null,
    },
];

const GroupInfo = ({ groupImage, setGroupImage }) => {
    const selectImage = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.5,
                includeBase64: false,
            });

            console.log('Image picker response:', result);

            if (result.didCancel) {
                console.log('User cancelled image picker');
            } else if (result.error) {
                console.log('ImagePicker Error:', result.error);
            } else if (result.assets && result.assets.length > 0) {
                console.log('Selected image:', result.assets[0].uri);
                setGroupImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Error selecting image:', error);
        }
    };

    return (
        <XStack
            paddingLeft="$4"
            paddingRight="$4"
            paddingBottom="$0"
            borderBottomWidth={1}
            borderBottomColor="$borderColor" alignItems="center">
            <InputField
                id="avatar"
                type="image"
                width={50}
                height={50}
                isNodeTapped={false}
                style={{ top: 15, }}
            />
            <Input
                name="groupName"
                flex={1}
                marginLeft="$4"
                size="$4"
                placeholder="Đặt tên nhóm"
                placeholderTextColor="$gray10"
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
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [groupImage, setGroupImage] = useState(null);
    const { goBackTo } = useLocalSearchParams();

    const toggleUserSelection = (user) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const removeSelectedUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
    };

    return (
        <YStack flex={1} backgroundColor="$background">
            <YStack flex={1}>
                <HeaderLeft goBack={goBackTo} title="Tạo Nhóm" />
                <GroupInfo groupImage={groupImage} setGroupImage={setGroupImage} />
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
                    {users.map(user => (
                        <Button
                            key={user._id}
                            onPress={() => toggleUserSelection(user)}
                            flexDirection="row"
                            alignItems="center"
                            padding="$4"
                            borderBottomWidth={1}
                            borderBottomColor="$gray5"
                            backgroundColor="#ffffff"
                            pressStyle={{ transform: [{ scale: 0.99 }],}}
                            height={70}
                        >
                            <Image
                                source={{ uri: user.profilePic || 'https://i.pravatar.cc/150?img=1' }}
                                width={46}
                                height={46}
                                borderRadius={23}
                            />
                            <YStack flex={1} marginLeft="$4" background="#ffffff">
                                <Text fontSize={16} fontWeight="500" color="$color">
                                    {user.fullName}
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
                                borderColor={selectedUsers.find(u => u._id === user._id) ? '$blue10' : '#bcbcbc'}
                                backgroundColor={selectedUsers.find(u => u._id === user._id) ? '$blue10' : 'transparent'}
                                justifyContent="center"
                                alignItems="center"
                            >
                                {selectedUsers.find(u => u._id === user._id) && (
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
                            <YStack key={user._id} marginRight="$3">
                                <Image source={{ uri: user.profilePic }} width={50} height={50} borderRadius={25} />
                                <Button
                                    position="absolute"
                                    top={0}
                                    right={-5}
                                    width={20}
                                    height={20}
                                    borderRadius={10}
                                    backgroundColor="#E94057"
                                    onPress={() => removeSelectedUser(user._id)}
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
                            onPress={() => console.log('Next pressed')}
                        >
                            <Ionicons name="arrow-forward" size={21} color="#fff" marginLeft={-5} />
                        </Button>
                    )}
                </XStack>
            )}
        </YStack>
    );
}

export default createGroup