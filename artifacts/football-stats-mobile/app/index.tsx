import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { NewGameModal } from "@/components/NewGameModal";
import { PlayFormModal } from "@/components/PlayFormModal";
import { StatsModal } from "@/components/StatsModal";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import type { Game, Play } from "@/lib/types";

async function fetchPlays(gameId: number): Promise<Play[]> {
  const { data, error } = await supabase
    .from("plays")
    .select("*")
    .eq("game_id", gameId)
    .order("play_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Play[];
}

function PlayRow({
  play,
  onPress,
}: {
  play: Play;
  onPress: () => void;
}) {
  const colors = useColors();
  const odkColor =
    play.odk === "O"
      ? colors.primary
      : play.odk === "D"
      ? colors.destructive
      : colors.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.playRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.playNum, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.playNumText, { color: colors.mutedForeground }]}>
          {play.play_number}
        </Text>
      </View>
      <View
        style={[styles.odkBadge, { backgroundColor: `${odkColor}20` }]}
      >
        <Text style={[styles.odkText, { color: odkColor }]}>
          {play.odk ?? "—"}
        </Text>
      </View>
      <View style={styles.playMeta}>
        {play.odk === "O" && (
          <Text style={[styles.playDetail, { color: colors.foreground }]}>
            {play.down ? `${play.down}&${play.dist ?? "—"}` : "—"}{" "}
            {play.off_play ?? play.play_type ?? ""}
          </Text>
        )}
        {play.odk === "D" && (
          <Text style={[styles.playDetail, { color: colors.foreground }]}>
            {play.front ?? "—"} {play.coverage ?? ""}
          </Text>
        )}
        {play.odk === "K" && (
          <Text style={[styles.playDetail, { color: colors.foreground }]}>
            {play.play_type ?? "Special teams"}
          </Text>
        )}
        {!play.odk && (
          <Text style={[styles.playDetail, { color: colors.mutedForeground }]}>
            No data
          </Text>
        )}
        {play.result && (
          <Text style={[styles.playResult, { color: colors.mutedForeground }]}>
            {play.result}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

// ── ODK count badges shown in header ──────────────────────────────────────────

function OdkCounts({ plays, colors }: { plays: Play[]; colors: ReturnType<typeof useColors> }) {
  const counts = plays.reduce(
    (acc, p) => {
      if (p.odk === "O") acc.O++;
      else if (p.odk === "D") acc.D++;
      else if (p.odk === "K") acc.K++;
      return acc;
    },
    { O: 0, D: 0, K: 0 }
  );

  const items: { label: string; count: number; color: string }[] = [
    { label: "O", count: counts.O, color: colors.primary },
    { label: "D", count: counts.D, color: colors.destructive },
    { label: "K", count: counts.K, color: colors.accent },
  ];

  return (
    <View style={styles.odkCounts}>
      {items.map(({ label, count, color }) => (
        <View key={label} style={styles.odkCountItem}>
          <View style={[styles.odkCountBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.odkCountLabel, { color }]}>{label}</Text>
            <Text style={[styles.odkCountNum, { color }]}>{count}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function EntryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeGame, setActiveGame } = useGame();
  const [showNewGame, setShowNewGame] = useState(false);
  const [showPlayForm, setShowPlayForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editPlay, setEditPlay] = useState<Play | null>(null);

  const {
    data: plays,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["plays", activeGame?.id],
    queryFn: () => fetchPlays(activeGame!.id),
    enabled: !!activeGame,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;
  const nextPlayNumber = (plays?.length ?? 0) + 1;
  const playList = plays ?? [];

  function handleNewPlay() {
    setEditPlay(null);
    setShowPlayForm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleEditPlay(play: Play) {
    setEditPlay(play);
    setShowPlayForm(true);
  }

  function handlePlaySaved() {
    setShowPlayForm(false);
    setEditPlay(null);
    refetch();
  }

  function handleGameCreated(game: Game) {
    setShowNewGame(false);
    setActiveGame(game);
  }

  function handleOpenStats() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStats(true);
  }

  if (!activeGame) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.noGameContainer,
            {
              paddingTop: topPad + 20,
              paddingBottom: bottomPad,
            },
          ]}
        >
          <View
            style={[styles.iconBg, { backgroundColor: colors.secondary }]}
          >
            <Feather name="edit-3" size={36} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.noGameTitle, { color: colors.foreground }]}>
            No active game
          </Text>
          <Text
            style={[styles.noGameDesc, { color: colors.mutedForeground }]}
          >
            Create a new game or select one from the Games tab to start entering plays.
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowNewGame(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create New Game</Text>
          </TouchableOpacity>
        </View>

        <NewGameModal
          visible={showNewGame}
          onClose={() => setShowNewGame(false)}
          onCreated={handleGameCreated}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPad + 12,
          },
        ]}
      >
        {/* Top row: title + New button */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerOpponent, { color: colors.foreground }]}>
              vs {activeGame.opponent}
            </Text>
            <Text style={[styles.headerDate, { color: colors.mutedForeground }]}>
              {new Date(activeGame.game_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              {playList.length > 0 && ` · ${playList.length} play${playList.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.statsBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }]}
              onPress={handleOpenStats}
            >
              <Feather name="bar-chart-2" size={14} color={colors.primary} />
              <Text style={[styles.statsBtnText, { color: colors.primary }]}>
                Stats
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchBtn, { borderColor: colors.border }]}
              onPress={() => setShowNewGame(true)}
            >
              <Feather name="plus-circle" size={16} color={colors.mutedForeground} />
              <Text
                style={[styles.switchBtnText, { color: colors.mutedForeground }]}
              >
                New
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ODK count badges row */}
        <OdkCounts plays={playList} colors={colors} />
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={playList}
          keyExtractor={(p) => String(p.id ?? p.play_number)}
          renderItem={({ item }) => (
            <PlayRow play={item} onPress={() => handleEditPlay(item)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + 72 },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Feather
                name="clipboard"
                size={40}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.foreground }]}
              >
                No plays yet
              </Text>
              <Text
                style={[styles.emptyDesc, { color: colors.mutedForeground }]}
              >
                Tap + to log the first play
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={playList.length > 0}
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: bottomPad,
          },
        ]}
        onPress={handleNewPlay}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <NewGameModal
        visible={showNewGame}
        onClose={() => setShowNewGame(false)}
        onCreated={handleGameCreated}
      />

      {showPlayForm && (
        <PlayFormModal
          visible={showPlayForm}
          gameId={activeGame.id}
          playNumber={editPlay ? editPlay.play_number : nextPlayNumber}
          editPlay={editPlay}
          onClose={() => {
            setShowPlayForm(false);
            setEditPlay(null);
          }}
          onSaved={handlePlaySaved}
        />
      )}

      <StatsModal
        visible={showStats}
        plays={playList}
        onClose={() => setShowStats(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noGameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  noGameTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  noGameDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    gap: 2,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerOpponent: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  headerDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statsBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  odkCounts: {
    flexDirection: "row",
    gap: 8,
  },
  odkCountItem: {
    flex: 1,
  },
  odkCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
  },
  odkCountLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  odkCountNum: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 12,
    gap: 6,
  },
  playRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 6,
  },
  playNum: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  playNumText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  odkBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  odkText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  playMeta: {
    flex: 1,
    gap: 2,
  },
  playDetail: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  playResult: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
