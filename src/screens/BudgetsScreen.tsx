import React from 'react';
import { View, Text } from 'react-native';
import GlassCard from '../components/GlassCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BudgetsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
      <GlassCard style={{ width: '90%', alignItems: 'center', paddingVertical: 32 }}>
        <MaterialCommunityIcons name="wallet" size={40} color="#FFD166" style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>Orçamentos</Text>
        <Text style={{ color: '#b0b0b0', textAlign: 'center' }}>Gerenciamento de orçamentos por categoria ou período.</Text>
      </GlassCard>
    </View>
  );
} 