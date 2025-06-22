import React from 'react';
import { View, Text } from 'react-native';
import GlassCard from '../components/GlassCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DebtsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
      <GlassCard style={{ width: '90%', alignItems: 'center', paddingVertical: 32 }}>
        <MaterialCommunityIcons name="credit-card" size={40} color="#EF476F" style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>Dívidas</Text>
        <Text style={{ color: '#b0b0b0', textAlign: 'center' }}>Controle de dívidas e histórico de pagamentos.</Text>
      </GlassCard>
    </View>
  );
} 