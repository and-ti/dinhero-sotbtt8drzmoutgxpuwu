import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import OrcamentosScreen from './orcamentos'; // Adjust path as necessary
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext'; // Adjust path
import { darkTheme } from '../../src/styles/theme'; // Adjust path
import type { Budget } from '../../src/database'; // Adjust path

// Mock the database module
jest.mock('../../src/database', () => ({
  getDBConnection: jest.fn(), // Not directly used by screen, but good to mock
  getBudgetsByFamilyId: jest.fn(),
  // Mock other DB functions if they were to be used directly by the screen
}));

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
  ...jest.requireActual('../../src/context/ThemeContext'), // Import and retain default behavior
  useTheme: () => ({
    theme: darkTheme, // Provide a default theme for tests
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));


const mockBudgets: Budget[] = [
  { id: 1, name: 'Groceries', amount: 150, category: 'Food', startDate: '2024-01-01', endDate: '2024-01-31', family_id: 1 },
  { id: 2, name: 'Transport', amount: 80, category: 'Commute', startDate: '2024-01-01', endDate: '2024-01-31', family_id: 1 },
];

const emptyMockBudgets: Budget[] = [];

// Helper to render with ThemeProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};


describe('OrcamentosScreen', () => {
  const { getBudgetsByFamilyId } = require('../../src/database');

  beforeEach(() => {
    // Clear mock calls before each test
    (getBudgetsByFamilyId as jest.Mock).mockClear();
  });

  test('should display budgets correctly when budgets are available', async () => {
    (getBudgetsByFamilyId as jest.Mock).mockResolvedValue(mockBudgets);

    renderWithProviders(<OrcamentosScreen />);

    // Wait for budgets to load and be displayed
    await waitFor(() => {
      expect(screen.getByText('Nome: Groceries')).toBeTruthy();
      expect(screen.getByText('Valor: R$ 150.00')).toBeTruthy();
      expect(screen.getByText('Categoria: Food')).toBeTruthy();
      expect(screen.getByText('Início: 2024-01-01')).toBeTruthy();
      expect(screen.getByText('Fim: 2024-01-31')).toBeTruthy();
    });

    expect(screen.getByText('Nome: Transport')).toBeTruthy();
    expect(screen.getByText('Valor: R$ 80.00')).toBeTruthy();

    // Check for Add button
    expect(screen.getByText('Adicionar Novo Orçamento')).toBeTruthy();

    // Check for Edit and Delete buttons for each item
    const editButtons = screen.getAllByText('Editar');
    const deleteButtons = screen.getAllByText('Excluir');
    expect(editButtons.length).toBe(mockBudgets.length);
    expect(deleteButtons.length).toBe(mockBudgets.length);
  });

  test('should display "Nenhum orçamento encontrado." when no budgets are available', async () => {
    (getBudgetsByFamilyId as jest.Mock).mockResolvedValue(emptyMockBudgets);

    renderWithProviders(<OrcamentosScreen />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum orçamento encontrado.')).toBeTruthy();
    });

    // Check for Add button even when no budgets
    expect(screen.getByText('Adicionar Novo Orçamento')).toBeTruthy();
  });

  test('should call console.log when add button is pressed', async () => {
    (getBudgetsByFamilyId as jest.Mock).mockResolvedValue(emptyMockBudgets);
    const consoleSpy = jest.spyOn(console, 'log');

    renderWithProviders(<OrcamentosScreen />);

    await waitFor(() => {
      expect(screen.getByText('Adicionar Novo Orçamento')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Adicionar Novo Orçamento'));
    expect(consoleSpy).toHaveBeenCalledWith('Add new budget');
    consoleSpy.mockRestore();
  });

  test('should call console.log with budget id when edit and delete buttons are pressed', async () => {
    (getBudgetsByFamilyId as jest.Mock).mockResolvedValue(mockBudgets);
    const consoleSpy = jest.spyOn(console, 'log');

    renderWithProviders(<OrcamentosScreen />);

    await waitFor(() => {
      expect(screen.getByText('Nome: Groceries')).toBeTruthy();
    });

    const editButtons = screen.getAllByText('Editar');
    const deleteButtons = screen.getAllByText('Excluir');

    fireEvent.press(editButtons[0]);
    expect(consoleSpy).toHaveBeenCalledWith('Edit budget', mockBudgets[0].id);

    fireEvent.press(deleteButtons[0]);
    expect(consoleSpy).toHaveBeenCalledWith('Delete budget', mockBudgets[0].id);

    consoleSpy.mockRestore();
  });

  test('should handle error when fetching budgets fails', async () => {
    const errorMessage = "Failed to load budgets";
    (getBudgetsByFamilyId as jest.Mock).mockRejectedValue(new Error(errorMessage));
    const consoleErrorSpy = jest.spyOn(console, 'error');

    renderWithProviders(<OrcamentosScreen />);

    await waitFor(() => {
      // Check if the error message is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to load budgets:", expect.any(Error));
      // Optionally, check if a user-facing error message is displayed, if implemented
      // For now, the component just logs the error.
    });

    // Even with error, the add button and empty state text might be visible
    expect(screen.getByText('Adicionar Novo Orçamento')).toBeTruthy();
    expect(screen.getByText('Nenhum orçamento encontrado.')).toBeTruthy();


    consoleErrorSpy.mockRestore();
  });

});
