import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BottomBar } from '../../../components/BottomBar';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const {theme} = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Search.png')} />
      </View>
      <View style={styles.chatHeader}>
        <Text style={[styles.chatTitle, { fontFamily: theme.text.fontFamily['semiBold'] }]}>Chat</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton}>
            <Text>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text>Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text>People</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text>Projects</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        <TouchableOpacity onPress={() => navigation.navigate('GroupChat', { id: 123 })} style={styles.chatItem}>
          <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
          <View style={styles.chatInfo}>
            <View style={styles.chatInfoHeader}>
              <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>General channel</Text>
              <Text style={styles.statusBadge}>20.07</Text>
            </View>
            <Text style={styles.dateText}>Adam N.</Text>
            <Text style={styles.locationText}>Thanks a lot!</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatItem}>
          <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
          <View style={styles.chatInfo}>
            <View style={styles.chatInfoHeader}>
              <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>General channel</Text>
              <Text style={styles.statusBadge}>20.07</Text>
            </View>
            <Text style={styles.dateText}>Adam N.</Text>
            <Text style={styles.locationText}>Thanks a lot!</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatItem}>
          <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
          <View style={styles.chatInfo}>
            <View style={styles.chatInfoHeader}>
              <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>General channel</Text>
              <Text style={styles.statusBadge}>20.07</Text>
            </View>
            <Text style={styles.dateText}>Adam N.</Text>
            <Text style={styles.locationText}>Thanks a lot!</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatItem}>
          <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
          <View style={styles.chatInfo}>
            <View style={styles.chatInfoHeader}>
              <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>General channel</Text>
              <Text style={styles.statusBadge}>20.07</Text>
            </View>
            <Text style={styles.dateText}>Adam N.</Text>
            <Text style={styles.locationText}>Thanks a lot!</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatItem}>
          <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
          <View style={styles.chatInfo}>
            <View style={styles.chatInfoHeader}>
              <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>General channel</Text>
              <Text style={styles.statusBadge}>20.07</Text>
            </View>
            <Text style={styles.dateText}>Adam N.</Text>
            <Text style={styles.locationText}>Thanks a lot!</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatItem}>
          <Image style={styles.chatImage} source={require('../../../assets/chatImage.jpg')} />
          <View style={styles.chatInfo}>
            <View style={styles.chatInfoHeader}>
              <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>General channel</Text>
              <Text style={styles.statusBadge}>20.07</Text>
            </View>
            <Text style={styles.dateText}>Adam N.</Text>
            <Text style={styles.locationText}>Thanks a lot!</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <BottomBar
        onLeftPress={() => navigation.navigate('Main')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={() => navigation.navigate('CreateChat')}
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
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    gap: 12,
    paddingBottom: 96,
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
  },
  dateText: {
  },
  locationText: {
  },
});