import type { SQLiteDatabase } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Text as PaperText, ProgressBar, useTheme } from 'react-native-paper';
// Removed useTheme from context, assuming Paper's useTheme is now standard
import {
  Budget,
  Debt,
  getBudgetsByFamilyId,
  getDBConnection,
  getDebtsByFamilyId,
  getGoalsByFamilyId,
  getTransactionsByFamilyId,
  Goal,
  initDatabase
} from '../../src/database';
import { PaperThemeType } from '../../src/styles/theme'; // Import PaperThemeType

// Types remain the same
interface MonthlySummary {
  income: number;
  expenses: number;
  net: number;
}

interface BudgetWithSpending extends Budget {
  spentAmount: number;
}

export default function DashboardScreen() {
  const theme = useTheme<PaperThemeType>(); // Use Paper's useTheme with type
  const styles = getDynamicStyles(theme);

  // State hooks
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [summaryData, setSummaryData] = useState<MonthlySummary | null>(null);
  const [activeBudgets, setActiveBudgets] = useState<BudgetWithSpending[]>([]);
  const [outstandingDebts, setOutstandingDebts] = useState<Debt[]>([]);
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
    return <View style={styles.centered}><ActivityIndicator animating={true} color={theme.colors.primary} size="large" /><PaperText style={styles.loadingText} variant="bodyLarge">Inicializando banco de dados...</PaperText></View>;
  }
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator animating={true} color={theme.colors.primary} size="large" /><PaperText style={styles.loadingText} variant="bodyLarge">Carregando dashboard...</PaperText></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <PaperText variant="headlineMedium" style={styles.headerTitle}>Painel Financeiro</PaperText>

      {/* Resumo Mensal */}
      <Card style={styles.sectionCard} elevation={theme.ELEVATION.small}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Resumo Mensal</PaperText>
          {summaryData ? (
            <>
              <PaperText variant="bodyMedium" style={[styles.summaryText, styles.incomeText]}>Receitas: R$ {summaryData.income.toFixed(2)}</PaperText>
              <PaperText variant="bodyMedium" style={[styles.summaryText, styles.expenseText]}>Despesas: R$ {summaryData.expenses.toFixed(2)}</PaperText>
              <PaperText variant="bodyLarge" style={[styles.summaryText, styles.netText]}>Saldo: R$ {summaryData.net.toFixed(2)}</PaperText>
            </>
          ) : <PaperText style={styles.placeholderText}>Calculando resumo...</PaperText>}
        </Card.Content>
      </Card>

      {/* Orçamentos Ativos */}
      <Card style={styles.sectionCard} elevation={theme.ELEVATION.small}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Orçamentos Ativos</PaperText>
          {activeBudgets.length > 0 ? activeBudgets.map(budget => {
            const progress = budget.amount > 0 ? Math.min(budget.spentAmount / budget.amount, 1) : 0;
            return (
              <View key={budget.id} style={styles.listItem}>
                <PaperText variant="labelLarge" style={styles.itemTextEmphasis}>{budget.name}</PaperText>
                <PaperText variant="bodySmall" style={styles.itemTextSecondary}>Gasto: R$ {budget.spentAmount.toFixed(2)} de R$ {budget.amount.toFixed(2)}</PaperText>
                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
              </View>
            );
          }) : <PaperText style={styles.placeholderText}>Nenhum orçamento ativo.</PaperText>}
        </Card.Content>
      </Card>

      {/* Dívidas Pendentes */}
      <Card style={styles.sectionCard} elevation={theme.ELEVATION.small}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Dívidas Pendentes</PaperText>
          {outstandingDebts.length > 0 ? outstandingDebts.map(debt => (
            <View key={debt.id} style={styles.listItem}>
              <PaperText variant="labelLarge" style={styles.itemTextEmphasis}>{debt.description}</PaperText>
              <PaperText variant="bodySmall" style={styles.itemTextSecondary}>Valor: R$ {debt.amount.toFixed(2)} {debt.due_date ? `- Vence: ${new Date(debt.due_date+"T00:00:00").toLocaleDateString()}` : ''}</PaperText>
            </View>
          )) : <PaperText style={styles.placeholderText}>Nenhuma dívida pendente. 🎉</PaperText>}
        </Card.Content>
      </Card>

      {/* Metas em Andamento */}
      <Card style={styles.sectionCard} elevation={theme.ELEVATION.small}>
        <Card.Content>
          <PaperText variant="titleMedium" style={styles.sectionTitle}>Metas em Andamento</PaperText>
          {activeGoals.length > 0 ? activeGoals.map(goal => {
            const progress = goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
            return (
              <View key={goal.id} style={styles.listItem}>
                <PaperText variant="labelLarge" style={styles.itemTextEmphasis}>{goal.name}</PaperText>
                <PaperText variant="bodySmall" style={styles.itemTextSecondary}>Progresso: R$ {goal.current_amount.toFixed(2)} de R$ {goal.target_amount.toFixed(2)}</PaperText>
                <ProgressBar progress={progress} color={theme.colors.secondary} style={styles.progressBar} />
              </View>
            );
          }) : <PaperText style={styles.placeholderText}>Nenhuma meta em andamento.</PaperText>}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const getDynamicStyles = (theme: PaperThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: { // Added for ScrollView padding
    paddingBottom: theme.SPACING.medium, // Ensure space at the bottom
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.SPACING.medium,
  },
  loadingText: {
    marginTop: theme.SPACING.small,
    color: theme.colors.onBackground,
    // fontSize: theme.FONTS.sizes.medium, // Handled by variant
  },
  headerTitle: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginVertical: theme.SPACING.large, // Increased vertical margin
    paddingHorizontal: theme.SPACING.medium, // Added horizontal padding
  },
  sectionCard: {
    // backgroundColor: theme.colors.surface, // Handled by Card
    // borderRadius: theme.roundness, // Handled by Card theme, consider theme.BORDER_RADIUS.medium for consistency
    borderRadius: theme.BORDER_RADIUS.large, // Explicitly using larger radius
    // padding: theme.SPACING.small, // Card.Content handles padding, this might be extra
    marginBottom: theme.SPACING.large, // Increased bottom margin
    marginHorizontal: theme.SPACING.medium,
    // elevation: theme.ELEVATION.small, // Passed as prop
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    marginBottom: theme.SPACING.medium, // Increased margin
  },
  summaryText: {
    color: theme.colors.onSurface,
    marginBottom: theme.SPACING.small, // Increased margin
  },
  incomeText: {
    color: theme.colors.success, // Using success for income
  },
  expenseText: {
    color: theme.colors.error,
  },
  netText: {
    // fontFamily: theme.FONTS.bold, // Handled by variant="bodyLarge" potentially, or use fontWeight
    fontWeight: 'bold', // Keep if variant doesn't cover
    marginTop: theme.SPACING.small,
    color: theme.colors.onSurface,
  },
  listItem: {
    marginBottom: theme.SPACING.medium,
    paddingBottom: theme.SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth, // Thinner border
    borderBottomColor: theme.colors.outlineVariant,
  },
  itemTextSecondary: { // Replaces itemText
    color: theme.colors.onSurfaceVariant,
  },
  itemTextEmphasis: { // Replaces itemTextBold
    color: theme.colors.onSurface,
    marginBottom: theme.SPACING.xxsmall,
  },
  placeholderText: { // Replaces text style for placeholders
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: theme.SPACING.medium, // Increased padding
  },
  progressBar: {
    height: 10, // Slightly increased height
    borderRadius: theme.BORDER_RADIUS.medium, // More rounded
    marginTop: theme.SPACING.xsmall,
    // marginBottom: theme.SPACING.xsmall, // Removed if not needed after listItem paddingBottom
    backgroundColor: theme.colors.surfaceVariant,
  },
});
