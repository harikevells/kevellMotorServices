import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

const LOGO_IMG = require('./assets/logo1.png');

const { width } = Dimensions.get('window');

const ORANGE = '#f28b2c';
const BG = '#060606';
const CARD_BG = '#111';
const CARD_BORDER = '#222';

const AnimatedG = Animated.createAnimatedComponent(G);

// ── Service strip data ──────────────────────────────────────────────
const SERVICES = [
  { label: 'Car Service', icon: 'car' },
  { label: 'Engine', icon: 'gear' },
  { label: 'Tyre', icon: 'tyre' },
  { label: 'Battery', icon: 'battery' },
  { label: 'Heavy', icon: 'heavy' },
  { label: 'EV Service', icon: 'ev' },
  { label: 'Oil Change', icon: 'oil' },
  { label: 'Repair', icon: 'wrench' },
];

function ServiceIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    car: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    gear: 'M12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
    tyre: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    battery: 'M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z M15 13H9v-2h6v2z',
    heavy: 'M20 8h-3V4H7v4H4c-1.1 0-2 .9-2 2v5h2v5h2v-5h12v5h2v-5h2v-5c0-1.1-.9-2-2-2zM9 6h6v2H9V6z',
    ev: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z M12 11h-2v3H8v-3H6V9h2V6h2v3h2v2z',
    oil: 'M12 2c-4 4.33-6 7.67-6 10 0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.33-2-5.67-6-10zm-5 10c0-2.5 2.5-4.5 5-7 2.5 2.5 5 4.5 5 7 0 2.8-2.2 5-5 5s-5-2.2-5-5z M12 18l3.5-3.5H8.5L12 18z',
    wrench: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
  };
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24">
      {type === 'tyre' ? (
        <>
          <Circle cx={12} cy={12} r={4} fill={ORANGE} />
          <Path d={paths[type]} fill={ORANGE} />
        </>
      ) : (
        <Path d={paths[type]} fill={ORANGE} />
      )}
    </Svg>
  );
}

