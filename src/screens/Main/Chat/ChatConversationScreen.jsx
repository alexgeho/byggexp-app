import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';
import AuthContext from '../../../contexts/AuthContext';
import { useChatConversation } from './useChatConversation';
import { resolveUploadUrl } from '../../../utils/shifts';

const formatMessageTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getChatSubtitle = (chat, variant) => {
  if (!chat) return '';

  if (variant === 'group') {
    const memberCount = Number(chat.memberCount) || 0;
    return memberCount ? `${memberCount} members` : 'Project group';
  }

  return chat?.participant?.profession || chat?.participant?.email || 'Direct conversation';
};

export default function ChatConversationScreen({ variant }) {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, user } = useContext(AuthContext);
  const [messageText, setMessageText] = useState('');
  const chatId = route.params?.chatId || route.params?.id || null;
  const initialChat = route.params?.initialChat || null;
  const {
    chat,
    messages,
    loading,
    sending,
    error,
    sendMessage,
  } = useChatConversation(chatId, initialChat);

  const currentUserId = userId || user?._id || user?.id || null;

  const headerTitle = chat?.title
    || initialChat?.title
    || (variant === 'group' ? 'Group chat' : 'Direct chat');

  const headerSubtitle = useMemo(
    () => getChatSubtitle(chat || initialChat, variant),
    [chat, initialChat, variant],
  );
  const headerAvatarSource = (chat || initialChat)?.participant?.avatarUrl
    ? { uri: resolveUploadUrl((chat || initialChat).participant.avatarUrl) }
    : require('../../../assets/chatImage.jpg');

  const handleSendMessage = async () => {
    const text = messageText.trim();

    if (!text) {
      return;
    }

    try {
      await sendMessage(text);
      setMessageText('');
    } catch (_error) {
      Alert.alert('Unable to send message', 'Please try again.');
    }
  };

  const onPlaceholderActionPress = () => {
    Alert.alert('Not available yet', 'Attachments and camera will be added later.');
  };

  if (!chatId) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.statusText}>Chat id is missing.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image style={styles.backgroundBlur} source={require('../../../assets/ChatBlur.png')} />

      <View style={styles.header}>
        <GlassBackButton
          backgroundColor={'rgb(253 253 253)'}
          tint={'light'}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require('../../../assets/Arrow-left.png')}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.channelName}>{headerTitle}</Text>
          {headerSubtitle ? <Text style={styles.channelStatus}>{headerSubtitle}</Text> : null}
        </View>
        <TouchableOpacity style={styles.backAvatar} activeOpacity={0.8}>
          <Image style={styles.avatarImage} source={headerAvatarSource} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0785F4" />
          <Text style={styles.statusText}>Loading messages...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Unable to load chat</Text>
              <Text style={styles.emptyStateText}>{error}</Text>
            </View>
          ) : null}

          {!error && messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateText}>Start the conversation by sending the first message.</Text>
            </View>
          ) : null}

          {messages.map((message) => {
            const isMyMessage = message.userId === currentUserId;

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
                    isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                  ]}
                >
                  {!isMyMessage && variant === 'group' ? (
                    <Text style={styles.senderName}>{message.senderName}</Text>
                  ) : null}
                  <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
                    {message.text}
                  </Text>
                  <Text style={isMyMessage ? styles.myMessageDate : styles.otherMessageDate}>
                    {formatMessageTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputButton} onPress={onPlaceholderActionPress}>
          <Image style={styles.inputIcon} source={require('../../../assets/PlusBlack.png')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputButton} onPress={onPlaceholderActionPress}>
          <Image style={styles.inputIcon} source={require('../../../assets/CameraBlack.png')} />
        </TouchableOpacity>
        <View style={styles.textInputWrapper}>
          <TextInput
            onChangeText={setMessageText}
            value={messageText}
            style={styles.textInput}
            placeholder="Message"
            multiline
          />
          {messageText ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              style={styles.sendButton}
              disabled={sending}
            >
              <Image style={styles.sendIcon} source={require('../../../assets/Send.png')} />
            </TouchableOpacity>
          ) : (
            <Image style={styles.voiceIcon} source={require('../../../assets/VoiceBlack.png')} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF5FB',
  },
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 172,
    zIndex: 1,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 24,
    zIndex: 2,
    position: 'relative',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  channelName: {
    width: '100%',
    textAlign: 'center',
    color: '#052D50',
    fontSize: 17,
    fontFamily: 'DMSans-SemiBold',
  },
  channelStatus: {
    width: '100%',
    textAlign: 'center',
    color: '#052D5050',
    fontSize: 12,
  },
  backAvatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 120,
    paddingHorizontal: 12,
    zIndex: 0,
  },
  messagesContent: {
    paddingBottom: 120,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    marginTop: 12,
    color: '#698196',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
  },
  emptyStateTitle: {
    color: '#052D50',
    fontSize: 18,
    marginBottom: 6,
  },
  emptyStateText: {
    color: '#698196',
  },
  messageRow: {
    marginBottom: 12,
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  otherMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '70%',
  },
  myMessageBubble: {
    backgroundColor: '#0785F4',
    borderBottomRightRadius: 0,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  senderName: {
    color: '#698196',
    fontSize: 11,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#ffffff',
    fontSize: 14,
  },
  otherMessageText: {
    color: '#052D50',
    fontSize: 14,
  },
  myMessageDate: {
    color: '#ffffff50',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  otherMessageDate: {
    color: '#ADB5BD',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EEF5FB',
    zIndex: 3,
  },
  inputButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
  },
  inputIcon: {
    width: 24,
    height: 24,
  },
  textInputWrapper: {
    minHeight: 48,
    flex: 1,
    borderRadius: 9999,
    backgroundColor: '#EEF5FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    color: '#052D50',
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
