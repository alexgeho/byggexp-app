import React, { useState, useContext } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import AuthContext from '../../contexts/AuthContext';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { BottomBar } from '../../components/BottomBar';
import { GlassBackButton } from '../../components/common/GlassBackButton/GlassBackButton';

export const MyAccount = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'companyAdmin':
        return { title: 'Company Admin', icon: require('../../assets/About.png'), color: '#009688' };
      case 'projectAdmin':
        return { title: 'Project Admin', icon: require('../../assets/Tracker.png'), color: '#7E57C2' };
      case 'worker':
        return { title: 'Worker', icon: require('../../assets/Tasks.png'), color: '#00C853' };
      default:
        return { title: 'User', icon: require('../../assets/Account.png'), color: '#9C27B0' };
    }
  };
  
  const roleInfo = getRoleInfo();

  const openModal = (imageSource) => {
    setSelectedImage(imageSource);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const handleDownload = () => {
    console.log('Downloading image...');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton onPress={() => navigation.goBack()} iconSource={require('../../assets/Arrow-left.png')} />
        <Text style={[styles.headerTitle, { fontFamily: theme.text.fontFamily['semiBold'] }]}>
          Create project
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            style={styles.avatar}
            source={require('../../assets/Avatar.png')}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Image
              style={styles.editAvatarIcon}
              source={require('../../assets/EditAvatar.png')}
            />
          </TouchableOpacity>
        </View>
        {/* Бейдж с ролью */}
        <View style={[styles.roleBadgeLarge, { backgroundColor: roleInfo.color + '26' }]}>
          <Image style={styles.roleBadgeIcon} source={roleInfo.icon} />
          <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>{roleInfo.title}</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>Your name</Text>
          <Text style={styles.requiredAsterisk}>*</Text>
        </View>
        <TextInput style={styles.textInput} placeholder="type..." defaultValue={user?.name || ''} />
      </View>

      <View style={styles.rowContainer}>
        <View style={styles.areaCodeContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Area code</Text>
          </View>
          <TextInput style={styles.textInput} placeholder="type..." />
        </View>
        <View style={styles.phoneContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Phone</Text>
          </View>
          <TextInput style={styles.textInput} placeholder="type..." />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>Language</Text>
        </View>
        <TextInput style={styles.textInput} placeholder="type..." />
      </View>

      <View style={styles.verifyRow}>
        <View style={styles.verifyTextContainer}>
          <Text style={styles.verifyText}>
            Verify your email and phone to access other companies. Learn more
          </Text>
        </View>
        <TouchableOpacity style={styles.verifyButton}>
          <Text style={styles.verifyButtonText}>Verify</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.documentsContainer}>
        <Text style={styles.documentsLabel}>Additional Documents</Text>
        <TouchableOpacity style={styles.addButton}>
          <Image style={styles.addIcon} source={require('../../assets/PlusBlack.png')} />
        </TouchableOpacity>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.documentsScroll}
          contentContainerStyle={styles.documentsScrollContent}
        >
          {[1, 2, 3, 4, 5].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.documentImageWrapper}
              onPress={() => openModal(require('../../assets/DocPhoto.png'))}
            >
              <Image
                style={styles.documentImage}
                source={require('../../assets/DocPhoto.png')}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <BottomBar
        onLeftPress={() => navigation.navigate('Home')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={() => navigation.navigate('CreateProject')}
        renderAddContent={() => <Text style={styles.logoutButtonText}>Log out</Text>}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleDownload} style={styles.modalButton}>
                <Image
                  style={styles.modalIcon}
                  source={require('../../assets/Download.png')}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} style={styles.modalButton}>
                <Image
                  style={styles.modalIcon}
                  source={require('../../assets/Close.png')}
                />
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <Image
                style={styles.modalImage}
                source={selectedImage}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity style={styles.scanButton}>
              <Text style={styles.scanButtonText}>Scan ID Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 12,
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
  headerTitle: {
    color: '#052D50',
    fontSize: 17,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  avatarContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 130,
    height: 130,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    backgroundColor: '#ffffff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.125,
    shadowRadius: 10,
    elevation: 2,
  },
  editAvatarIcon: {
    width: 11,
    height: 11,
  },
  roleBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  roleBadgeIcon: {
    width: 16,
    height: 16,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    padding: 12,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.125,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabelRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    color: '#00000050',
  },
  requiredAsterisk: {
    color: '#ff0000ff',
  },
  textInput: {
  },
  rowContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  areaCodeContainer: {
    width: '35%',
    padding: 12,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.125,
    shadowRadius: 10,
    elevation: 2,
  },
  phoneContainer: {
    flex: 1,
    padding: 12,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.125,
    shadowRadius: 10,
    elevation: 2,
  },
  verifyRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  verifyTextContainer: {
    width: '70%',
    flexWrap: 'wrap',
  },
  verifyText: {
    color: '#052D5050',
  },
  verifyButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2582D91A',
    borderRadius: 8,
    shadowColor: '#2582D91A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.392,
    shadowRadius: 10,
    elevation: 2,
  },
  verifyButtonText: {
    color: '#2582D9',
  },
  documentsContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 96,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.125,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  documentsLabel: {
    color: '#052D5050',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  addIcon: {
    width: 20,
    height: 20,
  },
  documentsScroll: {
    width: '100%',
  },
  documentsScrollContent: {
  },
  documentImageWrapper: {
    marginRight: 12,
  },
  documentImage: {
    width: 78,
    height: 97,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  logoutButtonText: {
    color: '#ffffff',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 16,
  },
  modalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    width: 20,
    height: 20,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#0091FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

