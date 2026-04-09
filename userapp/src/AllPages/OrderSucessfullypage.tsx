import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ThankYouIllustration from '../assets/Thankyou.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OrderCompletedPage = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Reviews');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Celebration Illustration */}
        <View style={styles.illustrationContainer}>
           <ThankYouIllustration width={350} height={350} />
        </View>

        <Text style={styles.thankYouText}>Thank You!</Text>
        <Text style={styles.orderCompletedText}>Order Completed</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  illustrationContainer: {
    height: 350,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  thankYouText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  orderCompletedText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default OrderCompletedPage;
