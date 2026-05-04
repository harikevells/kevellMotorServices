import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { useVendorNav } from './VendorSidebarNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NotificationRowProps {
    initials: string;
    avatarBg: string;
    name: string;
    message: string;
    time: string;
    hasNew?: boolean;
    hasEndIcon?: boolean;
    onPress?: () => void;
}

const NotificationRow = ({ initials, avatarBg, name, message, time, hasNew, hasEndIcon, onPress }: NotificationRowProps) => (
    <TouchableOpacity style={styles.notificationRow} onPress={onPress}>
        <View style={styles.rowLead}>
            <View style={[styles.newBullet, { backgroundColor: hasNew ? '#2196F3' : 'transparent' }]} />
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.messageLine}>
                <Text style={styles.boldText}>{name}</Text>
                <Text style={styles.grayText}> {message}</Text>
            </Text>
            <Text style={styles.timeLine}>MotorService · {time}</Text>
        </View>
        {hasEndIcon && (
            <View style={styles.endIconContainer}>
                <View style={styles.blueDot} />
            </View>
        )}
    </TouchableOpacity>
);

const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const getAvatarProps = (type: string, title: string) => {
    let bg = '#1a1a2e';
    let initials = 'MS';
    if (title) {
        const words = title.split(' ');
        initials = words.length > 1 ? (words[0][0] + (words[1] ? words[1][0] : '')) : title.substring(0, 2);
        initials = initials.toUpperCase();
    }
    switch (type) {
        case 'booking': bg = '#F5A623'; break;
        case 'payment': bg = '#F5A623'; break;
        case 'registration': bg = '#9C27B0'; break;
        case 'status_update': bg = '#03A9F4'; break;
        case 'system': default: bg = '#1a1a2e'; break;
    }
    return { initials, bg };
};

const NotificationPage = () => {
    const navigation = useNavigation<NavigationProp>();
    const vendorNav = useVendorNav();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadNotifications();
        }, [])
    );

    const loadNotifications = async () => {
        try {
            const res: any = await fetchNotifications();
            if (res.success) {
                setNotifications(res.data || []);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (notif: any) => {
        if (!notif.isRead) {
            try {
                await markNotificationRead(notif._id);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error(error);
            }
        }

        if (notif.data?.bookingId) {
            // For vendor, switch to the Orders tab
            vendorNav.setActiveTab('Orders');
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {notifications.some(n => !n.isRead) && (
                    <TouchableOpacity onPress={handleReadAll} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#1B4D6B" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {notifications.length > 0 ? (
                        <>
                            <Text style={styles.sectionLabel}>Recent</Text>
                            {notifications.map((notif) => {
                                const { initials, bg } = getAvatarProps(notif.type, notif.title);
                                return (
                                    <NotificationRow
                                        key={notif._id}
                                        initials={initials}
                                        avatarBg={bg}
                                        name={notif.title}
                                        message={notif.message}
                                        time={timeAgo(notif.createdAt)}
                                        hasNew={!notif.isRead}
                                        hasEndIcon={!notif.isRead}
                                        onPress={() => handleRead(notif)}
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <View style={styles.centerContent}>
                            <Text style={styles.emptyText}>No notifications yet.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 15,
        paddingRight: 15,
        backgroundColor: '#fff',
    },
    markAllBtn: {
        marginLeft: 'auto',
    },
    markAllText: {
        color: '#1B4D6B',
        fontSize: 14,
        fontWeight: '600',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
    scrollContent: {
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginTop: 16,
        marginBottom: 8,
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    rowLead: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    newBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    rowContent: {
        flex: 1,
        marginLeft: 12,
    },
    messageLine: {
        fontSize: 14,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#000',
    },
    grayText: {
        color: '#888',
    },
    timeLine: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 2,
    },
    endIconContainer: {
        paddingLeft: 10,
    },
    blueDot: {
        width: 8,
        height: 8,
        backgroundColor: '#1B4D6B',
        borderRadius: 4,
    },
});

export default NotificationPage;

