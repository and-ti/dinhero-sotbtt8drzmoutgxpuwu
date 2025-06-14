import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from "react-native"; // View might still be needed for some layout
import { useTheme } from '../../src/context/ThemeContext';
import { commonStyles } from '../../src/styles/theme'; // Keep for SPACING, BORDER_RADIUS if not using theme's directly
import { Text as PaperText, Card, ProgressBar, ActivityIndicator, MD3Colors } from 'react-native-paper';
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

// Types remain the same
interface MonthlySummary {
  income: number;
  expenses: number;
  net: number;
}

interface BudgetWithSpending extends Budget {
  spentAmount: number;
}

// CustomProgressBar is removed, will use Paper.ProgressBar

export default function DashboardScreen() {
  const { theme } = useTheme(); // theme is now PaperThemeType
  const styles = getDynamicStyles(theme);

  // State hooks remain the same
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [summaryData, setSummaryData] = useState<MonthlySummary | null>(null);
  const [activeBudgets, setActiveBudgets] = useState<BudgetWithSpending[]>([]);
  const [outstandingDebts, setOutstandingDebts] = useState<Debt[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  // useEffect and loadDashboardData logic remain largely the same,
  // just ensure Alert and console.error are handled if desired (they are standard).
  // The data fetching logic itself is not changing.

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const connection = getDBConnection();
        setDb(connection);
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
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      const allTransactions = await getTransactionsByFamilyId(currentDb, familyId, 1000, 0);

      let income = 0;
      let expenses = 0;
      allTransactions.forEach(t => {
        if (t.transaction_date >= firstDayOfMonth && t.transaction_date <= lastDayOfMonth) {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expenses += t.amount;
        }
      });
      setSummaryData({ income, expenses, net: income - expenses });

      const budgets = await getBudgetsByFamilyId(currentDb, familyId);
      const budgetsWithSpending: BudgetWithSpending[] = budgets.map(b => ({...b, spentAmount: 0})); // Placeholder
      setActiveBudgets(budgetsWithSpending);

      const unpaidDebts = await getDebtsByFamilyId(currentDb, familyId, 'unpaid');
      setOutstandingDebts(unpaidDebts);

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
    return <View style={styles.centered}><ActivityIndicator animating={true} color={theme.colors.primary} size="large" /><PaperText style={styles.loadingText}>Inicializando banco de dados...</PaperText></View>;
  }
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator animating={true} color={theme.colors.primary} size="large" /><PaperText style={styles.loadingText}>Carregando dashboard...</PaperText></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <PaperText variant="headlineMedium" style={styles.headerTitle}>Painel Financeiro</PaperText>

      {/* Resumo Mensal */}
      <Card style={styles.sectionCard} elevation={1}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Resumo Mensal</PaperText>
          {summaryData ? (
            <>
              <PaperText style={[styles.summaryText, styles.incomeText]}>Receitas: R$ {summaryData.income.toFixed(2)}</PaperText>
              <PaperText style={[styles.summaryText, styles.expenseText]}>Despesas: R$ {summaryData.expenses.toFixed(2)}</PaperText>
              <PaperText style={[styles.summaryText, styles.netText]}>Saldo: R$ {summaryData.net.toFixed(2)}</PaperText>
            </>
          ) : <PaperText style={styles.text}>Calculando resumo...</PaperText>}
        </Card.Content>
      </Card>

      {/* Orçamentos Ativos */}
      <Card style={styles.sectionCard} elevation={1}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Orçamentos Ativos</PaperText>
          {activeBudgets.length > 0 ? activeBudgets.map(budget => {
            const progress = budget.amount > 0 ? Math.min(budget.spentAmount / budget.amount, 1) : 0;
            return (
              <View key={budget.id} style={styles.listItem}>
                <PaperText variant="labelLarge" style={styles.itemTextBold}>{budget.name}</PaperText>
                <PaperText style={styles.itemText}>Gasto: R$ {budget.spentAmount.toFixed(2)} de R$ {budget.amount.toFixed(2)}</PaperText>
                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
              </View>
            );
          }) : <PaperText style={styles.text}>Nenhum orçamento ativo.</PaperText>}
        </Card.Content>
      </Card>

      {/* Dívidas Pendentes */}
      <Card style={styles.sectionCard} elevation={1}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Dívidas Pendentes</PaperText>
          {outstandingDebts.length > 0 ? outstandingDebts.map(debt => (
            <View key={debt.id} style={styles.listItem}>
              <PaperText variant="labelLarge" style={styles.itemTextBold}>{debt.description}</PaperText>
              <PaperText style={styles.itemText}>Valor: R$ {debt.amount.toFixed(2)} {debt.due_date ? `- Vence: ${new Date(debt.due_date+"T00:00:00").toLocaleDateString()}` : ''}</PaperText>
            </View>
          )) : <PaperText style={styles.text}>Nenhuma dívida pendente. 🎉</PaperText>}
        </Card.Content>
      </Card>

      {/* Metas em Andamento */}
      <Card style={styles.sectionCard} elevation={1}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Metas em Andamento</PaperText>
          {activeGoals.length > 0 ? activeGoals.map(goal => {
            const progress = goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
            return (
              <View key={goal.id} style={styles.listItem}>
                <PaperText variant="labelLarge" style={styles.itemTextBold}>{goal.name}</PaperText>
                <PaperText style={styles.itemText}>Progresso: R$ {goal.current_amount.toFixed(2)} de R$ {goal.target_amount.toFixed(2)}</PaperText>
                <ProgressBar progress={progress} color={theme.colors.secondary} style={styles.progressBar} />
              </View>
            );
          }) : <PaperText style={styles.text}>Nenhuma meta em andamento.</PaperText>}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: commonStyles.SPACING.medium,
  },
  loadingText: { // For text next to ActivityIndicator
    marginTop: commonStyles.SPACING.small,
    color: theme.colors.onBackground,
    fontSize: commonStyles.FONTS.sizes.medium,
  },
  headerTitle: {
    // fontSize: commonStyles.FONTS.sizes.xlarge, // Handled by variant
    // fontFamily: commonStyles.FONTS.bold, // Handled by variant
    color: theme.colors.primary,
    textAlign: 'center',
    marginVertical: commonStyles.SPACING.medium,
    // fontWeight: 'bold', // If variant doesn't provide enough weight
  },
  sectionCard: {
    // backgroundColor: theme.colors.surface, // Handled by Card
    // borderRadius: theme.roundness, // Handled by Card theme
    padding: commonStyles.SPACING.small, // Adjusted padding for Card.Content
    marginBottom: commonStyles.SPACING.medium,
    marginHorizontal: commonStyles.SPACING.medium,
    // elevation: 1, // Set on Card component directly
  },
  sectionTitle: {
    // fontSize: commonStyles.FONTS.sizes.large, // Handled by variant
    // fontFamily: commonStyles.FONTS.bold, // Handled by variant
    color: theme.colors.onSurface, // Text on Card
    marginBottom: commonStyles.SPACING.small,
  },
  summaryText: {
    // fontFamily: commonStyles.FONTS.regular, // Handled by PaperText default or variant
    // fontSize: commonStyles.FONTS.sizes.medium, // Handled by PaperText default or variant
    color: theme.colors.onSurface, // Text on Card
    marginBottom: commonStyles.SPACING.xxsmall || 4, // Ensure xxsmall is defined
  },
  incomeText: { color: theme.colors.tertiary }, // Assuming tertiary is a green-like color in your theme
  expenseText: { color: theme.colors.error },
  netText: {
    // fontFamily: commonStyles.FONTS.bold, // Use PaperText variant or fontWeight style
    fontWeight: 'bold',
    marginTop: commonStyles.SPACING.xsmall || 6, // Ensure xsmall is defined
    color: theme.colors.onSurface,
  },
  listItem: {
    marginBottom: commonStyles.SPACING.small,
    paddingBottom: commonStyles.SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant, // Softer border
  },
  itemText: {
    // fontFamily: commonStyles.FONTS.regular,
    // fontSize: commonStyles.FONTS.sizes.small,
    color: theme.colors.onSurfaceVariant, // Muted text on Card
  },
  itemTextBold: {
    // fontFamily: commonStyles.FONTS.medium, // Handled by variant
    // fontSize: commonStyles.FONTS.sizes.small, // Handled by variant
    color: theme.colors.onSurface, // Emphasized text on Card
    marginBottom: commonStyles.SPACING.xxsmall || 4,
  },
  text: {
    // fontFamily: commonStyles.FONTS.regular,
    // fontSize: commonStyles.FONTS.sizes.small,
    color: theme.colors.onSurfaceVariant, // For placeholder texts like "No data"
    textAlign: 'center',
    paddingVertical: commonStyles.SPACING.small,
  },
  progressBar: { // Renamed from progressBarContainer
    height: 8, // Default height or adjust as needed
    borderRadius: theme.roundness, // Use theme's roundness
    marginTop: commonStyles.SPACING.xxsmall || 4,
    marginBottom: commonStyles.SPACING.xsmall || 6,
    backgroundColor: theme.colors.surfaceVariant, // Background for the track
  },
  // progressBarFill is no longer needed as ProgressBar handles its own fill
});
