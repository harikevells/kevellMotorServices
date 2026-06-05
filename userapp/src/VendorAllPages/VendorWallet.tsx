import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    TextInput, ActivityIndicator, Alert, Platform, ScrollView
} from 'react-native';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

const VendorWallet = () => {
    const navigation = useNavigation();

    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState(false);

    // Form Inputs
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawNote, setWithdrawNote] = useState('');

    const fetchVendorWalletData = useCallback(async () => {
        setLoading(true);
        try {
            const balRes: any = await api.get('/wallet/my-balance');
            console.log('DEBUG - balRes:', JSON.stringify(balRes));
            if (balRes && balRes.success) {
                setWallet(balRes.wallet);
            }

            const txRes: any = await api.get('/wallet/transactions?limit=50');
            console.log('DEBUG - txRes transactions count:', txRes?.transactions?.length);
            if (txRes && txRes.success) {
                setTransactions(txRes.transactions);
            }
        } catch (error) {
            console.error('Error fetching vendor wallet data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendorWalletData();
    }, [fetchVendorWalletData]);

    const handleWithdrawFunds = async () => {
        const amt = parseFloat(withdrawAmount);
        if (!amt || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }
        
        if (wallet && (wallet.pendingBalance || 0) < amt) {
            Alert.alert('Insufficient Balance', `You can request up to ₹${(wallet.pendingBalance || 0).toFixed(2)}`);
            return;
        }

        setWithdrawing(true);
        try {
            const profileRes = await api.get('/vendor/profile').catch(() => null);
            let bankDetails = {};
            if (profileRes?.data?.vendor?.bankDetails) {
                bankDetails = profileRes.data.vendor.bankDetails;
            }

            const response: any = await api.post('/wallet/withdraw', { 
                amount: amt, 
                description: withdrawNote || 'Payout request',
                bankDetails 
            });

            if (response && response.success) {
                Alert.alert('Success', 'Redemption request submitted successfully.');
                setWithdrawAmount('');
                setWithdrawNote('');
                fetchVendorWalletData();
            }
        } catch (error: any) {
            console.error('Error requesting payout:', error);
            Alert.alert('Error', error.response?.data?.message || 'Error executing payout request');
        } finally {
            setWithdrawing(false);
        }
    };

    const renderTransactionItem = ({ item }: { item: any }) => {
        const isPositive = ['earning', 'add_funds'].includes(item.type);
        const amountStr = `${isPositive ? '+' : '-'}₹${item.amount.toFixed(2)}`;
        
        let amountColor = '#ff4444';
        if (item.status === 'completed' || item.status === 'successful') {
            amountColor = '#10b981';
        }
        
        let statusColor = '#FFF';
        let statusBg = '#ff4444';
        if (item.status === 'completed' || item.status === 'successful') {
            statusColor = '#10b981';
            statusBg = '#e6f8f0';
        } else if (item.status === 'pending') {
            statusColor = '#FFF';
            statusBg = '#ff6b6b'; 
        }

        return (
            <View style={styles.txItem}>
                <View style={styles.txIconContainer}>
                    <Text style={styles.txIconText}>A</Text>
                </View>
                <View style={styles.txDetails}>
                    <Text style={styles.txAdminText}>Admin</Text>
                    <Text style={styles.txDateText}>{new Date(item.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}</Text>
                </View>
                <View style={styles.txAmountSection}>
                    <Text style={[styles.txAmountText, { color: amountColor }]}>{amountStr}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>{'<'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Wallet</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f28b2c" />
                </View>
            </SafeAreaView>
        );
    }

    const totalEarned = transactions
        .filter(tx => tx.type === 'earning' && (tx.status === 'completed' || tx.status === 'successful'))
        .reduce((sum, t) => sum + t.amount, 0);

    const availableSettledAmount = wallet?.balance || 0;
    
    const redeemedAmount = transactions
        .filter(tx => tx.type === 'payout' && (tx.status === 'completed' || tx.status === 'successful'))
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wallet</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={[styles.statIcon, { color: '#10b981' }]}>💵</Text>
                            <Text style={styles.statLabel}>AVAILABLE</Text>
                        </View>
                        <Text style={styles.statValue}>₹{availableSettledAmount.toFixed(0)}</Text>
                    </View>
                    <View style={[styles.statCard, { marginLeft: 15 }]}>
                        <View style={styles.statHeader}>
                            <Text style={[styles.statIcon, { color: '#f28b2c' }]}>📈</Text>
                            <Text style={styles.statLabel}>REQUEST AMOUNT</Text>
                        </View>
                        <Text style={styles.statValue}>₹{(wallet?.pendingBalance || 0).toFixed(0)}</Text>
                    </View>
                </View>

                {/* Request Redemption Card */}
                <View style={styles.requestCard}>
                    <Text style={styles.requestTitle}>REQUEST REDEMPTION</Text>
                    
                    <Text style={styles.inputLabel}>Amount</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="Enter Amount"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={withdrawAmount}
                        onChangeText={setWithdrawAmount}
                    />

                    <Text style={styles.inputLabel}>Note(optional)</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="e.g.Monthly payout request"
                        placeholderTextColor="#888"
                        value={withdrawNote}
                        onChangeText={setWithdrawNote}
                    />

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleWithdrawFunds}
                        disabled={withdrawing}
                    >
                        {withdrawing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.actionButtonText}>Request Payout</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Transaction History */}
                <Text style={styles.historyTitle}>Transaction History</Text>
                
                <View style={styles.historyContainer}>
                    {transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <React.Fragment key={tx._id}>
                                {renderTransactionItem({ item: tx })}
                            </React.Fragment>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No transactions found.</Text>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
    },
    backBtn: {
        padding: 5,
    },
    backBtnText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        paddingTop:30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#111111',
        borderRadius: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statIcon: {
        fontSize: 12,
        marginRight: 5,
    },
    statLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: 'bold',
    },
    statValue: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    requestCard: {
        backgroundColor: '#111111',
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 30,
    },
    requestTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputLabel: {
        color: '#AAA',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#333333',
        borderRadius: 8,
        color: '#FFF',
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: '#f28b2c',
        borderRadius: 25,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 5,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    historyTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    historyContainer: {
        marginBottom: 5,
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    txIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    txIconText: {
        color: '#ff4444',
        fontSize: 18,
        fontWeight: 'bold',
    },
    txDetails: {
        flex: 1,
    },
    txAdminText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    txDateText: {
        color: '#888',
        fontSize: 12,
    },
    txAmountSection: {
        alignItems: 'flex-end',
    },
    txAmountText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default VendorWallet;
