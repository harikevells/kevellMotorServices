import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface FooterIconProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
  isCenter?: boolean;
}

const FooterIcon: React.FC<FooterIconProps> = ({ name, isActive, onPress, isCenter }) => {
  if (isCenter) {
    const iconColor = isActive ? '#FFFFFF' : '#A0A0A0';
    return (
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity style={[styles.centerButton, isActive && styles.centerButtonActive]} onPress={onPress}>
          {/* Tracking Icon (Bolt/Route) */}
          <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  }

  const renderIcon = () => {
    const color = isActive ? '#FFFFFF' : '#A0A0A0';
    switch (name) {
      case 'Home':
        return <Svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Path d="M9 22V12h6v10" /></Svg>;
      case 'Bookings':
        return <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><Path d="M12 11h4" /><Path d="M12 16h4" /><Path d="M8 11h.01" /><Path d="M8 16h.01" /><Path d="M9 2h6" /></Svg>;
      case 'Bell':
        return <Svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>;
      case 'Profile':
        return <Svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.iconContainer}>
      <Animated.View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
        {renderIcon()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transform: [{ translateY: 0 }],
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ translateY: -25 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ translateY: -25 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  }
});

export default FooterIcon;

