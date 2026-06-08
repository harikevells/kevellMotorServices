import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    ImageBackground,
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
    <TouchableOpacity style={styles.notificationRow} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.rowLead}>
            <View style={[styles.newBullet, { backgroundColor: hasNew ? '#4CD964' : 'transparent' }]} />
            <View style={[styles.avatar, { backgroundColor: '#FFF' }]}>
                <Text style={[styles.avatarText, { color: '#555' }]}>{initials}</Text>
            </View>
        </View>
        <View style={styles.rowContent}>
            <View style={styles.rowHeader}>
                <Text style={styles.boldText} numberOfLines={1}>{name}</Text>
                <View style={styles.timeGroup}>
                    <Text style={styles.timeLine}>{time}</Text>
                </View>
            </View>
            {message ? (
                <Text style={styles.grayText} numberOfLines={2}>{message}</Text>
            ) : null}
        </View>
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
                vendorNav.refreshNotifications();
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
            vendorNav.refreshNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => vendorNav.setActiveTab('Dashboard')} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {notifications.some(n => !n.isRead) && (
                    <TouchableOpacity onPress={handleReadAll} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#E67E22" />
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
        backgroundColor: 'transparent',
    },
    header: {
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 30,
        paddingTop: 15,
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
    },
    backBtn: {
        position: 'absolute',
        left: 15,
        top: 15,
        padding: 5,
    },
    backBtnText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    markAllBtn: {
        position: 'absolute',
        right: 15,
        bottom: 0,
    },
    markAllText: {
        color: '#E67E22',
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
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
        flexGrow: 1,
        paddingBottom: 10,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 10,
        marginBottom: 15,
        display: 'none',
    },
    notificationRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(35, 35, 35, 0.9)',
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginBottom: 10,
        alignItems: 'flex-start',
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
        fontWeight: 'bold',
        fontSize: 18,
    },
    rowContent: {
        flex: 1,
        marginLeft: 15,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    boldText: {
        fontWeight: 'bold',
        color: '#FFF',
        fontSize: 14,
        flex: 1,
        marginRight: 10,
    },
    timeGroup: {
        alignItems: 'center',
    },
    timeLine: {
        fontSize: 11,
        color: '#888',
    },
    dots: {
        color: '#FFF',
        fontSize: 12,
        marginTop: 4,
        letterSpacing: 2,
    },
    grayText: {
        color: '#AAA',
        fontSize: 12,
        marginTop: 8,
        lineHeight: 18,
    },
});

export default NotificationPage;

