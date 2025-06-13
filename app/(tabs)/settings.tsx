import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button, FlatList, Alert, Switch } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useTheme } from '../../src/context/ThemeContext';
import {
  getDBConnection,
  initDatabase,
  User,
  Family,
  getUserById,
  getFamilyById,
  addFamily,
  getUsersByFamilyId,
  updateUserFamilyId,
  updateFamilyName, // Added import
  addUser // Ensure addUser is explicitly available
} from '../../src/database';

export default function FamilySettingsScreen() {
  const { theme, toggleTheme, currentMode } = useTheme();
  const styles = getStyles(theme);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [newFamilyNameInput, setNewFamilyNameInput] = useState('');
  const [newMemberNameInput, setNewMemberNameInput] = useState(''); // Renamed
  const [newMemberEmailInput, setNewMemberEmailInput] = useState(''); // Renamed

  const fetchFamilyMembers = async (familyId: number) => {
    if (!db) return;
    try {
      const members = await getUsersByFamilyId(db, familyId);
      setFamilyMembers(members);
    } catch (error) {
      console.error("Failed to fetch family members:", error);
      Alert.alert("Error", "Could not fetch family members.");
    }
  };

  const handleUpdateFamilyName = async () => {
    if (!newFamilyNameInput.trim()) {
      Alert.alert("Validation Error", "New family name cannot be empty.");
      return;
    }
    if (!db || !family) {
      Alert.alert("Error", "Database connection or family data is not available. Please restart the app if this persists.");
      return;
    }

    setIsLoading(true); // Disable button while processing
    try {
      const rowsAffected = await updateFamilyName(db, family.id, newFamilyNameInput.trim());
      if (rowsAffected > 0) {
        // Update local family state to reflect the change immediately
        setFamily({ ...family, name: newFamilyNameInput.trim() });
        setNewFamilyNameInput(''); // Clear the input field
        Alert.alert("Success", "Family name updated successfully!");
      } else {
        Alert.alert("Info", "Family name was not updated. It might be the same as the current name or the family was not found.");
      }
    } catch (error: any) { // Explicitly typing error as any for simplicity here, consider specific error types
      console.error("Failed to update family name:", error);
      Alert.alert("Error", `An error occurred while updating the family name: ${error.message || error}`);
    } finally {
      setIsLoading(false); // Re-enable button
    }
  };

  const handleCreateFamily = async () => {
    if (!familyNameInput.trim()) {
      Alert.alert("Validation Error", "Family name cannot be empty.");
      return;
    }
    if (!db || !currentUser) {
      Alert.alert("Error", "Database connection or user data is not available. Please restart the app.");
      return;
    }

    try {
      // Create the new family
      const newFamilyId = await addFamily(db, familyNameInput.trim());
      if (newFamilyId === 0) { // Assuming addFamily might return 0 or throw on failure to get ID.
        Alert.alert("Error", "Failed to create family. No ID returned.");
        return;
      }

      // Link the current user to the new family
      const rowsAffected = await updateUserFamilyId(db, currentUser.id, newFamilyId);
      if (rowsAffected === 0) {
        Alert.alert("Error", "Failed to link user to the new family.");
        // Potentially delete the created family if the user link fails? Or handle otherwise.
        return;
      }

      // Refresh screen data
      const updatedUser = await getUserById(db, currentUser.id);
      setCurrentUser(updatedUser); // Update current user state

      if (updatedUser && updatedUser.family_id) {
        const newFamily = await getFamilyById(db, updatedUser.family_id);
        if (newFamily) {
          setFamily(newFamily); // Update family state
          await fetchFamilyMembers(newFamily.id); // Fetch members for the new family
        } else {
          Alert.alert("Error", "New family details could not be fetched.");
        }
      } else {
        Alert.alert("Error", "User's family information could not be updated locally.");
      }

      setFamilyNameInput(''); // Clear the input field
      Alert.alert("Success", `Family "${familyNameInput.trim()}" created successfully!`);

    } catch (error) {
      console.error("Failed to create family:", error);
      Alert.alert("Error", `An error occurred while creating the family: ${error}`);
    }
  };

  const handleAddNewMember = async () => {
    if (!newMemberNameInput.trim() || !newMemberEmailInput.trim()) {
      Alert.alert("Validation Error", "Member name and email cannot be empty.");
      return;
    }
    if (!db || !family) {
      Alert.alert("Error", "Database connection or family data is not available.");
      return;
    }

    try {
      // Using a placeholder password hash as discussed.
      // In a real app, this should be a securely generated hash of a temporary or user-defined password.
      const placeholderPasswordHash = "hashed_DEFAULT_PASSWORD_HASH";

      const newUserId = await addUser(
        db,
        newMemberNameInput.trim(),
        null, // phone - keeping null for now
        newMemberEmailInput.trim(),
        placeholderPasswordHash,
        family.id // Associate with the current family
      );

      if (newUserId > 0) {
        Alert.alert("Success", `Member "${newMemberNameInput.trim()}" added to the family!`);
        await fetchFamilyMembers(family.id); // Refresh the members list
        setNewMemberNameInput(''); // Clear input
        setNewMemberEmailInput(''); // Clear input
      } else {
        Alert.alert("Error", "Failed to add new member. No ID returned or user not created.");
      }
    } catch (error: any) {
      console.error("Failed to add new member:", error);
      // Check for unique constraint error for email (common case)
      if (error.message && error.message.toLowerCase().includes('unique constraint failed: users.email')) {
        Alert.alert("Error", "This email address is already in use. Please use a different email.");
      } else if (error.message && error.message.toLowerCase().includes('unique constraint failed: users.phone')) {
        Alert.alert("Error", "This phone number is already in use. Please use a different phone number.");
      }
      else {
        Alert.alert("Error", `An error occurred while adding the member: ${error.message || error}`);
      }
    }
  };

  useEffect(() => {
    let currentDb: SQLite.SQLiteDatabase | null = null;
    const initialize = async () => {
      try {
        currentDb = getDBConnection();
        setDb(currentDb);
        await initDatabase(currentDb);

        // Simulate fetching the current user (e.g., user with ID 1)
        const user = await getUserById(currentDb, 1);
        if (user) {
          setCurrentUser(user);
          if (user.family_id) {
            const fetchedFamily = await getFamilyById(currentDb, user.family_id);
            if (fetchedFamily) {
              setFamily(fetchedFamily);
              await fetchFamilyMembers(fetchedFamily.id); // Fetch members if family exists
            } else {
              // Optional: Handle case where family ID exists but family not found
              // This might indicate a data integrity issue or a race condition if a family was just deleted.
              console.log(`Family with ID ${user.family_id} not found, but user references it.`);
              // We could try to clear the family_id on the user here if appropriate for the app logic
              // await updateUserFamilyId(currentDb, user.id, null);
              // setCurrentUser({ ...user, family_id: null }); // Update local state
            }
          }
        } else {
          // Handle case where user is not found (e.g., create a default user or prompt for login/signup)
          Alert.alert("User not found", "Could not find user with ID 1. Consider creating a default user or implementing user creation flow.");
        }
        // console.log("Database initialized"); // Temporary log can be removed or kept for debugging
      } catch (error) {
        console.error("Initialization error:", error);
        Alert.alert("Error", "Failed to initialize database.");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Optional: Cleanup db connection when component unmounts
    // return () => {
    //   if (currentDb) {
    //     currentDb.closeAsync();
    //   }
    // };
  }, []); // CORRECTED to empty dependency array to run only once on mount

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Settings</Text>

      <View style={styles.themeSettingsContainer}>
        <Text style={styles.sectionTitle}>Theme Settings</Text>
        <View style={styles.themeSwitchRow}>
          <Text style={styles.themeSwitchText}>Current theme: {currentMode}</Text>
          <Switch
            trackColor={{ false: theme.COLORS.grey, true: theme.COLORS.primary }} // These might need to be part of theme.COLORS if more granular control is needed
            thumbColor={currentMode === 'dark' ? theme.COLORS.lightGrey : theme.COLORS.grey} // Same as above
            ios_backgroundColor={theme.COLORS.grey} // Same as above
            onValueChange={toggleTheme}
            value={currentMode === 'dark'}
          />
        </View>
      </View>

      {!currentUser ? (
        <Text style={styles.errorText}>Error: Current user not loaded. Please try again.</Text>
      ) : !family && !currentUser.family_id ? (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Create Your Family</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Family Name"
            value={familyNameInput}
            onChangeText={setFamilyNameInput}
            placeholderTextColor={theme.COLORS.placeholder}
          />
          <Button
            title="Create Family"
            onPress={handleCreateFamily}
            disabled={!familyNameInput.trim() || isLoading}
            color={theme.COLORS.primary}
          />
        </View>
      ) : family ? (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Family: {family.name}</Text>
          <Text style={styles.subheading}>Members:</Text>
          {familyMembers.length > 0 ? (
            <FlatList
              data={familyMembers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <Text style={styles.memberItem}>{item.name}</Text>}
              style={styles.list}
            />
          ) : (
            <Text style={styles.bodyText}>No members yet. You are the only member.</Text>
          )}

          {/* Add New Member Form */}
          <View style={styles.addMemberContainer}>
            <Text style={styles.subheading}>Add New Member</Text>
            <TextInput
              style={styles.input}
              placeholder="Member's Name"
              value={newMemberNameInput}
              onChangeText={setNewMemberNameInput}
              placeholderTextColor={theme.COLORS.placeholder}
            />
            <TextInput
              style={styles.input}
              placeholder="Member's Email"
              value={newMemberEmailInput}
              onChangeText={setNewMemberEmailInput}
              placeholderTextColor={theme.COLORS.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Add Member"
              onPress={handleAddNewMember}
              disabled={!newMemberNameInput.trim() || !newMemberEmailInput.trim() || isLoading}
              color={theme.COLORS.primary}
            />
          </View>

          {/* Update Family Name Form */}
          <View style={styles.updateFamilyNameContainer}>
            <Text style={styles.subheading}>Change Family Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new family name"
              value={newFamilyNameInput}
              onChangeText={setNewFamilyNameInput}
              placeholderTextColor={theme.COLORS.placeholder}
            />
            <Button
              title="Update Family Name"
              onPress={handleUpdateFamilyName}
              color={theme.COLORS.primary}
              disabled={!newFamilyNameInput.trim() || isLoading} // Disable if input is empty or loading
            />
          </View>
        </View>
      ) : (
        <Text style={styles.bodyText}>Loading family details...</Text>
      )}
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: theme.COLORS.text,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    color: theme.COLORS.text,
  },
  sectionContainer: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    backgroundColor: theme.COLORS.cardBackground,
    shadowColor: theme.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Specific container for theme settings to distinguish from other sections if needed
  themeSettingsContainer: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    backgroundColor: theme.COLORS.cardBackground,
    shadowColor: theme.COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  themeSwitchText: {
    color: theme.COLORS.text,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
    color: theme.COLORS.text,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 8,
    color: theme.COLORS.text,
  },
  addMemberContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.borderColor,
  },
  updateFamilyNameContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.borderColor,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderColor: theme.COLORS.borderColor,
    backgroundColor: theme.COLORS.inputBackground,
    color: theme.COLORS.text,
  },
  list: {
    marginTop: 5,
  },
  memberItem: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    color: theme.COLORS.text,
    borderBottomColor: theme.COLORS.borderColor,
  },
  errorText: {
    color: theme.COLORS.error, // Assuming theme has an error color
    fontSize: 16,
    textAlign: 'center',
  },
  bodyText: { // For general purpose text like "No members yet..."
    color: theme.COLORS.text,
    fontSize: 16,
  }
});
