import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Modal as PaperModal, // Consider for modals if applicable, though RN Modal is fine.
  ProgressBar,
  Text, // Use Paper's Text
  TextInput as PaperTextInput, // Use Paper's TextInput
  useTheme,
} from 'react-native-paper';
import type { SQLiteDatabase } from 'expo-sqlite';
// Assuming ThemeContext provides a theme compatible with react-native-paper
// For this refactoring, we'll assume `theme` object from `useTheme()` is compatible.
// import { useTheme } from '../../src/context/ThemeContext'; // Keep if this is the intended provider
import { PaperThemeType } from '../../src/styles/theme'; // Import theme type
import {
  addGoal,
  contributeToGoal,
  deleteGoal,
  getDBConnection,
  getGoalsByFamilyId,
  Goal,
  initDatabase,
  updateGoal,
  updateGoalStatus,
} from '../../src/database';
// import { commonStyles } from '../../src/styles/theme'; // To be removed

export default function MetasScreen() {
  const theme = useTheme<PaperThemeType>();
  const styles = getDynamicStyles(theme);

  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [contributionModalVisible, setContributionModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);

  // Form states for add/edit goal
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(''); // YYYY-MM-DD

  // Form state for contribution
  const [contributionAmount, setContributionAmount] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const connection = getDBConnection();
        setDb(connection);
        await initDatabase(connection);
        setIsDBInitialized(true);
        if (connection) {
          await loadGoals(connection);
        }
      } catch (error) {
        console.error('Goals Initialization error:', error);
        Alert.alert('Erro', 'Falha ao inicializar o banco de dados para metas.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const loadGoals = useCallback(async (currentDb: SQLiteDatabase) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const familyId = 1; // TODO: Replace with dynamic family ID
      const fetchedGoals = await getGoalsByFamilyId(currentDb, familyId);
      setGoals(fetchedGoals.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        if (a.target_date && b.target_date) return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
        if (a.target_date && !b.target_date) return -1; // active goals with target dates first
        if (!a.target_date && b.target_date) return 1;
        return 0;
      }));
    } catch (error) {
      console.error('Failed to load goals:', error);
      Alert.alert('Erro', 'Falha ao carregar metas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCloseGoalModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setCurrentGoal(null);
    setName('');
    setTargetAmount('');
    setTargetDate('');
  };

  const handleOpenGoalModal = (goalToEdit?: Goal) => {
    if (goalToEdit) {
      setIsEditing(true);
      setCurrentGoal(goalToEdit);
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.target_amount.toString());
      setTargetDate(goalToEdit.target_date || '');
    } else {
      setIsEditing(false);
      setCurrentGoal(null);
      setName('');
      setTargetAmount('');
      setTargetDate('');
    }
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!db) return Alert.alert('Erro', 'Banco de dados não conectado.');
    if (!name.trim() || !targetAmount.trim()) {
      return Alert.alert('Erro', 'Nome e Valor Alvo são obrigatórios.');
    }
    const numericTargetAmount = parseFloat(targetAmount);
    if (isNaN(numericTargetAmount) || numericTargetAmount <= 0) {
      return Alert.alert('Erro', 'Valor Alvo inválido.');
    }
    if (targetDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return Alert.alert("Erro", "Formato de Data Alvo inválido. Use YYYY-MM-DD ou deixe em branco.");
    }

    const family_id = 1; // TODO: Dynamic
    const user_id = 1;   // TODO: Dynamic

    const goalData = {
      name,
      target_amount: numericTargetAmount,
      target_date: targetDate.trim() || null,
    };

    try {
      if (isEditing && currentGoal) {
        await updateGoal(db, currentGoal.id, goalData);
        Alert.alert('Sucesso', 'Meta atualizada com sucesso!');
      } else {
        // For new goals, current_amount defaults to 0 and status to 'active' in DB
        await addGoal(db, { ...goalData, family_id, user_id });
        Alert.alert('Sucesso', 'Meta adicionada com sucesso!');
      }
      handleCloseGoalModal();
      if (db) loadGoals(db);
    } catch (error) {
      console.error('Failed to save goal:', error);
      Alert.alert('Erro', `Falha ao salvar meta: ${error}`);
    }
  };

  const handleOpenContributionModal = (goal: Goal) => {
    if (goal.status !== 'active') {
        Alert.alert("Atenção", "Só é possível contribuir para metas ativas.");
        return;
    }
    setCurrentGoal(goal);
    setContributionAmount('');
    setContributionModalVisible(true);
  };

  const handleCloseContributionModal = () => {
    setContributionModalVisible(false);
    setContributionAmount('');
    setCurrentGoal(null);
  };

  const handleContributeToGoal = async () => {
    if (!db || !currentGoal) return Alert.alert('Erro', 'Meta ou BD não selecionado.');
    const numericContribution = parseFloat(contributionAmount);
    if (isNaN(numericContribution) || numericContribution <= 0) {
      return Alert.alert('Erro', 'Valor da contribuição inválido.');
    }

    try {
      await contributeToGoal(db, currentGoal.id, numericContribution);
      Alert.alert('Sucesso', 'Contribuição registrada!');
      handleCloseContributionModal();
      if (db) loadGoals(db);
    } catch (error: any) {
      console.error('Failed to contribute to goal:', error);
      Alert.alert('Erro', `Falha ao contribuir: ${error.message || error}`);
    }
  };

  const handleDeleteConfirmation = (goalId: number) => {
    if (!db) return;
    Alert.alert("Confirmar Exclusão", "Tem certeza que deseja excluir esta meta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir", onPress: async () => {
            try {
              await deleteGoal(db, goalId);
              Alert.alert("Sucesso", "Meta excluída!");
              if (db) loadGoals(db);
            } catch (error) { Alert.alert("Erro", `Falha ao excluir meta: ${error}`); }
          }, style: "destructive"
        }
      ]
    );
  };

  const handleStatusChange = (goal: Goal, newStatus: 'active' | 'completed' | 'cancelled') => {
    if (!db) return;
    const confirmAndChange = async () => {
        try {
            await updateGoalStatus(db, goal.id, newStatus);
            Alert.alert('Sucesso', `Meta marcada como ${newStatus}.`);
            if (db) loadGoals(db);
        } catch (error) { Alert.alert('Erro', `Falha ao atualizar status: ${error}`); }
    };

    if (newStatus === 'cancelled' && goal.status === 'active') {
        Alert.alert("Confirmar Cancelamento", "Tem certeza que deseja cancelar esta meta?",
            [
                { text: "Não", style: "cancel" },
                { text: "Sim, Cancelar", onPress: confirmAndChange, style: "destructive" }
            ]
        );
    } else {
        confirmAndChange(); // Directly change for other statuses or re-activating
    }
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const progress = item.target_amount > 0 ? Math.min(item.current_amount / item.target_amount, 1) : 0;
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isActive = item.status === 'active';

    let statusText = 'Ativa';
    let statusColor = theme.colors.primary; // Default for active
    if (isCompleted) {
      statusText = 'Concluída';
      statusColor = theme.colors.success;
    }
    if (isCancelled) {
      statusText = 'Cancelada';
      statusColor = theme.colors.textMuted; // Or a specific grey
    }

    const cardStyle = [
      styles.goalItemCard,
      isCompleted && styles.completedGoalItemCard,
      isCancelled && styles.cancelledGoalItemCard,
    ].filter(Boolean);

    return (
      <Card style={cardStyle} elevation={theme.ELEVATION.small}>
        <Card.Title
          title={item.name}
          titleStyle={[styles.goalName, (isCompleted || isCancelled) && styles.strikethroughText]}
          subtitle={`Status: ${statusText}`}
          subtitleStyle={{ color: statusColor, textTransform: 'capitalize' }}
        />
        <Card.Content>
          <ProgressBar progress={progress} color={statusColor} style={styles.progressBar} />
          <Text variant="bodyMedium" style={styles.goalAmount}>
            R$ {item.current_amount.toFixed(2)} / R$ {item.target_amount.toFixed(2)} ({(progress * 100).toFixed(0)}%)
          </Text>
          {item.target_date && (
            <Text variant="bodySmall" style={styles.goalDate}>
              Data Alvo: {new Date(item.target_date + "T00:00:00").toLocaleDateString()}
            </Text>
          )}
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScrollView}>
              {isActive && (
                <Button mode="contained" onPress={() => handleOpenContributionModal(item)} style={styles.actionButton} buttonColor={theme.colors.success} compact>
                  Contribuir
                </Button>
              )}
              {!isCancelled && (
                <Button mode="outlined" onPress={() => handleOpenGoalModal(item)} style={styles.actionButton} compact>
                  Editar
                </Button>
              )}
              {isActive && (
                <Button mode="outlined" onPress={() => handleStatusChange(item, 'completed')} style={styles.actionButton} compact>
                  Concluir
                </Button>
              )}
              {isActive && (
                <Button mode="outlined" onPress={() => handleStatusChange(item, 'cancelled')} style={styles.actionButton} buttonColor={theme.colors.warning} compact>
                  Cancelar Meta
                </Button>
              )}
              {(isCompleted || isCancelled) && (
                <Button mode="outlined" onPress={() => handleStatusChange(item, 'active')} style={styles.actionButton} compact>
                  Reativar
                </Button>
              )}
               <IconButton icon="delete" onPress={() => handleDeleteConfirmation(item.id)} iconColor={theme.colors.error} style={styles.deleteIconButton} size={20}/>
            </ScrollView>
        </Card.Actions>
      </Card>
    );
  };

  if (!isDBInitialized) return <View style={styles.container}><Text variant="bodyLarge" style={styles.loadingText}>Inicializando...</Text></View>;
  if (isLoading) return <View style={styles.container}><Text variant="bodyLarge" style={styles.loadingText}>Carregando metas...</Text></View>;

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => handleOpenGoalModal()}
        style={styles.addGoalButton}
        icon="plus-circle-outline"
        buttonColor={theme.colors.secondary}
        textColor={theme.colors.white}
      >
        Adicionar Nova Meta
      </Button>

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={<Text variant="headlineSmall" style={styles.emptyListText}>Nenhuma meta encontrada.</Text>}
      />

      {/* Add/Edit Goal Modal - Using RN Modal, styled with Paper components */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleCloseGoalModal}>
        <View style={styles.centeredView}>
          <ScrollView contentContainerStyle={styles.modalScrollView}>
            <Card style={styles.modalCard}>
              <Card.Title title={isEditing ? 'Editar Meta' : 'Adicionar Nova Meta'} titleStyle={styles.modalTitle}/>
              <Card.Content>
                <PaperTextInput label="Nome da Meta" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
                <PaperTextInput label="Valor Alvo (ex: 1000.00)" value={targetAmount} onChangeText={setTargetAmount} style={styles.input} keyboardType="numeric" mode="outlined" />
                <PaperTextInput label="Data Alvo (YYYY-MM-DD)" value={targetDate} onChangeText={setTargetDate} style={styles.input} mode="outlined" placeholder="Opcional" />
              </Card.Content>
              <Card.Actions style={styles.modalActions}>
                <Button mode="contained" onPress={handleSaveGoal} style={styles.modalButton}>
                  {isEditing ? 'Salvar Alterações' : 'Adicionar Meta'}
                </Button>
                <Button mode="outlined" onPress={handleCloseGoalModal} style={styles.modalButton}>
                  Cancelar
                </Button>
              </Card.Actions>
            </Card>
          </ScrollView>
        </View>
      </Modal>

      {/* Contribution Modal - Using RN Modal, styled with Paper components */}
      {currentGoal && (
        <Modal animationType="slide" transparent={true} visible={contributionModalVisible} onRequestClose={handleCloseContributionModal}>
          <View style={styles.centeredView}>
           <ScrollView contentContainerStyle={styles.modalScrollView}>
            <Card style={styles.modalCard}>
              <Card.Title title={`Contribuir para "${currentGoal.name}"`} titleStyle={styles.modalTitle} />
              <Card.Content>
                <Text variant="bodyLarge" style={styles.modalText}>Progresso: R$ {currentGoal.current_amount.toFixed(2)} / R$ {currentGoal.target_amount.toFixed(2)}</Text>
                <Text variant="bodyMedium" style={styles.modalText}>Restante: R$ {(currentGoal.target_amount - currentGoal.current_amount).toFixed(2)}</Text>
                <PaperTextInput label="Valor da Contribuição" value={contributionAmount} onChangeText={setContributionAmount} style={styles.input} keyboardType="numeric" mode="outlined" />
              </Card.Content>
              <Card.Actions style={styles.modalActions}>
                <Button mode="contained" onPress={handleContributeToGoal} style={styles.modalButton}>
                  Confirmar Contribuição
                </Button>
                <Button mode="outlined" onPress={handleCloseContributionModal} style={styles.modalButton}>
                  Cancelar
                </Button>
              </Card.Actions>
            </Card>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const getDynamicStyles = (theme: PaperThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.SPACING.medium,
  },
  loadingText: { // Applied to Paper Text
    textAlign: 'center',
    marginVertical: theme.SPACING.large,
  },
  emptyListText: { // Applied to Paper Text
    textAlign: 'center',
    marginVertical: theme.SPACING.large,
    color: theme.colors.textMuted,
  },
  listContentContainer: {
    paddingBottom: theme.SPACING.large,
  },
  goalItemCard: {
    marginBottom: theme.SPACING.medium,
    backgroundColor: theme.colors.surface, // Ensure Card background is from theme
    borderRadius: theme.BORDER_RADIUS.medium, // Ensure Card roundness is from theme
  },
  completedGoalItemCard: {
    backgroundColor: theme.colors.surfaceSuccessMuted || theme.colors.surfaceDisabled, // Use a success-muted or disabled surface
  },
  cancelledGoalItemCard: {
    backgroundColor: theme.colors.surfaceMuted || theme.colors.surfaceDisabled, // Use a muted or disabled surface
    opacity: 0.7, // Keep opacity for visual distinction
  },
  goalName: { // Applied to Card.Title's titleStyle
    // fontFamily: theme.FONTS.bold, // Handled by Card.Title variants if applicable or theme's default
    // fontSize: theme.FONTS.sizes.small, // Handled by Card.Title variants
    // color: theme.colors.text, // Handled by Card.Title
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  progressBar: {
    height: 12, // Keep custom height if desired
    borderRadius: theme.BORDER_RADIUS.small,
    marginVertical: theme.SPACING.small,
  },
  goalAmount: { // Applied to Paper Text
    // fontFamily: theme.FONTS.regular, // Handled by Text variant
    // fontSize: theme.FONTS.sizes.xsmall, // Handled by Text variant
    color: theme.colors.textMuted,
    marginVertical: theme.SPACING.xxsmall,
  },
  goalDate: { // Applied to Paper Text
    // fontFamily: theme.FONTS.regular, // Handled by Text variant
    // fontSize: theme.FONTS.sizes.xsmall, // Handled by Text variant
    color: theme.colors.textMuted,
    marginBottom: theme.SPACING.xxsmall,
  },
  // goalStatus style is handled by Card.Title subtitleStyle
  cardActions: {
    paddingHorizontal: theme.SPACING.small, // Add some padding to actions
    paddingBottom: theme.SPACING.small,
  },
  actionsScrollView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: theme.SPACING.xsmall,
  },
  deleteIconButton: {
    // No specific styles needed here if default IconButton size is okay
    // marginLeft auto could push it to the right if it's the last item and not in ScrollView
  },
  addGoalButton: { // For the main "Add New Goal" button
    marginBottom: theme.SPACING.medium,
  },
  // Styles for Modal content (using Card as modal panel)
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backdrop || 'rgba(0,0,0,0.6)',
  },
  modalScrollView: { // Ensure this allows scrolling for various screen sizes
    width: '100%',
    maxHeight: '90%', // Cap modal height
  },
  modalCard: { // Card used as modal panel
    width: '90%',
    alignSelf: 'center',
    marginVertical: theme.SPACING.large, // Add vertical margin for scroll
    elevation: theme.ELEVATION.large,
    borderRadius: theme.BORDER_RADIUS.large,
  },
  modalTitle: { // Applied to Card.Title in modal
    // fontFamily: theme.FONTS.bold, // Handled by Card.Title
    // fontSize: theme.FONTS.sizes.medium, // Handled by Card.Title
    textAlign: 'center', // Ensure title is centered
    // color: theme.colors.text, // Handled by Card.Title
  },
  modalText: { // Applied to Paper Text in modal
    // fontFamily: theme.FONTS.regular, // Handled by Text variant
    // fontSize: theme.FONTS.sizes.small, // Handled by Text variant
    // color: theme.colors.text, // Handled by Text variant
    marginBottom: theme.SPACING.medium,
    textAlign: 'center',
  },
  input: { // Applied to PaperTextInput in modal
    marginBottom: theme.SPACING.medium,
  },
  modalActions: { // Applied to Card.Actions in modal
    justifyContent: 'space-around', // Distribute buttons evenly
  },
  modalButton: { // For buttons within the modal
    flex: 0.45, // Ensure buttons don't overlap, adjust as needed
  },
});
