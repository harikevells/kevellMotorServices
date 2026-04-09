import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import FooterIcon from './FooterIcon';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

// Calculate SVG path for the cutout based on active index
// 5 tabs total: index 0 (Home), 1 (Stats), 2 (Scan/Center), 3 (Bell), 4 (Profile)
const Footer: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  
  const getPath = () => {
    const tabWidth = width / 5;
    const activeIndex = state.index;
    
    // X center of the active tab
    const centerX = (activeIndex * tabWidth) + (tabWidth / 2);
    
    // Fixed curve constants
    const curveWidth = 70;
    const curveDepth = 35;
    
    const startX = centerX - (curveWidth / 2);
    const endX = centerX + (curveWidth / 2);
    
    // Draw rounded background with dynamic cutout
    return `
      M 0 0 
      L ${startX - 20} 0
      C ${startX} 0, ${startX} ${curveDepth}, ${centerX} ${curveDepth}
      C ${endX} ${curveDepth}, ${endX} 0, ${endX + 20} 0
      L ${width} 0 
      L ${width} 100 
      L 0 100 
      Z
    `;
  };

  return (
    <View style={styles.container}>
      <View style={styles.svgBackground}>
        <Svg width={width} height={100} viewBox={`0 0 ${width} 100`}>
          <Path d={getPath()} fill="#FFFFFF" />
        </Svg>
      </View>
      
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isCenter = index === 2;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <FooterIcon 
              key={route.key}
              name={route.name}
              isActive={isFocused}
              onPress={onPress}
              isCenter={isCenter}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 80, // visible height
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  svgBackground: {
    position: 'absolute',
    bottom: -10, // Push down slightly to hide bottom edge
    left: 0,
    right: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  }
});

export default Footer;
