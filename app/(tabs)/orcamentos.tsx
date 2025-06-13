import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, Button } from "react-native";
import { useTheme } from '../../src/context/ThemeContext'; // ADD THIS
import { commonStyles } from '../../src/styles/theme'; // Import commonStyles
import { getDBConnection, getBudgetsByFamilyId } from '../../src/database';
import type { Budget } from '../../src/database'; // Import the Budget interface

export default function OrcamentosScreen() {
  const { theme } = useTheme(); // ADD THIS
  const styles = getDynamicStyles(theme); // ADD THIS
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const db = getDBConnection();
        // TODO: Replace with dynamic family ID
        const fetchedBudgets = await getBudgetsByFamilyId(db, 1);
        setBudgets(fetchedBudgets);
      } catch (error) {
        console.error("Failed to load budgets:", error);
        // Handle error (e.g., show a message to the user)
      }
    };

    loadBudgets();
  }, []);

  const renderBudget = ({ item }: { item: Budget }) => (
    <View style={styles.budgetItem}>
      <Text style={styles.budgetText}>Nome: {item.name}</Text>
      <Text style={styles.budgetText}>Valor: R$ {item.amount.toFixed(2)}</Text>
      <Text style={styles.budgetText}>Categoria: {item.category}</Text>
      <Text style={styles.budgetText}>Início: {item.startDate}</Text>
      <Text style={styles.budgetText}>Fim: {item.endDate}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => console.log("Edit budget", item.id)}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => console.log("Delete budget", item.id)}>
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Orçamentos</Text>
      <TouchableOpacity style={[styles.button, styles.addButton]} onPress={() => console.log("Add new budget")}>
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
    </View>
  );
}

// Function to generate styles based on the current theme
const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center", // Adjusted for list view
    // alignItems: "center", // Adjusted for list view
    backgroundColor: theme.COLORS.background, // Dynamic background
    padding: commonStyles.SPACING.medium,
  },
  title: {
    fontFamily: commonStyles.FONTS.bold,
    fontSize: commonStyles.FONTS.sizes.large,
    color: theme.COLORS.text,
    textAlign: 'center',
    marginBottom: commonStyles.SPACING.medium,
  },
  text: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.COLORS.text, // Dynamic text color
    textAlign: 'center',
  },
  listContentContainer: {
    paddingBottom: commonStyles.SPACING.large, // Ensure space for the last item
  },
  budgetItem: {
    backgroundColor: theme.COLORS.surface,
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
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.xsmall,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: commonStyles.SPACING.small,
  },
  button: {
    backgroundColor: theme.COLORS.primary,
    paddingVertical: commonStyles.SPACING.xsmall,
    paddingHorizontal: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    marginLeft: commonStyles.SPACING.small,
  },
  addButton: {
    backgroundColor: theme.COLORS.accent,
    paddingVertical: commonStyles.SPACING.medium,
    paddingHorizontal: commonStyles.SPACING.medium,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    alignItems: 'center',
    marginBottom: commonStyles.SPACING.medium,
    alignSelf: 'stretch', // Make button stretch
  },
  deleteButton: {
    backgroundColor: theme.COLORS.error,
  },
  buttonText: {
    color: theme.COLORS.white,
    fontFamily: commonStyles.FONTS.medium,
    fontSize: commonStyles.FONTS.sizes.xsmall,
  },
});
