import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Svg, { Path, Circle, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const ORANGE = '#E86400';
const BG = '#060606';

// Animated SVG wrapper for rotating elements
const AnimatedG = Animated.createAnimatedComponent(G);

const LOGO_IMG = require('../assets/logo.png');

export default function IWSSplashScreen() {
    const navigation = useNavigation<any>();
    // Animation values
    const zoomLogo = useRef(new Animated.Value(0)).current;
    const ring1Opacity = useRef(new Animated.Value(0)).current;
    const ring1Scale = useRef(new Animated.Value(0.2)).current;
    const ring2Opacity = useRef(new Animated.Value(0)).current;
    const ring2Scale = useRef(new Animated.Value(0.2)).current;
    const ring3Opacity = useRef(new Animated.Value(0)).current;
    const ring3Scale = useRef(new Animated.Value(0.2)).current;
    const outerSpin = useRef(new Animated.Value(0)).current;
    const innerSpin = useRef(new Animated.Value(0)).current;
    const arcProgress = useRef(new Animated.Value(0)).current;
    const iwsY = useRef(new Animated.Value(-40)).current;
    const iwsOpacity = useRef(new Animated.Value(0)).current;
    const tagOpacity = useRef(new Animated.Value(0)).current;
    const lineScale = useRef(new Animated.Value(0)).current;
    const loaderWidth = useRef(new Animated.Value(0)).current;
    const loaderOpacity = useRef(new Animated.Value(0)).current;
    const dot1Opacity = useRef(new Animated.Value(0.2)).current;
    const dot2Opacity = useRef(new Animated.Value(0.2)).current;
    const dot3Opacity = useRef(new Animated.Value(0.2)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;
    const logoSpin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Zoom in logo
        Animated.spring(zoomLogo, {
            toValue: 1,
            delay: 400,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();

        // 1.1 Spin in logo
        Animated.timing(logoSpin, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
        }).start();

        // 2. Outer gear spin (continuous)
        Animated.loop(
            Animated.timing(outerSpin, {
                toValue: 1,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. Inner gear spin reverse (continuous)
        Animated.loop(
            Animated.timing(innerSpin, {
                toValue: 1,
                duration: 4000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 4. Ripple rings — staggered repeat
        const makeRipple = (opacity: Animated.Value, scale: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                        Animated.timing(scale, {
                            toValue: 3.5,
                            duration: 2500,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: 2500,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 0.2, duration: 0, useNativeDriver: true }),
                        Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
                    ]),
                ])
            );
        };

        setTimeout(() => {
            makeRipple(ring1Opacity, ring1Scale, 0).start();
            makeRipple(ring2Opacity, ring2Scale, 600).start();
            makeRipple(ring3Opacity, ring3Scale, 1200).start();
        }, 800);

        // 5. IWS text drop-in
        Animated.parallel([
            Animated.spring(iwsY, {
                toValue: 0,
                delay: 1200,
                friction: 7,
                tension: 90,
                useNativeDriver: true,
            }),
            Animated.timing(iwsOpacity, {
                toValue: 1,
                duration: 500,
                delay: 1200,
                useNativeDriver: true,
            }),
        ]).start();

        // 6. Tagline + lines
        Animated.parallel([
            Animated.timing(tagOpacity, {
                toValue: 1,
                duration: 600,
                delay: 1800,
                useNativeDriver: true,
            }),
            Animated.timing(lineScale, {
                toValue: 1,
                duration: 500,
                delay: 2000,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();

        // 7. Loader bar
        Animated.sequence([
            Animated.timing(loaderOpacity, {
                toValue: 1,
                duration: 400,
                delay: 2200,
                useNativeDriver: true,
            }),
            Animated.timing(loaderWidth, {
                toValue: 110,
                duration: 2200,
                delay: 200,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: false,
            }),
        ]).start();

        const timer = setTimeout(() => {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Onboarding' }],
                })
            );
        }, 6000);

        return () => clearTimeout(timer);

        // 8. Dot sequence animation
        const dotAnim = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.2, duration: 600, useNativeDriver: true }),
                ])
            );

        setTimeout(() => {
            dotAnim(dot1Opacity, 0).start();
            dotAnim(dot2Opacity, 200).start();
            dotAnim(dot3Opacity, 400).start();
        }, 2500);

        // 9. Glow pulse on logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, {
                    toValue: 1.06,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(glowPulse, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const outerRotate = outerSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const innerRotate = innerSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg'],
    });
    const logoScale = zoomLogo.interpolate({
        inputRange: [0, 0.6, 0.8, 1],
        outputRange: [0, 1.1, 0.95, 1],
    });
    const logoRotation = logoSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ['-180deg', '0deg'],
    });

    // 8 dot positions around the ring
    const dotPositions = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 360) / 8;
        const rad = (angle * Math.PI) / 180;
        const r = 71;
        return {
            x: 75 + r * Math.cos(rad),
            y: 75 + r * Math.sin(rad),
        };
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* Ripple rings */}
            {[
                { op: ring1Opacity, sc: ring1Scale },
                { op: ring2Opacity, sc: ring2Scale },
                { op: ring3Opacity, sc: ring3Scale },
            ].map((r, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.rippleRing,
                        { opacity: r.op, transform: [{ scale: r.sc }] },
                    ]}
                />
            ))}

            {/* Logo */}
            <Animated.View
                style={[
                    styles.logoWrap,
                    {
                        transform: [
                            { scale: logoScale },
                            { scale: glowPulse },
                            { rotate: logoRotation }
                        ]
                    },
                ]}
            >
                <View style={styles.logoCircle}>
                    <Image source={LOGO_IMG} style={styles.logoImage} resizeMode="contain" />
                </View>
            </Animated.View>

            {/* IWS Text */}
            <Animated.Text
                style={[
                    styles.iwsText,
                    { opacity: iwsOpacity, transform: [{ translateY: iwsY }] },
                ]}
            >
                IWS
            </Animated.Text>

            {/* Tagline with lines */}
            <Animated.View style={[styles.tagRow, { opacity: tagOpacity }]}>
                <Animated.View
                    style={[styles.lineSide, { transform: [{ scaleX: lineScale }] }]}
                />
                <Text style={styles.tagline}>
                    ANYTIME ANYWHERE
                </Text>
                <Animated.View
                    style={[styles.lineSide, { transform: [{ scaleX: lineScale }] }]}
                />
            </Animated.View>

            {/* Loader */}
            <Animated.View style={[styles.loaderWrap, { opacity: loaderOpacity }]}>
                <View style={styles.loaderTrack}>
                    <Animated.View style={[styles.loaderFill, { width: loaderWidth }]} />
                </View>
                <View style={styles.dotsRow}>
                    {[dot1Opacity, dot2Opacity, dot3Opacity].map((op, i) => (
                        <Animated.View key={i} style={[styles.dot, { opacity: op }]} />
                    ))}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rippleRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 1.5,
        borderColor: ORANGE,
    },
    logoWrap: {
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: '90%',
        height: '90%',
    },
    iwsText: {
        fontFamily: 'System',
        fontSize: 58,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 10,
        marginTop: 0,
        textShadowColor: '#E8640066',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    lineSide: {
        width: 40,
        height: 1,
        backgroundColor: ORANGE,
    },
    tagline: {
        fontFamily: 'System',
        fontSize: 10,
        color: '#FFF',
        letterSpacing: 4,
    },
    loaderWrap: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
        gap: 10,
    },
    loaderTrack: {
        width: 110,
        height: 2,
        backgroundColor: '#1c1c1c',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loaderFill: {
        height: '100%',
        backgroundColor: ORANGE,
        borderRadius: 2,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: ORANGE,
    },
});