import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { border, colors, fonts } from '@/ui/tokens';

interface Props {
  bedName: string;
  count: number;
  moveToName: string;
  onMove: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

const DANGER = '#B3261E';

export function RemoveBedPrompt({ bedName, count, moveToName, onMove, onDelete, onCancel }: Props) {
  const things = count === 1 ? '1 thought' : `${count} thoughts`;
  return (
    <View accessibilityRole="alert" accessibilityLabel={`Remove ${bedName}`} style={styles.box}>
      <Text style={styles.copy}>{`${bedName} has ${things}. What should happen to them?`}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onMove} style={styles.btn}>
          <Text style={styles.btnText}>{`Move them to ${moveToName}, remove bed`}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} style={[styles.btn, { borderColor: DANGER }]}>
          <Text style={[styles.btnText, { color: DANGER }]}>Delete bed and its thoughts</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.btn, styles.cancel]}>
          <Text style={[styles.btnText, styles.cancelText]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#FFF6F5',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 18,
  },
  copy: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  actions: { gap: 8, marginTop: 10 },
  btn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 14,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  cancel: { backgroundColor: 'transparent', borderWidth: 0 },
  cancelText: { color: colors.muted },
});
