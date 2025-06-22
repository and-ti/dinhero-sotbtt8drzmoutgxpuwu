import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  backgroundColor?: string;
  borderColor?: string;
  blurIntensity?: number;
  blurTint?: 'light' | 'dark';
}

export default function GlassCard({ children, style, backgroundColor, borderColor, blurIntensity, blurTint }: GlassCardProps) {
  const { theme, themeMode } = useTheme();
  const bg = backgroundColor || (themeMode === 'dark' ? theme.colors.surface + 'CC' : theme.colors.surface + 'B3');
  const border = borderColor || theme.colors.border + '40';
  const blur = blurIntensity || theme.blur.intensity;
  const tint: 'light' | 'dark' = blurTint || (theme.blur.tint === 'dark' ? 'dark' : 'light');

  return (
    <View style={[styles.glassCard, { backgroundColor: bg, borderColor: border }, style]}>
      {Platform.OS !== 'web' && (
        <BlurView
          style={StyleSheet.absoluteFill}
          tint={tint}
          intensity={blur}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 20,
    overflow: 'hidden',
    margin: 16,
    borderWidth: 1,
  },
  content: {
    padding: 24,
  },
}); 