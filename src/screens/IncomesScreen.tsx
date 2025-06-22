import React from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';

export default function IncomesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Card style={{ padding: 16, width: '90%' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Receitas</Text>
        <Text>Cadastro de receitas.</Text>
      </Card>
    </View>
  );
} 