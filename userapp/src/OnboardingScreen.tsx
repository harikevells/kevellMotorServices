import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import FirstSVG from './assets/first.svg';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

type Props = {
  navigation: OnboardingScreenNavigationProp;
};

const OnboardingScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHalf}>
        {/* <Text style={styles.illustration}>🖨️</Text> */}
        <FirstSVG style={styles.svg} width={350} height={500} />
      </View>
      <View style={styles.bottomHalf}>
        <Text style={styles.title}>Urgent Service{'\n'}Xerox Delivery</Text>
        <Text style={styles.subtitle}>
          We work on a crowdsourcing model. You place an order, the system selects the perfect courier for you.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Start using {'\u2192'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Soft gradient approximation (light green)
  },
  topHalf: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  

  },
  svg: {
    marginTop: 100,
  },
  illustration: {
    fontSize: 150,
  },
  bottomHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 10,
    // justifyContent: 'space-between',
    gap: 57,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: 300,
    // elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    // lineHeight: 24,
    marginTop: 0,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
