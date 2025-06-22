import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { usuario } = useAuth();
  return (
    <Stack.Navigator>
      {usuario ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
} 