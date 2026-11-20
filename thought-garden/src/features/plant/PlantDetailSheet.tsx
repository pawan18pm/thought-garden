import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Sheet } from '@/ui/Sheet';
import { ChunkyButton } from '@/ui/ChunkyButton';
import { PlantArt } from '@/ui/PlantArt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useGarden } from '@/store/AppProvider';
import { MAX_THOUGHT_LENGTH, validateThought } from '@/domain/validate';
import { orderBeds } from '@/domain/ordering';
import { stageOf } from '@/domain/stages';
import type { Plant } from '@/domain/types';
import { bedColors, colors, fonts } from '@/ui/tokens';
import { Chip } from './Chip';
import { PRIORITY_CHIPS } from './PlantingSheet';

interface Props {
  plantId: string | null;
  onClose: () => void;
}

const PRIORITY_NAME = { 3: 'high', 2: 'medium', 1: 'low' } as const;

export function waterCopy(n: number): string {
  if (n === 0) return 'not watered yet';
  return n === 1 ? 'watered 1 time' : `watered ${n} times`;
}

export function PlantDetailSheet({ plantId, onClose }: Props) {
  const live = useGarden((s) => (plantId ? s.plants.find((p) => p.id === plantId) : undefined));
  const beds = useGarden((s) => s.beds);
  const water = useGarden((s) => s.water);
  const bloom = useGarden((s) => s.bloom);
  const edit = useGarden((s) => s.edit);
  const remove = useGarden((s) => s.remove);
  const reduced = useReducedMotion();

  // Keep showing the plant while the bloom pop plays, after the store has removed it.
  const lastRef = useRef<Plant | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  if (live) lastRef.current = live;
  const plant = live ?? (closing ? lastRef.current : undefined);

  const [busyUi, setBusyUi] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [panel, setPanel] = useState<'priority' | 'bed' | null>(null);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setEditing(false);
    setPanel(null);
    setClosing(false);
    scale.value = 1;
    opacity.value = 1;
    busy.current = false;
    setBusyUi(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const artStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  if (!plant) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;

  const bed = beds.find((b) => b.id === plant.bedId);
  const flower = bed && bed.color !== 'ideas' ? bedColors[bed.color] : undefined;
  const orderedBeds = orderBeds(beds);

  // Reduce Motion substitute: a short opacity pulse, no scale or movement.
  const pulse = () => {
    opacity.value = withSequence(withTiming(0.35, { duration: 100 }), withTiming(1, { duration: 100 }));
  };

  const onWater = async () => {
    if (busy.current) return;
    busy.current = true;
    setBusyUi(true);
    try {
      await water(plant.id);
      if (reduced) pulse();
      else scale.value = withSequence(withTiming(1.25, { duration: 140 }), withTiming(1, { duration: 160 }));
    } finally {
      busy.current = false;
      setBusyUi(false);
    }
  };

  const onBloom = async () => {
    if (busy.current) return;
    busy.current = true;
    setBusyUi(true);
    // Snapshot first: the store update inside bloom() removes the plant before the promise resolves.
    setClosing(true);
    try {
      await bloom(plant.id);
    } catch (e) {
      setClosing(false);
      busy.current = false;
      setBusyUi(false);
      throw e;
    }
    if (reduced) {
      pulse();
      timer.current = setTimeout(onClose, 220);
      return;
    }
    scale.value = withSequence(withTiming(1.4, { duration: 160 }), withTiming(1, { duration: 140 }));
    timer.current = setTimeout(onClose, 320);
  };

  const saveText = async () => {
    const clean = validateThought(draft);
    if (clean === null) return;
    if (clean !== plant.text) await edit(plant.id, { text: clean });
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete this plant?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(plant.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Sheet visible onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.art}>
          <Animated.View style={artStyle}>
            <PlantArt stage={stageOf(plant)} size={96} flowerColor={flower} />
          </Animated.View>
        </View>

        {editing ? (
          <View>
            <TextInput
              accessibilityLabel="Edit thought"
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              returnKeyType="done"
              blurOnSubmit
              maxLength={MAX_THOUGHT_LENGTH}
              onSubmitEditing={saveText}
            />
            <Text style={styles.counter}>
              {draft.length}/{MAX_THOUGHT_LENGTH}
            </Text>
            <View style={styles.row}>
              <Chip label="Cancel" accessibilityLabel="Cancel edit" onPress={() => setEditing(false)} />
              <Chip label="Save" accessibilityLabel="Save text" selected onPress={saveText} />
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit text"
            onPress={() => {
              setDraft(plant.text);
              setEditing(true);
            }}
          >
            <Text style={styles.text}>{plant.text}</Text>
          </Pressable>
        )}

        <Text style={styles.meta}>
          {bed?.name ?? 'Ideas'} · {plant.priority ? `${PRIORITY_NAME[plant.priority]} priority` : 'no priority'}
        </Text>
        <Text style={styles.meta}>{waterCopy(plant.waterCount)}</Text>

        <View style={[styles.row, styles.actions]}>
          <ChunkyButton label="Water" onPress={onWater} disabled={busyUi} />
          <ChunkyButton label="Bloom" tone="primary" onPress={onBloom} disabled={busyUi} />
        </View>

        <Pressable style={styles.link} accessibilityRole="button" onPress={() => setPanel(panel === 'priority' ? null : 'priority')}>
          <Text style={styles.linkText}>Change priority</Text>
        </Pressable>
        {panel === 'priority' && (
          <View style={styles.row}>
            {PRIORITY_CHIPS.map((c) => (
              <Chip
                key={c.label}
                label={c.label}
                accessibilityLabel={`Set priority ${c.label}`}
                selected={plant.priority === c.value}
                onPress={async () => {
                  await edit(plant.id, { priority: plant.priority === c.value ? null : c.value });
                  setPanel(null);
                }}
              />
            ))}
          </View>
        )}

        <Pressable style={styles.link} accessibilityRole="button" onPress={() => setPanel(panel === 'bed' ? null : 'bed')}>
          <Text style={styles.linkText}>Move bed</Text>
        </Pressable>
        {panel === 'bed' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {orderedBeds.map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                accessibilityLabel={`Move to ${b.name}`}
                selected={b.id === plant.bedId}
                onPress={async () => {
                  await edit(plant.id, { bedId: b.id });
                  setPanel(null);
                }}
              />
            ))}
          </ScrollView>
        )}

        <Pressable style={styles.link} accessibilityRole="button" onPress={confirmDelete}>
          <Text style={[styles.linkText, styles.danger]}>Delete</Text>
        </Pressable>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center', marginBottom: 8 },
  text: { fontFamily: fonts.titleBold, fontSize: 22, color: colors.ink, textAlign: 'center', marginBottom: 8 },
  input: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  counter: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right', marginBottom: 8 },
  meta: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  actions: { justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, textDecorationLine: 'underline' },
  danger: { color: '#C0392B' },
});
