import React from "react";
import {StyleSheet, Text, View} from "react-native";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";

export default function SettingsScreen() {
  return (
    <View style={[globalStyles.container, styles.center]}>
      <Text style={styles.text}>Settings (coming s∞n)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...globalStyles.center,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});
