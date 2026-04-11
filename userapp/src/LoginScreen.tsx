import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import SecondSVG from './assets/second.svg';
import { login, SafeStorage } from './services/api';
import { COLORS, SHADOWS } from './constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);

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
        
        // Redirect based on role and clear history
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
      <View style={styles.topHalf}>
        <Text style={styles.heading}>
          {'LOGIN TO YOUR\nACCOUNT'}
        </Text>
        <View style={styles.illustrationContainer}>
          <SecondSVG width={300} height={350} />
        </View>
      </View>
      
      <View style={styles.svgContainer}>
        <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <Path 
            fill="#1B5E20" 
            d="M0,192L80,202.7C160,213,320,235,480,218.7C640,203,800,149,960,138.7C1120,128,1280,160,1360,176L1440,192L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z" 
          />
        </Svg>
      </View>

      <View style={styles.bottomHalf}>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleOption, role === 'user' && styles.roleSelected]} 
            onPress={() => setRole('user')}
          >
            <Text style={[styles.roleText, role === 'user' && styles.roleTextSelected]}>User Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleOption, role === 'vendor' && styles.roleSelected]} 
            onPress={() => setRole('vendor')}
          >
            <Text style={[styles.roleText, role === 'vendor' && styles.roleTextSelected]}>Vendor Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={styles.verifyButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyButtonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Registration' as any)} style={{ alignSelf: 'center' }}>
           <Text style={styles.backLink}>Don't have an account? <Text style={{fontWeight: '900', color: '#333333'}}>Register</Text></Text>
        </TouchableOpacity>

        <View style={[styles.footerTexts, { marginTop: 'auto', marginBottom: 20 }]}>
          <Text style={styles.safeText}>Your personal details are safe with us</Text>
          <TouchableOpacity>
             <Text style={styles.linkText}>Read our Privacy Policy and Terms and Conditions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  topHalf: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 10,
  },
  svgContainer: {
    height: 60,
    width: '100%',
    backgroundColor: '#FFFFFF',
    marginTop: -1,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 10,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  bottomHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F1F3F5',
    borderRadius: 15,
    padding: 5,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  roleSelected: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.light,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ADB5BD',
  },
  roleTextSelected: {
    color: '#1B5E20',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 60,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    color: '#1B5E20',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  footerTexts: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  safeText: {
    color: '#ADB5BD',
    fontSize: 12,
    marginBottom: 5,
  },
  linkText: {
    color: '#ADB5BD',
    fontSize: 10,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
