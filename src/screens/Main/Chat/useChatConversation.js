import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { chatService } from '../../../services';

export const useChatConversation = (chatId, initialChat = null) => {
  const [chat, setChat] = useState(initialChat);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadConversation = useCallback(async () => {
    if (!chatId) {
      setError('Chat id is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [chatData, messagesData] = await Promise.all([
        chatService.getById(chatId),
        chatService.getMessages(chatId),
      ]);

      setChat(chatData);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (loadError) {
      console.error('Failed to load chat conversation:', loadError);
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  const sendMessage = useCallback(async (text) => {
    const nextText = text?.trim();

    if (!chatId || !nextText) {
      return null;
    }

    try {
      setSending(true);
      const createdMessage = await chatService.sendMessage(chatId, nextText);
      setMessages((previous) => [...previous, createdMessage]);
      setChat((previous) => (previous ? {
        ...previous,
        lastMessageText: createdMessage.text,
        lastMessageAt: createdMessage.timestamp,
      } : previous));

      return createdMessage;
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
      throw sendError;
    } finally {
      setSending(false);
    }
  }, [chatId]);

  return {
    chat,
    messages,
    loading,
    sending,
    error,
    reload: loadConversation,
    sendMessage,
  };
};
