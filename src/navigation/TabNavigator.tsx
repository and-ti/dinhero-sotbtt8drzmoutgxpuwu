import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Image } from 'react-native';
import { useTheme } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useFAB } from '../contexts/FABContext';
import GlassFAB from '../components/GlassFAB';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import DebtsScreen from '../screens/DebtsScreen';

const { width: screenWidth } = Dimensions.get('window');

interface TabItem {
  name: string;
  title: string;
  component: React.ComponentType<any>;
  icon: {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  };
}

const tabs: TabItem[] = [
  {
    name: 'Dashboard',
    title: 'Início',
    component: DashboardScreen,
    icon: { active: 'home', inactive: 'home-outline' },
  },
  {
    name: 'Transactions',
    title: 'Transações',
    component: TransactionsScreen,
    icon: { active: 'card', inactive: 'card-outline' },
  },
  {
    name: 'Budgets',
    title: 'Orçamentos',
    component: BudgetsScreen,
    icon: { active: 'pie-chart', inactive: 'pie-chart-outline' },
  },
  {
    name: 'Goals',
    title: 'Metas',
    component: GoalsScreen,
    icon: { active: 'flag', inactive: 'flag-outline' },
  },
  {
    name: 'Debts',
    title: 'Dívidas',
    component: DebtsScreen,
    icon: { active: 'wallet', inactive: 'wallet-outline' },
  },
];

const TabNavigator = () => {
  const theme = useTheme();
  const { theme: appTheme } = useAppTheme();
  const { usuario } = useAuth();
  const navigation = useNavigation();
  const { onFABPress } = useFAB();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
  };

  const handleConfigPress = () => {
    navigation.navigate('Configuracoes' as never);
  };

  const handleFABPress = () => {
    onFABPress();
  };

  const renderTabBarIcon = (tab: TabItem, index: number) => {
    const isActive = index === activeIndex;
    const iconName = isActive ? tab.icon.active : tab.icon.inactive;

    return (
      <View style={styles.iconContainer}>
        <Ionicons 
          name={iconName as any} 
          size={28} 
          color={isActive ? appTheme.colors.primary : appTheme.colors.textSecondary} 
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={[styles.header, { backgroundColor: 'transparent' }]}>
        <Appbar.Content 
          title={tabs[activeIndex].title} 
          titleStyle={[styles.headerTitle, { color: appTheme.colors.text }]}
        />
        <TouchableOpacity onPress={handleConfigPress} style={styles.profileButton}>
          {usuario?.foto_perfil ? (
            <Image 
              source={{ uri: usuario.foto_perfil }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profilePlaceholder, { backgroundColor: appTheme.colors.surface + '40' }]}>
              <Ionicons 
                name="person" 
                size={24} 
                color={appTheme.colors.text} 
              />
            </View>
          )}
        </TouchableOpacity>
      </Appbar.Header>

      {/* Conteúdo das Screens */}
      <View style={styles.screenContainer}>
        {tabs.map((tab, index) => (
          <View 
            key={index} 
            style={[
              styles.screen, 
              { 
                position: 'absolute',
                left: index * screenWidth,
                opacity: index === activeIndex ? 1 : 0,
                zIndex: index === activeIndex ? 1 : 0
              }
            ]}
          >
            <tab.component />
          </View>
        ))}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <View style={[styles.tabBarContainer, { 
          borderColor: appTheme.colors.border + '40',
          backgroundColor: appTheme.colors.surface + '20'
        }]}>
          <BlurView intensity={20} style={styles.tabBarBlur} tint={appTheme.blur.tint as 'light' | 'dark'} />
          <View style={styles.tabBarContent}>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tabBarItem,
                  { opacity: index === activeIndex ? 1 : 0.7 }
                ]}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.8}
              >
                <View style={styles.tabButton}>
                  {renderTabBarIcon(tab, index)}
                  <View style={styles.tabBarLabel}>
                    <Text style={[
                      styles.tabText,
                      {
                        color: index === activeIndex 
                          ? appTheme.colors.primary 
                          : appTheme.colors.textSecondary,
                      },
                    ]}>
                      {tab.title}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <GlassFAB 
        icon="plus" 
        onPress={handleFABPress}
        iconColor={appTheme.colors.surface}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  screen: {
    width: screenWidth,
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 80,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabBarContainer: {
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    height: 64,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBarBlur: {
    borderRadius: 40,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
    paddingHorizontal: 20,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    height: '100%',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 48,
  },
  tabBarLabel: {
    alignItems: 'center',
    marginTop: 6,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabNavigator; 