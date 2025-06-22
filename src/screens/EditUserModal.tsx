import React, { useState } from 'react';
import { Modal, View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Card, Title, HelperText, Portal } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

interface EditUserModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditUserModal({ visible, onClose }: EditUserModalProps) {
  const { usuario, atualizarUsuario } = useAuth() as any;
  const [nomeCompleto, setNomeCompleto] = useState(usuario?.nome_completo || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const validarEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length >= 10 && numeros.length <= 11;
  };

  const formatarTelefone = (texto: string) => {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
  };

  const handleTelefoneChange = (texto: string) => {
    setTelefone(formatarTelefone(texto));
  };

  const handleSalvar = async () => {
    if (!nomeCompleto.trim() || !email.trim() || !telefone.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }
    if (!validarEmail(email.trim())) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }
    if (!validarTelefone(telefone)) {
      Alert.alert('Erro', 'Por favor, insira um telefone válido');
      return;
    }
    if (senha && senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (senha && senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      const success = await atualizarUsuario({ nome_completo: nomeCompleto.trim(), email: email.trim(), telefone: telefone.trim(), senha: senha || undefined });
      if (success) {
        Alert.alert('Sucesso', 'Informações atualizadas com sucesso!');
        onClose();
      } else {
        Alert.alert('Erro', 'Erro ao atualizar informações. Tente outro email.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar informações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>Editar Informações</Title>
              <TextInput
                label="Nome Completo"
                value={nomeCompleto}
                onChangeText={setNomeCompleto}
                mode="outlined"
                style={styles.input}
                autoCapitalize="words"
              />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                label="Telefone"
                value={telefone}
                onChangeText={handleTelefoneChange}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                placeholder="(11) 99999-9999"
              />
              <TextInput
                label="Nova senha (opcional)"
                value={senha}
                onChangeText={setSenha}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label="Confirmar nova senha"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <View style={styles.buttonRow}>
                <Button mode="text" onPress={onClose} disabled={loading} style={styles.button}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleSalvar} loading={loading} disabled={loading} style={styles.button}>
                  Salvar
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    padding: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 