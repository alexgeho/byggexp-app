import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { createStyles } from "./ChatListScreen.styles";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ProjectGroupIcon } from "../../../components/common/icons/ProjectGroupIcon";
import { Screen } from "../../../components/common/Screen/Screen";
import { ProjectFilterSelector } from "../../../components/common/ProjectFilterSelector/ProjectFilterSelector";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import { chatService, projectService, userService } from "../../../services";
import { getPersonWorkStatus, USER_ROLES } from "../../../utils/userRoles";
import { getEntityId } from "../../../utils/entityId";
import { statusBadgeFor } from "../../../utils/workerStatusBadge";

const getUserId = (person) => person?._id || person?.id;

// Same ordering as the Employees list: not-yet-confirmed first, then away,
// then off duty, then those currently at work.
const STATUS_SORT_PRIORITY = {
  waiting: 0,
  not_at_work: 1,
  off_duty: 2,
  at_work: 3,
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { user } = useContext(AuthContext);

  const [colleagues, setColleagues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  // Default to "All projects"; the dropdown narrows to a single project.
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  // Direct conversation keyed by the other participant's id — for the row's
  // last-message preview, timestamp and unread count.
  const [chatByPersonId, setChatByPersonId] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formatTimeAgo = useCallback(
    (value) => {
      if (!value) {
        return "";
      }
      const then = new Date(value).getTime();
      if (Number.isNaN(then)) {
        return "";
      }
      const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
      if (mins < 1) {
        return t("chat.justNow");
      }
      if (mins < 60) {
        return t("chat.minAgo", { count: mins });
      }
      const hours = Math.floor(mins / 60);
      if (hours < 24) {
        return t("chat.hourAgo", { count: hours });
      }
      const days = Math.floor(hours / 24);
      return t("chat.dayAgo", { count: days });
    },
    [t],
  );

  const loadColleagues = useCallback(async () => {
    try {
      setLoading(true);
      const [peopleData, projectsData, chatsData] = await Promise.all([
        userService.getColleagues().catch(() => []),
        (user?.role === "superadmin"
          ? projectService.getAll()
          : projectService.getMyProjects()
        ).catch(() => []),
        chatService.getAll().catch(() => []),
      ]);
      setColleagues(Array.isArray(peopleData) ? peopleData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      // Map each direct conversation to the other participant, so a colleague
      // row can show its last message, time and unread count.
      const allChats = Array.isArray(chatsData) ? chatsData : [];
      const byPerson = {};
      allChats
        .filter((chat) => chat?.type === "direct")
        .forEach((chat) => {
          const pid = getEntityId({
            id: chat?.participant?._id || chat?.participant?.id,
          });
          if (pid) {
            byPerson[pid] = chat;
          }
        });
      setChatByPersonId(byPerson);
    } catch (loadError) {
      console.error("Failed to load colleagues:", loadError);
      setColleagues([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useFocusEffect(
    useCallback(() => {
      loadColleagues();
    }, [loadColleagues]),
  );

  const visibleColleagues = useMemo(() => {
    const currentUserId = getEntityId({ id: user?._id || user?.id });
    const getSortPriority = (person) =>
      STATUS_SORT_PRIORITY[getPersonWorkStatus(person, selectedProjectId)] ??
      99;
    const getUnreadCount = (person) =>
      Number(chatByPersonId[String(getUserId(person))]?.unreadCount) || 0;
    const getLastMessageAt = (person) => {
      const at = chatByPersonId[String(getUserId(person))]?.lastMessageAt;
      const ms = at ? new Date(at).getTime() : 0;
      return Number.isNaN(ms) ? 0 : ms;
    };

    // Hide only the platform superadmin and the current user. Company admins
    // stay visible so workers can see and message their admin (and reply to
    // messages the admin started).
    const nonStaffRoles = [USER_ROLES.SUPERADMIN];

    const query = searchQuery.trim().toLowerCase();

    return (
      [...colleagues]
        .filter((person) => !nonStaffRoles.includes(person?.role))
        // GDPR-erased ("Raderad användare") users are tombstones — never list them.
        .filter((person) => !person?.erasedAt)
        .filter((person) => getEntityId(person) !== currentUserId)
        .filter((person) => {
          if (!selectedProjectId) {
            return true;
          }
          // Company admins aren't tied to a single project — keep them reachable
          // whichever project is selected.
          if (person?.role === USER_ROLES.COMPANY_ADMIN) {
            return true;
          }
          const ids = Array.isArray(person?.projectIds)
            ? person.projectIds.map((projectId) =>
                getEntityId({ id: projectId }),
              )
            : [];
          return ids.includes(String(selectedProjectId));
        })
        .filter((person) => {
          if (!query) {
            return true;
          }
          return (person?.name || person?.email || "")
            .toLowerCase()
            .includes(query);
        })
        .sort((left, right) => {
          // 1) Unread conversations always float to the very top.
          const leftUnread = getUnreadCount(left) > 0 ? 0 : 1;
          const rightUnread = getUnreadCount(right) > 0 ? 0 : 1;
          if (leftUnread !== rightUnread) {
            return leftUnread - rightUnread;
          }

          // 2) Then conversations that actually have messages, newest first,
          //    above the ones with no messages yet.
          const leftAt = getLastMessageAt(left);
          const rightAt = getLastMessageAt(right);
          const leftHasMsg = leftAt > 0 ? 0 : 1;
          const rightHasMsg = rightAt > 0 ? 0 : 1;
          if (leftHasMsg !== rightHasMsg) {
            return leftHasMsg - rightHasMsg;
          }
          if (leftAt !== rightAt) {
            return rightAt - leftAt;
          }

          // 3) No messages on either side — keep the work-status ordering.
          return getSortPriority(left) - getSortPriority(right);
        })
    );
  }, [
    colleagues,
    chatByPersonId,
    selectedProjectId,
    searchQuery,
    user?._id,
    user?.id,
  ]);

  const openReturnedChat = (chat) => {
    navigation.navigate(chat.type === "group" ? "GroupChat" : "SingleChat", {
      chatId: chat._id,
      initialChat: chat,
    });
  };

  const openChatWith = async (person) => {
    const id = getUserId(person);
    if (!id || opening) {
      return;
    }
    try {
      setOpening(true);
      const chat = await chatService.getOrCreateDirect(id);
      openReturnedChat(chat);
    } catch (error) {
      console.error("Failed to open chat:", error);
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setOpening(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const createGroup = async () => {
    if (selectedIds.length === 0 || opening) {
      return;
    }
    try {
      setOpening(true);
      const chat = await chatService.createGroup(selectedIds);
      setSelectMode(false);
      setSelectedIds([]);
      openReturnedChat(chat);
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert(t("common.error"), t("chat.loadError"));
    } finally {
      setOpening(false);
    }
  };

  const enterSelection = (personId) => {
    setSelectMode(true);
    setSelectedIds(personId ? [personId] : []);
  };

  // Selection-bar primary action: one person opens a direct chat, two or more
  // create a group. Lets the user pick recipients first, then send.
  const startConversation = async () => {
    if (selectedIds.length === 0 || opening) {
      return;
    }
    if (selectedIds.length === 1) {
      const only = colleagues.find(
        (person) => String(getUserId(person)) === String(selectedIds[0]),
      );
      if (only) {
        setSelectMode(false);
        setSelectedIds([]);
        await openChatWith(only);
      }
      return;
    }
    await createGroup();
  };

  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery("");
      }
      return !open;
    });
  };

  const openPersonProfile = (person) => {
    navigation.navigate("ChatProfile", { person });
  };

  // One conversation row: avatar, name + relative time, last-message preview,
  // and an "At work" presence badge. Selection turns the whole card blue
  // (matching the Figma), long-press enters group-select mode.
  const renderRow = (person) => {
    const personId = getUserId(person);
    const chat = chatByPersonId[String(personId)];
    const selected = selectedIds.includes(personId);
    const statusKind = getPersonWorkStatus(person, selectedProjectId);
    const statusBadge = statusKind
      ? statusBadgeFor(statusKind, t, theme.content)
      : null;
    const timeAgo = chat?.lastMessageAt
      ? formatTimeAgo(chat.lastMessageAt)
      : "";
    // It's a chat list, so the secondary line is the conversation — the last
    // message, or "No messages yet" — never the person's profession.
    const preview = chat?.lastMessageText || t("chat.noMessages");
    const unread = Number(chat?.unreadCount) || 0;

    return (
      <PersonListItem
        key={personId}
        person={person}
        subtitle={preview}
        timeAgo={timeAgo}
        statusBadge={statusBadge}
        unread={unread}
        selectable={selectMode}
        selected={selected}
        onPress={() =>
          selectMode ? toggleSelect(personId) : openChatWith(person)
        }
        onLongPress={() => enterSelection(personId)}
        onAvatarPress={() =>
          selectMode ? toggleSelect(personId) : openPersonProfile(person)
        }
      />
    );
  };

  return (
    <Screen
      title={t("chat.title")}
      onBack={() => navigation.goBack()}
      right={
        <TouchableOpacity
          style={styles.searchButton}
          onPress={toggleSearch}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.search")}
        >
          <Icon
            name={searchOpen ? "x" : "search"}
            size={20}
            color={theme.content.textPrimary}
          />
        </TouchableOpacity>
      }
    >
      {searchOpen ? (
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={theme.content.textMuted} />
          <TextInput
            style={[
              styles.searchInput,
              { fontFamily: theme.text.fontFamily.regular },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("chat.searchPlaceholder")}
            placeholderTextColor={theme.content.placeholder}
            autoFocus
            returnKeyType="search"
          />
        </View>
      ) : null}

      <View style={styles.searchContainer}>
        <ProjectFilterSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={setSelectedProjectId}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          style={styles.scrollContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          data={visibleColleagues}
          keyExtractor={(person) => String(getUserId(person))}
          renderItem={({ item }) => renderRow(item)}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t("chat.emptyTitle")}</Text>
              <Text style={styles.emptySubtitle}>{t("chat.emptyText")}</Text>
            </View>
          }
        />
      )}

      {selectMode ? (
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={toggleSelectMode}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.groupButton,
              selectedIds.length === 0 && styles.groupButtonDisabled,
            ]}
            onPress={startConversation}
            disabled={selectedIds.length === 0 || opening}
            activeOpacity={0.85}
          >
            <Text style={styles.groupButtonText}>
              {selectedIds.length > 1
                ? t("chat.createGroupCount", { count: selectedIds.length })
                : t("chat.messageAction")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          onAddPress={() => enterSelection()}
          renderAddContent={() => (
            <ProjectGroupIcon width={32} height={20} color="#FFFFFF" />
          )}
        />
      )}
    </Screen>
  );
}
