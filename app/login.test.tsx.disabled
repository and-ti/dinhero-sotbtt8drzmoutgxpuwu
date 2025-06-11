import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './login'; // Adjust path as necessary
import * as database from '../src/database'; // To mock its functions
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Link: jest.fn(({ href, children, style }) => <a href={href} style={style}>{children}</a>), // Basic mock for Link
}));

// Mock database functions
jest.mock('../src/database', () => ({
  ...jest.requireActual('../src/database'),
  getDBConnection: jest.fn(),
  initDatabase: jest.fn().mockResolvedValue(undefined),
  findUserByEmail: jest.fn(),
  findUserByPhone: jest.fn(),
}));

describe('LoginScreen', () => {
  const mockRouterReplace = jest.fn();
  let mockDbConnection: any;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password_hash: 'password123', // Plain text for now, as per app
    family_id: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockRouterReplace });
    mockDbConnection = {}; // Mock SQLiteDatabase object
    (database.getDBConnection as jest.Mock).mockReturnValue(mockDbConnection);
    (database.initDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email or Phone')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText("Don't have an account? Sign Up")).toBeTruthy();
  });

  it('shows error if fields are empty', async () => {
    const { getByText, findByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Login'));
    const message = await findByText('Email/Phone and Password are required.');
    expect(message).toBeTruthy();
  });

  it('handles successful login with email', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(database.findUserByEmail).toHaveBeenCalledWith(mockDbConnection, 'test@example.com');
    });
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
    });
  });

  it('handles successful login with phone number', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(null); // First attempt by email fails
    (database.findUserByPhone as jest.Mock).mockResolvedValue(mockUser);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(database.findUserByEmail).toHaveBeenCalledWith(mockDbConnection, '1234567890');
    });
    await waitFor(() => {
      expect(database.findUserByPhone).toHaveBeenCalledWith(mockDbConnection, '1234567890');
    });
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
    });
  });

  it('shows error for user not found (email)', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(null);

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), 'unknown@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Login'));

    const message = await findByText('Invalid email/phone or password.');
    expect(message).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('shows error for user not found (phone)', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(null); // Email check
    (database.findUserByPhone as jest.Mock).mockResolvedValue(null); // Phone check

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), '0000000000');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password');
    fireEvent.press(getByText('Login'));

    const message = await findByText('Invalid email/phone or password.');
    expect(message).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('shows error for incorrect password', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByText('Login'));

    const message = await findByText('Invalid email/phone or password.');
    expect(message).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('should call findUserByPhone if identifier does not contain "@"', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(null); // Simulate email not found or identifier is not email
    (database.findUserByPhone as jest.Mock).mockResolvedValue(mockUser); // User found by phone

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), '1234567890'); // Phone number
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(database.findUserByEmail).toHaveBeenCalledWith(mockDbConnection, '1234567890');
    });
    await waitFor(() => {
      expect(database.findUserByPhone).toHaveBeenCalledWith(mockDbConnection, '1234567890');
    });
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
    });
  });

  it('should NOT call findUserByPhone if identifier contains "@" and user is not found by email', async () => {
    (database.findUserByEmail as jest.Mock).mockResolvedValue(null); // User not found by email

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email or Phone'), 'nonexistent@example.com'); // Email format
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(database.findUserByEmail).toHaveBeenCalledWith(mockDbConnection, 'nonexistent@example.com');
    });
    expect(database.findUserByPhone).not.toHaveBeenCalled(); // Should not be called
    const message = await findByText('Invalid email/phone or password.');
    expect(message).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

});
