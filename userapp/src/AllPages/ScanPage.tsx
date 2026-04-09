import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Pressable,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
} from 'react-native-svg';

// --- Types ---
interface Category {
  id: string;
  title: string;
  color: string;
  image: any;
  textColor?: string;
}

const CATEGORIES: Category[] = [
  {
    id: '1',
    title: 'Black & White\nPrinting',
    color: '#8E8FFA', // Purple
    image: require('../assets/printer.png'),
  },
  {
    id: '2',
    title: 'Color\nPrinting',
    color: '#FF7E67', // Orange/Red
    image: require('../assets/colorprinter.png'),
  },
  {
    id: '3',
    title: 'Single Side\nPrinting',
    color: '#FFD384', // Yellow/Peach
    image: require('../assets/singlesideprinter.png'),
    textColor: '#845F13',
  },
  {
    id: '4',
    title: 'Double Side\nPrinting',
    color: '#2D3250', // Dark Navy
    image: require('../assets/doublesideprinter.png'),
  },
  {
    id: '5',
    title: 'Xerox\nNomination',
    color: '#41B06E', // Dark Green
    image: require('../assets/xeroxnomination.png'),
  },
  {
    id: '6',
    title: 'Xerox\nSpiral',
    color: '#393E46', // Dark Charcoal
    image: require('../assets/xeroxspiral.png'),
  },
];

const CategoryCard = ({
  category,
  isSelected,
  onPress,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.cardContainer}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: category.color, transform: [{ scale }] },
          ]}
        >
          {/* Main Illustration Image */}
          <View style={styles.imageOverlayContainer}>
            <Image
              source={category.image}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Left Label */}
          <View style={styles.labelContainer}>
            <Text
              style={[
                styles.cardLabel,
                { color: category.textColor || '#FFFFFF' },
              ]}
            >
              {category.title}
            </Text>
          </View>

          {/* Selection Badge - Top Right */}
          {isSelected && (
            <View style={styles.badge}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ScanPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedId, setSelectedId] = useState<string | null>('1');

  const handleSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
    navigation.navigate('Nearby');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Background Gradient using SVG */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Mock Status Bar Content */}
        <View style={styles.statusBarMock}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusTime}>9:41</Text>
          </View>
          <View style={styles.statusRight}>
            {/* Cell signal */}
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="black" style={{ marginRight: 4 }}>
                <Path d="M2,22 L22,22 L22,2 L2,22 Z" />
            </Svg>
            {/* Wi-Fi Icon */}
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="black" style={{ marginRight: 4 }}>
              <Path d="M12,21 C12,21 3,11 3,11 C3,11 12,1 12,1 C12,1 21,11 21,11 C21,11 12,21 12,21 Z" />
            </Svg>
            {/* Battery Icon */}
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="black">
              <Path d="M17,5 L17,19 L7,19 L7,5 L17,5 Z M18,7 L18,17 C19.1,17 20,16.1 20,15 L20,9 C20,7.9 19.1,7 18,7 Z" />
            </Svg>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Service Categories</Text>
            <Text style={styles.subtitle}>choose a topic to focus on:</Text>
          </View>

          <View style={styles.grid}>
            {CATEGORIES.map((item) => (
              <CategoryCard
                key={item.id}
                category={item}
                isSelected={selectedId === item.id}
                onPress={() => handleSelect(item.id)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  statusBarMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingTop: 10,
    height: 48,
    alignItems: 'center',
  },
  statusLeft: {
    flex: 1,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 15,
    marginBottom: 25,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2C3333',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A0A0',
    marginTop: 6,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    height: 210, // Taller cards to accommodate "full size" images
    borderRadius: 24,
    padding: 16,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  imageOverlayContainer: {
    position: 'absolute',
    top: 10,
    right: -10,
    bottom: 40,
    left: 10,
    zIndex: 0,
  },
  cardImage: {
    width: '90%',
    height: '80%',
    opacity: 0.95,
    marginTop: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#34C759',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default ScanPage;
