import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { 
  Title, 
  Text, 
  Button, 
  List,
  Switch,
  Divider,
  Avatar
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import EditUserModal from './EditUserModal';
import GlassCard from '../components/GlassCard';

export default function ConfiguracoesScreen() {
  const { theme, themeMode, toggleTheme } = useTheme();
  const { usuario, familia, logout, atualizarFotoPerfil } = useAuth();
  const styles = useStyles(theme);
  
  const [editModalVisible, setEditModalVisible] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const handleEditUser = () => {
    setEditModalVisible(true);
  };

  const handleSelectPhoto = async () => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria.');
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const success = await atualizarFotoPerfil(result.assets[0].uri);
        if (success) {
          Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        } else {
          Alert.alert('Erro', 'Erro ao atualizar foto de perfil.');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Erro ao selecionar foto.');
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Perfil do Usuário */}
        <GlassCard>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleSelectPhoto} style={styles.avatarContainer}>
              {usuario?.foto_perfil ? (
                <Image 
                  source={{ uri: usuario.foto_perfil }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Avatar.Text 
                  size={80} 
                  label={usuario?.nome_completo?.charAt(0) || 'U'} 
                  style={styles.avatar}
                  color={theme.colors.surface}
                />
              )}
              <View style={styles.avatarOverlay}>
                <MaterialCommunityIcons
                  name="camera"
                  size={20}
                  color={theme.colors.surface}
                />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Title style={styles.profileName}>{usuario?.nome_completo}</Title>
              <Text style={styles.profileEmail}>{usuario?.email}</Text>
              <Text style={styles.profileDate}>
                Membro desde {formatarData(new Date().toISOString())}
              </Text>
            </View>
          </View>
          <Button
            mode="outlined"
            icon="account-edit"
            onPress={handleEditUser}
            style={styles.editButton}
            textColor={theme.colors.primary}
          >
            Editar Perfil
          </Button>
        </GlassCard>

        {/* Informações da Família */}
        {familia && (
          <GlassCard>
            <Title style={styles.title}>Família</Title>
            <View style={styles.familiaPreview}>
              <Text style={styles.familiaLabel}>Nome da Família</Text>
              <Text style={styles.familiaNome}>{familia.nome}</Text>
              <Text style={styles.familiaLabel}>Criada em</Text>
              <Text style={styles.familiaDate}>
                {formatarData(new Date().toISOString())}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Configurações do App */}
        <GlassCard>
          <Title style={styles.title}>Configurações</Title>
          
          <List.Item
            title="Tema Escuro"
            description="Ativar modo escuro"
            left={() => (
              <MaterialCommunityIcons
                name={themeMode === 'dark' ? 'weather-night' : 'weather-sunny'}
                size={24}
                color={theme.colors.primary}
                style={styles.listIcon}
              />
            )}
            right={() => (
              <Switch
                value={themeMode === 'dark'}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.textSecondary }}
          />
          
          <Divider />
          
          <List.Item
            title="Notificações"
            description="Configurar alertas"
            left={() => (
              <MaterialCommunityIcons
                name="bell"
                size={24}
                color={theme.colors.primary}
                style={styles.listIcon}
              />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.textSecondary}
              />
            )}
            onPress={() => {}}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.textSecondary }}
          />
          
          <Divider />
          
          <List.Item
            title="Backup"
            description="Exportar dados"
            left={() => (
              <MaterialCommunityIcons
                name="cloud-upload"
                size={24}
                color={theme.colors.primary}
                style={styles.listIcon}
              />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.textSecondary}
              />
            )}
            onPress={() => {}}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.textSecondary }}
          />
          
          <Divider />
          
          <List.Item
            title="Sobre"
            description="Informações do app"
            left={() => (
              <MaterialCommunityIcons
                name="information"
                size={24}
                color={theme.colors.primary}
                style={styles.listIcon}
              />
            )}
            right={() => (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.textSecondary}
              />
            )}
            onPress={() => {}}
            style={styles.listItem}
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.textSecondary }}
          />
        </GlassCard>

        {/* Membros da Família */}
        <GlassCard>
            <List.Item
              title="Membros da Família"
              description="Visualizar e gerenciar membros"
              left={() => (
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.listIcon}
                />
              )}
              right={() => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              )}
              onPress={() => { /* Navegar para tela de membros no futuro */ }}
              style={styles.listItem}
              titleStyle={{ color: theme.colors.text }}
              descriptionStyle={{ color: theme.colors.textSecondary }}
            />
        </GlassCard>

        {/* Ações */}
        <GlassCard>
          <Title style={styles.title}>Ações</Title>
          
          <Button
            mode="outlined"
            icon="help-circle"
            onPress={() => {}}
            style={styles.actionButton}
            textColor={theme.colors.primary}
          >
            Ajuda e Suporte
          </Button>
          
          <Button
            mode="outlined"
            icon="star"
            onPress={() => {}}
            style={styles.actionButton}
            textColor={theme.colors.primary}
          >
            Avaliar App
          </Button>
          
          <Button
            mode="outlined"
            icon="share"
            onPress={() => {}}
            style={styles.actionButton}
            textColor={theme.colors.primary}
          >
            Compartilhar
          </Button>
          
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            textColor={theme.colors.error}
          >
            Sair
          </Button>
        </GlassCard>

        {/* Versão */}
        <GlassCard>
          <Text style={styles.versionText}>
            DinHero v1.0.0
          </Text>
        </GlassCard>
      </ScrollView>

      <EditUserModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

const useStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  profileDate: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
  },
  editButton: {
    marginTop: theme.spacing.sm,
  },
  familiaPreview: {
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  familiaLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  familiaNome: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  familiaDate: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  listItem: {
    paddingVertical: theme.spacing.sm,
  },
  listIcon: {
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
  versionText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 