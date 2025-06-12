import { Link, useRouter } from 'expo-router';
import { type SQLiteDatabase } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput
} from 'react-native';
import { addFamily, addUser, findFamilyByName, getDBConnection, initDatabase } from '../src/database';

export default function SignUpScreen() {
  const router = useRouter();
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState(''); // New state for Family Name
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
        <Text style={styles.title}>Create Account</Text>

        <TextInput
        style={styles.input}
        placeholder="Full Name (e.g., John Doe)"
        value={name}
        onChangeText={handleFullNameChange} // Use the new handler
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Family Name (Optional, auto-filled)"
        value={familyName}
        onChangeText={setFamilyName} // Allow direct editing
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone (Optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {message ? (
        <Text style={[
          styles.message,
          message.startsWith('Account created successfully') ? styles.successMessage : styles.errorMessage
        ]}>
          {message}
        </Text>
      ) : null}

      <Pressable style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>

      <Link href="/login" style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Background for the KAV
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Keep padding for content within scroll view
    paddingHorizontal: 20,
  },
  // container style is removed as its properties are split or moved
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: { // Input styles remain largely the same
    width: '80%', // Width for input fields
    height: 45, // Height for input fields
    backgroundColor: '#fff',
    paddingHorizontal: 10, // Adjusted padding
    borderRadius: 5,  // Adjusted radius
    marginBottom: 15, 
    borderWidth: 1,
    borderColor: 'gray', // Standardized border color
    fontSize: 16,
  },
  button: {
    width: '80%',
    backgroundColor: '#007bff', // Standard blue
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    marginTop: 15, 
    marginBottom: 10, 
    fontSize: 16,
    width: '80%',
  },
  errorMessage: {
    color: 'red',
  },
  successMessage: {
    color: 'green',
  },
  loginLink: {
    marginTop: 20, // Adjusted from 15 to provide a bit more space from button
    padding: 5, // Add some padding to make it easier to press
  },
  loginLinkText: {
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16, // Match other text where appropriate
  },
});
