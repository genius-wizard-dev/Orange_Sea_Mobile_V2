import React from 'react';
import { Sheet } from '@tamagui/sheet';
import { YStack, Button } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';

const MessageOptionsSheet = ({
    open,
    onClose,
    isMyMessage,
    isRecalled,
    onRecall,
    onDelete,
    onCopy,
    onForward
}) => {
    return (
        <Sheet
            modal
            open={open}
            onOpenChange={onClose}
            snapPoints={[40]}
            dismissOnSnapToBottom
            zIndex={100000}
            animation="quick"
        >
            <Sheet.Overlay
                animation="lazy"
                backgroundColor="rgba(0,0,0,0.5)"
            />
            <Sheet.Frame padding={16}>
                <YStack space="$2" width="100%">
                    <Button
                        size="$5"
                        width="100%"
                        onPress={onCopy}
                        icon={<Ionicons name="copy-outline" size={20} color="currentColor" />}
                    >
                        Sao chép
                    </Button>
                    {isMyMessage && !isRecalled && (
                        <Button
                            size="$5"
                            width="100%"
                            onPress={onRecall}
                            icon={<Ionicons name="refresh-outline" size={20} color="currentColor" />}
                        >
                            Thu hồi
                        </Button>
                    )}
                    <Button
                        size="$5"
                        width="100%"
                        onPress={onDelete}
                        icon={<Ionicons name="trash-outline" size={20} color="currentColor" />}
                    >
                        Xoá
                    </Button>
                    <Button
                        size="$5"
                        width="100%"
                        onPress={onForward}
                        icon={<Ionicons name="arrow-redo-outline" size={20} color="currentColor" />}
                    >
                        Chuyển tiếp
                    </Button>
                </YStack>
            </Sheet.Frame>
        </Sheet>
    );
};

export default React.memo(MessageOptionsSheet);