// ── Main Gear Logo Replacement ──
function LogoComponent({ anim }: { anim: Animated.Value }) {
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image
        source={LOGO_IMG}
        style={{ width: 300, height: 150 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ── Role Card ───────────────────────────────────────────────────────
function RoleCard({
  role,
  title,
  subtitle,
  selected,
  onPress,
  animVal,
}: {
  role: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  animVal: Animated.Value;
}) {
  const scale = animVal.interpolate({ inputRange: [0, 0.6, 0.8, 1], outputRange: [0, 1.05, 0.97, 1] });
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.card,
          selected && styles.cardActive,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {selected && (
          <View style={styles.checkBadge}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff" />
            </Svg>
          </View>
        )}
        <View style={[styles.iconRing, selected && styles.iconRingActive]}>
          {role === 'user' ? (
            <Svg width={32} height={32} viewBox="0 0 24 24">
              <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={selected ? ORANGE : '#555'} />
            </Svg>
          ) : (
            <Svg width={32} height={32} viewBox="0 0 24 24">
              <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill={selected ? ORANGE : '#555'} />
            </Svg>
          )}
        </View>
        <Text style={[styles.cardLabel, selected && { color: ORANGE }]}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Animated Strip Item ──────────────────────────────────────────────
function AnimatedStripItem({ item }: { item: any }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const iconOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.stripItem}>
      <Animated.View style={[styles.stripIcon, { transform: [{ scale }], opacity: iconOpacity }]}>
        <ServiceIcon type={item.icon} />
      </Animated.View>
      <Text style={styles.stripLabel}>{item.label}</Text>
    </View>
  );
}
type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
type Props = { navigation: OnboardingScreenNavigationProp };

const OnboardingScreen = ({ navigation }: Props) => {
  const [selected, setSelected] = useState<'user' | 'vendor' | null>('user');
  const [error, setError] = useState(false);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const whoAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const stripAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const gearSpin = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(logoAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(whoAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(card1Anim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.spring(card2Anim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(stripAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(gearSpin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const STRIP_WIDTH = SERVICES.length * 62;
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -STRIP_WIDTH,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleContinue = () => {
    if (!selected) {
      setError(true);
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start(() => setError(false));
      return;
    }

    // Always navigate to Login for both roles as per request
    navigation.navigate('Login', { role: selected as any });
  };

  const logoY = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  const whoY = whoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const doubledServices = [...SERVICES, ...SERVICES];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.logoArea, { opacity: logoAnim, transform: [{ translateY: logoY }] }]}>
          <LogoComponent anim={logoAnim} />
        </Animated.View>

        <Animated.View style={[styles.whoBlock, { opacity: whoAnim, transform: [{ translateY: whoY }] }]}>
          <Text style={styles.whoTitle}>Who are you?</Text>
          <Text style={styles.whoSub}>SELECT YOUR ACCOUNT TYPE</Text>
        </Animated.View>

        <Animated.View style={[styles.cardsRow, { transform: [{ translateX: errorShake }] }]}>
          <RoleCard
            role="user"
            title="USER"
            subtitle={'Book services &\ntrack your vehicle'}
            selected={selected === 'user'}
            onPress={() => setSelected('user')}
            animVal={card1Anim}
          />
          <RoleCard
            role="vendor"
            title="VENDOR"
            subtitle={'Manage jobs &\ngrow your garage'}
            selected={selected === 'vendor'}
            onPress={() => setSelected('vendor')}
            animVal={card2Anim}
          />
        </Animated.View>

        <Animated.View style={[styles.stripWrap, { opacity: stripAnim }]}>
          <Animated.View style={[styles.strip, { transform: [{ translateX: scrollX }] }]}>
            {doubledServices.map((s, i) => (
              <AnimatedStripItem key={i} item={s} />
            ))}
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.btnWrap, { opacity: btnAnim }]}>
          <TouchableOpacity
            style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueTxt}>CONTINUE</Text>
          </TouchableOpacity>
          <Text style={styles.loginLink}>
            Already have an account?{' '}
            <Text style={{ color: ORANGE }} onPress={() => navigation.navigate('Login')}>Sign In</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iwsBox: {
    backgroundColor: '#1a4aff',
    paddingHorizontal: 40, // Match image
    paddingVertical: 5,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 6,
  },
  iwsText: {
    fontFamily: 'System',
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 6,
    textAlign: 'center',
    paddingLeft: 6,
  },
  anytimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anytimeBox: {
    backgroundColor: ORANGE,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 2,
  },
  anytimeLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  anywhereLbl: {
    fontSize: 8,
    color: '#888',
    letterSpacing: 2,
  },
  whoBlock: {
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 10,
  },
  whoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
  whoSub: {
    fontSize: 9,
    color: '#555',
    letterSpacing: 2,
    marginTop: 3,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    marginBottom: 40,
  },
  card: {
    flex: 1,
    minHeight: 240,
    backgroundColor: CARD_BG,
    borderWidth: 2,
    borderColor: CARD_BORDER,
    borderRadius: 24,
    paddingVertical: 35,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
  },
  cardActive: {
    borderColor: ORANGE,
    backgroundColor: '#180e00',
  },
  checkBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a0c00',
    borderWidth: 1.5,
    borderColor: '#E8640066',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconRingActive: {
    borderColor: ORANGE,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 9,
    color: '#555',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  stripWrap: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: 30,
    paddingVertical: 10,
  },
  strip: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  stripItem: {
    alignItems: 'center',
    marginRight: 18, // More gap
    width: 70, // Wider for bigger content
  },
  stripIcon: {
    width: 54, // Bigger container
    height: 54,
    backgroundColor: '#1a0c00',
    borderWidth: 1.5,
    borderColor: '#E8640044',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripLabel: {
    fontSize: 9, // Bigger font
    fontWeight: '600',
    color: '#777',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 5,
  },
  btnWrap: {
    width: '100%',
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: ORANGE,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 14,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  loginLink: {
    fontSize: 10,
    color: '#444',
    letterSpacing: 1,
  },
});

export default OnboardingScreen;