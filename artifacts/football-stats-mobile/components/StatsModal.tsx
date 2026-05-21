import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import type { Play } from "@/lib/types";

interface PlayFormModalProps {
  visible: boolean;
  gameId: number;
  playNumber: number;
  editPlay?: Play | null;
  onClose: () => void;
  onSaved: () => void;
}

const ODK_OPTIONS = ["O", "D", "K"] as const;
const DOWN_OPTIONS = ["1", "2", "3", "4"] as const;
const HASH_OPTIONS = ["L", "M", "R"] as const;

function SegmentControl({
  options,
  value,
  onChange,
  colors,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View
      style={[
        segStyles.container,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt)}
          style={[
            segStyles.option,
            value === opt && {
              backgroundColor: colors.primary,
              borderRadius: 6,
            },
          ]}
        >
          <Text
            style={[
              segStyles.optionText,
              {
                color: value === opt ? "#fff" : colors.mutedForeground,
                fontFamily:
                  value === opt ? "Inter_600SemiBold" : "Inter_400Regular",
              },
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  optionText: {
    fontSize: 13,
  },
});

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={fieldStyles.field}>
      <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

function SectionTitle({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[sectionStyles.title, { color: colors.primary }]}>{title}</Text>
  );
}

const sectionStyles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
});

export function PlayFormModal({
  visible,
  gameId,
  playNumber,
  editPlay,
  onClose,
  onSaved,
}: PlayFormModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [odk, setOdk] = useState(editPlay?.odk ?? "");
  const [down, setDown] = useState(editPlay?.down?.toString() ?? "");
  const [dist, setDist] = useState(editPlay?.dist?.toString() ?? "");
  const [hash, setHash] = useState(editPlay?.hash ?? "");
  const [gnls, setGnls] = useState(editPlay?.gnls?.toString() ?? "");
  const [yardLine, setYardLine] = useState(editPlay?.yard_line?.toString() ?? "");
  const [playType, setPlayType] = useState(editPlay?.play_type ?? "");
  const [result, setResult] = useState(editPlay?.result ?? "");
  const [offFormation, setOffFormation] = useState(editPlay?.off_formation ?? "");
  const [defense, setDefense] = useState(editPlay?.defense ?? "");
  const [motion, setMotion] = useState(editPlay?.motion ?? "");
  const [offPlay, setOffPlay] = useState(editPlay?.off_play ?? "");
  const [rpo, setRpo] = useState(editPlay?.rpo ?? "");
  const [playDir, setPlayDir] = useState(editPlay?.play_dir ?? "");
  const [stunt, setStunt] = useState(editPlay?.stunt ?? "");
  const [blitz, setBlitz] = useState(editPlay?.blitz ?? "");
  const [coverage, setCoverage] = useState(editPlay?.coverage ?? "");
  const [ballCarrier, setBallCarrier] = useState(editPlay?.ball_carrier ?? "");
  const [front, setFront] = useState(editPlay?.front ?? "");

  const textInput = useCallback(
    (
      value: string,
      onChange: (v: string) => void,
      placeholder?: string,
      keyboardType: "default" | "numeric" = "default"
    ) => (
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            color: colors.foreground,
            borderColor: colors.border,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ""}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        returnKeyType="next"
      />
    ),
    [colors]
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        game_id: gameId,
        play_number: editPlay?.play_number ?? playNumber,
        odk: odk || null,
        down: down ? parseInt(down) : null,
        dist: dist ? parseInt(dist) : null,
        hash: hash || null,
        gnls: gnls ? parseFloat(gnls) : null,
        yard_line: yardLine ? parseInt(yardLine) : null,
        play_type: playType || null,
        result: result || null,
        off_formation: offFormation || null,
        defense: defense || null,
        motion: motion || null,
        off_play: offPlay || null,
        rpo: rpo || null,
        play_dir: playDir || null,
        stunt: stunt || null,
        blitz: blitz || null,
        coverage: coverage || null,
        ball_carrier: ballCarrier || null,
        front: front || null,
      };

      if (editPlay?.id) {
        const { error: dbErr } = await supabase
          .from("plays")
          .update(payload)
          .eq("id", editPlay.id);
        if (dbErr) throw dbErr;
      } else {
        const { error: dbErr } = await supabase.from("plays").insert(payload);
        if (dbErr) throw dbErr;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save play");
    } finally {
      setSaving(false);
    }
  }

  const isOffense = odk === "O";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === "web" ? 67 : insets.top || 16,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Play #{editPlay?.play_number ?? playNumber}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: `${colors.destructive}20` },
              ]}
            >
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          )}

          <SectionTitle title="Play" />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="ODK">
                <SegmentControl
                  options={ODK_OPTIONS}
                  value={odk}
                  onChange={setOdk}
                  colors={colors}
                />
              </Field>
            </View>
            {isOffense && (
              <View style={styles.rowItem}>
                <Field label="Down">
                  <SegmentControl
                    options={DOWN_OPTIONS}
                    value={down}
                    onChange={setDown}
                    colors={colors}
                  />
                </Field>
              </View>
            )}
          </View>

          {isOffense && (
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Field label="Distance">
                  {textInput(dist, setDist, "0", "numeric")}
                </Field>
              </View>
              <View style={styles.rowItem}>
                <Field label="Gain/Loss">
                  {textInput(gnls, setGnls, "0", "numeric")}
                </Field>
              </View>
            </View>
          )}

          <SectionTitle title="Field" />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Hash">
                <SegmentControl
                  options={HASH_OPTIONS}
                  value={hash}
                  onChange={setHash}
                  colors={colors}
                />
              </Field>
            </View>
            <View style={styles.rowItem}>
              <Field label="Yard Line">
                {textInput(yardLine, setYardLine, "0", "numeric")}
              </Field>
            </View>
          </View>

          {isOffense && (
            <>
              <SectionTitle title="Offense" />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Field label="Formation">
                    {textInput(offFormation, setOffFormation, "e.g. Shotgun")}
                  </Field>
                </View>
                <View style={styles.rowItem}>
                  <Field label="Motion">
                    {textInput(motion, setMotion, "e.g. Jet")}
                  </Field>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Field label="Play Type">
                    {textInput(playType, setPlayType, "e.g. Pass")}
                  </Field>
                </View>
                <View style={styles.rowItem}>
                  <Field label="Off Play">
                    {textInput(offPlay, setOffPlay, "e.g. Slant")}
                  </Field>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Field label="Play Dir">
                    {textInput(playDir, setPlayDir, "e.g. Left")}
                  </Field>
                </View>
                <View style={styles.rowItem}>
                  <Field label="RPO">
                    {textInput(rpo, setRpo, "Y/N")}
                  </Field>
                </View>
              </View>
              <Field label="Ball Carrier">
                {textInput(ballCarrier, setBallCarrier, "e.g. #21")}
              </Field>
            </>
          )}

          <SectionTitle title="Defense" />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Front">
                {textInput(front, setFront, "e.g. 4-3")}
              </Field>
            </View>
            <View style={styles.rowItem}>
              <Field label="Coverage">
                {textInput(coverage, setCoverage, "e.g. Cover 2")}
              </Field>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field label="Blitz">
                {textInput(blitz, setBlitz, "e.g. MLB")}
              </Field>
            </View>
            <View style={styles.rowItem}>
              <Field label="Stunt">
                {textInput(stunt, setStunt, "e.g. Twist")}
              </Field>
            </View>
          </View>
          {!isOffense && (
            <Field label="Defense Formation">
              {textInput(defense, setDefense, "e.g. 3-4")}
            </Field>
          )}

          <SectionTitle title="Result" />
          <Field label="Result">
            {textInput(result, setResult, "e.g. Complete, Gain 8")}
          </Field>
        </ScrollView>
      </View>
    </Modal>
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
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
