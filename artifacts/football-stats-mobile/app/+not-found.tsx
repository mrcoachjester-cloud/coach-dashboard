import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

import { GameCard } from "@/components/GameCard";
import { NewGameModal } from "@/components/NewGameModal";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import type { Game } from "@/lib/types";

async function fetchAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("game_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Game[];
}

export default function GamesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeGame, setActiveGame } = useGame();
  const [showNewGame, setShowNewGame] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const { data: games, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["allGames"],
    queryFn: fetchAllGames,
  });

  function handleGamePress(game: Game) {
    router.push({ pathname: "/game/[id]", params: { id: game.id } });
  }

  function handleGameCreated(game: Game) {
    setShowNewGame(false);
    setActiveGame(game);
    refetch();
    router.push("/(tabs)/entry");
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Games
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowNewGame(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={games ?? []}
          keyExtractor={(g) => String(g.id)}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              isActive={activeGame?.id === item.id}
              onPress={() => handleGamePress(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Feather
                name="calendar"
                size={40}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No games recorded
              </Text>
              <Text
                style={[styles.emptyDesc, { color: colors.mutedForeground }]}
              >
                Tap + to create your first game
              </Text>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowNewGame(true)}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.createBtnText}>Create Game</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!(games && games.length > 0)}
        />
      )}

      <NewGameModal
        visible={showNewGame}
        onClose={() => setShowNewGame(false)}
        onCreated={handleGameCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 12,
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
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
