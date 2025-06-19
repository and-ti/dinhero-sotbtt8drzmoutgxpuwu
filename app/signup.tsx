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
import { addFamily, addUser, findFamilyByName, getDBConnection, initDatabase } from '../src/database';
import { PaperThemeType } from '../src/styles/theme'; // Import theme type

export default function SignUpScreen() {
  const router = useRouter();
  const theme = useTheme<PaperThemeType>(); // Use theme
  const styles = getDynamicStyles(theme); // Generate styles with theme

  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [message, setMessage] = useState('');

  const handleFullNameChange = (text: string) => {
    setName(text); // Set the full name
    const parts = text.trim().split(' ');
    if (parts.length > 1) {
      const lastName = parts[parts.length - 1];
      setFamilyName(lastName); // Auto-fill family name from last word of full name
    } else {
      setFamilyName(''); // Clear family name if full name has no spaces or is a single word
    }
  };

  useEffect(() => {
    const initializeDB = async () => {
      const connection = getDBConnection();
      await initDatabase(connection);
      setDb(connection);
    };
    initializeDB();
  }, []);

  const handleSignUp = async () => {
    if (!db) {
      setMessage('Database connection not available.');
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage('Name, Email, and Password are required.');
      return;
    }

    // Use name state directly for full name, and familyName state for family name
    const userFullName = name.trim();
    const currentFamilyName = familyName.trim(); // Use the dedicated familyName state

    let familyId: number | null = null;

    try {
      if (currentFamilyName) { // Check if familyName state is not empty
        let existingFamily = await findFamilyByName(db, currentFamilyName);
        if (existingFamily) {
          familyId = existingFamily.id;
        } else {
          try {
            const newFamilyId = await addFamily(db, currentFamilyName);
            familyId = newFamilyId;
          } catch (e: any) {
            console.error('Error creating family:', e);
            setMessage(`Error creating family: ${e.message || e}`);
            return;
          }
        }
      }

      // NOTE: Storing plain text password. Hashing should be implemented.
      // The 'name' parameter for addUser should be the user's individual name,
      // which is 'userFullName' from the 'name' state.
      const passwordHash = password;
      await addUser(db, userFullName, phone.trim() || null, email.trim(), passwordHash, familyId);
      setMessage('Account created successfully! Redirecting to login...'); // Success message
      setTimeout(() => {
        router.replace('/login');
      }, 1500);

    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
        setMessage('This email is already registered.'); // Error message
      } else if (error.message && error.message.includes('UNIQUE constraint failed: users.phone')) {
        setMessage('This phone number is already registered.'); // Error message
      } else {
        setMessage(`Error creating account: ${error.message || error}`); // Error message
      }
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
        <PaperText variant="headlineLarge" style={styles.title}>Create Account</PaperText>

        <PaperTextInput
          label="Full Name (e.g., John Doe)"
          value={name}
          onChangeText={handleFullNameChange}
          style={styles.input}
          autoCapitalize="words"
          mode="outlined"
        />
        <PaperTextInput
          label="Family Name (Optional, auto-filled)"
          value={familyName}
          onChangeText={setFamilyName}
          style={styles.input}
          autoCapitalize="words"
          mode="outlined"
        />
        <PaperTextInput
          label="Phone (Optional)"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
          mode="outlined"
        />
        <PaperTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
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
            message.startsWith('Account created successfully') ? styles.successMessage : styles.errorMessage
          ]}
          variant="bodyMedium"
          >
            {message}
          </PaperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSignUp}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Sign Up
        </Button>

        <Button
            mode="text"
            onPress={() => router.replace('/login')} // Use replace to avoid back to signup
            style={styles.linkButton}
        >
            Already have an account? Login
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
    marginBottom: theme.SPACING.large,
    textAlign: 'center',
    color: theme.colors.primary,
  },
  input: {
    width: '90%',
    marginBottom: theme.SPACING.medium,
  },
  button: {
    width: '90%',
    borderRadius: theme.BORDER_RADIUS.button,
    marginTop: theme.SPACING.medium,
  },
  buttonLabel: {
    // fontFamily: theme.FONTS.medium, // Optional: if default button font needs override
    // fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginTop: theme.SPACING.medium,
    marginBottom: theme.SPACING.small,
    width: '90%',
  },
  errorMessage: {
    color: theme.colors.error,
  },
  successMessage: {
    color: theme.colors.success,
  },
  linkButton: {
    marginTop: theme.SPACING.medium,
  },
});
