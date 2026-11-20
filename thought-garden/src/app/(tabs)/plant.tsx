import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGarden } from '@/store/AppProvider';
import { orderBeds } from '@/domain/ordering';
import { greetingFor } from '@/domain/greeting';
import { BedCard } from '@/ui/BedCard';
import { PlantItButton } from '@/ui/PlantItButton';
import { colors, fonts } from '@/ui/tokens';
import { PlantingSheet } from '@/features/plant/PlantingSheet';
import { PlantDetailSheet } from '@/features/plant/PlantDetailSheet';
import { BloomedTodayRow } from '@/features/plant/BloomedTodayRow';

export default function PlantTab() {
  const insets = useSafeAreaInsets();
  const beds = useGarden((s) => s.beds);
  const plants = useGarden((s) => s.plants);
  const bloomedToday = useGarden((s) => s.bloomedToday);
  const plantsInBed = useGarden((s) => s.plantsInBed);
  const toggleFold = useGarden((s) => s.toggleFold);
  const unbloom = useGarden((s) => s.unbloom);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetBedId, setSheetBedId] = useState<string | undefined>(undefined);
  const [detailId, setDetailId] = useState<string | null>(null);

  const ordered = orderBeds(beds);
  const n = plants.length;
  const greeting = `${greetingFor(new Date().getHours())} · ${n} ${n === 1 ? 'plant' : 'plants'} growing`;

  const openSheet = (bedId?: string) => {
    setSheetBedId(bedId);
    setSheetOpen(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={styles.settings}>
            <Text style={styles.settingsText}>⚙︎</Text>
          </Pressable>
        </Link>
      </View>
      <FlatList
        data={ordered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.title}>Plant</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.bed}>
            <BedCard
              bed={item}
              plants={plantsInBed(item.id)}
              onPlantPress={setDetailId}
              onAddPress={() => openSheet(item.id)}
              onToggleFold={() => void toggleFold(item.id)}
            />
          </View>
        )}
        ListFooterComponent={<BloomedTodayRow plants={bloomedToday} onUndo={(id) => void unbloom(id)} />}
        extraData={plants}
      />
      <View pointerEvents="box-none" style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 72 }]}>
        <PlantItButton onPress={() => openSheet(undefined)} />
      </View>
      <PlantingSheet visible={sheetOpen} initialBedId={sheetBedId} onClose={() => setSheetOpen(false)} />
      <PlantDetailSheet plantId={detailId} onClose={() => setDetailId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 },
  settings: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  settingsText: { fontSize: 24, color: colors.ink },
  list: { paddingHorizontal: 16, paddingBottom: 260 },
  greeting: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  title: { fontFamily: fonts.titleXBold, fontSize: 40, color: colors.ink, marginBottom: 12 },
  bed: { marginBottom: 10 },
  fab: { position: 'absolute', right: 8 },
});
