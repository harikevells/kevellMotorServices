import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface FooterIconProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

const FooterIcon: React.FC<FooterIconProps> = ({ name, isActive, onPress }) => {
  const activeColor = '#f28b2c';
  const inactiveColor = '#FFFFFF';
  const color = isActive ? activeColor : inactiveColor;

  const getLabel = () => {
    switch (name) {
      case 'Home': return 'Home';
      case 'Bookings': return 'Your Booking';
      case 'Tracking': return 'Services';
      case 'Spares': return 'Spares';
      case 'Bell': return 'Notification';
      case 'Profile': return 'Profile';
      default: return name;
    }
  };

  const renderIcon = () => {
    switch (name) {
      case 'Home':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Path d="M9 22V12h6v10" />
            {isActive && <Circle cx="12" cy="14" r="3" fill={activeColor} stroke="none" />}
          </Svg>
        );
      case 'Bookings':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <Path d="M9 2h6" />
            <Path d="M12 11h4" />
            <Path d="M12 16h4" />
            <Circle cx="8" cy="11" r="1" fill={color} />
            <Circle cx="8" cy="16" r="1" fill={color} />
          </Svg>
        );
      case 'Tracking':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
          </Svg>
        );
      case 'Spares':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
            <Path d="M12 22.08V12" />
          </Svg>
        );
      case 'Bell':
        return (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
    fontSize: 10, // Slightly smaller for longer text
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

export default FooterIcon;

export default FooterIcon;

