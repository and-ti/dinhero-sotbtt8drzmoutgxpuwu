import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getDBConnection, addUser, findFamilyByName, addFamily, initDatabase } from '../src/database';
import { type SQLiteDatabase } from 'expo-sqlite';

export default function SignUpScreen() {
  const router = useRouter();
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

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

    let familyName = '';
    let currentUserName = name.trim(); // Default to full name
    const nameParts = name.trim().split(' ');

    if (nameParts.length > 1) {
      familyName = nameParts.pop() as string; // Last part is family name
      currentUserName = nameParts.join(' '); // Remainder is given name
    }

    let familyId: number | null = null;

    try {
      if (familyName) {
        let existingFamily = await findFamilyByName(db, familyName);
        if (existingFamily) {
          familyId = existingFamily.id;
        } else {
          try {
            const newFamilyId = await addFamily(db, familyName);
            familyId = newFamilyId;
          } catch (e: any) {
            console.error('Error creating family:', e);
            setMessage(`Error creating family: ${e.message || e}`);
            return;
          }
        }
      }

      // NOTE: Storing plain text password. Hashing should be implemented.
      const passwordHash = password;
      await addUser(db, currentUserName, phone.trim() || null, email.trim(), passwordHash, familyId);
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name (e.g., John Doe)"
        value={name}
        onChangeText={setName}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Center form elements
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24, // Adjusted size
    fontWeight: 'bold',
    marginBottom: 20, // Adjusted margin
    textAlign: 'center',
    color: '#333',
  },
  input: {
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
});
