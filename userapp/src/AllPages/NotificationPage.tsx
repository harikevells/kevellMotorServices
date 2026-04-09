import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NotificationRowProps {
    initials: string;
    avatarBg: string;
    name: string;
    message: string;
    time: string;
    hasNew?: boolean;
    hasEndIcon?: boolean;
}

const NotificationRow = ({ initials, avatarBg, name, message, time, hasNew, hasEndIcon }: NotificationRowProps) => (
    <View style={styles.notificationRow}>
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
            <Text style={styles.timeLine}>Xerox app · {time}</Text>
        </View>
        {hasEndIcon && (
            <View style={styles.endIconContainer}>
                <View style={styles.blueDot} />
            </View>
        )}
    </View>
);

const NotificationPage = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionLabel}>Today</Text>

                <NotificationRow
                    initials="CR"
                    avatarBg="#F5A623"
                    name="Jeremy"
                    message="Deliver boy Delivered your Ord"
                    time="2h ago"
                    hasNew
                />

                <NotificationRow
                    initials="CS"
                    avatarBg="#1a1a2e"
                    name="Jeremy"
                    message="Deliver boy Delivered your Ord"
                    time="2h ago"
                    hasNew
                />

                <NotificationRow
                    initials="JD"
                    avatarBg="#E53935"
                    name="Jeremy"
                    message="Deliver boy Delivered your Ord"
                    time="2h ago"
                    hasNew
                    hasEndIcon
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        backgroundColor: '#fff',
    },
    backButton: {
        marginRight: 15,
    },
    backIcon: {
        fontSize: 28,
        color: '#333',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        flex: 1,
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
        backgroundColor: '#2196F3',
        borderRadius: 4,
    },
});

export default NotificationPage;
