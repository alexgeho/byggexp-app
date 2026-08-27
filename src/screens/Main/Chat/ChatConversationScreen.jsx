import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getDateLocale } from "../../../utils/dateLocale";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Icon from "react-native-vector-icons/Feather";
import { createStyles } from "./ChatConversationScreen.styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import AuthContext from "../../../contexts/AuthContext";
import { useChatConversation } from "./useChatConversation";
import { resolveUploadUrl } from "../../../utils/shifts";
import { getInitials } from "../../../utils/initials";
import { pickFromCamera, pickDocuments } from "../../../utils/uploadPicker";
import { moderationService } from "../../../services/moderation.service";

const REPORT_REASONS = ["spam", "harassment", "inappropriate", "other"];

// Palette for the initials fallback avatar; white text reads well on all of
// these.
const AVATAR_COLORS = [
  "#0089f6",
  "#338600",
  "#F5A524",
  "#9333EA",
  "#E11D48",
  "#0891B2",
  "#DB2777",
  "#65A30D",
];

// Deterministic color per name, so the same person always gets the same one.
const getAvatarColor = (name) => {
  const key = String(name || "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatMessageTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(getDateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

// Telegram-style centered day label: "Today" / "Yesterday" / a full date.
const formatDaySeparator = (value, t) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return t("chat.today", "Today");
  if (isSameDay(date, yesterday)) return t("chat.yesterday", "Yesterday");

  return date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
};

const getChatSubtitle = (chat, variant, t) => {
  if (!chat) return "";

  if (variant === "group") {
    const memberCount = Number(chat.memberCount) || 0;
    return memberCount
      ? t("chat.memberCount", { count: memberCount })
      : t("chat.projectGroup");
  }

  return (
    chat?.participant?.profession ||
    chat?.participant?.email ||
    t("chat.directConversation")
  );
};

// One chat bubble. Memoized so unrelated state changes (typing in the input,
// the attach sheet opening) don't re-render every message in the list — only a
// row whose own props change (e.g. its translation is toggled) re-renders.
const MessageRow = React.memo(function MessageRow({
  message,
  isMyMessage,
  variant,
  autoTranslate,
  showingOriginal,
  showDaySeparator,
  styles,
  t,
  onLongPress,
  onToggleOriginal,
}) {
  const hasTranslation = autoTranslate && Boolean(message.translatedText);
  const bodyText =
    hasTranslation && !showingOriginal ? message.translatedText : message.text;

  const attachments = message.attachments || [];
  // Image-only messages render as the bare photo (rounded corners, timestamp
  // overlaid) instead of inside the colored chat bubble.
  const isImageOnly =
    attachments.length > 0 &&
    attachments.every((att) => att.kind === "image") &&
    !bodyText &&
    !hasTranslation;

  return (
    <>
      {showDaySeparator ? (
        <View style={styles.daySeparator}>
          <Text style={styles.daySeparatorText}>
            {formatDaySeparator(message.timestamp, t)}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        <Pressable
          onLongPress={isMyMessage ? undefined : () => onLongPress(message)}
          delayLongPress={350}
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            isImageOnly && styles.mediaBubble,
          ]}
        >
          {!isMyMessage && variant === "group" ? (
            <Text style={styles.senderName}>{message.senderName}</Text>
          ) : null}
          {message.attachments?.length ? (
            <View
              style={[
                styles.attachments,
                isImageOnly && styles.attachmentsMedia,
              ]}
            >
              {message.attachments.map((att, attIndex) => {
                const url = resolveUploadUrl(att.url);
                return att.kind === "image" ? (
                  <TouchableOpacity
                    key={`${message._id}-att-${attIndex}`}
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(url)}
                  >
                    <ExpoImage
                      style={styles.attachmentImage}
                      source={url}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={0}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={`${message._id}-att-${attIndex}`}
                    style={styles.attachmentFile}
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(url)}
                  >
                    <Text style={styles.attachmentFileName} numberOfLines={1}>
                      📎 {att.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {bodyText ? (
            <Text
              style={
                isMyMessage ? styles.myMessageText : styles.otherMessageText
              }
            >
              {bodyText}
            </Text>
          ) : null}
          {hasTranslation ? (
            <TouchableOpacity
              onPress={() => onToggleOriginal(message._id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.translatedHint,
                  isMyMessage
                    ? styles.myTranslatedHint
                    : styles.otherTranslatedHint,
                ]}
              >
                {showingOriginal
                  ? t("chat.showTranslation")
                  : message.sourceLang
                    ? t("chat.translatedFromShowOriginal", {
                        lang: message.sourceLang,
                      })
                    : t("chat.translatedShowOriginal")}
              </Text>
            </TouchableOpacity>
          ) : null}
          {isImageOnly ? (
            <View style={styles.mediaTimeOverlay} pointerEvents="none">
              <Text style={styles.mediaTimeText}>
                {formatMessageTime(message.timestamp)}
              </Text>
            </View>
          ) : (
            <Text
              style={
                isMyMessage ? styles.myMessageDate : styles.otherMessageDate
              }
            >
              {formatMessageTime(message.timestamp)}
            </Text>
          )}
        </Pressable>
      </View>
    </>
  );
});

export default function ChatConversationScreen({ variant }) {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { userId, user } = useContext(AuthContext);
  const [messageText, setMessageText] = useState("");
  const chatId = route.params?.chatId || route.params?.id || null;
  const initialChat = route.params?.initialChat || null;
  const {
    chat,
    messages,
    loading,
    sending,
    error,
    sendMessage,
    sendAttachments,
    translationEnabled,
    autoTranslate,
    setAutoTranslate,
  } = useChatConversation(chatId, initialChat);
  const [showOriginalIds, setShowOriginalIds] = useState(() => new Set());
  const [uploading, setUploading] = useState(false);

  // Stable so the memoized MessageRow doesn't re-render on every keystroke.
  const toggleOriginal = useCallback(
    (id) =>
      setShowOriginalIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  const currentUserId = userId || user?._id || user?.id || null;

  // Report/block controls for user-generated content (App Store Guideline 1.2).
  const [reportTarget, setReportTarget] = useState(null);

  const confirmBlock = useCallback(
    (reportedUserId) => {
      Alert.alert(
        t("moderation.blockConfirmTitle"),
        t("moderation.blockConfirmMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("moderation.blockUser"),
            style: "destructive",
            onPress: async () => {
              try {
                await moderationService.blockUser(reportedUserId);
                Alert.alert(
                  t("moderation.blockedTitle"),
                  t("moderation.blockedMessage"),
                  [
                    {
                      text: t("common.ok"),
                      onPress: () => navigation.goBack(),
                    },
                  ],
                );
              } catch {
                Alert.alert(
                  t("moderation.errorTitle"),
                  t("moderation.errorMessage"),
                );
              }
            },
          },
        ],
      );
    },
    [t, navigation],
  );

  // Stable so the memoized MessageRow keeps its identity across re-renders.
  const openMessageActions = useCallback(
    (message) => {
      if (!message || message.userId === currentUserId) return;
      const reportedUserId = message.userId;
      Alert.alert(t("moderation.actionsTitle"), undefined, [
        {
          text: t("moderation.reportMessage"),
          onPress: () => setReportTarget({ message, reportedUserId }),
        },
        {
          text: t("moderation.blockUser"),
          style: "destructive",
          onPress: () => confirmBlock(reportedUserId),
        },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    },
    [t, currentUserId, confirmBlock],
  );

  const submitReport = async (reason) => {
    const target = reportTarget;
    setReportTarget(null);
    if (!target) return;
    try {
      await moderationService.reportContent({
        reportedUserId: target.reportedUserId,
        chatId,
        messageId: target.message?._id,
        reason,
      });
      Alert.alert(
        t("moderation.reportedTitle"),
        t("moderation.reportedMessage"),
      );
    } catch {
      Alert.alert(t("moderation.errorTitle"), t("moderation.errorMessage"));
    }
  };

  const headerTitle =
    chat?.title ||
    initialChat?.title ||
    (variant === "group" ? t("chat.groupChat") : t("chat.directChat"));

  const headerSubtitle = useMemo(
    () => getChatSubtitle(chat || initialChat, variant, t),
    [chat, initialChat, variant, t],
  );
  const participant = (chat || initialChat)?.participant;

  const participantUserId =
    participant?.id || participant?._id || participant?.userId || null;

  const openParticipantActions = () => {
    if (variant === "group" || !participantUserId) return;
    Alert.alert(t("moderation.actionsTitle"), undefined, [
      {
        text: t("moderation.reportUser"),
        onPress: () =>
          setReportTarget({ message: null, reportedUserId: participantUserId }),
      },
      {
        text: t("moderation.blockUser"),
        style: "destructive",
        onPress: () => confirmBlock(participantUserId),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const avatarUri = participant?.avatarUrl
    ? resolveUploadUrl(participant.avatarUrl)
    : null;
  // Name to derive the initials fallback from: the other person for direct
  // chats, otherwise the chat/group title.
  const avatarName = participant?.name || headerTitle || "";

  const handleSendMessage = async () => {
    const text = messageText.trim();

    if (!text) {
      return;
    }

    try {
      await sendMessage(text);
      setMessageText("");
    } catch (_error) {
      Alert.alert(t("chat.sendFailedTitle"), t("common.tryAgain"));
    }
  };

  const runAttachmentPicker = async (picker) => {
    if (uploading) {
      return;
    }
    try {
      const files = await picker({ fileNamePrefix: "chat" });
      if (!files?.length) {
        return;
      }
      setUploading(true);
      await sendAttachments(files, "");
    } catch (_error) {
      Alert.alert(t("chat.sendFailedTitle"), t("common.tryAgain"));
    } finally {
      setUploading(false);
    }
  };

  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(
    function animateSheetIn() {
      if (attachSheetVisible) {
        Animated.timing(sheetAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    },
    [attachSheetVisible, sheetAnim],
  );

  const closeAttachSheet = (after) => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 170,
      useNativeDriver: true,
    }).start(() => {
      setAttachSheetVisible(false);
      if (typeof after === "function") {
        after();
      }
    });
  };

  const handleAttachPress = () => {
    setAttachSheetVisible(true);
  };

  if (!chatId) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.statusText}>{t("chat.idMissing")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // With edge-to-edge enabled, Android no longer resizes the window for the
      // keyboard, so "padding" is needed on both platforms to lift the input.
      behavior="padding"
    >
      <Image
        style={styles.backgroundBlur}
        source={require("../../../assets/ChatBlur.png")}
      />

      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.channelName}>{headerTitle}</Text>
          {headerSubtitle ? (
            <Text style={styles.channelStatus}>{headerSubtitle}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.backAvatar}
          activeOpacity={0.8}
          onPress={
            variant === "group" ? undefined : () => openParticipantActions()
          }
        >
          {avatarUri ? (
            <Image style={styles.avatarImage} source={{ uri: avatarUri }} />
          ) : (
            <View
              style={[
                styles.avatarInitials,
                { backgroundColor: getAvatarColor(avatarName) },
              ]}
            >
              <Text style={styles.avatarInitialsText}>
                {getInitials(avatarName)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0785F4" />
          <Text style={styles.statusText}>{t("chat.loadingMessages")}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          data={messages}
          keyExtractor={(message) => message._id}
          initialNumToRender={15}
          windowSize={11}
          removeClippedSubviews={false}
          ListHeaderComponent={
            <>
              {translationEnabled ? (
                <TouchableOpacity
                  style={styles.translateToggle}
                  activeOpacity={0.8}
                  onPress={() => setAutoTranslate((value) => !value)}
                >
                  <Text style={styles.translateToggleText}>
                    {autoTranslate
                      ? t("chat.autoTranslateOn")
                      : t("chat.autoTranslateOff")}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {error ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    {t("chat.loadChatErrorTitle")}
                  </Text>
                  <Text style={styles.emptyStateText}>{error}</Text>
                </View>
              ) : null}

              {!error && messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    {t("chat.noMessages")}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {t("chat.startConversation")}
                  </Text>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item: message, index }) => {
            const previous = index > 0 ? messages[index - 1] : null;
            const showDaySeparator =
              !previous || !isSameDay(previous.timestamp, message.timestamp);

            return (
              <MessageRow
                message={message}
                isMyMessage={message.userId === currentUserId}
                variant={variant}
                autoTranslate={autoTranslate}
                showingOriginal={showOriginalIds.has(message._id)}
                showDaySeparator={showDaySeparator}
                styles={styles}
                t={t}
                onLongPress={openMessageActions}
                onToggleOriginal={toggleOriginal}
              />
            );
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={handleAttachPress}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#0785F4" />
          ) : (
            <Image
              style={styles.inputIcon}
              source={require("../../../assets/PlusBlack.png")}
            />
          )}
        </TouchableOpacity>
        <View style={styles.textInputWrapper}>
          <TextInput
            onChangeText={setMessageText}
            value={messageText}
            style={styles.textInput}
            placeholder={t("chat.messagePlaceholder")}
            placeholderTextColor="#8895A7"
            multiline
          />
          {messageText ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              style={styles.sendButton}
              disabled={sending}
            >
              <Image
                style={styles.sendIcon}
                source={require("../../../assets/Send.png")}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Modal
        visible={attachSheetVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeAttachSheet()}
      >
        <Animated.View style={[styles.sheetBackdrop, { opacity: sheetAnim }]}>
          <Pressable
            style={styles.sheetBackdropPress}
            onPress={() => closeAttachSheet()}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t("chat.attachTitle")}</Text>
          <View style={styles.sheetCard}>
            <TouchableOpacity
              style={styles.sheetOption}
              activeOpacity={0.6}
              onPress={() =>
                closeAttachSheet(() => runAttachmentPicker(pickFromCamera))
              }
            >
              <View style={[styles.sheetIcon, styles.sheetIconCamera]}>
                <Icon name="camera" size={22} color="#0785F4" />
              </View>
              <View style={styles.sheetOptionCopy}>
                <Text style={styles.sheetOptionText}>
                  {t("chat.takePhoto")}
                </Text>
                <Text style={styles.sheetOptionHint}>
                  {t("chat.takePhotoHint")}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#C2CCD6" />
            </TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity
              style={styles.sheetOption}
              activeOpacity={0.6}
              onPress={() =>
                closeAttachSheet(() => runAttachmentPicker(pickDocuments))
              }
            >
              <View style={[styles.sheetIcon, styles.sheetIconFile]}>
                <Icon name="paperclip" size={22} color="#9333EA" />
              </View>
              <View style={styles.sheetOptionCopy}>
                <Text style={styles.sheetOptionText}>
                  {t("chat.attachFile")}
                </Text>
                <Text style={styles.sheetOptionHint}>
                  {t("chat.attachFileHint")}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#C2CCD6" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sheetCancel}
            activeOpacity={0.7}
            onPress={() => closeAttachSheet()}
          >
            <Text style={styles.sheetCancelText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      <Modal
        visible={!!reportTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setReportTarget(null)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setReportTarget(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {t("moderation.reportReasonTitle")}
          </Text>
          <View style={styles.sheetCard}>
            {REPORT_REASONS.map((reason, index) => (
              <React.Fragment key={reason}>
                {index > 0 ? <View style={styles.sheetDivider} /> : null}
                <TouchableOpacity
                  style={styles.sheetOption}
                  activeOpacity={0.6}
                  onPress={() => submitReport(reason)}
                >
                  <Text style={styles.sheetOptionText}>
                    {t(
                      `moderation.reason${reason.charAt(0).toUpperCase()}${reason.slice(1)}`,
                    )}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
          <TouchableOpacity
            style={styles.sheetCancel}
            activeOpacity={0.7}
            onPress={() => setReportTarget(null)}
          >
            <Text style={styles.sheetCancelText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
