import dayjs from 'dayjs';

export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '?';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const displayTime = (time) => {
    if (!time) return '';

    const now = dayjs()
    const msgTime = dayjs(time)
    const diffMinutes = now.diff(msgTime, 'minute')

    if (diffMinutes < 1) return 'Vừa xong'
    if (diffMinutes < 60) return `${diffMinutes} phút`
    const diffHours = now.diff(msgTime, 'hour')
    if (diffHours < 24) return `${diffHours} giờ`
    const diffDays = now.diff(msgTime, 'day')
    if (diffDays <= 10) return `${diffDays} ngày`
    return msgTime.format('DD/MM/YYYY')
}
