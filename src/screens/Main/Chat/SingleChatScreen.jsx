import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export default function SingleChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};

  const [messages, setMessages] = useState([
    { date: '09.45', sender: '', text: 'Thanks a lot!' },
    { date: '09.45', sender: '1234', text: `SAFETY REMINDER – PLEASE READ Team, Your safety is our top priority. Please follow these essential guidelines at all times on site: PPE is Mandatory – Hard hats, safety boots, high-visibility vests, gloves, and eye protection must be worn in designated areas. Daily Briefing – Attend the toolbox talk before starting work. No exceptions. Report Hazards – If you see something unsafe, report it immediately to your supervisor or in this chat. Follow Signage – All safety signs and barriers are there for your protection. Do not bypass them. Electrical & Machinery – Only authorized personnel may operate or access electrical panels or heavy machinery. Clean As You Go – Keep your area tidy. Avoid trip hazards and dispose of waste properly. Emergency Procedures – Know the location of first aid kits, fire extinguishers, and assembly points.` },
    { date: '09.45', sender: '1234', text: `SAFETY REMINDER – PLEASE READ Team, Your safety is our top priority. Please follow these essential guidelines at all times on site: PPE is Mandatory – Hard hats, safety boots, high-visibility vests, gloves, and eye protection must be worn in designated areas. Daily Briefing – Attend the toolbox talk before starting work. No exceptions. Report Hazards – If you see something unsafe, report it immediately to your supervisor or in this chat. Follow Signage – All safety signs and barriers are there for your protection. Do not bypass them. Electrical & Machinery – Only authorized personnel may operate or access electrical panels or heavy machinery. Clean As You Go – Keep your area tidy. Avoid trip hazards and dispose of waste properly. Emergency Procedures – Know the location of first aid kits, fire extinguishers, and assembly points.` },
    { date: '09.45', sender: '', text: 'Thanks a lot!' },
  ]);

  const [messText, setMessText] = useState('');

  const sendMessage = (text) => {
    if (!text.trim()) return; 

    setMessages(prevMessages => [
      ...prevMessages,
      { date: '09.45', sender: '1234', text: text }
    ]);
  };

  return (
    <View style={styles.container}>
      <Image style={styles.backgroundBlur} source={require('../../../assets/ChatBlur.png')} />
      
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <View style={styles.headerInfo}>
          <Text style={styles.channelName}>Alex Gerhard</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backAvatar}>
          <Image style={styles.avatarImage} source={require('../../../assets/chatImage.jpg')} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((data, i) => {
          const isMyMessage = data.sender === '1234';
          return (
            <View
              key={i}
              style={[
                styles.messageRow,
                isMyMessage ? styles.myMessageRow : styles.otherMessageRow
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                  { maxWidth: '70%' }
                ]}
              >
                <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
                  {data.text}
                </Text>
                <Text style={isMyMessage ? styles.myMessageDate : styles.otherMessageDate}>
                  {data.date}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputButton}>
          <Image style={styles.inputIcon} source={require('../../../assets/PlusBlack.png')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.inputButton}>
          <Image style={styles.inputIcon} source={require('../../../assets/CameraBlack.png')} />
        </TouchableOpacity>
        <View style={styles.textInputWrapper}>
          <TextInput
            onChangeText={setMessText}
            value={messText}
            style={styles.textInput}
            placeholder='Message'
            multiline
          />
          {messText ? (
            <TouchableOpacity onPress={() => sendMessage(messText)} style={styles.sendButton}>
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
    backgroundColor: '#ffffff',
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  channelName: {
    width: '100%',
    textAlign: 'center',
    color: '#052D50',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#ffffff',
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
    height: 48,
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