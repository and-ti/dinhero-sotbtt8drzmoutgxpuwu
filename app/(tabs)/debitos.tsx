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
  Switch, // For toggling status, or use a button
  Platform,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { commonStyles } from '../../src/styles/theme';
import {
  getDBConnection,
  initDatabase,
  addDebt,
  getDebtsByFamilyId,
  updateDebt,
  deleteDebt,
  updateDebtStatus,
  Debt,
} from '../../src/database';
import type { SQLiteDatabase } from 'expo-sqlite';

export default function DebitosScreen() {
  const { theme } = useTheme();
  const styles = getDynamicStyles(theme);

  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDebt, setCurrentDebt] = useState<Debt | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(''); // YYYY-MM-DD
  const [creditor, setCreditor] = useState('');

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

  const loadDebts = useCallback(async (currentDb: SQLiteDatabase) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      // TODO: Replace with dynamic family ID
      const familyId = 1;
      const fetchedDebts = await getDebtsByFamilyId(currentDb, familyId);
      setDebts(fetchedDebts.sort((a, b) => { // Sort by status (unpaid first), then due date
        if (a.status === 'unpaid' && b.status === 'paid') return -1;
        if (a.status === 'paid' && b.status === 'unpaid') return 1;
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1; // Debts with due dates first
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
    <View style={[styles.debtItem, item.status === 'paid' ? styles.paidDebtItem : {}]}>
      <View style={styles.debtInfo}>
        <Text style={[styles.debtDescription, item.status === 'paid' && styles.paidText]}>
          {item.description}
        </Text>
        {item.creditor && (
          <Text style={[styles.debtCreditor, item.status === 'paid' && styles.paidText]}>
            Credor: {item.creditor}
          </Text>
        )}
        {item.due_date && (
          <Text style={[styles.debtDueDate, item.status === 'paid' && styles.paidText]}>
            Vencimento: {new Date(item.due_date + "T00:00:00").toLocaleDateString()}
          </Text>
        )}
         <Text style={[styles.debtStatus, item.status === 'paid' ? styles.paidStatusText : styles.unpaidStatusText]}>
          Status: {item.status === 'paid' ? 'Paga' : 'Não Paga'}
        </Text>
      </View>
      <View style={styles.debtActions}>
        <Text style={[styles.debtAmount, item.status === 'paid' ? styles.paidText : (item.status === 'unpaid' ? styles.unpaidAmountText : {})]}>
          R$ {item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={[styles.statusButton, item.status === 'paid' ? styles.markUnpaidButton : styles.markPaidButton]}
          onPress={() => handleToggleStatus(item)}
        >
          <Text style={styles.statusButtonText}>
            {item.status === 'paid' ? 'Marcar Não Paga' : 'Marcar Paga'}
          </Text>
        </TouchableOpacity>
        <View style={styles.itemActionButtonsRow}>
            <TouchableOpacity onPress={() => handleOpenModal(item)} style={[styles.itemActionButton, styles.editItemButton]}>
                <Text style={styles.itemActionButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteConfirmation(item.id)} style={[styles.itemActionButton, styles.deleteItemButton]}>
                <Text style={styles.itemActionButtonText}>Excluir</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!isDBInitialized) return <View style={styles.container}><Text style={styles.text}>Inicializando...</Text></View>;
  if (isLoading) return <View style={styles.container}><Text style={styles.text}>Carregando dívidas...</Text></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.addButton]} onPress={() => handleOpenModal()}>
        <Text style={styles.buttonText}>Adicionar Nova Dívida</Text>
      </TouchableOpacity>

      {debts.length === 0 ? (
        <Text style={styles.text}>Nenhuma dívida encontrada.</Text>
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
            <Text style={styles.modalTitle}>{isEditing ? 'Editar Dívida' : 'Adicionar Nova Dívida'}</Text>
            <TextInput
              placeholder="Descrição da Dívida"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              placeholderTextColor={theme.COLORS.placeholder}
            />
            <TextInput
              placeholder="Valor (ex: 150.75)"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor={theme.COLORS.placeholder}
            />
            <TextInput
              placeholder="Data de Vencimento (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              style={styles.input}
              placeholderTextColor={theme.COLORS.placeholder}
            />
            <TextInput
              placeholder="Credor (Opcional)"
              value={creditor}
              onChangeText={setCreditor}
              style={styles.input}
              placeholderTextColor={theme.COLORS.placeholder}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={handleSaveDebt}>
                <Text style={styles.buttonText}>{isEditing ? 'Salvar Alterações' : 'Adicionar Dívida'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.modalButton, styles.cancelButton]} onPress={handleCloseModal}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
    padding: commonStyles.SPACING.medium,
  },
  text: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.COLORS.text,
    textAlign: 'center',
    marginBottom: commonStyles.SPACING.medium,
  },
  listContentContainer: {
    paddingBottom: commonStyles.SPACING.large,
  },
  debtItem: {
    backgroundColor: theme.COLORS.surface,
    padding: commonStyles.SPACING.medium,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    marginBottom: commonStyles.SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paidDebtItem: {
    backgroundColor: theme.COLORS.surfaceMuted,
  },
  debtInfo: {
    flex: 1,
  },
  debtDescription: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.xxsmall,
  },
  debtCreditor: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.xsmall,
    color: theme.COLORS.textMuted,
    marginBottom: commonStyles.SPACING.xxsmall,
  },
  debtDueDate: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.xsmall,
    color: theme.COLORS.textMuted,
    marginBottom: commonStyles.SPACING.xxsmall,
  },
  debtStatus: {
    fontFamily: commonStyles.FONTS.medium,
    fontSize: commonStyles.FONTS.sizes.xsmall,
    marginTop: commonStyles.SPACING.xsmall,
  },
  paidStatusText: {
    color: theme.COLORS.success,
  },
  unpaidStatusText: {
    color: theme.COLORS.warning,
  },
  paidText: {
    textDecorationLine: 'line-through',
    color: theme.COLORS.textMuted,
  },
  debtActions: {
    alignItems: 'flex-end',
    marginTop: commonStyles.SPACING.small,
  },
  debtAmount: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.medium,
    marginBottom: commonStyles.SPACING.small,
  },
  unpaidAmountText: {
    color: theme.COLORS.error, // Explicitly color unpaid amounts
  },
  statusButton: {
    paddingVertical: commonStyles.SPACING.xsmall,
    paddingHorizontal: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginBottom: commonStyles.SPACING.small,
    minWidth: 120,
    alignItems: 'center',
  },
  markPaidButton: {
    backgroundColor: theme.COLORS.success,
  },
  markUnpaidButton: {
    backgroundColor: theme.COLORS.warning,
  },
  statusButtonText: {
    color: theme.COLORS.white,
    fontFamily: commonStyles.FONTS.medium,
    fontSize: commonStyles.FONTS.sizes.xsmall,
  },
  itemActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  itemActionButton: {
    paddingVertical: commonStyles.SPACING.xxsmall,
    paddingHorizontal: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginLeft: commonStyles.SPACING.xsmall,
  },
  itemActionButtonText: {
    color: theme.COLORS.white,
    fontFamily: commonStyles.FONTS.medium,
    fontSize: commonStyles.FONTS.sizes.xxsmall,
  },
  editItemButton: {
    backgroundColor: theme.COLORS.primary,
  },
  deleteItemButton: {
    backgroundColor: theme.COLORS.error,
  },
  button: {
    backgroundColor: theme.COLORS.primary,
    padding: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: theme.COLORS.accent,
    marginBottom: commonStyles.SPACING.medium,
  },
  buttonText: {
    color: theme.COLORS.white,
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.small,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: '90%',
    backgroundColor: theme.COLORS.surface,
    borderRadius: commonStyles.BORDER_RADIUS.large,
    padding: commonStyles.SPACING.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.large,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.COLORS.inputBackground || theme.COLORS.background,
    color: theme.COLORS.text,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    paddingHorizontal: commonStyles.SPACING.medium,
    paddingVertical: commonStyles.SPACING.small,
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    marginBottom: commonStyles.SPACING.medium,
    minHeight: 44,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: commonStyles.SPACING.medium,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: commonStyles.SPACING.xsmall,
  },
  cancelButton: {
    backgroundColor: theme.COLORS.grey,
  },
});
