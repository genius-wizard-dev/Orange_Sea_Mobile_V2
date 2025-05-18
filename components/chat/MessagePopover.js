import { Popover, YStack, Button } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';

const MessagePopover = ({
    isOpen,
    onOpenChange,
    placement,
    isMyMessage,
    isRecalled,
    onRecall,
    onDelete,
    onCopy,
    onForward,
    children,
    message,
}) => {
    return (
        <Popover
            open={isOpen}
            onOpenChange={onOpenChange}
            placement={placement}
            size="$5"
        >
            <Popover.Trigger asChild>
                {children}
            </Popover.Trigger>

            <Popover.Content
                borderWidth={1}
                borderColor="$borderColor"
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
                elevate
                animation="quick"
            >
                <YStack space="$2" padding="$2">
                    <Button
                        size="$3"
                        width="$15"
                        icon={<Ionicons name="copy-outline" size={18} />}
                        onPress={onCopy}
                    >
                        Sao chép
                    </Button>

                    {isMyMessage && !isRecalled && (
                        <Button
                            size="$3"
                            width="$15"
                            icon={<Ionicons name="refresh-outline" size={18} />}
                            onPress={onRecall}
                        >
                            Thu hồi
                        </Button>
                    )}

                    <Button
                        size="$3"
                        width="$15"
                        icon={<Ionicons name="trash-outline" size={18} />}
                        onPress={onDelete}
                    >
                        Xoá
                    </Button>

                    <Button
                        size="$3"
                        width="$15"
                        icon={<Ionicons name="arrow-redo-outline" size={18} />}
                        onPress={onForward}
                    >
                        Chuyển tiếp
                    </Button>
                </YStack>
            </Popover.Content>
        </Popover>
    );
};

export default MessagePopover;
