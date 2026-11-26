import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGarden } from '@/store/AppProvider';
import { orderBeds } from '@/domain/ordering';
import { nextBedColor } from '@/domain/bedColors';
import { LogoRow } from '@/ui/Logo';
import { BED_COLOR_ORDER, border, colors, fonts, type BedColorKey } from '@/ui/tokens';
import { PlantDetailSheet } from '@/features/plant/PlantDetailSheet';
import { QuickPlantBox } from '@/features/plant/QuickPlantBox';
import { BedSection } from '@/features/plant/BedSection';
import { RemoveBedPrompt } from '@/features/plant/RemoveBedPrompt';

const MAX_USER_BEDS = 6;

export default function PlantTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const beds = useGarden((s) => s.beds);
  const plants = useGarden((s) => s.plants);
  const bloomedToday = useGarden((s) => s.bloomedToday);
  const plantsInBed = useGarden((s) => s.plantsInBed);
  const plant = useGarden((s) => s.plant);
  const water = useGarden((s) => s.water);
  const bloom = useGarden((s) => s.bloom);
  const addBed = useGarden((s) => s.addBed);
  const renameBed = useGarden((s) => s.renameBed);
  const recolorBed = useGarden((s) => s.recolorBed);
  const removeBed = useGarden((s) => s.removeBed);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);

  const ordered = orderBeds(beds);
  const userBeds = ordered.filter((b) => !b.isIdeas);
  const visible = ordered.filter((b) => !b.isIdeas || plantsInBed(b.id).length > 0);

  const onPlant = async (text: string, bedId: string) => {
    const created = await plant(text, bedId, null, 'fab');
    if (created) setFreshId(created.id);
  };

  const toggleEdit = () => {
    setEditing((e) => !e);
    setConfirmId(null);
  };

  const recolor = (id: string, current: BedColorKey | 'ideas') => {
    if (current === 'ideas') return;
    const next = BED_COLOR_ORDER[(BED_COLOR_ORDER.indexOf(current) + 1) % BED_COLOR_ORDER.length];
    void recolorBed(id, next);
  };

  const addBlankBed = () => {
    const used = userBeds.map((b) => b.color).filter((c): c is BedColorKey => c !== 'ideas');
    void addBed('New bed', nextBedColor(used));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LogoRow onSettings={() => router.push('/settings')} />
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            Plant
          </Text>
          <Text style={styles.summary}>{`${plants.length} growing · ${bloomedToday.length} bloomed`}</Text>
        </View>

        <QuickPlantBox beds={ordered} onPlant={onPlant} selectedBedId={targetId} onSelectBed={setTargetId} />

        <View style={styles.bedsHeader}>
          <Text style={styles.h2} accessibilityRole="header">
            Your beds
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={toggleEdit}
            style={[styles.editBtn, { backgroundColor: editing ? colors.ink : colors.bg }]}
          >
            <Text style={[styles.editText, { color: editing ? '#FFFFFF' : colors.ink }]}>
              {editing ? 'Done' : 'Edit beds'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.beds}>
          {visible.map((bed) => {
            const active = plantsInBed(bed.id);
            const rows = [...active, ...bloomedToday.filter((p) => p.bedId === bed.id)];
            const moveTo = userBeds.find((b) => b.id !== bed.id);
            return (
              <BedSection
                key={bed.id}
                bed={bed}
                plants={rows}
                growing={active.length}
                editing={editing}
                canRemove={!bed.isIdeas && userBeds.length > 1}
                onRename={(name) => void renameBed(bed.id, name)}
                onRecolor={() => recolor(bed.id, bed.color)}
                onRemove={() => {
                  if (active.length === 0) void removeBed(bed.id);
                  else setConfirmId(bed.id);
                }}
                onPickForPlanting={() => setTargetId(bed.id)}
                onWater={(id) => void water(id)}
                onBloom={(id) => void bloom(id)}
                onPressPlant={setDetailId}
                highlightId={freshId}
                footer={
                  confirmId === bed.id && moveTo ? (
                    <RemoveBedPrompt
                      bedName={bed.name}
                      count={active.length}
                      moveToName={moveTo.name}
                      onMove={() => {
                        setConfirmId(null);
                        void removeBed(bed.id, { moveTo: moveTo.id });
                      }}
                      onDelete={() => {
                        setConfirmId(null);
                        void removeBed(bed.id, { deleteThoughts: true });
                      }}
                      onCancel={() => setConfirmId(null)}
                    />
                  ) : null
                }
              />
            );
          })}
          {editing && userBeds.length < MAX_USER_BEDS && (
            <Pressable accessibilityRole="button" onPress={addBlankBed} style={styles.addBed}>
              <Text style={styles.addBedText}>+ Add a bed</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <PlantDetailSheet plantId={detailId} onClose={() => setDetailId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 140 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 18,
    marginHorizontal: 20,
  },
  title: { fontFamily: fonts.titleXBold, fontSize: 44, lineHeight: 46, letterSpacing: -0.9, color: colors.ink },
  summary: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  bedsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginHorizontal: 20,
  },
  h2: { fontFamily: fonts.titleXBold, fontSize: 22, color: colors.ink },
  editBtn: {
    height: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: border,
    borderColor: colors.ink,
    borderRadius: 999,
  },
  editText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  beds: { gap: 24, paddingTop: 14, paddingHorizontal: 20 },
  addBed: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    borderRadius: 22,
  },
  addBedText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink },
});
