import React from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import VendorFooterIcon from './VendorFooterIcon';
import { useVendorNav } from './VendorSidebarNavigator';

const { width } = Dimensions.get('window');

const VendorFooter: React.FC = () => {
  const { activeTab, setActiveTab } = useVendorNav();

  const tabs = [
    { id: 'Dashboard', name: 'Dashboard' },
    { id: 'Orders', name: 'Orders' },
    { id: 'DeliveryList', name: 'Delivery' },
    { id: 'Notifications', name: 'Notifications' },
    { id: 'Profile', name: 'Profile' },
  ];

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isFocused = activeTab === tab.id;

            const onPress = () => {
              setActiveTab(tab.id);
            };

            return (
              <VendorFooterIcon 
                key={tab.id}
                name={tab.id}
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
    zIndex: 15,
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
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  }
});

export default VendorFooter;
