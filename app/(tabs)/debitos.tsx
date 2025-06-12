import { Text, View, StyleSheet } from "react-native";
import theme from '../../src/styles/theme'; // Import theme

export default function DebitosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Débitos Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.COLORS.background, // Use theme background
  },
  text: {
    fontFamily: theme.FONTS.regular,
    fontSize: theme.FONTS.sizes.medium,
    color: theme.COLORS.text,
  },
});
