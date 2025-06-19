import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Text, // Use Paper's Text
  TextInput as PaperTextInput, // Use Paper's TextInput
  useTheme, // Use Paper's useTheme
} from 'react-native-paper';
import type { Budget } from '../../src/database'; // Import the Budget interface
import { addBudget, deleteBudget, getBudgetsByFamilyId, getDBConnection, updateBudget } from '../../src/database';
import { PaperThemeType } from '../../src/styles/theme'; // Import PaperThemeType

export default function OrcamentosScreen() {
  const theme = useTheme<PaperThemeType>();
  const styles = getDynamicStyles(theme);
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
    <Card style={styles.budgetItemCard} elevation={theme.ELEVATION.small}>
      <Card.Title title={item.name} titleStyle={styles.cardTitle}/>
      <Card.Content>
        <Text variant="bodyLarge" style={styles.budgetText}>Valor: R$ {item.amount.toFixed(2)}</Text>
        <Text variant="bodyMedium" style={styles.budgetText}>Categoria: {item.category}</Text>
        <Text variant="bodySmall" style={styles.budgetText}>Início: {item.startDate}</Text>
        <Text variant="bodySmall" style={styles.budgetText}>Fim: {item.endDate}</Text>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button mode="contained" onPress={() => openEditModal(item)} style={styles.actionButton} compact>
          Editar
        </Button>
        <Button mode="contained" buttonColor={theme.colors.error} onPress={() => handleDeleteBudget(item.id)} style={styles.actionButton} compact>
          Excluir
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Meus Orçamentos</Text>
      <Button
        mode="contained"
        onPress={openAddModal}
        style={styles.addBudgetButton}
        icon="plus-circle-outline"
        buttonColor={theme.colors.secondary}
        textColor={theme.colors.white}
      >
        Adicionar Novo Orçamento
      </Button>
      {budgets.length === 0 ? (
        <Text style={styles.emptyListText} variant="bodyLarge">Nenhum orçamento encontrado.</Text>
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
            <Card style={styles.modalCard}>
              <Card.Title title={editingBudget ? "Editar Orçamento" : "Adicionar Novo Orçamento"} titleStyle={styles.modalTitle}/>
              <Card.Content>
                <PaperTextInput
                  label="Nome do Orçamento"
                  value={newBudgetName}
                  onChangeText={setNewBudgetName}
                  style={styles.input}
                  mode="outlined"
                />
                <PaperTextInput
                  label="Valor (ex: 500.00)"
                  value={newBudgetAmount}
                  onChangeText={setNewBudgetAmount}
                  style={styles.input}
                  keyboardType="numeric"
                  mode="outlined"
                />
                <PaperTextInput
                  label="Categoria (ex: Alimentação)"
                  value={newBudgetCategory}
                  onChangeText={setNewBudgetCategory}
                  style={styles.input}
                  mode="outlined"
                />
                <PaperTextInput
                  label="Data de Início (YYYY-MM-DD)"
                  value={newBudgetStartDate}
                  onChangeText={setNewBudgetStartDate}
                  style={styles.input}
                  mode="outlined"
                />
                <PaperTextInput
                  label="Data de Término (YYYY-MM-DD)"
                  value={newBudgetEndDate}
                  onChangeText={setNewBudgetEndDate}
                  style={styles.input}
                  mode="outlined"
                />
              </Card.Content>
              <Card.Actions style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={handleSaveBudget}
                  style={styles.modalButton}
                >
                  {editingBudget ? "Salvar Alterações" : "Salvar Orçamento"}
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
  title: {
    // fontFamily: theme.FONTS.bold, // Handled by Text variant="headlineMedium"
    // fontSize: theme.FONTS.sizes.large, // Handled by Text variant="headlineMedium"
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.SPACING.medium,
  },
  emptyListText: { // Applied to Paper Text
    textAlign: 'center',
    marginVertical: theme.SPACING.large,
    color: theme.colors.textMuted,
  },
  listContentContainer: {
    paddingBottom: theme.SPACING.large,
  },
  budgetItemCard: {
    // backgroundColor: theme.colors.surface, // Handled by Card
    borderRadius: theme.BORDER_RADIUS.medium, // Handled by Card theme
    marginBottom: theme.SPACING.medium,
    // elevation: theme.ELEVATION.small, // Passed as prop
  },
  cardTitle: {
    // Custom styling for Card.Title if needed, otherwise rely on Paper's defaults
    // color: theme.colors.text,
  },
  budgetText: {
    // fontFamily: theme.FONTS.regular, // Handled by Text variant
    // fontSize: theme.FONTS.sizes.small, // Handled by Text variant
    // color: theme.colors.text, // Handled by Text variant
    marginBottom: theme.SPACING.xsmall,
  },
  cardActions: {
    justifyContent: 'flex-end', // Align buttons to the right
    paddingTop: theme.SPACING.small,
  },
  actionButton: {
    marginLeft: theme.SPACING.small,
  },
  addBudgetButton: {
    // backgroundColor: theme.colors.secondary, // Set via buttonColor prop
    // paddingVertical: theme.SPACING.medium, // Handled by Button
    // paddingHorizontal: theme.SPACING.medium, // Handled by Button
    // borderRadius: theme.BORDER_RADIUS.medium, // Handled by Button
    // alignItems: 'center', // Handled by Button
    marginBottom: theme.SPACING.medium,
    // alignSelf: 'stretch', // Default for block button
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // marginTop: 22, // Removed, not needed with flex:1 and justifyContent
    backgroundColor: theme.colors.backdrop || 'rgba(0,0,0,0.5)',
  },
  modalCard: { // Card used as modal panel
    width: '90%',
    alignSelf: 'center',
    // margin: theme.SPACING.medium, // alignSelf and fixed width handle this
    backgroundColor: theme.colors.surface,
    borderRadius: theme.BORDER_RADIUS.large,
    padding: theme.SPACING.small, // Reduced padding as Card.Content/Actions will have their own
    elevation: theme.ELEVATION.large,
  },
  modalTitle: { // Applied to Card.Title in modal
    // fontFamily: theme.FONTS.bold, // Handled by Card.Title
    // fontSize: theme.FONTS.sizes.medium, // Handled by Card.Title
    textAlign: 'center',
    // color: theme.colors.text, // Handled by Card.Title
    // marginBottom: theme.SPACING.medium, // Handled by Card.Title
  },
  input: { // Applied to PaperTextInput in modal
    // height: 50, // Handled by PaperTextInput
    // borderColor: theme.colors.border, // Handled by PaperTextInput mode="outlined"
    // borderWidth: 1, // Handled by PaperTextInput mode="outlined"
    // borderRadius: theme.BORDER_RADIUS.small, // Handled by PaperTextInput
    marginBottom: theme.SPACING.medium,
    // paddingHorizontal: theme.SPACING.small, // Handled by PaperTextInput
    // width: '100%', // Default for PaperTextInput in a Card
    // fontFamily: theme.FONTS.regular, // Handled by PaperTextInput
    // fontSize: theme.FONTS.sizes.small, // Handled by PaperTextInput
    // color: theme.colors.text, // Handled by PaperTextInput
  },
  modalActions: { // Applied to Card.Actions in modal
    justifyContent: 'space-around',
    paddingTop: theme.SPACING.medium,
  },
  modalButton: { // For buttons within the modal
    flex: 0.48, // Allow buttons to share space
    // paddingVertical: theme.SPACING.small, // Handled by Button
    // paddingHorizontal: theme.SPACING.medium, // Handled by Button
    // borderRadius: theme.BORDER_RADIUS.medium, // Handled by Button
    // elevation: 2, // Handled by Button mode="contained"
    // minWidth: 120, // Handled by Button content and padding
    // alignItems: 'center', // Handled by Button
  },
  // cancelButton specific styling (like color) is handled by Button's mode or props directly
});
