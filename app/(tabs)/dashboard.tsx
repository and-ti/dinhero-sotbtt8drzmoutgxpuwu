import { Text, View, StyleSheet, TextInput, Button, FlatList, Alert } from "react-native";
import React, { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { getDBConnection, initDatabase, addItem, getAllItems } from '../../src/database'; // Adjusted path
// import theme from '../../src/styles/theme'; // REMOVE THIS
import { useTheme } from '../../src/context/ThemeContext'; // ADD THIS
import { commonStyles } from '../../src/styles/theme'; // Import commonStyles

interface Item {
  id: number;
  name: string;
}

export default function DashboardScreen() {
  const { theme } = useTheme(); // ADD THIS
  const styles = getDynamicStyles(theme); // ADD THIS

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
        <Text style={styles.loadingText}>Loading database...</Text>
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
          placeholderTextColor={theme.COLORS.subtleText}
        />
        <Button title="Add Item" onPress={handleAddItem} color={theme.COLORS.primary} />
      </View>

      <Text style={styles.subtitle}>Items:</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{item.id}: {item.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyListText}>No items yet. Add some!</Text>}
        style={styles.list}
      />
    </View>
  );
}

const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    padding: commonStyles.SPACING.medium,
    backgroundColor: theme.COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background,
  },
  loadingText: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.COLORS.subtleText,
  },
  title: {
    fontSize: commonStyles.FONTS.sizes.xlarge,
    fontFamily: commonStyles.FONTS.bold,
    color: theme.COLORS.primary,
    marginBottom: commonStyles.SPACING.medium,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: commonStyles.FONTS.sizes.large,
    fontFamily: commonStyles.FONTS.bold,
    color: theme.COLORS.text,
    marginTop: commonStyles.SPACING.medium,
    marginBottom: commonStyles.SPACING.small,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: commonStyles.SPACING.medium,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: theme.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: commonStyles.BORDER_RADIUS.small,
    paddingHorizontal: commonStyles.SPACING.small,
    marginRight: commonStyles.SPACING.small,
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    backgroundColor: theme.COLORS.inputBackground,
    color: theme.COLORS.text,
  },
  list: {
    flexGrow: 1,
  },
  itemContainer: {
    paddingVertical: commonStyles.SPACING.small,
    paddingHorizontal: commonStyles.SPACING.small,
    borderBottomColor: theme.COLORS.lightGray,
    borderBottomWidth: 1,
    backgroundColor: theme.COLORS.cardBackground,
    marginBottom: commonStyles.SPACING.small,
    borderRadius: commonStyles.BORDER_RADIUS.small,
  },
  itemText: {
    fontFamily: commonStyles.FONTS.regular,
    color: theme.COLORS.text,
  },
  emptyListText: {
    fontFamily: commonStyles.FONTS.regular,
    color: theme.COLORS.subtleText,
    textAlign: 'center',
    marginTop: commonStyles.SPACING.medium,
  }
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
//   paddingVertical: commonStyles.SPACING.small,
//   paddingHorizontal: commonStyles.SPACING.medium,
//   borderRadius: commonStyles.BORDER_RADIUS.small,
//   alignItems: 'center',
//   justifyContent: 'center',
//   height: 44, // Match input height
// },
// buttonText: {
//   color: theme.COLORS.white,
//   fontFamily: commonStyles.FONTS.bold,
//   fontSize: commonStyles.FONTS.sizes.medium,
// }
