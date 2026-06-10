import React, { useState, useEffect } from 'react';
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

const NotificationRow = ({ initials, avatarBg, name, message, time, hasNew, hasEndIcon, onPress }: NotificationRowProps) => {
    const displayAvatarBg = avatarBg === '#1a1a2e' ? '#fff' : avatarBg;
    const displayAvatarColor = avatarBg === '#1a1a2e' ? '#000' : '#fff';

    return (
        <TouchableOpacity style={styles.notificationRow} onPress={onPress}>
            <View style={styles.rowLead}>
                <View style={[styles.newBullet, { backgroundColor: hasNew ? '#4CAF50' : 'transparent' }]} />
                <View style={[styles.avatar, { backgroundColor: displayAvatarBg }]}>
                    <Text style={[styles.avatarText, { color: displayAvatarColor }]}>{initials}</Text>
                </View>
            </View>
            <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
                    <Text style={styles.boldText}>{name}</Text>
                </View>
                <View style={styles.messageContainer}>
                    {message ? <View style={styles.verticalLine} /> : null}
                    <Text style={styles.grayText} numberOfLines={2}>{message}</Text>
                </View>
            </View>
            <View style={styles.rowRight}>
                <Text style={styles.timeText} numberOfLines={1}>{time}</Text>
                <Text style={styles.menuIcon}>•••</Text>
            </View>
        </TouchableOpacity>
    );
};

const timeAgo = (dateStr: any) => {
    if (!dateStr) return '';
    
    let date = new Date(dateStr);
    if (!isNaN(Number(dateStr))) {
        date = new Date(Number(dateStr));
    }

    if (isNaN(date.getTime())) return String(dateStr);
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 0) return 'Just now';
    
    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + " yrs";
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + " mos";
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + " hrs";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + " min";
    return Math.floor(seconds) + " sec";
};

const getAvatarProps = (type: string, title: string) => {
    let bg = '#1a1a2e';
    let initials = 'MS';
    if (title) {
        const words = title.split(' ');
        initials = words.length > 1 ? (words[0][0] + words[1][0]) : title.substring(0, 2);
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
            navigation.navigate('LiveTracking', { bookingId: notif.data.bookingId });
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.rightAction}>
                    {notifications.some(n => !n.isRead) && (
                        <TouchableOpacity onPress={handleReadAll}>
                            <Text style={styles.markAllText}>Mark all</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#F5A623" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {notifications.length > 0 ? (
                        <>
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
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
        backgroundColor: '#000',
    },
    backButton: {
        flex: 1,
        alignItems: 'flex-start',
    },
    backIcon: {
        fontSize: 22,
        color: '#fff',
        paddingVertical: 5,
        paddingRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 2,
        textAlign: 'center',
    },
    rightAction: {
        flex: 1,
        alignItems: 'flex-end',
    },
    markAllText: {
        color: '#F5A623',
        fontSize: 12,
        fontWeight: '600',
        paddingVertical: 5,
        paddingLeft: 10,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
    scrollContent: {
        paddingHorizontal: 0,
        backgroundColor: '#000',
        flexGrow: 1,
        paddingBottom: 20,
        paddingTop: 10,
    },
    sectionLabel: {
        display: 'none',
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#222',
        marginBottom: 4,
    },
    rowLead: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
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
        fontSize: 16,
    },
    rowContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 10,
    },
    rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    verticalLine: {
        width: 2,
        backgroundColor: '#444',
        marginRight: 8,
        borderRadius: 1,
    },
    grayText: {
        color: '#aaa',
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    rowRight: {
        width: 80,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 44,
        flexShrink: 0,
    },
    timeText: {
        fontSize: 12,
        color: '#fff',
        textAlign: 'right',
        width: '100%',
    },
    menuIcon: {
        color: '#888',
        fontSize: 16,
        letterSpacing: 1,
    },
});

export default NotificationPage;

