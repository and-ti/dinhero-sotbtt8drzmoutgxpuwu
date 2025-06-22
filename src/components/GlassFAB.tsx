import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface GlassFABProps {
  icon: string;
  onPress: () => void;
  style?: any;
  iconColor?: string;
  size?: number;
}

export default function GlassFAB({ 
  icon, 
  onPress, 
  style, 
  iconColor,
  size = 56 
}: GlassFABProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <BlurView intensity={60} style={styles.blur} tint={theme.blur.tint as 'light' | 'dark'} />
      <TouchableOpacity
        style={[styles.button, { width: size, height: size }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={size * 0.4}
          color={iconColor || theme.colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
}); 