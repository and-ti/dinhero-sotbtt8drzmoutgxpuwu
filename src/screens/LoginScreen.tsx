import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme } = useTheme();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    const ok = await login(email, senha);
    setIsLoading(false);
    if (!ok) setError('Email ou senha inválidos');
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.centered}>
          <GlassCard style={styles.card}>
            <Title style={[styles.title, { color: theme.colors.text }]}>DinHero</Title>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Acesse sua conta</Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              theme={{
                colors: {
                  text: theme.colors.text,
                  placeholder: theme.colors.placeholder,
                  background: theme.colors.surface,
                  primary: theme.colors.primary,
                },
              }}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              mode="outlined"
              secureTextEntry
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              theme={{
                colors: {
                  text: theme.colors.text,
                  placeholder: theme.colors.placeholder,
                  background: theme.colors.surface,
                  primary: theme.colors.primary,
                },
              }}
              placeholderTextColor={theme.colors.placeholder}
            />
            {!!error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading || loading}
              style={[styles.button, styles.buttonBase, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
              labelStyle={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
              contentStyle={styles.buttonContent}
            >
              Entrar
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Cadastro')}
              style={[styles.button, styles.buttonBase, { backgroundColor: 'transparent', borderColor: 'transparent' }]}
              labelStyle={[styles.buttonLabel, { color: theme.colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              Não tem uma conta? Cadastre-se
            </Button>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: 400, alignItems: 'stretch', paddingVertical: 32 },
  title: { textAlign: 'center', fontSize: 28, marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, marginBottom: 16 },
  buttonBase: {
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
  },
  buttonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonContent: {
    height: 48,
    paddingHorizontal: 8,
  },
  error: { textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
}); 