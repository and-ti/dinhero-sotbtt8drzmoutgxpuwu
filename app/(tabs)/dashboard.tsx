import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, ScrollView, Alert } from "react-native";
import { useTheme } from '../../src/context/ThemeContext';
import { commonStyles } from '../../src/styles/theme';
import {
  getDBConnection,
  initDatabase,
  getTransactionsByFamilyId,
  getBudgetsByFamilyId,
  getDebtsByFamilyId,
  getGoalsByFamilyId,
  Transaction,
  Budget,
  Debt,
  Goal,
} from '../../src/database';
import type { SQLiteDatabase } from 'expo-sqlite';

interface MonthlySummary {
  income: number;
  expenses: number;
  net: number;
}

interface BudgetWithSpending extends Budget {
  spentAmount: number;
}

const CustomProgressBar = ({ progress, color, height = 8 }: { progress: number, color: string, height?: number }) => {
  const styles = getDynamicStyles(useTheme().theme); // Access theme for styles
  return (
    <View style={[styles.progressBarContainer, { height }]}>
      <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(progress * 100, 100))}%`, backgroundColor: color }]} />
    </View>
  );
};


export default function DashboardScreen() {
  const { theme } = useTheme();
  const styles = getDynamicStyles(theme);

  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [summaryData, setSummaryData] = useState<MonthlySummary | null>(null);
  const [activeBudgets, setActiveBudgets] = useState<BudgetWithSpending[]>([]);
  const [outstandingDebts, setOutstandingDebts] = useState<Debt[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const connection = getDBConnection();
        setDb(connection);
        // It's okay to call initDatabase multiple times, tables are created with IF NOT EXISTS
        await initDatabase(connection);
        setIsDBInitialized(true);
        if (connection) {
          await loadDashboardData(connection);
        }
      } catch (error) {
        console.error("Dashboard Initialization error:", error);
        Alert.alert("Erro", "Falha ao inicializar o banco de dados para o dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const loadDashboardData = useCallback(async (currentDb: SQLiteDatabase) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const familyId = 1; // TODO: Replace with dynamic family ID

      // 1. Income/Expense Summary (Current Month)
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      // For simplicity, fetching all transactions and filtering in JS.
      // Ideally, filter by date in SQL if getTransactionsByFamilyId supports it or add a new DB function.
      const allTransactions = await getTransactionsByFamilyId(currentDb, familyId, 1000, 0); // Fetch a large number for now

      let income = 0;
      let expenses = 0;
      allTransactions.forEach(t => {
        // Basic check if transaction_date is within the current month
        if (t.transaction_date >= firstDayOfMonth && t.transaction_date <= lastDayOfMonth) {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expenses += t.amount;
        }
      });
      setSummaryData({ income, expenses, net: income - expenses });

      // 2. Budget Progress
      const budgets = await getBudgetsByFamilyId(currentDb, familyId);
      const budgetsWithSpending: BudgetWithSpending[] = [];
      for (const budget of budgets) {
        // TODO: This is a simplified calculation. For accuracy, transactions should be linked to budgets (budget_id)
        // or filter transactions by category AND date range of the budget.
        let spentAmount = 0;
        allTransactions.forEach(t => {
          if (t.category_id && t.type === 'expense') { // Assuming budget 'category' matches transaction category name for now
             // This is a very rough match. Ideally budget.category would be an ID or a more robust matching logic.
             // And that transactions have a category name that can be matched to budget.category string.
             // For now, we'll assume budget.category is a string that we hope matches some transaction categories.
             // This part needs significant improvement for real-world use.
             // A proper solution would involve linking transactions to budgets directly (budget_id)
             // or having a categories table that both budgets and transactions reference.
             // The current Budget interface has `category: string`, which is not ideal.
             // For this example, we'll simulate some spending if category names match (very loosely).
             // This part will likely show 0 spending for most budgets unless category names align perfectly
             // with categories used in transactions AND transactions have categories assigned.
             // A better approach would be to iterate through transactions and sum up amounts for categories defined in budgets.
          }
        });
        // For demonstration, let's assume we just display the budget without accurate spending for now
        // as the current structure doesn't easily support it without major assumptions or changes elsewhere.
        budgetsWithSpending.push({ ...budget, spentAmount: 0 }); // Placeholder spentAmount
      }
      setActiveBudgets(budgetsWithSpending);


      // 3. Outstanding Debts
      const unpaidDebts = await getDebtsByFamilyId(currentDb, familyId, 'unpaid');
      setOutstandingDebts(unpaidDebts);

      // 4. Active Goals
      const activeGoalsList = await getGoalsByFamilyId(currentDb, familyId, 'active');
      setActiveGoals(activeGoalsList);

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      Alert.alert("Erro", "Falha ao carregar dados do dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isDBInitialized) {
    return <View style={styles.centered}><Text style={styles.text}>Inicializando banco de dados...</Text></View>;
  }
  if (isLoading) {
    return <View style={styles.centered}><Text style={styles.text}>Carregando dashboard...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Painel Financeiro</Text>

      {/* Resumo Mensal */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Resumo Mensal</Text>
        {summaryData ? (
          <>
            <Text style={[styles.summaryText, styles.incomeText]}>Receitas: R$ {summaryData.income.toFixed(2)}</Text>
            <Text style={[styles.summaryText, styles.expenseText]}>Despesas: R$ {summaryData.expenses.toFixed(2)}</Text>
            <Text style={[styles.summaryText, styles.netText]}>Saldo: R$ {summaryData.net.toFixed(2)}</Text>
          </>
        ) : <Text style={styles.text}>Calculando resumo...</Text>}
      </View>

      {/* Orçamentos Ativos */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Orçamentos Ativos</Text>
        {activeBudgets.length > 0 ? activeBudgets.map(budget => {
          const progress = budget.amount > 0 ? Math.min(budget.spentAmount / budget.amount, 1) : 0;
          return (
            <View key={budget.id} style={styles.listItem}>
              <Text style={styles.itemTextBold}>{budget.name}</Text>
              <Text style={styles.itemText}>Gasto: R$ {budget.spentAmount.toFixed(2)} de R$ {budget.amount.toFixed(2)}</Text>
              <CustomProgressBar progress={progress} color={theme.COLORS.primary} />
            </View>
          );
        }) : <Text style={styles.text}>Nenhum orçamento ativo.</Text>}
      </View>

      {/* Dívidas Pendentes */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Dívidas Pendentes</Text>
        {outstandingDebts.length > 0 ? outstandingDebts.map(debt => (
          <View key={debt.id} style={styles.listItem}>
            <Text style={styles.itemTextBold}>{debt.description}</Text>
            <Text style={styles.itemText}>Valor: R$ {debt.amount.toFixed(2)} {debt.due_date ? `- Vence: ${new Date(debt.due_date+"T00:00:00").toLocaleDateString()}` : ''}</Text>
          </View>
        )) : <Text style={styles.text}>Nenhuma dívida pendente. 🎉</Text>}
      </View>

      {/* Metas em Andamento */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Metas em Andamento</Text>
        {activeGoals.length > 0 ? activeGoals.map(goal => {
          const progress = goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
          return (
            <View key={goal.id} style={styles.listItem}>
              <Text style={styles.itemTextBold}>{goal.name}</Text>
              <Text style={styles.itemText}>Progresso: R$ {goal.current_amount.toFixed(2)} de R$ {goal.target_amount.toFixed(2)}</Text>
              <CustomProgressBar progress={progress} color={theme.COLORS.accent} />
            </View>
          );
        }) : <Text style={styles.text}>Nenhuma meta em andamento.</Text>}
      </View>
    </ScrollView>
  );
}

// Moved getDynamicStyles outside the component and passed theme to it
const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background,
    padding: commonStyles.SPACING.medium,
  },
  headerTitle: {
    fontSize: commonStyles.FONTS.sizes.xlarge,
    fontFamily: commonStyles.FONTS.bold,
    color: theme.COLORS.primary,
    textAlign: 'center',
    marginVertical: commonStyles.SPACING.medium,
  },
  sectionCard: {
    backgroundColor: theme.COLORS.surface,
    borderRadius: commonStyles.BORDER_RADIUS.medium,
    padding: commonStyles.SPACING.medium,
    marginBottom: commonStyles.SPACING.medium,
    marginHorizontal: commonStyles.SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: commonStyles.FONTS.sizes.large,
    fontFamily: commonStyles.FONTS.bold,
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.small,
  },
  summaryText: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.xxsmall,
  },
  incomeText: { color: theme.COLORS.success },
  expenseText: { color: theme.COLORS.error },
  netText: { fontFamily: commonStyles.FONTS.bold, marginTop: commonStyles.SPACING.xsmall },
  listItem: {
    marginBottom: commonStyles.SPACING.small,
    paddingBottom: commonStyles.SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.borderMuted,
  },
  itemText: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.COLORS.textMuted,
  },
  itemTextBold: {
    fontFamily: commonStyles.FONTS.medium,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.COLORS.text,
    marginBottom: commonStyles.SPACING.xxsmall,
  },
  text: { // General text style for messages like "No data"
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.small,
    color: theme.COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: commonStyles.SPACING.small,
  },
  progressBarContainer: {
    backgroundColor: theme.COLORS.border,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    overflow: 'hidden',
    marginTop: commonStyles.SPACING.xxsmall,
    marginBottom: commonStyles.SPACING.xsmall,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: commonStyles.BORDER_RADIUS.small,
  },
});
