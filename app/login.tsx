import { useRouter } from 'expo-router';
import { type SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import {
  Button,
  Text as PaperText,
  TextInput as PaperTextInput,
  useTheme,
} from 'react-native-paper';
import { findUserByEmail, findUserByPhone, getDBConnection, initDatabase, User } from '../src/database';
import { PaperThemeType } from '../src/styles/theme'; // Import theme type

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme<PaperThemeType>(); // Use theme
  const styles = getDynamicStyles(theme); // Generate styles with theme

  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Initialize DB - useEffect remains the same
  useEffect(() => {
    const initializeDB = async () => {
      const connection = getDBConnection();
      await initDatabase(connection);
      setDb(connection);
    };
    initializeDB();
  }, []);

  const handleLogin = async () => {
    if (!db) {
      setMessage('Database connection not available.');
      return;
    }

    if (!identifier.trim() || !password.trim()) {
      setMessage('Email/Phone and Password are required.');
      return;
    }

    let user: User | null = null;

    try {
      // Try finding by email first
      user = await findUserByEmail(db, identifier.trim());

      // If not found by email and identifier doesn't look like an email, try by phone
      if (!user && !identifier.includes('@')) {
        user = await findUserByPhone(db, identifier.trim());
      }

      if (user) {
        // NOTE: Plain text password comparison. Hashing and secure comparison needed.
        if (user.password_hash === password) {
          console.log('Login successful for user:', user.id);
          setMessage('Login successful! Redirecting...'); // Success message
          // TODO: Implement actual session management (e.g., store session token)
          router.replace('/(tabs)/dashboard'); // Navigate to a protected route
        } else {
          setMessage('Invalid email/phone or password.'); // Error message
        }
      } else {
        setMessage('Invalid email/phone or password.'); // Error message
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setMessage(`Login failed: ${error.message || error}`); // Error message
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <PaperText variant="headlineLarge" style={styles.title}>Login</PaperText>

        <PaperTextInput
          label="Email or Phone"
          value={identifier}
          onChangeText={setIdentifier}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
        />
        <PaperTextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          mode="outlined"
        />

        {message ? (
          <PaperText style={[
            styles.message,
            message.startsWith('Login successful') ? styles.successMessage : styles.errorMessage
          ]}
          variant="bodyMedium"
          >
            {message}
          </PaperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          labelStyle={styles.buttonLabel} // For font theming if needed
          // buttonColor={theme.colors.primary} // Usually handled by theme
          // textColor={theme.colors.onPrimary} // Usually handled by theme
        >
          Login
        </Button>

        <Button
            mode="text"
            onPress={() => router.push('/signup')}
            style={styles.linkButton}
            // textColor={theme.colors.primary} // Usually handled by theme for text mode
        >
            Don't have an account? Sign Up
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getDynamicStyles = (theme: PaperThemeType) => StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.SPACING.large,
    paddingHorizontal: theme.SPACING.medium,
  },
  title: {
    // fontSize: 24, // From variant
    // fontWeight: 'bold', // From variant
    marginBottom: theme.SPACING.large,
    textAlign: 'center',
    color: theme.colors.primary, // Or theme.colors.text
  },
  input: {
    width: '90%', // Adjusted width
    // height: 45, // PaperTextInput handles height
    // backgroundColor: theme.colors.surface, // PaperTextInput handles background
    // paddingHorizontal: 10, // PaperTextInput handles padding
    // borderRadius: 5, // PaperTextInput handles radius via theme.roundness
    marginBottom: theme.SPACING.medium,
    // borderWidth: 1, // PaperTextInput handles border
    // borderColor: 'gray', // PaperTextInput handles border color via theme
    // fontSize: 16, // PaperTextInput handles font size
  },
  button: {
    width: '90%',
    // backgroundColor: theme.colors.primary, // Handled by mode="contained"
    // paddingVertical: 12, // Paper Button has default padding
    // paddingHorizontal: 20, // Paper Button has default padding
    borderRadius: theme.BORDER_RADIUS.button, // Use theme border radius for buttons
    marginTop: theme.SPACING.medium,
    // alignItems: 'center', // Handled by Button
  },
  buttonLabel: { // Example if you need to override button text style
    // fontFamily: theme.FONTS.medium, // if default button font is not desired
    // fontSize: theme.FONTS.sizes.medium, // if default button font size is not desired
    // fontWeight: 'bold', // if default button font weight is not desired
  },
  message: {
    textAlign: 'center',
    marginTop: theme.SPACING.medium,
    marginBottom: theme.SPACING.small,
    // fontSize: 16, // From variant
    width: '90%',
  },
  errorMessage: {
    color: theme.colors.error,
  },
  successMessage: {
    color: theme.colors.success, // Assuming success color exists in theme
  },
  linkButton: { // Replaces link style
    marginTop: theme.SPACING.medium,
    // color: theme.colors.primary, // Handled by Button mode="text"
    // textAlign: 'center', // Handled by Button
    // fontSize: 16, // Handled by Button label style or default
  },
});
