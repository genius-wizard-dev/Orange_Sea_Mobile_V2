import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
import { Image, TouchableOpacity, Alert } from 'react-native';
import { View, Text, XStack, YStack, ScrollView, Separator, Switch } from 'tamagui';
import HeaderLeft from '../../../components/header/HeaderLeft';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getGroupDetail } from '../../../redux/thunks/group';
import HeaderNavigation from '../../../components/header/HeaderNavigation';

const GroupDetail = () => {
    const { goBackTo } = useLocalSearchParams();
    const route = useRoute();
    const navigation = useNavigation();
    const router = useRouter(); // Thêm useRouter
    const dispatch = useDispatch();

    // Lấy dataDetail từ params hoặc từ Redux store
    const { dataDetail: routeDataDetail } = route.params || {};
    const { groupDetails } = useSelector((state) => state.group);

    // Kết hợp dữ liệu từ route.params và Redux store
    const [currentData, setCurrentData] = useState(null);

    useEffect(() => {
        // Ưu tiên dữ liệu từ route.params (mới nhất)
        if (routeDataDetail) {
            setCurrentData(routeDataDetail);

            // Cập nhật lại Redux store nếu cần
            if (routeDataDetail.id && (!groupDetails[routeDataDetail.id] ||
                (groupDetails[routeDataDetail.id]?.updatedAt !== routeDataDetail.updatedAt))) {
                dispatch(getGroupDetail(routeDataDetail.id));
            }
        }
        // Nếu không có dữ liệu từ route.params, kiểm tra từ Redux store
        else if (route.params?.groupId && groupDetails[route.params.groupId]) {
            setCurrentData(groupDetails[route.params.groupId]);
        }
    }, [route.params, groupDetails]);

    const [isGhimEnabled, setIsGhimEnabled] = useState(false);
    const [isAnEnabled, setIsAnEnabled] = useState(false);

    // Kiểm tra nguồn gốc của navigation để quay lại đúng màn hình
    // const handleGoBack = () => {
    //     const { fromScreen, directFromChat } = route.params || {};

    //     if (fromScreen === 'chat/chatDetail' && directFromChat) {
    //         // Quay về màn hình Chat
    //         router.replace('/chat');
    //     } else if (goBackTo) {
    //         router.replace(goBackTo);
    //     } else {
    //         navigation.goBack();
    //     }
    // };;

    // Kiểm tra nếu không có data
    if (!currentData) {
        return (
            <YStack flex={1} backgroundColor="#ffffff">
                <HeaderNavigation
                    title="Tùy chọn"
                // onGoBack={handleGoBack} 
                />
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <Text color="#000">Không tìm thấy thông tin nhóm</Text>
                </YStack>
            </YStack>
        );
    }

    const handleAddMember = () => {
        navigation.navigate('group/addParticipant', {
            dataDetail: currentData,
            goBackTo: 'group/groupDetail'
        });
    };

    // Định nghĩa các nhóm menu
    const menuGroups = [
        {
            id: 'quickActions',
            type: 'icons',
            items: [
                { id: 'search', icon: 'search', label: 'Tìm tin nhắn', onPress: () => console.log('Tìm tin nhắn') },
                { id: 'addMember', icon: 'person-add', label: 'Thêm thành viên', onPress: () => handleAddMember() },
                { id: 'changeBg', icon: 'image', label: 'Đổi hình nền', onPress: () => console.log('Đổi hình nền') },
            ]
        },
        {
            id: 'features',
            type: 'menu',
            items: [
                { id: 'media', icon: 'image', iconFamily: 'Ionicons', label: 'Ảnh, file, link', onPress: () => console.log('Ảnh, file, link') },
                { id: 'pinned', icon: 'pin', iconFamily: 'Ionicons', label: 'Tin nhắn đã ghim', onPress: () => console.log('Tin nhắn đã ghim') },
                // { id: 'calendar', icon: 'calendar', iconFamily: 'Ionicons', label: 'Lịch nhóm', onPress: () => console.log('Lịch nhóm') },
                // { id: 'saved', icon: 'bookmark', iconFamily: 'Ionicons', label: 'Tin nhắn đã lưu', onPress: () => console.log('Tin nhắn đã lưu') },
                // { id: 'poll', icon: 'poll', iconFamily: 'MaterialCommunityIcons', label: 'Bình chọn', onPress: () => console.log('Bình chọn') },
            ]
        },
        {
            id: 'settings',
            type: 'switch',
            items: [
                { id: 'pin', icon: 'pushpin', iconFamily: 'AntDesign', label: 'Ghim trò chuyện', value: isGhimEnabled, onChange: setIsGhimEnabled },
                { id: 'hide', icon: 'eye-off', iconFamily: 'Feather', label: 'Ẩn trò chuyện', value: isAnEnabled, onChange: setIsAnEnabled },
            ]
        },
        {
            id: 'actions',
            type: 'menu',
            items: [
                { id: 'report', icon: 'warning', iconFamily: 'AntDesign', label: 'Báo xấu', onPress: () => console.log('Báo xấu'), textColor: 'black' },
                // { id: 'storage', icon: 'harddisk', iconFamily: 'MaterialCommunityIcons', label: 'Dung lượng trò chuyện', onPress: () => console.log('Dung lượng'), textColor: 'black' },
                // { id: 'clearHistory', icon: 'delete-sweep', iconFamily: 'MaterialIcons', label: 'Xóa lịch sử trò chuyện', onPress: () => console.log('Xóa lịch sử'), textColor: 'black' },
                { id: 'leaveGroup', icon: 'logout', iconFamily: 'MaterialIcons', label: 'Rời nhóm', onPress: () => Alert.alert('Xác nhận', 'Bạn có chắc muốn rời nhóm?'), textColor: '#FF3B30' },
            ]
        },
        // {
        //     id: 'sharedMedia',
        //     type: 'gallery',
        //     title: 'Ảnh, file, link',
        //     mediaItems: [
        //         'https://via.placeholder.com/150',
        //         'https://via.placeholder.com/150',
        //         'https://via.placeholder.com/150',
        //         'https://via.placeholder.com/150',
        //         'https://via.placeholder.com/150',
        //     ]
        // }
    ];

    // Render group avatar and title
    const renderHeader = () => (
        <YStack alignItems="center" padding="$4" space="$2">
            <Image
                source={{ uri: currentData?.avatar || "https://i.ibb.co/jvVzkvBm/bgr-default.png" }}
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: '#f0f0f0'
                }}
            />
            <TouchableOpacity>
                <Feather name="camera" size={20} color="black" style={{
                    position: 'absolute',
                    right: -50,
                    bottom: 0,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 12,
                    padding: 5
                }} />
            </TouchableOpacity>

            <Text color="black" fontSize="$6" fontWeight="bold" textAlign="center" marginTop="$4">
                {currentData?.name || "Nhóm chat"}
            </Text>
            {/* <Text color="gray" fontSize="$3" textAlign="center">
                {currentData?.participants?.length || 0} thành viên
            </Text> */}
        </YStack>
    );

    // Render các component dựa vào loại nhóm menu
    const renderMenuGroup = (group) => {
        switch (group.type) {
            case 'icons':
                return (
                    <YStack key={group.id} marginVertical="$2">
                        <XStack justifyContent="space-around" padding="$2">
                            {group.items.map(item => (
                                <YStack key={item.id} alignItems="center">
                                    <TouchableOpacity onPress={item.onPress}>
                                        <XStack
                                            backgroundColor="#f0f0f0"
                                            width={40}
                                            height={40}
                                            borderRadius={25}
                                            alignItems="center"
                                            justifyContent="center"
                                            marginBottom="$1"
                                        >
                                            <Ionicons name={item.icon} size={20} color="#FF7A1E" />
                                        </XStack>
                                    </TouchableOpacity>
                                    <Text color="black" fontSize="$2" marginTop={10}>{item.label}</Text>
                                </YStack>
                            ))}
                        </XStack>
                    </YStack>
                );

            case 'menu':
                return (
                    <YStack key={group.id}>
                        {group.items.map(item => {
                            // Chọn Icon Component dựa vào iconFamily
                            const IconComponent = {
                                Ionicons: Ionicons,
                                MaterialIcons: MaterialIcons,
                                MaterialCommunityIcons: MaterialCommunityIcons,
                                FontAwesome: FontAwesome,
                                Feather: Feather,
                                AntDesign: AntDesign
                            }[item.iconFamily || 'Ionicons'];

                            return (
                                <TouchableOpacity key={item.id} onPress={item.onPress}>
                                    <XStack
                                        alignItems="center"
                                        paddingVertical="$4"
                                        paddingHorizontal="$4"
                                    >
                                        <XStack
                                            backgroundColor="#fcd6bd"
                                            width={35}
                                            height={35}
                                            borderRadius={20}
                                            alignItems="center"
                                            justifyContent="center"
                                            marginRight="$3"
                                        >
                                            <IconComponent name={item.icon} size={20} color="#FF7A1E" />
                                        </XStack>
                                        <Text color={item.textColor || "black"} fontSize="$4">{item.label}</Text>
                                    </XStack>
                                </TouchableOpacity>
                            );
                        })}
                    </YStack>
                );

            case 'switch':
                return (
                    <YStack key={group.id}>
                        {group.items.map(item => {
                            const IconComponent = {
                                Ionicons: Ionicons,
                                MaterialIcons: MaterialIcons,
                                MaterialCommunityIcons: MaterialCommunityIcons,
                                FontAwesome: FontAwesome,
                                Feather: Feather,
                                AntDesign: AntDesign
                            }[item.iconFamily || 'Ionicons'];

                            return (
                                <XStack
                                    key={item.id}
                                    justifyContent="space-between"
                                    alignItems="center"
                                    paddingVertical="$4"
                                    paddingHorizontal="$4"
                                >
                                    <XStack alignItems="center">
                                        <XStack
                                            backgroundColor="#fcd6bd"
                                            width={35}
                                            height={35}
                                            borderRadius={20}
                                            alignItems="center"
                                            justifyContent="center"
                                            marginRight="$3"
                                        >
                                            <IconComponent name={item.icon} size={20} color="#FF7A1E" />
                                        </XStack>
                                        <Text color="black" fontSize="$4">{item.label}</Text>
                                    </XStack>
                                    <Switch checked={item.value} onCheckedChange={item.onChange} />
                                </XStack>
                            );
                        })}
                    </YStack>
                );

            // case 'gallery':
            //     return (
            //         <YStack key={group.id} padding="$4">
            //             <Text color="black" fontSize="$5" marginBottom="$3">{group.title}</Text>
            //             <XStack flexWrap="wrap" justifyContent="space-between">
            //                 {group.mediaItems.map((uri, i) => (
            //                     <Image 
            //                         key={i}
            //                         source={{ uri }}
            //                         style={{ 
            //                             width: '30%', 
            //                             height: 90,
            //                             marginBottom: 10,
            //                             borderRadius: 8,
            //                             backgroundColor: '#f0f0f0'
            //                         }} 
            //                     />
            //                 ))}
            //                 <TouchableOpacity style={{
            //                     width: '30%',
            //                     height: 90,
            //                     justifyContent: 'center',
            //                     alignItems: 'center',
            //                     backgroundColor: '#f0f0f0',
            //                     borderRadius: 8
            //                 }}>
            //                     <Ionicons name="arrow-forward" size={24} color="black" />
            //                 </TouchableOpacity>
            //             </XStack>
            //         </YStack>
            //     );

            default:
                return null;
        }
    };

    return (
        <YStack flex={1} backgroundColor="#ffffff">
            {/* <HeaderLeft
                title="Tùy chọn"
                onGoBack={handleGoBack}
            /> */}
            <HeaderNavigation
                title="Tùy chọn"
            // onGoBack={handleGoBack} 
            />

            <ScrollView>
                {renderHeader()}

                {/* Render các menu group */}
                {menuGroups.map((group, index) => (
                    <YStack key={group.id}>
                        {renderMenuGroup(group)}
                        {index < menuGroups.length - 1 && (
                            <Separator backgroundColor="#f0f0f0" marginVertical="$2" />
                        )}
                    </YStack>
                ))}
            </ScrollView>
        </YStack>
    );
};

export default GroupDetail;