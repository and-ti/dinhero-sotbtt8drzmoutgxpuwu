import type { SQLiteDatabase } from 'expo-sqlite'; // Ensure this is present once
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet, // Ensure StyleSheet is imported once
  View
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Text, // Use Paper's Text
  TextInput as PaperTextInput, // Use Paper's TextInput
  useTheme, // Use Paper's useTheme if context provides full Paper theme
} from 'react-native-paper';
// Assuming ThemeContext provides a theme compatible with react-native-paper
// If useTheme from ThemeContext is not directly from react-native-paper, ensure theme structure is compatible.
// For this refactoring, we'll assume `theme` object from `useTheme()` is compatible.

import {
  addDebt,
  Debt,
  deleteDebt,
  getDBConnection,
  getDebtsByFamilyId,
  initDatabase,
  updateDebt,
  updateDebtStatus,
} from '../../src/database';
// commonStyles might be phased out or used for non-Paper specific values if any remain
// import { commonStyles } from '../../src/styles/theme'; // This line can be removed if not used
import { PaperThemeType } from '../../src/styles/theme'; // Import the theme type

export default function DebitosScreen() {
  const theme = useTheme<PaperThemeType>(); // Specify theme type for useTheme
  const styles = getDynamicStyles(theme);

  const [db, setDb] = useState<SQLiteDatabase | null>(null); // Restore SQLiteDatabase type
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDebt, setCurrentDebt] = useState<Debt | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(''); // YYYY-MM-DD
  const [creditor, setCreditor] = useState('');

  const [isLoading, setIsLoading] = useState(true); // Keep this for loading state
  const [isDBInitialized, setIsDBInitialized] = useState(false); // Keep this

  // Database initialization and loading logic (remains largely the same)
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const connection = getDBConnection();
        setDb(connection);
        await initDatabase(connection);
        setIsDBInitialized(true);
        console.log('Debts DB initialized.');
        if (connection) {
          await loadDebts(connection);
        }
      } catch (error) {
        console.error('Debts Initialization error:', error);
        Alert.alert('Erro', 'Falha ao inicializar o banco de dados para dívidas.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const loadDebts = useCallback(async (currentDb: SQLiteDatabase) => { // Restore SQLiteDatabase type
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const familyId = 1; // TODO: Replace with dynamic family ID
      const fetchedDebts = await getDebtsByFamilyId(currentDb, familyId);
      setDebts(fetchedDebts.sort((a, b) => {
        if (a.status === 'unpaid' && b.status === 'paid') return -1;
        if (a.status === 'paid' && b.status === 'unpaid') return 1;
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      }));
    } catch (error) {
      console.error('Failed to load debts:', error);
      Alert.alert('Erro', 'Falha ao carregar dívidas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setCurrentDebt(null);
    setDescription('');
    setAmount('');
    setDueDate('');
    setCreditor('');
  };

  const handleOpenModal = (debtToEdit?: Debt) => {
    if (debtToEdit) {
      setIsEditing(true);
      setCurrentDebt(debtToEdit);
      setDescription(debtToEdit.description);
      setAmount(debtToEdit.amount.toString());
      setDueDate(debtToEdit.due_date || '');
      setCreditor(debtToEdit.creditor || '');
    } else {
      setIsEditing(false);
      setCurrentDebt(null);
      setDescription('');
      setAmount('');
      setDueDate('');
      setCreditor('');
    }
    setModalVisible(true);
  };

  const handleSaveDebt = async () => {
    if (!db) return Alert.alert('Erro', 'Banco de dados não conectado.');
    if (!description.trim() || !amount.trim()) {
      return Alert.alert('Erro', 'Descrição e Valor são obrigatórios.');
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return Alert.alert('Erro', 'Valor inválido.');
    }
    if (dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return Alert.alert("Erro", "Formato de Data de Vencimento inválido. Use YYYY-MM-DD ou deixe em branco.");
    }

    // TODO: Replace with dynamic user_id and family_id
    const family_id = 1;
    const user_id = 1;

    const debtData = {
      description,
      amount: numericAmount,
      due_date: dueDate.trim() || null,
      creditor: creditor.trim() || null,
    };

    try {
      if (isEditing && currentDebt) {
        await updateDebt(db, currentDebt.id, debtData);
        Alert.alert('Sucesso', 'Dívida atualizada com sucesso!');
      } else {
        await addDebt(db, { ...debtData, family_id, user_id }); // status defaults to 'unpaid'
        Alert.alert('Sucesso', 'Dívida adicionada com sucesso!');
      }
      handleCloseModal();
      if (db) loadDebts(db);
    } catch (error) {
      console.error('Failed to save debt:', error);
      Alert.alert('Erro', `Falha ao salvar dívida: ${error}`);
    }
  };

  const handleDeleteConfirmation = (debtId: number) => {
    if (!db) return;
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta dívida?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              await deleteDebt(db, debtId);
              Alert.alert("Sucesso", "Dívida excluída com sucesso!");
              if (db) loadDebts(db);
            } catch (error) {
              console.error("Failed to delete debt:", error);
              Alert.alert("Erro", `Falha ao excluir dívida: ${error}`);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleToggleStatus = async (debt: Debt) => {
    if (!db) return;
    const newStatus = debt.status === 'paid' ? 'unpaid' : 'paid';
    try {
      await updateDebtStatus(db, debt.id, newStatus);
      Alert.alert('Sucesso', `Dívida marcada como ${newStatus === 'paid' ? 'paga' : 'não paga'}.`);
      if (db) loadDebts(db);
    } catch (error) {
      console.error('Failed to update debt status:', error);
      Alert.alert('Erro', `Falha ao atualizar status da dívida: ${error}`);
    }
  };

  const renderDebt = ({ item }: { item: Debt }) => (
    <Card style={[styles.debtItemCard, item.status === 'paid' ? styles.paidDebtItemCard : {}]} elevation={theme.ELEVATION.small}>
      <Card.Content>
        <View style={styles.debtItemContent}>
            <View style={styles.debtInfo}>
              <Text variant="titleMedium" style={[styles.debtDescription, item.status === 'paid' && styles.paidText]}>
                {item.description}
              </Text>
              {item.creditor && (
                <Text variant="bodySmall" style={[styles.debtMeta, item.status === 'paid' && styles.paidText]}>
                  Credor: {item.creditor}
                </Text>
              )}
              {item.due_date && (
                <Text variant="bodySmall" style={[styles.debtMeta, item.status === 'paid' && styles.paidText]}>
                  Vencimento: {new Date(item.due_date + "T00:00:00").toLocaleDateString()}
                </Text>
              )}
              <Text variant="bodySmall" style={[styles.debtStatus, item.status === 'paid' ? styles.paidStatusText : styles.unpaidStatusText]}>
                Status: {item.status === 'paid' ? 'Paga' : 'Não Paga'}
              </Text>
            </View>
            <View style={styles.debtAmountAndActions}>
                 <Text variant="headlineSmall" style={[styles.debtAmount, item.status === 'paid' ? styles.paidText : (item.status === 'unpaid' ? styles.unpaidAmountText : {})]}>
                    R$ {item.amount.toFixed(2)}
                </Text>
                 <Button
                    mode="contained"
                    onPress={() => handleToggleStatus(item)}
                    style={styles.statusButton}
                    buttonColor={item.status === 'paid' ? theme.colors.warning : theme.colors.success}
                    textColor={theme.colors.white} // Explicitly set text color for contrast
                    compact
                  >
                    {item.status === 'paid' ? 'Marcar Não Paga' : 'Marcar Paga'}
                </Button>
            </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <IconButton icon="pencil" onPress={() => handleOpenModal(item)} iconColor={theme.colors.primary} />
        <IconButton icon="delete" onPress={() => handleDeleteConfirmation(item.id)} iconColor={theme.colors.error}/>
      </Card.Actions>
    </Card>
  );

  if (!isDBInitialized) return <View style={styles.container}><Text style={styles.loadingText}>Inicializando banco de dados...</Text></View>;
  if (isLoading && !debts.length) return <View style={styles.container}><Text style={styles.loadingText}>Carregando dívidas...</Text></View>;


  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => handleOpenModal()}
        style={styles.addButton}
        icon="plus-circle-outline"
        buttonColor={theme.colors.secondary} // Using secondary for FAB-like action
        textColor={theme.colors.white} // Ensure text is readable
      >
        Adicionar Nova Dívida
      </Button>

      {isLoading && debts.length > 0 && <Text style={styles.loadingText}>Atualizando lista...</Text>}

      {debts.length === 0 && !isLoading ? (
        <View style={styles.emptyStateContainer}>
            <Text variant='headlineSmall' style={styles.emptyStateText}>Nenhuma dívida encontrada.</Text>
            <Text variant='bodyLarge' style={styles.emptyStateText}>Crie uma nova dívida clicando no botão acima.</Text>
        </View>
      ) : (
        <FlatList
          data={debts}
          renderItem={renderDebt}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {isEditing ? 'Editar Dívida' : 'Adicionar Nova Dívida'}
            </Text>
            <PaperTextInput
              label="Descrição da Dívida"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
            />
            <PaperTextInput
              label="Valor (ex: 150.75)"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
              mode="outlined"
            />
            <PaperTextInput
              label="Data de Vencimento (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              style={styles.input}
              mode="outlined"
              placeholder="Opcional"
            />
            <PaperTextInput
              label="Credor (Opcional)"
              value={creditor}
              onChangeText={setCreditor}
              style={styles.input}
              mode="outlined"
            />
            <View style={styles.modalButtonContainer}>
              <Button mode="contained" onPress={handleSaveDebt} style={styles.modalButton}>
                {isEditing ? 'Salvar Alterações' : 'Adicionar Dívida'}
              </Button>
              <Button mode="outlined" onPress={handleCloseModal} style={styles.modalButton}>
                Cancelar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Note: theme type might need to be explicitly PaperTheme from your theme file
const getDynamicStyles = (theme: PaperThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.SPACING.medium,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: theme.SPACING.large,
    color: theme.colors.text, // Ensure this uses theme.colors.text or a variant color
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.SPACING.medium,
  },
  emptyStateText: { // This style is applied to Paper Text components
    textAlign: 'center',
    marginBottom: theme.SPACING.medium,
    // color: theme.colors.textMuted, // Color can be set via variant or explicitly here
  },
  listContentContainer: {
    paddingBottom: theme.SPACING.large,
  },
  debtItemCard: {
    // backgroundColor: theme.colors.surface, // Card component handles its own background via theme
    borderRadius: theme.BORDER_RADIUS.medium, // Card component might use theme.roundness
    marginBottom: theme.SPACING.medium,
  },
  paidDebtItemCard: {
    backgroundColor: theme.colors.surfaceDisabled || theme.colors.surfaceVariant,
  },
  debtItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debtInfo: {
    flex: 1,
    marginRight: theme.SPACING.small,
  },
  debtDescription: { // Applied to Paper Text with variant="titleMedium"
    // color: theme.colors.text, // Usually handled by variant, override if needed
    marginBottom: theme.SPACING.small,
  },
  debtMeta: { // Applied to Paper Text with variant="bodySmall"
    // color: theme.colors.text, // Usually handled by variant
    marginBottom: theme.SPACING.xxsmall,
  },
  debtStatus: { // Applied to Paper Text with variant="bodySmall"
    marginTop: theme.SPACING.xsmall,
  },
  paidStatusText: {
    color: theme.colors.success,
  },
  unpaidStatusText: {
    color: theme.colors.warning,
  },
  paidText: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  debtAmountAndActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  debtAmount: { // Applied to Paper Text with variant="headlineSmall"
    marginBottom: theme.SPACING.small,
  },
  unpaidAmountText: {
    color: theme.colors.error,
  },
  statusButton: { // Style for Paper Button
    marginTop: theme.SPACING.small,
    minWidth: 140,
  },
  cardActions: { // Style for Card.Actions
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  addButton: { // Style for Paper Button
    marginBottom: theme.SPACING.medium,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backdrop || 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: '90%',
    backgroundColor: theme.colors.surface, // Modal content surface color
    borderRadius: theme.BORDER_RADIUS.large, // Modal content roundness
    padding: theme.SPACING.large,
    elevation: theme.ELEVATION.large, // Elevation for modal
  },
  modalTitle: { // Applied to Paper Text with variant="titleLarge"
    color: theme.colors.text,
    marginBottom: theme.SPACING.large,
    textAlign: 'center',
  },
  input: { // Style for PaperTextInput
    marginBottom: theme.SPACING.medium,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.SPACING.medium,
  },
  modalButton: { // Style for Paper Button in modal
    flex: 0.48,
  },
});
