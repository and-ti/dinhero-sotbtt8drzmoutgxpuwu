import { Text, View, StyleSheet, TextInput, Button, FlatList, Alert } from "react-native";
import React, { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { getDBConnection, initDatabase, addItem, getAllItems } from '../../src/database'; // Adjusted path
import theme from '../../src/styles/theme'; // Import the theme

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
        <Text style={{ fontFamily: theme.FONTS.regular, fontSize: theme.FONTS.sizes.medium, color: theme.COLORS.subtleText }}>Loading database...</Text>
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
          placeholderTextColor={theme.COLORS.subtleText} // Use theme color for placeholder
        />
        {/* Consider styling Button component or using a custom Pressable for more control */}
        <Button title="Add Item" onPress={handleAddItem} color={theme.COLORS.primary} />
      </View>

      <Text style={styles.subtitle}>Items:</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={{ fontFamily: theme.FONTS.regular, color: theme.COLORS.text }}>{item.id}: {item.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ fontFamily: theme.FONTS.regular, color: theme.COLORS.subtleText, textAlign: 'center', marginTop: theme.SPACING.medium }}>No items yet. Add some!</Text>}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.SPACING.medium, // Use theme spacing
    backgroundColor: theme.COLORS.background, // Use theme background color
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background, // Use theme background color
  },
  title: {
    fontSize: theme.FONTS.sizes.xlarge, // Use theme font size
    fontFamily: theme.FONTS.bold, // Use theme font
    color: theme.COLORS.primary, // Use theme primary color
    marginBottom: theme.SPACING.medium, // Use theme spacing
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.FONTS.sizes.large, // Use theme font size
    fontFamily: theme.FONTS.bold, // Use theme font
    color: theme.COLORS.text, // Use theme text color
    marginTop: theme.SPACING.medium, // Use theme spacing
    marginBottom: theme.SPACING.small, // Use theme spacing
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.medium, // Use theme spacing
    alignItems: 'center', // Align items for better layout with button
  },
  input: {
    flex: 1,
    height: 44, // Adjusted height for better touch target
    borderColor: theme.COLORS.lightGray, // Use theme border color
    borderWidth: 1,
    borderRadius: theme.BORDER_RADIUS.small, // Use theme border radius
    paddingHorizontal: theme.SPACING.small, // Use theme spacing
    marginRight: theme.SPACING.small, // Use theme spacing
    fontFamily: theme.FONTS.regular, // Use theme font
    fontSize: theme.FONTS.sizes.medium, // Use theme font size
    backgroundColor: theme.COLORS.white, // Input background
    color: theme.COLORS.text,
  },
  list: {
    flexGrow: 1,
  },
  itemContainer: {
    paddingVertical: theme.SPACING.small, // Use theme spacing
    paddingHorizontal: theme.SPACING.small, // Use theme spacing
    borderBottomColor: theme.COLORS.lightGray, // Use theme border color
    borderBottomWidth: 1,
    backgroundColor: theme.COLORS.cardBackground, // Use theme card background
    marginBottom: theme.SPACING.small, // Use theme spacing
    borderRadius: theme.BORDER_RADIUS.small, // Use theme border radius
  },
});

// Note: The Button component has limited styling options.
// For a fully themed button, a custom component using <Pressable> and <Text> would be needed.
// For example:
// <Pressable style={styles.button} onPress={handleAddItem}>
//   <Text style={styles.buttonText}>Add Item</Text>
// </Pressable>
//
// And in StyleSheet:
// button: {
//   backgroundColor: theme.COLORS.primary,
//   paddingVertical: theme.SPACING.small,
//   paddingHorizontal: theme.SPACING.medium,
//   borderRadius: theme.BORDER_RADIUS.small,
//   alignItems: 'center',
//   justifyContent: 'center',
//   height: 44, // Match input height
// },
// buttonText: {
//   color: theme.COLORS.white,
//   fontFamily: theme.FONTS.bold,
//   fontSize: theme.FONTS.sizes.medium,
// }
