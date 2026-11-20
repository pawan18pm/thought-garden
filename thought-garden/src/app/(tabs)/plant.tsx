import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGarden } from '@/store/AppProvider';
import { orderBeds } from '@/domain/ordering';
import { BedCard } from '@/ui/BedCard';
import { PlantItButton } from '@/ui/PlantItButton';
import { colors } from '@/ui/tokens';
import { PlantingSheet } from '@/features/plant/PlantingSheet';
import { PlantDetailSheet } from '@/features/plant/PlantDetailSheet';
import { BloomedTodayCard } from '@/features/plant/BloomedTodayCard';
import { PlantHeader } from '@/features/plant/PlantHeader';

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

  const openSheet = (bedId?: string) => {
    setSheetBedId(bedId);
    setSheetOpen(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <FlatList
        data={ordered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <PlantHeader hour={new Date().getHours()} growing={plants.length} bloomedToday={bloomedToday.length} />
            <BloomedTodayCard plants={bloomedToday} beds={beds} onUndo={(id) => void unbloom(id)} />
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
        extraData={[plants, bloomedToday]}
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
  list: { paddingHorizontal: 20, paddingBottom: 260 },
  bed: { marginBottom: 16 },
  fab: { position: 'absolute', right: 8 },
});
