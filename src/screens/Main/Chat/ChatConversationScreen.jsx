import React, { useContext, useMemo, useState } from "react";
import { getDateLocale } from "../../../utils/dateLocale";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import AuthContext from "../../../contexts/AuthContext";
import { useChatConversation } from "./useChatConversation";
import { resolveUploadUrl } from "../../../utils/shifts";

const formatMessageTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(getDateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
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
    translationEnabled,
    autoTranslate,
    setAutoTranslate,
  } = useChatConversation(chatId, initialChat);
  const [showOriginalIds, setShowOriginalIds] = useState(() => new Set());

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
  const headerAvatarSource = (chat || initialChat)?.participant?.avatarUrl
    ? { uri: resolveUploadUrl((chat || initialChat).participant.avatarUrl) }
    : require("../../../assets/chatImage.jpg");

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

  const onPlaceholderActionPress = () => {
    Alert.alert(t("chat.notAvailableTitle"), t("chat.notAvailableMessage"));
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          <Image style={styles.avatarImage} source={headerAvatarSource} />
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

          {messages.map((message) => {
            const isMyMessage = message.userId === currentUserId;
            const hasTranslation =
              autoTranslate && Boolean(message.translatedText);
            const showingOriginal = showOriginalIds.has(message._id);
            const bodyText =
              hasTranslation && !showingOriginal
                ? message.translatedText
                : message.text;

            return (
              <View
                key={message._id}
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
                  ]}
                >
                  {!isMyMessage && variant === "group" ? (
                    <Text style={styles.senderName}>{message.senderName}</Text>
                  ) : null}
                  <Text
                    style={
                      isMyMessage
                        ? styles.myMessageText
                        : styles.otherMessageText
                    }
                  >
                    {bodyText}
                  </Text>
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
                  <Text
                    style={
                      isMyMessage
                        ? styles.myMessageDate
                        : styles.otherMessageDate
                    }
                  >
                    {formatMessageTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={onPlaceholderActionPress}
        >
          <Image
            style={styles.inputIcon}
            source={require("../../../assets/PlusBlack.png")}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={onPlaceholderActionPress}
        >
          <Image
            style={styles.inputIcon}
            source={require("../../../assets/CameraBlack.png")}
          />
        </TouchableOpacity>
        <View style={styles.textInputWrapper}>
          <TextInput
            onChangeText={setMessageText}
            value={messageText}
            style={styles.textInput}
            placeholder={t("chat.messagePlaceholder")}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEEEEE",
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
    width: 56,
    height: 56,
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
    backgroundColor: "#EEEEEE",
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
    backgroundColor: "#EEEEEE",
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
});
