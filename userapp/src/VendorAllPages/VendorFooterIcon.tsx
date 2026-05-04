import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface VendorFooterIconProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

const VendorFooterIcon: React.FC<VendorFooterIconProps> = ({ name, isActive, onPress }) => {
  const activeColor = '#f28b2c';
  const inactiveColor = '#FFFFFF';
  const color = isActive ? activeColor : inactiveColor;

  const getLabel = () => {
    switch (name) {
      case 'Dashboard': return 'Dashboard';
      case 'Orders': return 'Orders';
      case 'Notifications': return 'Notification';
      case 'ChallenBooking': return 'Challen';
      case 'Profile': return 'Profile';
      default: return name;
    }
  };

  const renderIcon = () => {
    switch (name) {
      case 'Dashboard':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="3" width="7" height="9" />
            <Rect x="14" y="3" width="7" height="5" />
            <Rect x="14" y="12" width="7" height="9" />
            <Rect x="3" y="16" width="7" height="5" />
          </Svg>
        );
      case 'Orders':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <Path d="m3.3 7 8.7 5 8.7-5" />
            <Path d="M12 22V12" />
          </Svg>
        );
      case 'Notifications':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </Svg>
        );
      case 'ChallenBooking':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <Path d="M14 2v6h6" />
            <Path d="M16 13H8" />
            <Path d="M16 17H8" />
            <Path d="M10 9H8" />
          </Svg>
        );
      case 'Profile':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
          </Svg>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <View style={styles.iconBox}>
        {renderIcon()}
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {getLabel()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  labelActive: {
    color: '#f28b2c',
    fontWeight: '700',
  },
});

export default VendorFooterIcon;
