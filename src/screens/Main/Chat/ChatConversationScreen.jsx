import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDateLocale } from "../../../utils/dateLocale";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import AuthContext from "../../../contexts/AuthContext";
import { useChatConversation } from "./useChatConversation";
import { resolveUploadUrl } from "../../../utils/shifts";
import { pickFromCamera, pickDocuments } from "../../../utils/uploadPicker";

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

const getInitials = (name) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

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

export default function ChatConversationScreen({ variant }) {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
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

  const toggleOriginal = (id) =>
    setShowOriginalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const currentUserId = userId || user?._id || user?.id || null;

  const headerTitle =
    chat?.title ||
    initialChat?.title ||
    (variant === "group" ? t("chat.groupChat") : t("chat.directChat"));

  const headerSubtitle = useMemo(
    () => getChatSubtitle(chat || initialChat, variant, t),
    [chat, initialChat, variant, t],
  );
  const participant = (chat || initialChat)?.participant;
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
        <TouchableOpacity style={styles.backAvatar} activeOpacity={0.8}>
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
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
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
              <Text style={styles.emptyStateTitle}>{t("chat.noMessages")}</Text>
              <Text style={styles.emptyStateText}>
                {t("chat.startConversation")}
              </Text>
            </View>
          ) : null}

          {messages.map((message, index) => {
            const isMyMessage = message.userId === currentUserId;
            const hasTranslation =
              autoTranslate && Boolean(message.translatedText);
            const showingOriginal = showOriginalIds.has(message._id);
            const bodyText =
              hasTranslation && !showingOriginal
                ? message.translatedText
                : message.text;

            const attachments = message.attachments || [];
            // Image-only messages render as the bare photo (rounded corners,
            // timestamp overlaid) instead of inside the colored chat bubble, so
            // there's no blue frame around the picture.
            const isImageOnly =
              attachments.length > 0 &&
              attachments.every((att) => att.kind === "image") &&
              !bodyText &&
              !hasTranslation;

            const previous = index > 0 ? messages[index - 1] : null;
            const showDaySeparator =
              !previous || !isSameDay(previous.timestamp, message.timestamp);

            return (
              <React.Fragment key={message._id}>
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
                  <View
                    style={[
                      styles.messageBubble,
                      isMyMessage
                        ? styles.myMessageBubble
                        : styles.otherMessageBubble,
                      isImageOnly && styles.mediaBubble,
                    ]}
                  >
                    {!isMyMessage && variant === "group" ? (
                      <Text style={styles.senderName}>
                        {message.senderName}
                      </Text>
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
                              <Image
                                style={styles.attachmentImage}
                                source={{ uri: url }}
                              />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              key={`${message._id}-att-${attIndex}`}
                              style={styles.attachmentFile}
                              activeOpacity={0.85}
                              onPress={() => Linking.openURL(url)}
                            >
                              <Text
                                style={styles.attachmentFileName}
                                numberOfLines={1}
                              >
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
                          isMyMessage
                            ? styles.myMessageText
                            : styles.otherMessageText
                        }
                      >
                        {bodyText}
                      </Text>
                    ) : null}
                    {hasTranslation ? (
                      <TouchableOpacity
                        onPress={() => toggleOriginal(message._id)}
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
                      <View
                        style={styles.mediaTimeOverlay}
                        pointerEvents="none"
                      >
                        <Text style={styles.mediaTimeText}>
                          {formatMessageTime(message.timestamp)}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={
                          isMyMessage
                            ? styles.myMessageDate
                            : styles.otherMessageDate
                        }
                      >
                        {formatMessageTime(message.timestamp)}
                      </Text>
                    )}
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </ScrollView>
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
          ) : (
            <Image
              style={styles.voiceIcon}
              source={require("../../../assets/VoiceBlack.png")}
            />
          )}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f1f6",
  },
  backgroundBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 172,
    zIndex: 1,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 24,
    zIndex: 2,
    position: "relative",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  channelName: {
    width: "100%",
    textAlign: "center",
    color: "#052D50",
    fontSize: 17,
    fontFamily: "DMSans-SemiBold",
  },
  channelStatus: {
    width: "100%",
    textAlign: "center",
    color: "#052D5050",
    fontSize: 12,
  },
  backAvatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  avatarInitials: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  messagesContainer: {
    flex: 1,
    width: "100%",
    paddingTop: 120,
    paddingHorizontal: 12,
    zIndex: 0,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statusText: {
    marginTop: 12,
    color: "#698196",
    textAlign: "center",
  },
  emptyState: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  emptyStateTitle: {
    color: "#052D50",
    fontSize: 18,
    marginBottom: 6,
  },
  emptyStateText: {
    color: "#698196",
  },
  translateToggle: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  translateToggleText: {
    color: "#052D50",
    fontSize: 12,
    fontFamily: "DMSans-SemiBold",
  },
  translatedHint: {
    fontSize: 10,
    marginTop: 4,
  },
  myTranslatedHint: {
    color: "#ffffffcc",
  },
  otherTranslatedHint: {
    color: "#0785F4",
  },
  daySeparator: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  daySeparatorText: {
    color: "#052D50",
    fontSize: 12,
    fontFamily: "DMSans-SemiBold",
  },
  messageRow: {
    marginBottom: 12,
  },
  myMessageRow: {
    alignItems: "flex-end",
  },
  otherMessageRow: {
    alignItems: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%",
  },
  // Image-only messages: drop the colored bubble so the photo shows on its own.
  mediaBubble: {
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 18,
    overflow: "hidden",
  },
  attachmentsMedia: {
    marginBottom: 0,
    gap: 0,
  },
  mediaTimeOverlay: {
    position: "absolute",
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(5, 45, 80, 0.45)",
  },
  mediaTimeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  myMessageBubble: {
    backgroundColor: "#0785F4",
    borderBottomRightRadius: 0,
  },
  otherMessageBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  senderName: {
    color: "#698196",
    fontSize: 11,
    marginBottom: 4,
  },
  attachments: {
    gap: 6,
    marginBottom: 4,
  },
  attachmentImage: {
    width: 220,
    height: 220,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  attachmentFile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.06)",
    maxWidth: 220,
  },
  attachmentFileName: {
    color: "#052D50",
    fontSize: 13,
  },
  myMessageText: {
    color: "#ffffff",
    fontSize: 14,
  },
  otherMessageText: {
    color: "#052D50",
    fontSize: 14,
  },
  myMessageDate: {
    color: "#ffffff50",
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  otherMessageDate: {
    color: "#ADB5BD",
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
    backgroundColor: "#f2f1f6",
  },
  inputButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  inputIcon: {
    width: 24,
    height: 24,
  },
  textInputWrapper: {
    minHeight: 48,
    flex: 1,
    borderRadius: 9999,
    // Match the "+" attach button on the left.
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    color: "#052D50",
    maxHeight: 96,
  },
  sendButton: {
    padding: 4,
  },
  sendIcon: {
    width: 24,
    height: 24,
  },
  voiceIcon: {
    width: 24,
    height: 24,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheetBackdropPress: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F2F1F6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 36,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(5, 45, 80, 0.18)",
    marginBottom: 14,
  },
  sheetTitle: {
    textAlign: "center",
    fontSize: 13,
    letterSpacing: 0.3,
    color: "#8895A7",
    fontFamily: "DMSans-SemiBold",
    marginBottom: 12,
  },
  // Grouped iOS-style card holding the options; white rows on the light sheet.
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  sheetDivider: {
    height: 1,
    marginLeft: 72,
    backgroundColor: "rgba(5, 45, 80, 0.07)",
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetIconCamera: {
    backgroundColor: "rgba(7, 133, 244, 0.12)",
  },
  sheetIconFile: {
    backgroundColor: "rgba(147, 51, 234, 0.12)",
  },
  sheetOptionCopy: {
    flex: 1,
  },
  sheetOptionText: {
    fontSize: 16,
    color: "#052D50",
    fontFamily: "DMSans-SemiBold",
  },
  sheetOptionHint: {
    fontSize: 13,
    color: "#8895A7",
    marginTop: 2,
  },
  sheetCancel: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: {
    fontSize: 16,
    color: "#052D50",
    fontFamily: "DMSans-SemiBold",
  },
});
