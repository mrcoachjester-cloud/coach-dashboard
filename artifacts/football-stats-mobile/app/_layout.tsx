import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { GameCard } from "@/components/GameCard";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import type { Game } from "@/lib/types";

async function fetchRecentGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("game_date", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as Game[];
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeGame, setActiveGame } = useGame();

  const {
    data: games,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({ queryKey: ["recentGames"], queryFn: fetchRecentGames });

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  function handleGamePress(game: Game) {
    setActiveGame(game);
    router.push("/(tabs)/entry");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View
            style={[styles.logoCircle, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.logoText}>K</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.appTitle, { color: colors.foreground }]}>
              Kangaroos Stats
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: colors.accent }]}
              />
              <Text style={[styles.statusLabel, { color: colors.accent }]}>
                Ready for game day
              </Text>
            </View>
          </View>
        </View>

        {activeGame && (
          <TouchableOpacity
            style={[styles.activeGameBanner, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` }]}
            onPress={() => router.push("/(tabs)/entry")}
            activeOpacity={0.8}
          >
            <View style={styles.activeGameLeft}>
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: colors.primary },
                ]}
              />
              <View>
                <Text
                  style={[styles.activeGameLabel, { color: colors.mutedForeground }]}
                >
                  ACTIVE GAME
                </Text>
                <Text
                  style={[styles.activeGameTitle, { color: colors.foreground }]}
                >
                  vs {activeGame.opponent}
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/entry")}
          >
            <Feather name="edit-3" size={22} color="#fff" />
            <Text style={styles.actionLabel}>Start Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/games")}
          >
            <Feather name="list" size={22} color={colors.foreground} />
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>
              All Games
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            RECENT GAMES
          </Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : !games || games.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Feather
                name="calendar"
                size={32}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.foreground }]}
              >
                No games yet
              </Text>
              <Text
                style={[styles.emptyDesc, { color: colors.mutedForeground }]}
              >
                Create a game in the Entry tab to get started
              </Text>
            </View>
          ) : (
            games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isActive={activeGame?.id === game.id}
                onPress={() => handleGamePress(game)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 20,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroText: {
    gap: 4,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  activeGameBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeGameLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeGameLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  activeGameTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
