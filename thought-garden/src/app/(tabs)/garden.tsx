import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/ui/tokens';

export default function Garden() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Garden coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  text: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink },
});
