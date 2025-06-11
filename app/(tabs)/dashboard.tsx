import { Text, View, StyleSheet, TextInput, Button, FlatList, Alert } from "react-native";
import React, { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { getDBConnection, initDatabase, addItem, getAllItems } from '../../src/database'; // Adjusted path

interface Item {
  id: number;
  name: string;
}

export default function DashboardScreen() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const connection = getDBConnection();
        setDb(connection);
        await initDatabase(connection);
        await fetchItems(connection);
      } catch (error) {
        console.error("Initialization error", error);
        Alert.alert("Error", "Failed to initialize database.");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const fetchItems = async (database: SQLite.SQLiteDatabase) => {
    if (!database) return;
    try {
      const fetchedItems = await getAllItems(database);
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching items", error);
      Alert.alert("Error", "Failed to fetch items.");
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Validation", "Item name cannot be empty.");
      return;
    }
    if (!db) {
      Alert.alert("Error", "Database not connected.");
      return;
    }
    try {
      await addItem(db, newItemName);
      setNewItemName('');
      await fetchItems(db); // Refresh items after adding
    } catch (error) {
      console.error("Error adding item", error);
      Alert.alert("Error", "Failed to add item.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Demo</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter item name"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <Button title="Add Item" onPress={handleAddItem} />
      </View>

      <Text style={styles.subtitle}>Items:</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text>{item.id}: {item.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No items yet. Add some!</Text>}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  list: {
    flexGrow: 1,
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    backgroundColor: '#f9f9f9',
    marginBottom: 4,
    borderRadius: 4,
  },
});
