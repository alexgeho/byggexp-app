import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { getLocales } from "expo-localization";
import { chatService } from "../../../services";

// The reader's language for chat auto-translation — the phone's real locale
// (so a Polish worker gets Polish), falling back to Swedish.
const readerLang = () => getLocales()?.[0]?.languageCode || "sv";

export const useChatConversation = (chatId, initialChat = null) => {
  const [chat, setChat] = useState(initialChat);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);

  useEffect(() => {
    let active = true;
    chatService.getTranslationStatus().then((enabled) => {
      if (active) setTranslationEnabled(enabled);
    });
    return () => {
      active = false;
    };
  }, []);

  const loadConversation = useCallback(async () => {
    if (!chatId) {
      setError("Chat id is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const lang = autoTranslate ? readerLang() : undefined;
      const [chatData, messagesData] = await Promise.all([
        chatService.getById(chatId),
        chatService.getMessages(chatId, lang),
      ]);
      const readChatData = await chatService.markAsRead(chatId);

      setChat(
        readChatData || {
          ...chatData,
          unreadCount: 0,
        },
      );
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (loadError) {
      console.error("Failed to load chat conversation:", loadError);
      setError("Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [chatId, autoTranslate]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation]),
  );

  const sendMessage = useCallback(
    async (text) => {
      const nextText = text?.trim();

      if (!chatId || !nextText) {
        return null;
      }

      try {
        setSending(true);
        const createdMessage = await chatService.sendMessage(chatId, nextText);
        setMessages((previous) => [...previous, createdMessage]);
        setChat((previous) =>
          previous
            ? {
                ...previous,
                lastMessageText: createdMessage.text,
                lastMessageAt: createdMessage.timestamp,
              }
            : previous,
        );

        return createdMessage;
      } catch (sendError) {
        console.error("Failed to send message:", sendError);
        throw sendError;
      } finally {
        setSending(false);
      }
    },
    [chatId],
  );

  const sendAttachments = useCallback(
    async (files, text = "") => {
      if (!chatId || !files?.length) {
        return null;
      }

      try {
        setSending(true);
        const createdMessage = await chatService.sendAttachments(
          chatId,
          files,
          text?.trim(),
        );
        setMessages((previous) => [...previous, createdMessage]);
        setChat((previous) =>
          previous
            ? {
                ...previous,
                lastMessageText: createdMessage.text,
                lastMessageAt: createdMessage.timestamp,
              }
            : previous,
        );

        return createdMessage;
      } catch (sendError) {
        console.error("Failed to send attachments:", sendError);
        throw sendError;
      } finally {
        setSending(false);
      }
    },
    [chatId],
  );

  return {
    chat,
    messages,
    loading,
    sending,
    error,
    translationEnabled,
    autoTranslate,
    setAutoTranslate,
    reload: loadConversation,
    sendMessage,
    sendAttachments,
  };
};
