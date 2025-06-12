// app/(tabs)/dashboard.test.tsx
import React from 'react';
import renderer from 'react-test-renderer';
import DashboardScreen from './dashboard';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  getDBConnection: jest.fn(() => ({
    transaction: jest.fn((callback) => callback({
      executeSql: jest.fn(),
    })),
  })),
  initDatabase: jest.fn(() => Promise.resolve()),
  addItem: jest.fn(() => Promise.resolve()),
  getAllItems: jest.fn(() => Promise.resolve([])), // Start with empty items for consistent snapshot
}));


// Mock the database module
jest.mock('../../src/database', () => ({
  getDBConnection: jest.fn(() => ({
    transaction: jest.fn(async (callback) => {
      const mockTx = {
        executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
          if (sql.includes("SELECT")) { // Simulate fetching items
            if (successCallback) successCallback(mockTx, { rows: { _array: [] } });
          } else { // Simulate other operations (INSERT, CREATE TABLE)
             if (successCallback) successCallback(mockTx, { rowsAffected: 1 });
          }
        }),
      };
      try {
        await callback(mockTx);
      } catch (e) {
        // console.error("Transaction error in mock", e);
      }
    }),
  })),
  initDatabase: jest.fn(() => Promise.resolve()),
  addItem: jest.fn(() => Promise.resolve()),
  getAllItems: jest.fn(() => Promise.resolve([])),
}));


// Mock expo-router's useRouter for components that might use it (even if not directly in DashboardScreen, good practice for consistency)
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'), // Import and retain default behavior
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: jest.requireActual('expo-router').Stack, // Ensure Stack is not undefined
  Tabs: jest.requireActual('expo-router').Tabs,   // Ensure Tabs is not undefined
}));


describe('<DashboardScreen />', () => {
  it('renders correctly and matches snapshot', async () => {
    let tree;
    // Use act to handle state updates from useEffect
    await renderer.act(async () => {
      tree = renderer.create(<DashboardScreen />);
    });
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
