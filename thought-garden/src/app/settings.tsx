import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fonts } from '@/ui/tokens';

export default function Settings() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <Text style={styles.text}>Settings coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  text: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
