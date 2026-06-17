import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Game } from "@/lib/types";

interface GameCardProps {
  game: Game;
  isActive?: boolean;
  onPress?: () => void;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function GameCard({ game, isActive, onPress }: GameCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isActive
                ? `${colors.primary}20`
                : `${colors.muted}`,
            },
          ]}
        >
          <Feather
            name="activity"
            size={16}
            color={isActive ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.opponent, { color: colors.foreground }]}>
            vs {game.opponent}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(game.game_date)}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        {isActive && (
          <View
            style={[styles.activePill, { backgroundColor: `${colors.primary}20` }]}
          >
            <View
              style={[styles.activeDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.activeText, { color: colors.primary }]}>
              Active
            </Text>
          </View>
        )}
        {game.status && !isActive && (
          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {game.status}
          </Text>
        )}
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    gap: 2,
  },
  opponent: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  status: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
