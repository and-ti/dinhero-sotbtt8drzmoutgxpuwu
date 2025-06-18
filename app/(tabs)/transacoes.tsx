import { Picker } from '@react-native-picker/picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import {
  addCategory,
  addTransaction,
  Category,
  deleteTransaction,
  getDBConnection,
  getTransactionsByFamilyId,
  initDatabase,
  Transaction, // Assuming Family might be needed for family_id context later
  updateTransaction
} from '../../src/database';
import { commonStyles } from '../../src/styles/theme';

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
  const { theme } = useTheme();
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
    <View style={styles.transactionItem}>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionDescription, styles.text]}>{item.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.transaction_date).toLocaleDateString()} - {getCategoryName(item.category_id)}
        </Text>
      </View>
      <View style={styles.transactionRightContent}>
        <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeText : styles.expenseText]}>
          {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
        </Text>
        <View style={styles.itemActionButtonsContainer}>
          <TouchableOpacity onPress={() => handleOpenModal(item)} style={[styles.itemActionButton, styles.editButton]}>
            <Text style={styles.itemActionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteConfirmation(item.id)} style={[styles.itemActionButton, styles.deleteButton]}>
            <Text style={styles.itemActionButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const filteredCategories = categories.filter(cat => cat.type === type || cat.family_id === null);


  if (!isDBInitialized) {
    return <View style={styles.container}><Text style={styles.text}>Inicializando banco de dados...</Text></View>;
  }
  if (isLoading) {
    return <View style={styles.container}><Text style={styles.text}>Carregando dados...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.addButton]} onPress={() => handleOpenModal()}>
        <Text style={styles.buttonText}>Adicionar Nova Transação</Text>
      </TouchableOpacity>

      {transactions.length === 0 ? (
        <Text style={styles.text}>Nenhuma transação encontrada.</Text>
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
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{isEditing ? 'Editar Transação' : 'Adicionar Nova Transação'}</Text>

            <TextInput
              placeholder="Descrição"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Valor (ex: 50.99)"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Data (YYYY-MM-DD)"
              value={transactionDate}
              onChangeText={setTransactionDate}
              style={styles.input}
              placeholderTextColor={theme.colors.placeholder}
            />

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Tipo:</Text>
              <Text style={[styles.typeLabel, type === 'expense' ? styles.activeTypeText : styles.inactiveTypeText]}>Despesa</Text>
              <Switch
                trackColor={{ false: theme.colors.error, true: theme.colors.success }}
                thumbColor={theme.colors.white}
                ios_backgroundColor={theme.colors.error}
                onValueChange={() => setType(prevType => prevType === 'expense' ? 'income' : 'expense')}
                value={type === 'income'}
              />
              <Text style={[styles.typeLabel, type === 'income' ? styles.activeTypeText : styles.inactiveTypeText]}>Receita</Text>
            </View>

            <Text style={styles.label}>Categoria:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                selectedValue={selectedCategoryId}
                onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
                style={styles.picker}
                dropdownIconColor={theme.colors.text}
                prompt="Selecione uma Categoria"
                >
                <Picker.Item label="Selecione uma categoria..." value={null} style={{color: theme.colors.textMuted || theme.colors.text}} />
                {filteredCategories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} style={{color: theme.colors.text}}/>
                ))}
                </Picker>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.modalButton]}
                onPress={handleSaveTransaction}
              >
                <Text style={styles.buttonText}>{isEditing ? 'Salvar Alterações' : 'Salvar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
              >
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
    backgroundColor: theme.colors.background,
    padding: commonStyles.SPACING.medium,
  },
  title: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.large,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: commonStyles.SPACING.medium,
  },
  text: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  listContentContainer: {
    paddingBottom: commonStyles.SPACING.large,
  },
  transactionItem: {
    backgroundColor: theme.colors.surface,
    padding: commonStyles.SPACING.medium,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    marginBottom: commonStyles.SPACING.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionDetails: {
    flex: 1,
    marginRight: commonStyles.SPACING.small,
  },
  transactionDescription: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.colors.text,
    marginBottom: commonStyles.SPACING.xxsmall,
  },
  transactionDate: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.xsmall,
    color: theme.colors.textMuted,
  },
  transactionRightContent: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.medium,
    marginBottom: commonStyles.SPACING.xsmall,
  },
  itemActionButtonsContainer: {
    flexDirection: 'row',
    marginTop: commonStyles.SPACING.xsmall,
  },
  itemActionButton: {
    paddingVertical: commonStyles.SPACING.xxsmall,
    paddingHorizontal: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginLeft: commonStyles.SPACING.xsmall,
  },
  itemActionButtonText: {
    color: theme.colors.white,
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.xxsmall,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  incomeText: {
    color: theme.colors.success,
  },
  expenseText: {
    color: theme.colors.error,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: commonStyles.SPACING.small,
    paddingHorizontal: commonStyles.SPACING.medium,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addButton: {
    backgroundColor: theme.colors.accent,
    marginBottom: commonStyles.SPACING.medium,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: commonStyles.BORDER_RADIUS.large,
    padding: commonStyles.SPACING.large,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.colors.text,
    marginBottom: commonStyles.SPACING.large,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.inputBackground || theme.colors.background,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    paddingHorizontal: commonStyles.SPACING.medium,
    paddingVertical: commonStyles.SPACING.small,
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    marginBottom: commonStyles.SPACING.medium,
    minHeight: 44,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: commonStyles.SPACING.large,
    paddingHorizontal: commonStyles.SPACING.small,
  },
  label: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.colors.text,
    marginRight: commonStyles.SPACING.small, // Ensure some space for type switch label
  },
  typeLabel: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    marginHorizontal: commonStyles.SPACING.xsmall,
  },
  activeTypeText: {
    color: theme.colors.primary,
    fontFamily: commonStyles.FONTS.bold,
  },
  inactiveTypeText: {
    color: theme.colors.textMuted,
  },
  pickerContainer: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginBottom: commonStyles.SPACING.medium,
    justifyContent: 'center',
    minHeight: 50, // Increased height for picker
    backgroundColor: theme.colors.inputBackground || theme.colors.background,
  },
  picker: {
    width: '100%',
    color: theme.colors.text,
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
    backgroundColor: theme.colors.grey,
  },
});
