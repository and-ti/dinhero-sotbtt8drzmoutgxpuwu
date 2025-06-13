import { Text, View, StyleSheet } from "react-native";
import { useTheme } from '../../src/context/ThemeContext'; // ADD THIS
import { commonStyles } from '../../src/styles/theme'; // Import commonStyles

export default function TransacoesScreen() {
  const { theme } = useTheme(); // ADD THIS
  const styles = getDynamicStyles(theme); // ADD THIS

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Transações Screen</Text>
    </View>
  );
}

// Function to generate styles based on the current theme
const getDynamicStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.COLORS.background, // Dynamic background
    padding: commonStyles.SPACING.medium,
  },
  text: {
    fontFamily: commonStyles.FONTS.regular,
    fontSize: commonStyles.FONTS.sizes.medium,
    color: theme.COLORS.text, // Dynamic text color
  },
});
