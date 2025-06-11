import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from './signup'; // Adjust path if your file structure is different
import * as database from '../src/database'; // To mock its functions
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Link: jest.fn(({ href, children }) => <a href={href}>{children}</a>), // Basic mock for Link
}));

// Mock database functions
jest.mock('../src/database', () => ({
  ...jest.requireActual('../src/database'), // Import and retain default behavior for unmocked functions
  getDBConnection: jest.fn(),
  initDatabase: jest.fn().mockResolvedValue(undefined),
  addUser: jest.fn(),
  addFamily: jest.fn(),
  findFamilyByName: jest.fn(),
}));

describe('SignUpScreen', () => {
  const mockRouterReplace = jest.fn();
  let mockDbConnection: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ replace: mockRouterReplace });

    // Mock DB connection and init
    mockDbConnection = {}; // Mock SQLiteDatabase object as needed by component
    (database.getDBConnection as jest.Mock).mockReturnValue(mockDbConnection);
    (database.initDatabase as jest.Mock).mockResolvedValue(undefined); // Ensure initDatabase does not throw
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    expect(getByPlaceholderText('Full Name (e.g., John Doe)')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  it('shows error if required fields are empty', async () => {
    const { getByText, findByText } = render(<SignUpScreen />);
    fireEvent.press(getByText('Sign Up'));
    const message = await findByText('Name, Email, and Password are required.');
    expect(message).toBeTruthy();
  });

  it('handles successful signup for new user, no family name', async () => {
    (database.addUser as jest.Mock).mockResolvedValue(1); // Mock successful user addition

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name (e.g., John Doe)'), 'John');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(database.addUser).toHaveBeenCalledWith(
        mockDbConnection,
        'John', // Name
        null,   // Phone (optional, not filled)
        'john@example.com',
        'password123', // Password (plain text, as per current implementation)
        null    // Family ID (no family name part)
      );
    });
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/login'));
  });

  it('handles successful signup for new user with new family name', async () => {
    (database.findFamilyByName as jest.Mock).mockResolvedValue(null); // Family does not exist
    (database.addFamily as jest.Mock).mockResolvedValue(10); // New family ID is 10
    (database.addUser as jest.Mock).mockResolvedValue(2); // New user ID is 2

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name (e.g., John Doe)'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'jane.doe@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securepass');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(database.findFamilyByName).toHaveBeenCalledWith(mockDbConnection, 'Doe');
    });
    await waitFor(() => {
      expect(database.addFamily).toHaveBeenCalledWith(mockDbConnection, 'Doe');
    });
    await waitFor(() => {
      expect(database.addUser).toHaveBeenCalledWith(
        mockDbConnection,
        'Jane', // Given name
        null,
        'jane.doe@example.com',
        'securepass',
        10 // New family ID
      );
    });
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/login'));
  });

  it('handles successful signup for new user with existing family name', async () => {
    (database.findFamilyByName as jest.Mock).mockResolvedValue({ id: 5, name: 'Smith' }); // Family exists
    (database.addUser as jest.Mock).mockResolvedValue(3);

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name (e.g., John Doe)'), 'Peter Smith');
    fireEvent.changeText(getByPlaceholderText('Email'), 'peter.smith@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'anotherpass');
    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(database.findFamilyByName).toHaveBeenCalledWith(mockDbConnection, 'Smith');
    });
    await waitFor(() => {
      expect(database.addFamily).not.toHaveBeenCalled(); // Should not add existing family
    });
    await waitFor(() => {
      expect(database.addUser).toHaveBeenCalledWith(
        mockDbConnection,
        'Peter',
        null,
        'peter.smith@example.com',
        'anotherpass',
        5 // Existing family ID
      );
    });
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/login'));
  });

  it('shows error message if email already exists', async () => {
    // Mock addUser to throw a unique constraint error
     const error = new Error('UNIQUE constraint failed: users.email');
    (database.addUser as jest.Mock).mockRejectedValue(error);

    const { getByPlaceholderText, getByText, findByText }_ = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name (e.g., John Doe)'), 'Existing User');
    fireEvent.changeText(getByPlaceholderText('Email'), 'exists@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Sign Up'));

    // Check for the error message in the UI
    const errorMessage = await findByText('This email is already registered.');
    expect(errorMessage).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('shows a generic error message if addFamily fails', async () => {
    (database.findFamilyByName as jest.Mock).mockResolvedValue(null); // Family does not exist
    const familyError = new Error('Failed to create family');
    (database.addFamily as jest.Mock).mockRejectedValue(familyError); // Mock addFamily failure

    const { getByPlaceholderText, getByText, findByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Full Name (e.g., John Doe)'), 'Error FamilyUser');
    fireEvent.changeText(getByPlaceholderText('Email'), 'ef@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign Up'));

    const errorMessage = await findByText(`Error creating family: ${familyError.message}`);
    expect(errorMessage).toBeTruthy();
    expect(database.addUser).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

});
