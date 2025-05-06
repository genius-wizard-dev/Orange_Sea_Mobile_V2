import { FlatList, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useMemo } from 'react'
import HeaderLeft from '../../../components/header/HeaderLeft'
import { useLocalSearchParams } from 'expo-router';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, XStack, YStack, Separator } from 'tamagui';
import { useDispatch, useSelector } from 'react-redux';
import { addParticipant } from '../../../redux/thunks/group';
import { getGroupDetail } from '../../../redux/thunks/group';
import { getFriendList } from '../../../redux/thunks/friend';
import HeaderNavigation from '../../../components/header/HeaderNavigation';

const AddParticipant = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    // Lấy thông tin từ route.params
    const { dataDetail, fromScreen, directFromChat } = route.params || {};
    const groupId = dataDetail?.id;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const { profile } = useSelector(state => state.profile);

    // Lấy danh sách bạn bè từ Redux
    const { friends } = useSelector(state => state.friend);
    const { groupDetails } = useSelector(state => state.group);

    // Fetch dữ liệu nhóm nếu chưa có
    useEffect(() => {
        if (groupId && !groupDetails[groupId]) {
            dispatch(getGroupDetail(groupId));
        }
    }, [groupId, dispatch, groupDetails]);

    // Fetch danh sách bạn bè nếu chưa có
    useEffect(() => {
        if (friends.length === 0) {
            dispatch(getFriendList());
        }
    }, [dispatch, friends.length]);

    // Tạo danh sách người liên hệ từ bạn bè
    const contacts = useMemo(() => {
        return friends.map(friend => {
            // Tùy thuộc vào cấu trúc API bạn bè, điều chỉnh dữ liệu cho phù hợp
            return {
                id: friend.profileId || friend.id,
                name: friend.name || friend.profile?.name,
                avatarUrl: friend.avatar || friend.profile?.avatar || 'https://via.placeholder.com/100',
                username: friend.username || friend.profile?.username || `@user${friend.id}`
            };
        });
    }, [friends]);

    // Kiểm tra người dùng đã trong nhóm chưa
    const existingParticipantIds = useMemo(() => {
        if (groupDetails[groupId]?.participants) {
            return groupDetails[groupId].participants.map(p => p.userId);
        }
        return [];
    }, [groupDetails, groupId]);

    // Phân loại danh bạ theo chữ cái đầu tiên
    const contactsByLetter = useMemo(() => {
        return contacts.reduce((acc, contact) => {
            const firstLetter = contact.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(contact);
            return acc;
        }, {});
    }, [contacts]);

    // Lọc danh bạ theo từ khóa tìm kiếm
    const filteredContacts = useMemo(() => {
        if (searchTerm.length === 0) return [];

        return contacts.filter(contact =>
            contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contacts, searchTerm]);

    const isParticipantInGroup = (contactId) => {
        return existingParticipantIds.includes(contactId);
    };

    const toggleSelectContact = (contact) => {
        // Nếu đã tham gia nhóm, không cho phép chọn
        if (isParticipantInGroup(contact.id)) {
            return;
        }

        const isSelected = selectedContacts.some(c => c.id === contact.id);

        if (isSelected) {
            setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts([...selectedContacts, contact]);
        }
    };

    // Handle navigation back with data
    const handleGoBack = () => {
        navigation.navigate('group/groupDetail', {
            dataDetail: groupDetails[groupId] || dataDetail,
            fromScreen, // Giữ thông tin màn hình gốc
            directFromChat // Giữ thông tin đến trực tiếp từ chat nếu có
        });
    };

    const handleAddParticipants = async () => {
        try {
            for (const contact of selectedContacts) {
                await dispatch(addParticipant({
                    groupId,
                    participantId: contact.id
                })).unwrap();
            }
            // Cập nhật lại thông tin nhóm
            const action = await dispatch(getGroupDetail(groupId));
            const updatedGroupDetails = action.payload.data || action.payload;

            // Chuyển về màn hình trước với dữ liệu cập nhật
            navigation.navigate('group/groupDetail', {
                dataDetail: updatedGroupDetails
            });
        } catch (error) {
            console.error('Failed to add participants:', error);
        }
    };

    // Render từng nhóm chữ cái
    const renderAlphabetGroup = ([letter, contactsInGroup]) => (
        <View key={letter}>
            <Text color="gray" fontSize="$4" paddingHorizontal="$4" paddingVertical="$2" backgroundColor="#f5f5f5">
                {letter}
            </Text>
            {contactsInGroup.map(contact => renderContactItem(contact))}
        </View>
    );

    // Render từng người trong danh bạ
    const renderContactItem = (contact) => {
        const isSelected = selectedContacts.some(c => c.id === contact.id);
        const isAlreadyInGroup = isParticipantInGroup(contact.id);

        return (
            <TouchableOpacity
                key={contact.id}
                onPress={() => toggleSelectContact(contact)}
                disabled={isAlreadyInGroup}
            >
                <XStack paddingVertical="$3" paddingHorizontal="$4" alignItems="center">
                    <Image
                        source={{ uri: contact.avatarUrl }}
                        style={styles.avatar}
                    />
                    <YStack flex={1} marginLeft="$3">
                        <Text fontSize="$5" fontWeight="500">{contact.name}</Text>
                        {/* <Text fontSize="$3" color="gray">{contact.username}</Text> */}
                    </YStack>

                    {isAlreadyInGroup ? (
                        // Người dùng đã tham gia nhóm
                        <Text fontSize="$3" color="#888">Đã tham gia</Text>
                    ) : (
                        // Người dùng chưa tham gia nhóm
                        <View
                            width={24}
                            height={24}
                            borderRadius={12}
                            borderWidth={1}
                            borderColor={isSelected ? 'transparent' : '#ccc'}
                            backgroundColor={isSelected ? '#FF7A1E' : 'transparent'}
                            alignItems="center"
                            justifyContent="center"
                        >
                            {isSelected && <Ionicons name="checkmark" size={18} color="white" />}
                        </View>
                    )}
                </XStack>
                <Separator marginLeft="$4" />
            </TouchableOpacity>
        );
    };

    return (
        <YStack flex={1} backgroundColor="white">
            <HeaderNavigation
                title="Thêm thành viên"
            />
            <Text fontSize="$4" color="gray" paddingHorizontal="$4" paddingTop="$2">
                Đã chọn: {selectedContacts.length}
            </Text>

            <XStack
                alignItems="center"
                margin="$3"
                padding="$2"
                paddingHorizontal="$3"
                backgroundColor="#f0f0f0"
                borderRadius={8}
            >
                <Ionicons name="search" size={24} color="gray" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm tên hoặc số điện thoại"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTerm('')}>
                        <Text color="gray">123</Text>
                    </TouchableOpacity>
                )}
            </XStack>

            <XStack
                padding="$3"
                borderRadius={25}
                margin="$3"
                backgroundColor="#f0f0f0"
                alignItems="center"
            >
                <Ionicons name="link" size={24} color="#FF7A1E" />
                <Text marginLeft="$2" fontSize="$5" color="#FF7A1E">Mời vào nhóm bằng link</Text>
            </XStack>

            {searchTerm.length > 0 ? (
                // Hiển thị kết quả tìm kiếm
                <FlatList
                    data={filteredContacts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => renderContactItem(item)}
                    ListEmptyComponent={
                        <Text textAlign="center" margin="$4" color="gray">
                            Không tìm thấy kết quả
                        </Text>
                    }
                />
            ) : (
                // Hiển thị danh bạ theo chữ cái
                <FlatList
                    data={Object.entries(contactsByLetter).sort((a, b) => a[0].localeCompare(b[0]))}
                    keyExtractor={([letter]) => letter}
                    renderItem={({ item }) => renderAlphabetGroup(item)}
                    ListEmptyComponent={
                        friends.length === 0 && (
                            <Text textAlign="center" margin="$4" color="gray">
                                Bạn chưa có bạn bè nào
                            </Text>
                        )
                    }
                />
            )}

            {selectedContacts.length > 0 && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddParticipants}
                >
                    <Text color="white" fontSize="$5" fontWeight="bold">
                        Thêm ({selectedContacts.length})
                    </Text>
                </TouchableOpacity>
            )}
        </YStack>
    );
};

const styles = StyleSheet.create({
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: '#FF7A1E',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    }
});

export default AddParticipant;