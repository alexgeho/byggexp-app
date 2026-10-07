import React, { useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import Icon from "react-native-vector-icons/Feather";

import { AppIcon } from "../AppIcon";
import { useTheme } from "../../../theme/ThemeContext";
import { createStyles } from "./FieldRow.styles";

// The single source of truth for user-facing "info field rows" (icon + gray
// label + value), grouped inside a FieldCard. Extracted from the Redigera
// anställd form so the edit, profile and any future user screens render the
// exact same design instead of each rolling their own.
//
// Variants:
//   - "input"    editable TextInput (forms)
//   - "select"   tappable, shows a chevron (navigates / opens a picker)
//   - "readonly" static value (detail / profile); tappable if onPress is given
//   - "toggle"   label + optional hint with a Switch on the right
const BADGE_BLUE = "#007AFF";

export function FieldCard({ children, style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function FieldRow({
  icon,
  label,
  value,
  placeholder,
  variant = "readonly",
  onChangeText,
  onEndEditing,
  onPress,
  keyboardType,
  autoCapitalize,
  multiline = false,
  isLast = false,
  hint,
  switchValue,
  onSwitchChange,
  // Short muted prefix on the left (e.g. a point number), centred on the row.
  prefix,
  // Custom control under the label (chips, segmented choice…) — same row
  // padding and separator as every other row.
  children,
  // Floating label: while empty the label sits inside the field as its
  // placeholder (one compact line, like iOS Settings); once there is a value
  // it moves up as the small grey label. The label is never shown twice.
  floating = false,
  // Extra TextInput props (selectTextOnFocus, autoCorrect…) for "input".
  inputProps,
}) {
  const { theme } = useTheme();
  const c = theme.content;
  const styles = useMemo(() => createStyles(c), [c]);

  const badge = icon ? (
    <View style={styles.iconBadge}>
      <AppIcon name={icon} size={28} color={BADGE_BLUE} strokeWidth={1.5} />
    </View>
  ) : prefix != null ? (
    <Text style={[styles.input, { flex: 0, color: c.placeholder }]}>
      {prefix}
    </Text>
  ) : null;

  const sep = !isLast ? (
    <View style={icon ? styles.sepIcon : styles.sepPlain} />
  ) : null;

  if (children) {
    return (
      <>
        <View style={styles.rowPad}>
          <View style={styles.rowContent}>
            {badge}
            <View style={[styles.body, styles.bodyCustom]}>
              {label ? <Text style={styles.label}>{label}</Text> : null}
              {children}
            </View>
          </View>
        </View>
        {sep}
      </>
    );
  }

  if (variant === "input") {
    // Multiline fields keep the label on top: RN iOS doesn't paint a multiline
    // placeholder until the field is focused, so it can't carry the label.
    const float = floating && !multiline;
    const showLabel = label && (!float || !!value);
    return (
      <>
        <View style={[styles.rowPad, float && styles.floatingRow]}>
          <View style={styles.rowContent}>
            {badge}
            <View style={styles.body}>
              {showLabel ? <Text style={styles.label}>{label}</Text> : null}
              <TextInput
                style={[
                  styles.input,
                  multiline ? styles.inputMultiline : styles.inputLine,
                ]}
                value={value}
                onChangeText={onChangeText}
                onEndEditing={onEndEditing}
                placeholder={float ? placeholder || label : placeholder}
                placeholderTextColor={c.placeholder}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                textAlignVertical={multiline ? "top" : "auto"}
                {...inputProps}
              />
            </View>
          </View>
        </View>
        {sep}
      </>
    );
  }

  if (variant === "toggle") {
    return (
      <>
        <View style={[styles.tapRow, floating && styles.floatingRow]}>
          <View style={styles.rowContent}>
            {badge}
            <View style={styles.body}>
              <Text style={floating ? styles.value : styles.label}>
                {label}
              </Text>
              {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>
          </View>
          <Switch
            style={styles.switch}
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ true: "#34C759", false: "#D1D9E0" }}
          />
        </View>
        {sep}
      </>
    );
  }

  // "select" always shows a chevron; "readonly" shows one only when tappable.
  const showChevron =
    variant === "select" || (variant === "readonly" && onPress);
  const Container = onPress ? TouchableOpacity : View;
  const isTap = variant === "select" || onPress;

  return (
    <>
      <Container
        style={[
          isTap ? styles.tapRow : styles.rowPad,
          floating && styles.floatingRow,
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.85 : 1}
      >
        <View style={styles.rowContent}>
          {badge}
          <View style={styles.body}>
            {!floating || value ? (
              <Text style={styles.label}>{label}</Text>
            ) : null}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.value,
                !value &&
                  (floating ? styles.placeholderFloating : styles.placeholder),
              ]}
            >
              {value || placeholder || (floating ? label : "")}
            </Text>
          </View>
        </View>
        {showChevron ? (
          <Icon name="chevron-right" size={18} color={c.textPrimary} />
        ) : null}
      </Container>
      {sep}
    </>
  );
}

export default FieldRow;
