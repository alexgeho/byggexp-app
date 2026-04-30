import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BottomBar } from '../../../components/BottomBar';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';
import { chatService } from '../../../services';

const FILTERS = ['All', 'Groups', 'People', 'Projects'];

const formatChatTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
  });
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {theme} = useTheme();

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await chatService.getAll();
      setChats(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error('Failed to load chats:', loadError);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const filteredChats = useMemo(() => {
    if (activeFilter === 'Groups') {
      return chats.filter((chat) => chat.type === 'group');
    }

    if (activeFilter === 'People') {
      return chats.filter((chat) => chat.type === 'direct');
    }

    if (activeFilter === 'Projects') {
      return chats.filter((chat) => chat.project?._id);
    }

    return chats;
  }, [activeFilter, chats]);

  const openChat = (chat) => {
    navigation.navigate(chat.type === 'group' ? 'GroupChat' : 'SingleChat', {
      chatId: chat._id,
      initialChat: chat,
    });
  };

  const handleAddChat = () => {
    Alert.alert(
      'New chat',
      'Open projects to start a personal or project group chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open projects', onPress: () => navigation.navigate('Projects') },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={loadChats} iconSource={require('../../../assets/Search.png')} />
      </View>
      <View style={styles.chatHeader}>
        <Text style={[styles.chatTitle, { fontFamily: theme.text.fontFamily['semiBold'] }]}>Chat</Text>
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
              <Text style={activeFilter === filter ? styles.activeFilterText : styles.filterText}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#0785F4" />
            <Text style={styles.stateText}>Loading chats...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Unable to load chats</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && filteredChats.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No chats yet</Text>
            <Text style={styles.stateText}>Your conversations will appear here.</Text>
          </View>
        ) : null}

        {!loading && !error && filteredChats.map((chat) => (
          <TouchableOpacity key={chat._id} onPress={() => openChat(chat)} style={styles.chatItem}>
            <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
            <View style={styles.chatInfo}>
              <View style={styles.chatInfoHeader}>
                <Text
                  numberOfLines={1}
                  style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}
                >
                  {chat.title}
                </Text>
                <Text style={styles.statusBadge}>{formatChatTime(chat.lastMessageAt)}</Text>
              </View>
              <Text numberOfLines={1} style={styles.dateText}>
                {chat.type === 'group'
                  ? (chat.project?.name || `${chat.memberCount || 0} members`)
                  : (chat.participant?.profession || chat.participant?.email || 'Direct chat')}
              </Text>
              <Text numberOfLines={2} style={styles.locationText}>
                {chat.lastMessageText || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomBar
        onLeftPress={() => navigation.navigate('Main')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={handleAddChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: '#EEF5FB',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  chatHeader: {
    width: '100%',
    gap: 12,
    paddingBottom: 12,
    paddingTop: 24,
  },
  chatTitle: {
    color: '#052D50',
    fontSize: 17,
  },
  filterRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 4,
    paddingRight: 12,
    paddingLeft: 12,
  },
  activeFilterButton: {
    backgroundColor: '#0785F4',
  },
  filterText: {
    color: '#052D50',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    gap: 12,
    paddingBottom: 96,
  },
  stateCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
  },
  stateTitle: {
    color: '#052D50',
    fontSize: 18,
    marginBottom: 6,
  },
  stateText: {
    color: '#698196',
    textAlign: 'center',
    marginTop: 8,
  },
  chatItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 9999,
  },
  chatImage: {
    width: 72,
    height: 72,
    borderRadius: 9999,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingLeft: 12,
  },
  chatInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  projectName: {
    color: '#052D50',
  },
  statusBadge: {
    color: '#698196',
    fontSize: 12,
  },
  dateText: {
    color: '#698196',
    marginTop: 2,
  },
  locationText: {
    color: '#052D50',
    marginTop: 4,
  },
});