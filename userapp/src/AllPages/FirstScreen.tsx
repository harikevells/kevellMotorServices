import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Svg, {
    Polygon,
    Circle,
    Rect,
    Line,
    G,
    Defs,
    LinearGradient,
    Stop,
    ClipPath,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_SIZE = Math.min(SCREEN_WIDTH * 0.55, 220);

const MotorServicesLogo: React.FC = () => {
    // Animation values
    const fadeIn = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const rotateGear = useRef(new Animated.Value(0)).current;
    const textSlide = useRef(new Animated.Value(40)).current;
    const textFade = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const speedLine1 = useRef(new Animated.Value(0)).current;
    const speedLine2 = useRef(new Animated.Value(0)).current;
    const speedLine3 = useRef(new Animated.Value(0)).current;
    const taglineSlide = useRef(new Animated.Value(20)).current;
    const taglineFade = useRef(new Animated.Value(0)).current;

    const navigation = useNavigation<any>();

    useEffect(() => {
        // Step 1: Icon fade + scale in
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Step 2: Gear slow rotation
        Animated.loop(
            Animated.timing(rotateGear, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Step 3: Text slide in after 400ms
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(textFade, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(textSlide, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 400);

        // Step 4: Speed lines staggered
        const lineDelay = (index: number) => {
            setTimeout(() => {
                const line = [speedLine1, speedLine2, speedLine3][index];
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(line, {
                            toValue: 1,
                            duration: 700,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                        Animated.timing(line, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.delay(800),
                    ])
                ).start();
            }, 600 + index * 150);
        };
        lineDelay(0);
        lineDelay(1);
        lineDelay(2);

        // Step 5: Pulse on gear icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.06,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Step 6: Tagline fade in last
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(taglineFade, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(taglineSlide, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 900);

        // Step 7: Transition to Onboarding after 3 seconds
        const timer = setTimeout(() => {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Onboarding' }],
                })
            );
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigation]);

    const gearRotation = rotateGear.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const HALF = ICON_SIZE / 2;
    const HEX_R = HALF * 0.78;
    const HEX_INNER = HALF * 0.62;

    // Hexagon points
    const hexPoints = (r: number) => {
        return Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            return `${HALF + r * Math.cos(angle)},${HALF + r * Math.sin(angle)}`;
        }).join(' ');
    };

    // Gear teeth positions
    const gearTeeth = Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI / 4) * i;
        const r1 = HEX_R;
        const r2 = HALF * 0.94;
        const hw = HALF * 0.065;
        const cx = HALF + Math.cos(angle);
        const cy = HALF + Math.sin(angle);
        const px = Math.cos(angle);
        const py = Math.sin(angle);
        const ox = -py * hw;
        const oy = px * hw;
        return [
            `${HALF + px * r1 + ox},${HALF + py * r1 + oy}`,
            `${HALF + px * r2 + ox},${HALF + py * r2 + oy}`,
            `${HALF + px * r2 - ox},${HALF + py * r2 - oy}`,
            `${HALF + px * r1 - ox},${HALF + py * r1 - oy}`,
        ].join(' ');
    });

    // Lightning bolt path (centered)
    const boltSize = HALF * 0.32;
    const boltX = HALF;
    const boltY = HALF;
    const boltPoints = [
        `${boltX - boltSize * 0.32},${boltY - boltSize}`,
        `${boltX + boltSize * 0.45},${boltY - boltSize * 0.08}`,
        `${boltX + boltSize * 0.05},${boltY - boltSize * 0.08}`,
        `${boltX + boltSize * 0.32},${boltY + boltSize}`,
        `${boltX - boltSize * 0.45},${boltY + boltSize * 0.08}`,
        `${boltX - boltSize * 0.05},${boltY + boltSize * 0.08}`,
    ].join(' ');

    return (
        <View style={styles.container}>
            {/* Icon */}
            <Animated.View
                style={[
                    styles.iconWrapper,
                    {
                        opacity: fadeIn,
                        transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
                    },
                ]}
            >
                <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}>
                    <Defs>
                        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#4DBAEE" />
                            <Stop offset="100%" stopColor="#1A8FD1" />
                        </LinearGradient>
                    </Defs>

                    {/* Rounded square background */}
                    <Rect
                        x={2}
                        y={2}
                        width={ICON_SIZE - 4}
                        height={ICON_SIZE - 4}
                        rx={ICON_SIZE * 0.22}
                        fill="url(#bgGrad)"
                    />

                    {/* Inner border ring */}
                    <Rect
                        x={ICON_SIZE * 0.07}
                        y={ICON_SIZE * 0.07}
                        width={ICON_SIZE * 0.86}
                        height={ICON_SIZE * 0.86}
                        rx={ICON_SIZE * 0.18}
                        fill="none"
                        stroke="white"
                        strokeWidth={1}
                        strokeOpacity={0.25}
                    />
                </Svg>

                {/* Rotating gear layer */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFillObject,
                        { transform: [{ rotate: gearRotation }] },
                    ]}
                >
                    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}>
                        {/* Gear teeth */}
                        {gearTeeth.map((pts, i) => (
                            <Polygon
                                key={`tooth-${i}`}
                                points={pts}
                                fill="white"
                                fillOpacity={0.18}
                            />
                        ))}
                        {/* Outer hex ring */}
                        <Polygon
                            points={hexPoints(HEX_R)}
                            fill="white"
                            fillOpacity={0.12}
                            stroke="white"
                            strokeOpacity={0.2}
                            strokeWidth={1}
                        />
                    </Svg>
                </Animated.View>

                {/* Static inner content */}
                <View style={StyleSheet.absoluteFillObject}>
                    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}>
                        {/* Inner hex */}
                        <Polygon
                            points={hexPoints(HEX_INNER)}
                            fill="white"
                            fillOpacity={0.9}
                            stroke="#4DBAEE"
                            strokeWidth={2}
                        />
                        {/* Lightning bolt */}
                        <Polygon points={boltPoints} fill="#4DBAEE" />
                        {/* Center ring */}
                        <Circle
                            cx={HALF}
                            cy={HALF}
                            r={HALF * 0.13}
                            fill="none"
                            stroke="#4DBAEE"
                            strokeWidth={2.5}
                        />
                        <Circle cx={HALF} cy={HALF} r={HALF * 0.055} fill="#4DBAEE" />
                    </Svg>
                </View>
            </Animated.View>

            {/* Speed lines */}
            <View style={styles.speedLinesRow}>
                {[speedLine1, speedLine2, speedLine3].map((anim, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.speedLine,
                            i === 1 && styles.speedLineMid,
                            { opacity: anim, transform: [{ scaleX: anim }] },
                        ]}
                    />
                ))}
            </View>

            {/* Wordmark */}
            <Animated.View
                style={[
                    styles.textBlock,
                    {
                        opacity: textFade,
                        transform: [{ translateY: textSlide }],
                    },
                ]}
            >
                <Text style={styles.motorText}>KEVELL</Text>
                <View style={styles.redLine} />
                <Text style={styles.servicesText}>SERVICES</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View
                style={{
                    opacity: taglineFade,
                    transform: [{ translateY: taglineSlide }],
                }}
            >
                <Text style={styles.tagline}>PRECISION · PERFORMANCE · TRUST</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    iconWrapper: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        marginBottom: 24,
        shadowColor: '#4DBAEE',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
    },
    speedLinesRow: {
        alignItems: 'flex-start',
        marginBottom: 20,
        gap: 6,
    },
    speedLine: {
        height: 3,
        width: 60,
        backgroundColor: '#4DBAEE',
        borderRadius: 2,
        opacity: 0.7,
    },
    speedLineMid: {
        width: 80,
        height: 2,
        opacity: 0.4,
    },
    textBlock: {
        alignItems: 'center',
        marginBottom: 12,
    },
    motorText: {
        fontSize: 35,
        fontWeight: '600',
        color: '#1A8FD1',
        letterSpacing: 8,
        includeFontPadding: false,
    },
    redLine: {
        width: '100%',
        height: 3,
        backgroundColor: '#4DBAEE',
        borderRadius: 2,
        marginTop: 4,
        marginBottom: 8,
        opacity: 0.5,
    },
    servicesText: {
        fontSize: 18,
        fontWeight: '400',
        color: '#4DBAEE',
        letterSpacing: 10,
        includeFontPadding: false,
    },
    tagline: {
        fontSize: 11,
        fontWeight: '400',
        color: '#90CAE8',
        letterSpacing: 2,
        textAlign: 'center',
    },
});

export default MotorServicesLogo;