import { FlatList, Image, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ToastAndroid } from 'react-native'
import React, { useState, useEffect, useMemo } from 'react'
import HeaderLeft from '../../../components/header/HeaderLeft'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, XStack, YStack, Separator } from 'tamagui';
import { useDispatch, useSelector } from 'react-redux';
import { addParticipant } from '../../../redux/thunks/group';
import { getGroupDetail } from '../../../redux/thunks/group';
import { getFriendList } from '../../../redux/thunks/friend';
import HeaderNavigation from '../../../components/header/HeaderNavigation';
import DefaultAvatar from '../../../components/chat/DefaultAvatar';


const AddParticipant = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    // Lấy thông tin từ params
    const groupId = params.groupId || route.params?.groupId;
    const fromScreen = params.fromScreen || route.params?.fromScreen;
    const goBackTo = params.goBackTo || route.params?.goBackTo;
    const uniqueKey = route.params?.uniqueKey || params?.uniqueKey;

    // Lấy thông tin nhóm từ Redux store dựa vào groupId
    const groupDetail = useSelector(state => state.group.groupDetails[groupId]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true); // Thêm state kiểm tra đang load danh sách liên hệ
    const [isSubmitting, setIsSubmitting] = useState(false); // Thêm state kiểm tra đang thêm thành viên
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


    // console.log("groupId:", groupId);

    // console.log("groupDetails[groupId] : ", groupDetails[groupId])




    useEffect(() => {
        const fetchFriendList = async () => {
            setIsLoadingContacts(true);
            try {
                await dispatch(getFriendList()).unwrap();
            } catch (error) {
                console.error('Lỗi khi tải danh sách bạn bè:', error);
            } finally {
                setIsLoadingContacts(false);
            }
        };

        fetchFriendList();
    }, [dispatch]);

    // console.log("friends : ", friends)

    const getContacts = () => {
        if (!friends?.data) return [];

        return friends?.data?.map(friend => {
            return {
                id: friend.profileId,
                name: friend.name,
                avatarUrl: friend.avatar,
            };
        });
    };

    const getExistingParticipantIds = () => {
        if (groupDetails[groupId]?.participants) {
            return groupDetails[groupId].participants?.map(p => p.profileId);
        }
        return [];
    };


    // Phân loại danh bạ theo chữ cái đầu tiên
    const getContactsByLetter = () => {
        const contacts = getContacts();
        if (!contacts) return {};

        return contacts.reduce((acc, contact) => {
            const firstLetter = contact.name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(contact);
            return acc;
        }, {});
    };

    // Lọc danh bạ theo từ khóa tìm kiếm
    // Thay thế useMemo cho filteredContacts
    const getFilteredContacts = () => {
        if (searchTerm.length === 0) return [];

        const contacts = getContacts();
        return contacts.filter(contact =>
            contact.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const isParticipantInGroup = (contactId) => {
        const existingIds = getExistingParticipantIds();
        return existingIds?.includes(contactId);
    };

    const contacts = getContacts();
    const contactsByLetter = getContactsByLetter();
    const filteredContacts = getFilteredContacts();

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

    // console.log("contacts ", contacts)
    // console.log("groupDetails[groupId] ", groupDetails[groupId])

    const handleAddParticipants = async () => {
        if (selectedContacts.length === 0) return;

        setIsSubmitting(true); // Bắt đầu hiển thị loading trên nút

        try {
            // Chuẩn bị dữ liệu theo định dạng API yêu cầu
            const participantIds = selectedContacts?.map(contact => contact.id);

            console.log("Chuẩn bị gửi API thêm thành viên:", participantIds);
            console.log("Chuẩn bị gửi API thêm thành viên với groupId :", groupId);

            // Gọi API để thêm thành viên với định dạng đúng
            const result = await dispatch(addParticipant({
                groupId,
                participantIds: participantIds
            })).unwrap();

            // console.log("Kết quả API thêm thành viên:", result);

            // Kiểm tra kết quả từ API - API trả về thông tin nhóm đầy đủ nếu thành công
            if (result && result.data?.groupId) {
                // Xóa danh sách người đã chọn sau khi thêm thành công
                setSelectedContacts([]);
                ToastAndroid.show("Thêm thành viên " + participantIds.length + " thành công", ToastAndroid.SHORT);

                await dispatch(getGroupDetail(groupId));

            } else {
                // Xử lý trường hợp API trả về lỗi
                Alert.alert(
                    'Lỗi',
                    result?.message || 'Không thể thêm thành viên vào nhóm.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Lỗi khi thêm thành viên:', error);
            Alert.alert(
                'Lỗi',
                'Có lỗi xảy ra khi thêm thành viên. Vui lòng thử lại sau.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSubmitting(false); // Dù thành công hay thất bại đều tắt loading
        }
    };

    // Thêm useEffect để quan sát sự thay đổi của groupDetails và cập nhật existingParticipantIds
    useEffect(() => {
        if (groupId && groupDetails[groupId]) {
            // Khi dữ liệu nhóm được cập nhật, cũng cần kiểm tra lại selectedContacts
            // để loại bỏ những người đã được thêm vào nhóm
            if (selectedContacts.length > 0) {
                const updatedParticipantIds = groupDetails[groupId].participants?.map(p => p.userId);
                // Lọc ra các liên hệ chưa được thêm vào nhóm
                const filteredContacts = selectedContacts.filter(
                    contact => !updatedParticipantIds?.includes(contact.id)
                );

                // Nếu có sự thay đổi trong danh sách, cập nhật lại state
                if (filteredContacts.length !== selectedContacts.length) {
                    setSelectedContacts(filteredContacts);
                }
            }
        }
    }, [groupDetails, groupId]);

    // Thêm effect để đảm bảo component luôn được khởi tạo lại mỗi khi được mount
    useEffect(() => {
        console.log('AddParticipant mounted with uniqueKey:', uniqueKey);

        // Reset các state quan trọng mỗi khi component mount với key mới
        setSearchTerm('');
        setSelectedContacts([]);
        setIsLoadingContacts(true);

        // Fetch danh sách bạn bè mỗi khi component được mount
        const fetchInitialData = async () => {
            try {
                if (groupId) {
                    await dispatch(getGroupDetail(groupId));
                }
                await dispatch(getFriendList());
            } catch (error) {
                console.error('Lỗi khi khởi tạo dữ liệu:', error);
            } finally {
                setIsLoadingContacts(false);
            }
        };

        fetchInitialData();
    }, [uniqueKey, dispatch, groupId]); // Phụ thuộc vào uniqueKey sẽ làm effect này chạy mỗi khi component được mount với key khác

    // Render từng nhóm chữ cái
    const renderAlphabetGroup = ([letter, contactsInGroup]) => (
        <View key={letter}>
            <Text color="gray" fontSize="$4" paddingHorizontal="$4" paddingVertical="$2" backgroundColor="#f5f5f5">
                {letter}
            </Text>
            {contactsInGroup?.map(contact => renderContactItem(contact))}
        </View>
    );

    // Render từng người trong danh bạ
    const renderContactItem = (contact) => {
        const isSelected = selectedContacts.some(c => c.id === contact.id);
        const isAlreadyInGroup = isParticipantInGroup(contact.id);

        return (
            <TouchableOpacity
                key={contact.id}
                onPress={() => !isAlreadyInGroup && toggleSelectContact(contact)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: isSelected ? '#fff3e6' : 'white',
                    opacity: isAlreadyInGroup ? 0.8 : 1,
                }}
            >
                {/* Hiển thị avatar hoặc DefaultAvatar */}
                {contact.avatarUrl && contact.avatarUrl !== 'https://via.placeholder.com/100' ? (
                    <Image
                        source={{ uri: contact.avatarUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <DefaultAvatar name={contact.name} size={40} />
                )}

                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>
                        {contact.name}
                    </Text>
                </View>

                {
                    !isAlreadyInGroup &&

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
                }



                {isAlreadyInGroup && (
                    <Text style={{
                        fontSize: 15,
                        color: '#000',
                        fontStyle: 'italic',
                        marginRight: 10
                    }}>
                        Đã trong nhóm
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    // Cập nhật HeaderNavigation để trở về đúng màn hình trước đó
    return (
        <YStack flex={1} backgroundColor="white">
            <HeaderNavigation
                title="Thêm thành viên"
                onGoBack={() => {
                    // Kiểm tra nếu có màn hình cần quay lại
                    if (fromScreen) {
                        // Lấy thông tin nhóm hiện tại từ Redux store
                        const currentGroupDetail = groupDetails[groupId];
                        if (currentGroupDetail) {
                            // Truyền dữ liệu nhóm hiện tại từ Redux store khi quay lại
                            navigation.navigate(fromScreen, {
                                dataDetail: currentGroupDetail, // Truyền trực tiếp đối tượng từ Redux store
                                groupId: groupId,
                                refreshTimestamp: Date.now() // Thêm timestamp để kích hoạt refresh ở màn hình trước
                            });
                        } else {
                            // Nếu không có dữ liệu nhóm trong store, chỉ truyền groupId
                            navigation.navigate(fromScreen, {
                                groupId: groupId,
                                refreshTimestamp: Date.now()
                            });
                        }
                    } else {
                        navigation.goBack(); // Mặc định quay lại màn hình trước đó
                    }
                }}
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
                    placeholderTextColor="#000"
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTerm('')}>
                        <Text color="gray">123</Text>
                    </TouchableOpacity>
                )}
            </XStack>

            {/* <XStack
                padding="$3"
                borderRadius={25}
                margin="$3"
                backgroundColor="#f0f0f0"
                alignItems="center"
            >
                <Ionicons name="link" size={24} color="#FF7A1E" />
                <Text marginLeft="$2" fontSize="$5" color="#FF7A1E">Mời vào nhóm bằng link</Text>
            </XStack> */}

            {searchTerm.length > 0 ? (
                // Hiển thị kết quả tìm kiếm
                <FlatList
                    data={filteredContacts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => renderContactItem(item)}
                    ListEmptyComponent={
                        isLoadingContacts ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FF7A1E" />
                                <Text style={{ marginTop: 10, color: 'gray' }}>
                                    Đang tải danh sách liên hệ...
                                </Text>
                            </View>
                        ) : (
                            <Text textAlign="center" margin="$4" color="gray">
                                Không tìm thấy kết quả
                            </Text>
                        )
                    }
                />
            ) : (
                // Hiển thị danh bạ theo chữ cái
                <FlatList
                    data={Object.entries(contactsByLetter).sort((a, b) => a[0].localeCompare(b[0]))}
                    keyExtractor={([letter]) => letter}
                    renderItem={({ item }) => renderAlphabetGroup(item)}
                    ListEmptyComponent={
                        isLoadingContacts ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FF7A1E" />
                                <Text style={{ marginTop: 10, color: 'gray' }}>
                                    Đang tải danh sách liên hệ...
                                </Text>
                            </View>
                        ) : (
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
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text color="white" fontSize="$5" fontWeight="bold">
                            Thêm ({selectedContacts.length})
                        </Text>
                    )}
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
        color: 'black',
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 200
    }
});

export default AddParticipant;