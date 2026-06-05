import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import VendorImage from './assets/logoimage.png';
import UserImage from './assets/logoimage1.png';
import { login, SafeStorage } from './services/api';
import { SHADOWS } from './constants/theme';

const { width } = Dimensions.get('window');
const ORANGE = '#f28b2c';
const BG = '#060606';
const CARD_BG = '#111';
const INPUT_BG = '#1A1A1A';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

const EyeIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const initialRole = route.params?.role || 'user';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'vendor'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const inputStagger = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // If route params change, update local role state
    if (route.params?.role) {
      setRole(route.params.role);
    }
  }, [route.params?.role]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(inputStagger, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res: any = await login({ email, password, role });

      if (res.token) {
        await SafeStorage.setItem('token', res.token);
        await SafeStorage.setItem('user', JSON.stringify(res.user));

        if (res.user.role === 'vendor') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorDrawer' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeTabs' }],
          });
        }
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.topHalf, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.illustrationContainer, { transform: [{ scale: logoScale }] }]}>
              <Image source={role === 'vendor' ? VendorImage : UserImage} style={styles.logoImage} resizeMode="contain" />
            </Animated.View>
            <Text style={styles.heading}>
              {'Welcome back'}
            </Text>
            <Text style={styles.subHeading}>
              {'Login to continue your journey'}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.bottomHalf, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'user' && styles.roleSelected]}
                onPress={() => setRole('user')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'user' && styles.roleTextSelected]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === 'vendor' && styles.roleSelected]}
                onPress={() => setRole('vendor')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleText, role === 'vendor' && styles.roleTextSelected]}>Vendor</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: inputStagger, transform: [{ translateX: inputStagger.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#555"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: inputStagger, transform: [{ translateX: inputStagger.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? <EyeIcon color={ORANGE} /> : <EyeOffIcon color="#555" />}
                </TouchableOpacity>
              </View>
            </Animated.View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyButtonText}>LOG IN</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Registration' as any)} style={{ alignSelf: 'center' }}>
              <Text style={styles.backLink}>
                Don't have an account? <Text style={{ fontWeight: '900', color: ORANGE }}>Register</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  topHalf: {
    paddingHorizontal: 0,
    paddingTop: 40,
    paddingBottom: 0,
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  logoImage: {
    width: width * 1,
    height: width * 0.85,
    marginTop: 20,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subHeading: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomHalf: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: CARD_BG,
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: '#222',
  },
  roleOption: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 25,
  },
  roleSelected: {
    backgroundColor: ORANGE,
    ...SHADOWS.medium,
  },
  roleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#777',
    letterSpacing: 1,
  },
  roleTextSelected: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 65,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 5,
  },
  verifyButton: {
    backgroundColor: ORANGE,
    borderRadius: 30,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
    ...SHADOWS.medium,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  backLink: {
    color: '#777',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
