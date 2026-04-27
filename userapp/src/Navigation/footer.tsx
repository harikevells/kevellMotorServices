import React from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import FooterIcon from './FooterIcon';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

const Footer: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

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
              />
            );
          })}
        </View>
      </View>
      <SafeAreaView style={{ backgroundColor: '#0A0A0A' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    height: 90,
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    justifyContent: 'center',
    // paddingTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  }
});

export default Footer;


