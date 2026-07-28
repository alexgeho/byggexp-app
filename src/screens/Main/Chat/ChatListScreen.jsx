import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { chatService } from "../../../services";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { resolveUploadUrl } from "../../../utils/shifts";

const FILTERS = ["All", "Groups", "People", "Projects"];

const formatChatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString([], {
    month: "2-digit",
    day: "2-digit",
  });
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { theme } = useTheme();

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await chatService.getAll();
      setChats(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Failed to load chats:", loadError);
      setError(t("chat.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  const filteredChats = useMemo(() => {
    if (activeFilter === "Groups") {
      return chats.filter((chat) => chat.type === "group");
    }

    if (activeFilter === "People") {
      return chats.filter((chat) => chat.type === "direct");
    }

    if (activeFilter === "Projects") {
      return chats.filter((chat) => chat.project?._id);
    }

    return chats;
  }, [activeFilter, chats]);

  const openChat = (chat) => {
    navigation.navigate(chat.type === "group" ? "GroupChat" : "SingleChat", {
      chatId: chat._id,
      initialChat: chat,
    });
  };

  const handleAddChat = () => {
    Alert.alert(t("chat.newChatTitle"), t("chat.newChatMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("chat.openProjects"),
        onPress: () => navigation.navigate("Projects"),
      },
    ]);
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
            { fontFamily: theme.text.fontFamily["semiBold"] },
          ]}
        >
          {t("chat.title")}
        </Text>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={loadChats}
          iconSource={require("../../../assets/Search.png")}
        />
      </View>
      <View style={styles.chatHeader}>
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={
                  activeFilter === filter
                    ? styles.activeFilterText
                    : styles.filterText
                }
              >
                {t(`chat.filters.${filter.toLowerCase()}`, filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {!loading && !error && filteredChats.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.stateTitle}>{t("chat.emptyTitle")}</Text>
          <Text style={styles.stateText}>{t("chat.emptyText")}</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#0785F4" />
            <Text style={styles.stateText}>{t("chat.loading")}</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{t("chat.loadErrorTitle")}</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading &&
          !error &&
          filteredChats.map((chat) => (
            <TouchableOpacity
              key={chat._id}
              onPress={() => openChat(chat)}
              style={styles.chatItem}
            >
              <Image
                style={styles.chatImage}
                source={
                  chat.participant?.avatarUrl
                    ? { uri: resolveUploadUrl(chat.participant.avatarUrl) }
                    : require("../../../assets/chatImage.jpg")
                }
              />
              <View style={styles.chatInfo}>
                <View style={styles.chatInfoHeader}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.projectName,
                      chat.unreadCount > 0 && styles.unreadText,
                      { fontFamily: theme.text.fontFamily["bold"] },
                    ]}
                  >
                    {chat.title}
                  </Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      chat.unreadCount > 0 && styles.unreadText,
                    ]}
                  >
                    {formatChatTime(chat.lastMessageAt)}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.dateText}>
                  {chat.type === "group"
                    ? chat.project?.name ||
                      t("chat.memberCount", { count: chat.memberCount || 0 })
                    : chat.participant?.profession ||
                      chat.participant?.email ||
                      t("chat.directChat")}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.locationText,
                    chat.unreadCount > 0 && styles.unreadText,
                  ]}
                >
                  {chat.lastMessageText || t("chat.noMessages")}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={handleAddChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
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
    width: 44,
    height: 44,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  chatHeader: {
    width: "100%",
    gap: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  filterRow: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 4,
    paddingRight: 12,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  activeFilterButton: {
    backgroundColor: "#0785F4",
  },
  filterText: {
    color: "#052D50",
  },
  activeFilterText: {
    color: "#ffffff",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    gap: 12,
    paddingBottom: 96,
  },
  stateCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyStateCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginBottom: 12,
  },
  stateTitle: {
    color: "#052D50",
    fontSize: 18,
    marginBottom: 6,
  },
  stateText: {
    color: "#698196",
    textAlign: "center",
    marginTop: 8,
  },
  chatItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  chatImage: {
    width: 72,
    height: 72,
    borderRadius: 9999,
  },
  chatInfo: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 12,
    paddingLeft: 12,
  },
  chatInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  projectName: {
    color: "#052D50",
  },
  statusBadge: {
    color: "#698196",
    fontSize: 12,
  },
  dateText: {
    color: "#698196",
    marginTop: 2,
  },
  locationText: {
    color: "#052D50",
    marginTop: 4,
  },
  unreadText: {
    fontFamily: "DMSans-Bold",
  },
});
