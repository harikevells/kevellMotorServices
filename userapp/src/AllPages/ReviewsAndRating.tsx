import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import ReviewIllustration from '../assets/reviews.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReviewsRatingsPage = () => {
    const navigation = useNavigation<NavigationProp>();
    const [rating, setRating] = useState<number>(2);
    const [feedback, setFeedback] = useState<string>('');

    const submitReview = () => {
        navigation.navigate('HomeTabs');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reviews & Ratings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Illustration */}
                <View style={styles.illustrationArea}>
                    <ReviewIllustration width={500} height={500} />
                </View>

                <Text style={styles.thankYouHeading}>Thank you!</Text>
                <Text style={styles.takeXeroxHeading}>Take your Xerox</Text>
                <Text style={styles.subTitle}>Please rate our app</Text>

                {/* Star Rating Row */}
                <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                        >
                            <Text style={[styles.starIcon, star <= rating ? styles.starFilled : styles.starEmpty]}>
                                {star <= rating ? '⭐' : '☆'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Feedback Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.pencilIcon}>✏️</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Write Feedback"
                        placeholderTextColor="#888"
                        value={feedback}
                        onChangeText={setFeedback}
                        multiline
                    />
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
                    <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Orders')}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 60,
    },
    backIcon: {
        fontSize: 28,
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 40,
    },
    scrollContent: {
        alignItems: 'center',
        padding: 24,
    },
    illustrationArea: {
        height: 400,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    thankYouHeading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    takeXeroxHeading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subTitle: {
        fontSize: 13,
        color: '#888',
        marginBottom: 16,
    },
    starRow: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 16,
    },
    starIcon: {
        fontSize: 32,
    },
    starFilled: {
        color: '#FFD700',
    },
    starEmpty: {
        color: '#ddd',
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 12 : 2,
        marginTop: 20,
    },
    pencilIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        textAlignVertical: 'top',
    },
    footer: {
        padding: 24,
    },
    submitButton: {
        backgroundColor: '#1B5E3B',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 16,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    skipButton: {
        alignItems: 'center',
    },
    skipText: {
        color: '#1B5E3B',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ReviewsRatingsPage;
