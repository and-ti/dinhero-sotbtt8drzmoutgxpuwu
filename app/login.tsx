import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { getDBConnection, findUserByEmail, findUserByPhone, initDatabase, User } from '../src/database';
import { type SQLiteDatabase } from 'expo-sqlite';

export default function LoginScreen() {
  const router = useRouter();
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initializeDB = async () => {
      const connection = getDBConnection();
      // Assuming initDatabase is idempotent and safe to call
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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Phone"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType="email-address" // General enough for phone too
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
          message.startsWith('Login successful') ? styles.successMessage : styles.errorMessage
        ]}>
          {message}
        </Text>
      ) : null}

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Link href="/signup" style={styles.link}>
        Don't have an account? Sign Up
      </Link>
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
    marginBottom: 15, // Adjusted margin
    borderWidth: 1,
    borderColor: 'gray', // Standardized border color
    fontSize: 16,
  },
  button: {
    width: '80%',
    backgroundColor: '#007bff',
    paddingVertical: 12, // Adjusted padding
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center', // Center text inside button
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    marginTop: 15, // Adjusted from marginBottom
    marginBottom: 10, // Added some bottom margin before button
    fontSize: 16,
    width: '80%', // Match input width
  },
  errorMessage: {
    color: 'red',
  },
  successMessage: {
    color: 'green',
  },
  link: {
    marginTop: 20, // Keep margin for link
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16,
  },
});
