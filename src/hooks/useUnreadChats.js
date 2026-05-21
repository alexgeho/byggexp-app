import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { chatService } from "../services";

const getTotalUnreadCount = (chats = []) =>
  chats.reduce(
    (total, chat) => total + Math.max(0, Number(chat?.unreadCount) || 0),
    0,
  );

export const useUnreadChats = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const chats = await chatService.getAll();
      setUnreadCount(getTotalUnreadCount(Array.isArray(chats) ? chats : []));
    } catch (error) {
      console.error("Failed to load unread chats:", error);
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount]),
  );

  return {
    unreadCount,
    reloadUnreadCount: loadUnreadCount,
  };
};

export default useUnreadChats;
