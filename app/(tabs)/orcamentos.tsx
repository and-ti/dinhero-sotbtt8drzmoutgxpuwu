import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from '../../src/context/ThemeContext'; // ADD THIS
import type { Budget } from '../../src/database'; // Import the Budget interface
import { addBudget, deleteBudget, getBudgetsByFamilyId, getDBConnection, updateBudget } from '../../src/database';
import { commonStyles } from '../../src/styles/theme'; // Import commonStyles

export default function OrcamentosScreen() {
  const { theme } = useTheme(); // ADD THIS
  const styles = getDynamicStyles(theme); // ADD THIS
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetStartDate, setNewBudgetStartDate] = useState('');
  const [newBudgetEndDate, setNewBudgetEndDate] = useState('');
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const loadBudgets = async () => {
    try {
      const db = getDBConnection();
      // TODO: Replace with dynamic family ID
      const fetchedBudgets = await getBudgetsByFamilyId(db, 1);
      setBudgets(fetchedBudgets);
    } catch (error) {
      console.error("Failed to load budgets:", error);
      Alert.alert("Erro", "Não foi possível carregar os orçamentos.");
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingBudget(null); // Clear editing state when modal closes
    // Clear form fields
    setNewBudgetName('');
    setNewBudgetAmount('');
    setNewBudgetCategory('');
    setNewBudgetStartDate('');
    setNewBudgetEndDate('');
  };

  const handleSaveBudget = async () => {
    if (!newBudgetName.trim() || !newBudgetAmount.trim() || !newBudgetCategory.trim() || !newBudgetStartDate.trim() || !newBudgetEndDate.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    const amount = parseFloat(newBudgetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erro", "Por favor, insira um valor válido para o orçamento.");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newBudgetStartDate) || !dateRegex.test(newBudgetEndDate)) {
        Alert.alert("Erro", "Formato de data inválido. Use YYYY-MM-DD.");
        return;
    }

    try {
      const db = getDBConnection();
      if (editingBudget) {
        // Update existing budget
        await updateBudget(db, editingBudget.id, newBudgetName, amount, newBudgetCategory, newBudgetStartDate, newBudgetEndDate);
        Alert.alert("Sucesso", "Orçamento atualizado com sucesso!");
      } else {
        // Add new budget
        // TODO: Replace with dynamic family ID
        await addBudget(db, newBudgetName, amount, newBudgetCategory, newBudgetStartDate, newBudgetEndDate, 1);
        Alert.alert("Sucesso", "Orçamento salvo com sucesso!");
      }
      loadBudgets();
      handleCloseModal(); // Close modal and clear states
    } catch (error) {
      console.error("Failed to save budget:", error);
      Alert.alert("Erro", `Não foi possível salvar o orçamento: ${error}`);
    }
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setNewBudgetName('');
    setNewBudgetAmount('');
    setNewBudgetCategory('');
    setNewBudgetStartDate('');
    setNewBudgetEndDate('');
    setModalVisible(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setNewBudgetName(budget.name);
    setNewBudgetAmount(budget.amount.toString());
    setNewBudgetCategory(budget.category);
    setNewBudgetStartDate(budget.startDate);
    setNewBudgetEndDate(budget.endDate);
    setModalVisible(true);
  };

  const handleDeleteBudget = (id: number) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              const db = getDBConnection();
              await deleteBudget(db, id);
              Alert.alert("Sucesso", "Orçamento excluído com sucesso!");
              loadBudgets();
            } catch (error) {
              console.error("Failed to delete budget:", error);
              Alert.alert("Erro", `Não foi possível excluir o orçamento: ${error}`);
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  };

  const renderBudget = ({ item }: { item: Budget }) => (
    <View style={styles.budgetItem}>
      <Text style={styles.budgetText}>Nome: {item.name}</Text>
      <Text style={styles.budgetText}>Valor: R$ {item.amount.toFixed(2)}</Text>
      <Text style={styles.budgetText}>Categoria: {item.category}</Text>
      <Text style={styles.budgetText}>Início: {item.startDate}</Text>
      <Text style={styles.budgetText}>Fim: {item.endDate}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => openEditModal(item)}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDeleteBudget(item.id)}>
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Orçamentos</Text>
      <TouchableOpacity style={[styles.button, styles.addButton]} onPress={openAddModal}>
        <Text style={styles.buttonText}>Adicionar Novo Orçamento</Text>
      </TouchableOpacity>
      {budgets.length === 0 ? (
        <Text style={styles.text}>Nenhum orçamento encontrado.</Text>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudget}
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
            <Text style={styles.modalTitle}>{editingBudget ? "Editar Orçamento" : "Adicionar Novo Orçamento"}</Text>
            <TextInput
              placeholder="Nome do Orçamento"
              value={newBudgetName}
              onChangeText={setNewBudgetName}
              style={styles.input}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Valor (ex: 500.00)"
              value={newBudgetAmount}
              onChangeText={setNewBudgetAmount}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Categoria (ex: Alimentação)"
              value={newBudgetCategory}
              onChangeText={setNewBudgetCategory}
              style={styles.input}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Data de Início (YYYY-MM-DD)"
              value={newBudgetStartDate}
              onChangeText={setNewBudgetStartDate}
              style={styles.input}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Data de Término (YYYY-MM-DD)"
              value={newBudgetEndDate}
              onChangeText={setNewBudgetEndDate}
              style={styles.input}
              placeholderTextColor={theme.colors.placeholder}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.modalButton]}
                onPress={handleSaveBudget}
              >
                <Text style={styles.buttonText}>{editingBudget ? "Salvar Alterações" : "Salvar Orçamento"}</Text>
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

// Function to generate styles based on the current theme
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
  budgetItem: {
    backgroundColor: theme.colors.surface,
    padding: commonStyles.SPACING.medium,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    marginBottom: commonStyles.SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetText: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.colors.text,
    marginBottom: commonStyles.SPACING.xsmall,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: commonStyles.SPACING.small,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: commonStyles.SPACING.xsmall,
    paddingHorizontal: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginLeft: commonStyles.SPACING.small,
  },
  addButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: commonStyles.SPACING.medium,
    paddingHorizontal: commonStyles.SPACING.medium,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    alignItems: 'center',
    marginBottom: commonStyles.SPACING.medium,
    alignSelf: 'stretch',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.xsmall,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
  },
  modalView: {
    margin: commonStyles.SPACING.medium,
    backgroundColor: theme.colors.surface, // Use surface color for modal background
    borderRadius: commonStyles.BORDER_RADIUS.large,
    padding: commonStyles.SPACING.large,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Modal width
  },
  modalTitle: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.medium, // Adjusted size for modal
    color: theme.colors.text,
    marginBottom: commonStyles.SPACING.medium,
    textAlign: 'center',
  },
  input: {
    height: 50, // Increased height for better touchability
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginBottom: commonStyles.SPACING.medium, // Consistent spacing
    paddingHorizontal: commonStyles.SPACING.small,
    width: '100%', // Full width
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.colors.text, // Ensure text is visible
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute buttons evenly
    width: '100%',
    marginTop: commonStyles.SPACING.small,
  },
  modalButton: {
    paddingVertical: commonStyles.SPACING.small, // Adjusted padding
    paddingHorizontal: commonStyles.SPACING.medium, // Adjusted padding
    borderRadius: commonStyles.BORDER_RADIUS.medium, // Consistent border radius
    elevation: 2,
    minWidth: 120, // Ensure buttons have a good size
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.error, // Use error color for cancel
    marginLeft: commonStyles.SPACING.small,
  },
});
