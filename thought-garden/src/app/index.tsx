import { Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '@/ui/tokens';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thought Garden</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  title: { fontFamily: fonts.titleXBold, fontSize: 36, color: colors.ink },
});
