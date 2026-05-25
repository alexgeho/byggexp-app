import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CommonActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import {
  normalizeLocationSuggestions,
  searchAddressesWithNominatim,
} from "../../../utils/projectLocationSearch";

export default function ProjectAddressSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const [query, setQuery] = useState(route.params?.initialQuery || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      requestIdRef.current += 1;
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const debounceId = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const matches = await searchAddressesWithNominatim(normalizedQuery, 8);
        const nextSuggestions = normalizeLocationSuggestions(matches);

        if (requestIdRef.current === requestId) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setSuggestions([]);
        }
        console.error("Failed to search project addresses:", error);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(debounceId);
  }, [query]);

  const emptyStateText = useMemo(() => {
    if (query.trim().length < 2) {
      return "Start typing to search for a project address.";
    }

    if (loading) {
      return "";
    }

    return "No addresses found. Try a more specific search.";
  }, [loading, query]);

  const handleSelectSuggestion = (suggestion) => {
    const originRouteKey = route.params?.originRouteKey;

    if (originRouteKey) {
      navigation.dispatch({
        ...CommonActions.setParams({
          projectAddressSelection: {
            ...suggestion,
            nonce: Date.now(),
          },
        }),
        source: originRouteKey,
      });
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          Project address
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchCard}>
        <Icon name="search" size={18} color="rgba(5, 45, 80, 0.55)" />
        <TextInput
          autoFocus={true}
          value={query}
          onChangeText={setQuery}
          placeholder="Search address"
          placeholderTextColor="rgba(5, 45, 80, 0.45)"
          style={[
            styles.searchInput,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
          returnKeyType="search"
        />
      </View>

      <View style={styles.resultsCard}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { fontFamily: theme.text.fontFamily.medium },
              ]}
            >
              Searching addresses...
            </Text>
          </View>
        ) : suggestions.length ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.suggestionItem,
                  index === suggestions.length - 1 && styles.suggestionItemLast,
                ]}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Icon name="map-pin" size={16} color="#052D50" />
                <Text
                  style={[
                    styles.suggestionText,
                    { fontFamily: theme.text.fontFamily.medium },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[
                styles.emptyStateText,
                { fontFamily: theme.text.fontFamily.medium },
              ]}
            >
              {emptyStateText}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  searchCard: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: "#052D50",
    fontSize: 16,
    paddingVertical: 16,
  },
  resultsCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflow: "hidden",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  loadingText: {
    color: "#052D50",
    fontSize: 14,
  },
  suggestionItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    flex: 1,
    color: "#052D50",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyStateText: {
    color: "#698196",
    fontSize: 14,
    lineHeight: 20,
  },
});
