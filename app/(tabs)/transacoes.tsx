import { Picker } from '@react-native-picker/picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  View
} from 'react-native';
import {
  Button,
  Card, // For tabular data if chosen, or just Card for items
  Switch as PaperSwitch, // Use Paper's Text
  TextInput as PaperTextInput,
  Text, // Use Paper's TextInput
  useTheme
} from 'react-native-paper';
import {
  addCategory,
  addTransaction,
  Category,
  deleteTransaction,
  getDBConnection,
  getTransactionsByFamilyId,
  initDatabase,
  Transaction,
  updateTransaction
} from '../../src/database';
import { PaperThemeType } from '../../src/styles/theme'; // Import PaperThemeType

// Default categories to seed if none exist
const DEFAULT_CATEGORIES = [
  { name: 'Salário', type: 'income' },
  { name: 'Outras Receitas', type: 'income' },
  { name: 'Alimentação', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Moradia', type: 'expense' },
  { name: 'Lazer', type: 'expense' },
  { name: 'Saúde', type: 'expense' },
  { name: 'Educação', type: 'expense' },
  { name: 'Outras Despesas', type: 'expense' },
];

export default function TransacoesScreen() {
  const theme = useTheme<PaperThemeType>();
  const styles = getDynamicStyles(theme);

  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  // Initialize DB and load initial data
  useEffect(() => {
    const initialize = async () => {
      try {
        const connection = getDBConnection();
        setDb(connection);
        await initDatabase(connection);
        setIsDBInitialized(true);
        console.log('Database initialized.');
        if (connection) { // Ensure connection is not null before loading
          await loadCategoriesAndTransactions(connection);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Erro', 'Falha ao inicializar o banco de dados.');
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const loadCategoriesAndTransactions = useCallback(async (currentDb: SQLiteDatabase) => {
    if (!currentDb) {
      console.log("loadCategoriesAndTransactions called with null db");
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Replace with dynamic family ID (e.g., from user context)
      const familyId = 1;

      let fetchedCategories = await getAllCategoriesByFamily(currentDb, familyId);

      if (fetchedCategories.length === 0) {
        console.log('No categories found, seeding default categories...');
        for (const cat of DEFAULT_CATEGORIES) {
          // TODO: Ensure familyId is correctly passed if it's optional in addCategory
          await addCategory(currentDb, cat.name, cat.type as 'income' | 'expense', familyId);
        }
        fetchedCategories = await getAllCategoriesByFamily(currentDb, familyId);
      }
      setCategories(fetchedCategories);

      // TODO: Replace with dynamic family ID
      const fetchedTransactions = await getTransactionsByFamilyId(currentDb, familyId);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Erro', 'Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllCategoriesByFamily = async (currentDb: SQLiteDatabase, family_id?: number | null): Promise<Category[]> => {
    let query = 'SELECT * FROM categories';
    const params: any[] = [];
    if (family_id !== undefined && family_id !== null) {
      query += ' WHERE family_id = ? OR family_id IS NULL';
      params.push(family_id);
    } else {
      query += ' WHERE family_id IS NULL';
    }
    query += ' ORDER BY type, name;';
    return await currentDb.getAllAsync<Category>(query, ...params);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setCurrentTransaction(null);
    // Reset form fields
    setDescription('');
    setAmount('');
    setType('expense');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setSelectedCategoryId(null);
  };

  const handleOpenModal = (transactionToEdit?: Transaction) => {
    if (transactionToEdit) {
      setIsEditing(true);
      setCurrentTransaction(transactionToEdit);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setType(transactionToEdit.type);
      setTransactionDate(transactionToEdit.transaction_date.split('T')[0]);
      setSelectedCategoryId(transactionToEdit.category_id);
    } else {
      setIsEditing(false);
      setCurrentTransaction(null);
      setDescription('');
      setAmount('');
      setType('expense');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setSelectedCategoryId(null);
    }
    setModalVisible(true);
  };

  const handleSaveTransaction = async () => {
    if (!db) {
      Alert.alert('Erro', 'Banco de dados não conectado.');
      return;
    }
    if (!description.trim() || !amount.trim() || !transactionDate.trim()) {
      Alert.alert('Erro', 'Por favor, preencha descrição, valor e data.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Valor inválido para o montante.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(transactionDate)) {
        Alert.alert("Erro", "Formato de data inválido. Use YYYY-MM-DD.");
        return;
    }

    // TODO: Replace with dynamic user_id and family_id from context/auth
    const baseTransactionData = {
      description,
      amount: numericAmount,
      type,
      transaction_date: transactionDate,
      category_id: selectedCategoryId,
      budget_id: null, // TODO: Implement budget linking
    };

    try {
      if (isEditing && currentTransaction) {
        const updatedData = { ...baseTransactionData }; // user_id and family_id are not updated
        await updateTransaction(db, currentTransaction.id, updatedData);
        Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      } else {
        // For new transactions, add user_id and family_id
        const newTransactionData = {
            ...baseTransactionData,
            user_id: 1, // TODO: Replace with dynamic user_id
            family_id: 1, // TODO: Replace with dynamic family_id
        };
        await addTransaction(db, newTransactionData);
        Alert.alert('Sucesso', 'Transação adicionada com sucesso!');
      }
      handleCloseModal();
      if (db) loadCategoriesAndTransactions(db); // Refresh list
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Erro', `Falha ao salvar transação: ${error}`);
    }
  };

  const handleDeleteConfirmation = (transactionId: number) => {
    if (!db) {
        Alert.alert('Erro', 'Banco de dados não conectado.');
        return;
    }
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              await deleteTransaction(db, transactionId);
              Alert.alert("Sucesso", "Transação excluída com sucesso!");
              if (db) loadCategoriesAndTransactions(db); // Refresh list
            } catch (error) {
              console.error("Failed to delete transaction:", error);
              Alert.alert("Erro", `Falha ao excluir transação: ${error}`);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const getCategoryName = (categoryId: number | null) => {
    if (categoryId === null) return 'N/A';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card style={styles.transactionItemCard} elevation={theme.ELEVATION.small}>
        <Card.Content style={styles.cardContent}>
            <View style={styles.transactionDetails}>
                <Text variant="titleMedium" style={styles.transactionDescription}>{item.description}</Text>
                <Text variant="bodySmall" style={styles.transactionMeta}>
                    {new Date(item.transaction_date).toLocaleDateString()} - {getCategoryName(item.category_id)}
                </Text>
            </View>
            <View style={styles.transactionAmountContainer}>
                <Text variant="bodyLarge" style={[styles.transactionAmount, item.type === 'income' ? styles.incomeText : styles.expenseText]}>
                    {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                </Text>
            </View>
        </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button mode="contained" onPress={() => handleOpenModal(item)} style={styles.actionButton} compact>
          Editar
        </Button>
        <Button mode="contained" buttonColor={theme.colors.error} onPress={() => handleDeleteConfirmation(item.id)} style={styles.actionButton} compact>
          Excluir
        </Button>
      </Card.Actions>
    </Card>
  );

  const filteredCategories = categories.filter(cat => cat.type === type || cat.family_id === null);

  if (!isDBInitialized) {
    return <View style={styles.container}><Text variant="bodyLarge" style={styles.loadingText}>Inicializando banco de dados...</Text></View>;
  }
  if (isLoading) {
    return <View style={styles.container}><Text variant="bodyLarge" style={styles.loadingText}>Carregando dados...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => handleOpenModal()}
        style={styles.addTransactionButton}
        icon="plus-circle-outline"
        buttonColor={theme.colors.secondary}
        textColor={theme.colors.white}
      >
        Adicionar Nova Transação
      </Button>

      {transactions.length === 0 ? (
        <Text style={styles.emptyListText} variant="headlineSmall">Nenhuma transação encontrada.</Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
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
          <Card style={styles.modalCard}>
            <Card.Title title={isEditing ? 'Editar Transação' : 'Adicionar Nova Transação'} titleStyle={styles.modalTitle}/>
            <Card.Content>
              <PaperTextInput
                label="Descrição"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                mode="outlined"
              />
              <PaperTextInput
                label="Valor (ex: 50.99)"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
                keyboardType="numeric"
                mode="outlined"
              />
              <PaperTextInput
                label="Data (YYYY-MM-DD)"
                value={transactionDate}
                onChangeText={setTransactionDate}
                style={styles.input}
                mode="outlined"
                // Consider using react-native-paper-dates for a DatePicker
              />

              <View style={styles.switchRow}>
                <Text variant="bodyLarge" style={styles.label}>Tipo:</Text>
                <Text style={[styles.typeLabel, type === 'expense' ? styles.activeTypeText : {}]}>Despesa</Text>
                <PaperSwitch
                  value={type === 'income'}
                  onValueChange={() => setType(prevType => prevType === 'expense' ? 'income' : 'expense')}
                  color={theme.colors.primary} // Or use success for income, error for expense if desired
                />
                <Text style={[styles.typeLabel, type === 'income' ? styles.activeTypeText : {}]}>Receita</Text>
              </View>

              <Text variant="bodyLarge" style={styles.label}>Categoria:</Text>
              <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCategoryId}
                    onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
                    style={[styles.picker, { color: theme.colors.text }]} // Ensure picker text color matches theme
                    dropdownIconColor={theme.colors.text}
                    prompt="Selecione uma Categoria"
                  >
                  <Picker.Item label="Selecione uma categoria..." value={null} style={{color: theme.colors.textMuted || theme.colors.text}} />
                  {filteredCategories.map((cat) => (
                      <Picker.Item key={cat.id} label={cat.name} value={cat.id} style={{color: theme.colors.text}} />
                  ))}
                  </Picker>
              </View>
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={handleSaveTransaction}
                style={styles.modalButton}
              >
                {isEditing ? 'Salvar Alterações' : 'Salvar'}
              </Button>
              <Button
                mode="outlined"
                onPress={handleCloseModal}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const getDynamicStyles = (theme: PaperThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.SPACING.medium,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: theme.SPACING.large,
  },
  emptyListText: {
    textAlign: 'center',
    marginVertical: theme.SPACING.large,
    color: theme.colors.textMuted,
  },
  listContentContainer: {
    paddingBottom: theme.SPACING.large,
  },
  transactionItemCard: {
    marginBottom: theme.SPACING.medium,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.BORDER_RADIUS.medium,
  },
  cardContent: { // Style for Card.Content to enable flex layout
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1, // Allow text to take available space and wrap
    marginRight: theme.SPACING.small,
  },
  transactionDescription: { // Applied to Paper Text
    // color: theme.colors.text, // Default from variant
    marginBottom: theme.SPACING.xxsmall,
  },
  transactionMeta: { // Applied to Paper Text
    color: theme.colors.textMuted,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: { // Applied to Paper Text
    // fontFamily: theme.FONTS.bold, // Handled by variant or direct styling if needed
    // fontSize: theme.FONTS.sizes.medium, // Handled by variant
  },
  incomeText: {
    color: theme.colors.success,
  },
  expenseText: {
    color: theme.colors.error,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: theme.SPACING.none, // Adjust if Card.Content has enough padding
  },
  actionButton: {
    marginLeft: theme.SPACING.small,
  },
  addTransactionButton: {
    marginBottom: theme.SPACING.medium,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backdrop || 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.BORDER_RADIUS.large,
    padding: theme.SPACING.small, // Adjust padding for Card
    elevation: theme.ELEVATION.large,
  },
  modalTitle: { // Applied to Card.Title
    textAlign: 'center',
  },
  input: { // Applied to PaperTextInput
    marginBottom: theme.SPACING.medium,
  },
  switchRow: { // For Switch and its labels
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Evenly space items
    marginBottom: theme.SPACING.large,
    paddingVertical: theme.SPACING.small,
  },
  label: { // Applied to Paper Text
    // color: theme.colors.text, // Default from variant
    // marginRight: theme.SPACING.small,
  },
  typeLabel: { // Applied to Paper Text for Switch
    // marginHorizontal: theme.SPACING.xsmall,
  },
  activeTypeText: {
    color: theme.colors.primary, // Or theme.colors.text
    fontWeight: 'bold', // Make active type bold
  },
  pickerContainer: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.BORDER_RADIUS.medium, // Consistent with PaperTextInput
    marginBottom: theme.SPACING.medium,
    justifyContent: 'center',
    // backgroundColor: theme.colors.inputBackground || theme.colors.surface, // Use surface or specific input background
    minHeight: 56, // Align with PaperTextInput height
  },
  picker: {
    width: '100%',
    // color: theme.colors.text, // Set in component style prop
    // backgroundColor: 'transparent', // Ensure container bg shows
  },
  modalActions: {
    justifyContent: 'space-around',
    paddingTop: theme.SPACING.medium,
  },
  modalButton: {
    flex: 0.48,
  },
});
