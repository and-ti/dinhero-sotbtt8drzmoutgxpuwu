import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
// Consider using ProgressBar from 'react-native-paper' in a future enhancement
// import { ProgressBar } from 'react-native-paper';
import { useTheme } from '../../src/context/ThemeContext';
import { commonStyles } from '../../src/styles/theme';
import {
  getDBConnection,
  initDatabase,
  addGoal,
  getGoalsByFamilyId,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  updateGoalStatus,
  Goal,
} from '../../src/database';
import type { SQLiteDatabase } from 'expo-sqlite';

export default function MetasScreen() {
  const { theme } = useTheme();
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

  const CustomProgressBar = ({ progress, color }: { progress: number, color: string }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  );

  const renderGoal = ({ item }: { item: Goal }) => {
    const progress = item.target_amount > 0 ? Math.min(item.current_amount / item.target_amount, 1) : 0;
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isActive = item.status === 'active';

    let statusText = 'Ativa';
    if (isCompleted) statusText = 'Concluída';
    if (isCancelled) statusText = 'Cancelada';

    let progressBarColor = theme.COLORS.primary;
    if (isCompleted) progressBarColor = theme.COLORS.success;
    if (isCancelled) progressBarColor = theme.COLORS.grey;


    return (
      <View style={[styles.goalItem, isCompleted ? styles.completedGoalItem : (isCancelled ? styles.cancelledGoalItem : {})]}>
        <Text style={[styles.goalName, (isCompleted || isCancelled) && styles.strikethroughText]}>{item.name}</Text>
        <CustomProgressBar progress={progress} color={progressBarColor} />
        <Text style={styles.goalAmount}>
          R$ {item.current_amount.toFixed(2)} / R$ {item.target_amount.toFixed(2)}
          ({(progress * 100).toFixed(0)}%)
        </Text>
        {item.target_date && <Text style={styles.goalDate}>Data Alvo: {new Date(item.target_date+"T00:00:00").toLocaleDateString()}</Text>}
        <Text style={styles.goalStatus}>Status: {statusText}</Text>

        <View style={styles.itemButtonsContainer}>
          {isActive && (
            <TouchableOpacity style={[styles.itemButton, styles.contributeButton]} onPress={() => handleOpenContributionModal(item)}>
              <Text style={styles.itemButtonText}>Contribuir</Text>
            </TouchableOpacity>
          )}
          {!isCancelled && ( // Can't edit cancelled goals
            <TouchableOpacity style={[styles.itemButton, styles.editButton]} onPress={() => handleOpenGoalModal(item)}>
                <Text style={styles.itemButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.itemButton, styles.deleteButton]} onPress={() => handleDeleteConfirmation(item.id)}>
            <Text style={styles.itemButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.itemButtonsContainer}>
            {isActive && (
                 <TouchableOpacity style={[styles.itemButton, styles.statusActionButton, styles.completeButton]} onPress={() => handleStatusChange(item, 'completed')}>
                    <Text style={styles.itemButtonText}>Concluir</Text>
                </TouchableOpacity>
            )}
            {isActive && (
                <TouchableOpacity style={[styles.itemButton, styles.statusActionButton, styles.cancelGoalButton]} onPress={() => handleStatusChange(item, 'cancelled')}>
                    <Text style={styles.itemButtonText}>Cancelar Meta</Text>
                </TouchableOpacity>
            )}
             {(isCompleted || isCancelled) && (
                <TouchableOpacity style={[styles.itemButton, styles.statusActionButton, styles.reactivateButton]} onPress={() => handleStatusChange(item, 'active')}>
                    <Text style={styles.itemButtonText}>Reativar</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  if (!isDBInitialized) return <View style={styles.container}><Text style={styles.text}>Inicializando...</Text></View>;
  if (isLoading) return <View style={styles.container}><Text style={styles.text}>Carregando metas...</Text></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.addButton]} onPress={() => handleOpenGoalModal()}>
        <Text style={styles.buttonText}>Adicionar Nova Meta</Text>
      </TouchableOpacity>

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={<Text style={styles.text}>Nenhuma meta encontrada.</Text>}
      />

      {/* Add/Edit Goal Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={handleCloseGoalModal}>
        <View style={styles.centeredView}>
          <ScrollView contentContainerStyle={styles.modalScrollView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{isEditing ? 'Editar Meta' : 'Adicionar Nova Meta'}</Text>
              <TextInput placeholder="Nome da Meta" value={name} onChangeText={setName} style={styles.input} placeholderTextColor={theme.COLORS.placeholder}/>
              <TextInput placeholder="Valor Alvo (ex: 1000.00)" value={targetAmount} onChangeText={setTargetAmount} style={styles.input} keyboardType="numeric" placeholderTextColor={theme.COLORS.placeholder}/>
              <TextInput placeholder="Data Alvo (YYYY-MM-DD)" value={targetDate} onChangeText={setTargetDate} style={styles.input} placeholderTextColor={theme.COLORS.placeholder}/>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={handleSaveGoal}>
                  <Text style={styles.buttonText}>{isEditing ? 'Salvar Alterações' : 'Adicionar Meta'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.modalButton, styles.cancelButton]} onPress={handleCloseGoalModal}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contribution Modal */}
      {currentGoal && (
        <Modal animationType="slide" transparent={true} visible={contributionModalVisible} onRequestClose={handleCloseContributionModal}>
          <View style={styles.centeredView}>
           <ScrollView contentContainerStyle={styles.modalScrollView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Contribuir para "{currentGoal.name}"</Text>
              <Text style={styles.modalText}>Progresso: R$ {currentGoal.current_amount.toFixed(2)} / R$ {currentGoal.target_amount.toFixed(2)}</Text>
              <Text style={styles.modalText}>Restante: R$ {(currentGoal.target_amount - currentGoal.current_amount).toFixed(2)}</Text>
              <TextInput placeholder="Valor da Contribuição" value={contributionAmount} onChangeText={setContributionAmount} style={styles.input} keyboardType="numeric" placeholderTextColor={theme.COLORS.placeholder}/>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={handleContributeToGoal}>
                  <Text style={styles.buttonText}>Confirmar Contribuição</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.modalButton, styles.cancelButton]} onPress={handleCloseContributionModal}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.COLORS.background, padding: commonStyles.SPACING.medium },
  text: { fontFamily: commonStyles.FONTS.regular, fontSize: commonStyles.FONTS.sizes.medium, color: theme.COLORS.text, textAlign: 'center', marginBottom: commonStyles.SPACING.medium },
  listContentContainer: { paddingBottom: commonStyles.SPACING.large },
  goalItem: { backgroundColor: theme.COLORS.surface, padding: commonStyles.SPACING.medium, borderRadius: commonStyles.BORDER_RADIUS.medium, marginBottom: commonStyles.SPACING.medium, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  completedGoalItem: { backgroundColor: theme.COLORS.surfaceSuccessMuted },
  cancelledGoalItem: { backgroundColor: theme.COLORS.surfaceMuted, opacity: 0.7 },
  strikethroughText: { textDecorationLine: 'line-through', color: theme.COLORS.textMuted },
  goalName: { fontFamily: commonStyles.FONTS.bold, fontSize: commonStyles.FONTS.sizes.small, color: theme.COLORS.text, marginBottom: commonStyles.SPACING.xsmall },
  progressBarContainer: { height: 12, backgroundColor: theme.COLORS.border, borderRadius: commonStyles.BORDER_RADIUS.small, overflow: 'hidden', marginVertical: commonStyles.SPACING.small },
  progressBarFill: { height: '100%', borderRadius: commonStyles.BORDER_RADIUS.small },
  goalAmount: { fontFamily: commonStyles.FONTS.regular, fontSize: commonStyles.FONTS.sizes.xsmall, color: theme.COLORS.textMuted, marginVertical: commonStyles.SPACING.xxsmall },
  goalDate: { fontFamily: commonStyles.FONTS.regular, fontSize: commonStyles.FONTS.sizes.xsmall, color: theme.COLORS.textMuted, marginBottom: commonStyles.SPACING.xxsmall },
  goalStatus: { fontFamily: commonStyles.FONTS.medium, fontSize: commonStyles.FONTS.sizes.xsmall, color: theme.COLORS.text, marginTop: commonStyles.SPACING.xsmall, marginBottom: commonStyles.SPACING.small, textTransform: 'capitalize'},
  itemButtonsContainer: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: commonStyles.SPACING.small, flexWrap: 'wrap' },
  itemButton: { paddingVertical: commonStyles.SPACING.xsmall, paddingHorizontal: commonStyles.SPACING.small, borderRadius: commonStyles.BORDER_RADIUS.small, marginRight: commonStyles.SPACING.small, marginTop: commonStyles.SPACING.xsmall, alignItems: 'center', justifyContent: 'center', minHeight: 30 },
  itemButtonText: { color: theme.COLORS.white, fontFamily: commonStyles.FONTS.medium, fontSize: commonStyles.FONTS.sizes.xxsmall },
  contributeButton: { backgroundColor: theme.COLORS.success },
  editButton: { backgroundColor: theme.COLORS.primary },
  deleteButton: { backgroundColor: theme.COLORS.error },
  statusActionButton: { backgroundColor: theme.COLORS.secondary },
  completeButton: {backgroundColor: theme.COLORS.success },
  cancelGoalButton: { backgroundColor: theme.COLORS.warning },
  reactivateButton: { backgroundColor: theme.COLORS.info },
  button: { backgroundColor: theme.COLORS.primary, padding: commonStyles.SPACING.small, borderRadius: commonStyles.BORDER_RADIUS.medium, alignItems: 'center' },
  addButton: { backgroundColor: theme.COLORS.accent, marginBottom: commonStyles.SPACING.medium },
  buttonText: { color: theme.COLORS.white, fontFamily: commonStyles.FONTS.bold, fontSize: commonStyles.FONTS.sizes.small },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalScrollView: { width: '100%', maxHeight: '90%' }, // Ensure modal is scrollable if content overflows
  modalView: { width: '90%', marginHorizontal: '5%', backgroundColor: theme.COLORS.surface, borderRadius: commonStyles.BORDER_RADIUS.large, padding: commonStyles.SPACING.large, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, marginVertical: commonStyles.SPACING.large },
  modalTitle: { fontFamily: commonStyles.FONTS.bold, fontSize: commonStyles.FONTS.sizes.medium, color: theme.COLORS.text, marginBottom: commonStyles.SPACING.large, textAlign: 'center' },
  modalText: { fontFamily: commonStyles.FONTS.regular, fontSize: commonStyles.FONTS.sizes.small, color: theme.COLORS.text, marginBottom: commonStyles.SPACING.medium, textAlign: 'center' },
  input: { backgroundColor: theme.COLORS.inputBackground || theme.COLORS.background, color: theme.COLORS.text, borderWidth: 1, borderColor: theme.COLORS.border, borderRadius: commonStyles.BORDER_RADIUS.small, paddingHorizontal: commonStyles.SPACING.medium, paddingVertical: commonStyles.SPACING.small, fontFamily: commonStyles.FONTS.regular, fontSize: commonStyles.FONTS.sizes.small, marginBottom: commonStyles.SPACING.medium, minHeight: 44 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: commonStyles.SPACING.medium },
  modalButton: { flex: 1, marginHorizontal: commonStyles.SPACING.xsmall },
  cancelButton: { backgroundColor: theme.COLORS.grey },
});
