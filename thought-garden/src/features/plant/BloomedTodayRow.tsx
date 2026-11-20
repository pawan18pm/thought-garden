import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Plant } from '@/domain/types';
import { colors, fonts } from '@/ui/tokens';

interface Props {
  plants: Plant[];
  onUndo: (id: string) => void;
}

export function BloomedTodayRow({ plants, onUndo }: Props) {
  if (plants.length === 0) return null;
  const ask = (p: Plant) =>
    Alert.alert(p.text, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo bloom', onPress: () => onUndo(p.id) },
    ]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>🌸 Bloomed today ({plants.length})</Text>
      {plants.map((p) => (
        <Pressable key={p.id} onPress={() => ask(p)} accessibilityRole="button" accessibilityLabel={`Bloomed: ${p.text}`} style={styles.item}>
          <Text style={styles.text} numberOfLines={2}>
            {p.text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  title: { fontFamily: fonts.titleBold, fontSize: 18, color: colors.ink, marginBottom: 6 },
  item: { minHeight: 44, justifyContent: 'center' },
  text: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});
