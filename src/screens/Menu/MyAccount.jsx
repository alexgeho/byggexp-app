import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AuthContext from '../../contexts/AuthContext';
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
import { BottomBar } from '../../components/BottomBar';
import { GlassBackButton } from '../../components/common/GlassBackButton/GlassBackButton';
import { userService } from '../../services';

const getLanguageInputValue = (language) => {
  if (!language) {
    return '';
  }

  if (typeof language === 'string') {
    return language;
  }

  if (typeof language === 'object' && !Array.isArray(language)) {
    const values = Object.values(language).filter(
      (value) => typeof value === 'string' && value.trim(),
    );
    return values[0] || '';
  }

  return '';
};

const buildLanguagePayload = (value, existingLanguage) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {};
  }

  if (existingLanguage && typeof existingLanguage === 'object' && !Array.isArray(existingLanguage)) {
    const firstKey = Object.keys(existingLanguage)[0] || 'primary';
    return { [firstKey]: trimmedValue };
  }

  return { primary: trimmedValue };
};

const parseOptionalNumber = (value) => {
  const normalized = String(value || '').replace(/\D/g, '');
  return normalized ? parseInt(normalized, 10) : undefined;
};

export const MyAccount = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user, userId, updateStoredUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    profession: '',
    email: '',
    phoneAreaCode: '',
    phoneNumber: '',
    language: '',
  });

  const profileId = userId || user?._id || user?.id || null;
  const activeRole = profile?.role || user?.role;

  const getRoleInfo = () => {
    switch (activeRole) {
      case 'superadmin':
        return { title: 'Super Admin', icon: require('../../assets/Account.png'), color: '#9C27B0' };
      case 'companyAdmin':
        return { title: 'Company Admin', icon: require('../../assets/About.png'), color: '#009688' };
      case 'projectAdmin':
        return { title: 'Project Admin', icon: require('../../assets/Tracker.png'), color: '#7E57C2' };
      case 'worker':
        return { title: 'Worker', icon: require('../../assets/Tasks.png'), color: '#00C853' };
      default:
        return { title: activeRole || 'Unknown role', icon: require('../../assets/Account.png'), color: '#9C27B0' };
    }
  };

  const roleInfo = useMemo(() => getRoleInfo(), [activeRole]);

  const applyProfileToForm = useCallback((userData) => {
    setForm({
      name: userData?.name || '',
      profession: userData?.profession || '',
      email: userData?.email || '',
      phoneAreaCode: userData?.phoneAreaCode ? String(userData.phoneAreaCode) : '',
      phoneNumber: userData?.phoneNumber ? String(userData.phoneNumber) : '',
      language: getLanguageInputValue(userData?.language),
    });
  }, []);

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await userService.getById(profileId);
      setProfile(userData);
      applyProfileToForm(userData);
    } catch (error) {
      console.error('Failed to load account:', error);
      Alert.alert('Unable to load account', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [applyProfileToForm, profileId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleNotAvailableYet = () => {
    Alert.alert('Not available yet', 'Verify and document actions will be added later.');
  };

  const handleSave = async () => {
    if (!profileId) {
      Alert.alert('Unable to save', 'User id is missing.');
      return;
    }

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: trimmedName,
        profession: form.profession.trim(),
        language: buildLanguagePayload(form.language, profile?.language),
      };
      const phoneAreaCode = parseOptionalNumber(form.phoneAreaCode);
      const phoneNumber = parseOptionalNumber(form.phoneNumber);

      if (phoneAreaCode !== undefined) {
        payload.phoneAreaCode = phoneAreaCode;
      }

      if (phoneNumber !== undefined) {
        payload.phoneNumber = phoneNumber;
      }

      const updatedUser = await userService.update(profileId, payload);

      setProfile(updatedUser);
      applyProfileToForm(updatedUser);
      await updateStoredUser({
        ...(user || {}),
        ...updatedUser,
        id: updatedUser?._id || updatedUser?.id || profileId,
      });
      Alert.alert('Saved', 'Your account has been updated.');
    } catch (error) {
      console.error('Failed to update account:', error);
      Alert.alert(
        'Unable to save',
        error?.response?.data?.message || 'Please try again later.',
      );
    } finally {
      setSaving(false);
    }
  };

  const documents = Array.isArray(profile?.additionalDocuments)
    ? profile.additionalDocuments
    : [];

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0785F4" />
        <Text style={styles.statusText}>Loading account...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton onPress={() => navigation.goBack()} iconSource={require('../../assets/Arrow-left.png')} />
        <Text style={[styles.headerTitle, { fontFamily: theme.text.fontFamily['semiBold'] }]}>
          My account
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatar}
              source={require('../../assets/Avatar.png')}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleNotAvailableYet}>
              <Image
                style={styles.editAvatarIcon}
                source={require('../../assets/EditAvatar.png')}
              />
            </TouchableOpacity>
          </View>
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
          <TextInput
            style={styles.textInput}
            placeholder="Type..."
            value={form.name}
            onChangeText={(value) => handleChange('name', value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Role</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.readOnlyInput]}
            value={roleInfo.title}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Email</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.readOnlyInput]}
            value={form.email}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Profession</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Type..."
            value={form.profession}
            onChangeText={(value) => handleChange('profession', value)}
          />
        </View>

        <View style={styles.rowContainer}>
          <View style={styles.areaCodeContainer}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Area code</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Type..."
              value={form.phoneAreaCode}
              onChangeText={(value) => handleChange('phoneAreaCode', value)}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.phoneContainer}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Phone</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Type..."
              value={form.phoneNumber}
              onChangeText={(value) => handleChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Language</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Type..."
            value={form.language}
            onChangeText={(value) => handleChange('language', value)}
          />
        </View>

        <View style={styles.documentsContainer}>
          <Text style={styles.documentsLabel}>Additional documents</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleNotAvailableYet}>
            <Image style={styles.addIcon} source={require('../../assets/PlusBlack.png')} />
          </TouchableOpacity>
          {documents.length ? (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              style={styles.documentsScroll}
              contentContainerStyle={styles.documentsScrollContent}
            >
              {documents.map((document, index) => (
                <TouchableOpacity
                  key={`${document}-${index}`}
                  style={styles.documentImageWrapper}
                  onPress={handleNotAvailableYet}
                >
                  <Image
                    style={styles.documentImage}
                    source={require('../../assets/DocPhoto.png')}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyDocumentsText}>No additional documents yet.</Text>
          )}
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate('Main')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={handleSave}
        addDisabled={saving}
        renderAddContent={() => (
          saving
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={styles.saveButtonText}>Save</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 12,
    backgroundColor: '#EEF5FB',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#EEF5FB',
  },
  statusText: {
    marginTop: 12,
    color: '#698196',
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
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 120,
    gap: 12,
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
    marginTop: 6,
    color: '#052D50',
    fontSize: 16,
    paddingVertical: 4,
  },
  readOnlyInput: {
    color: '#698196',
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
  documentsContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    paddingTop: 8,
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
  emptyDocumentsText: {
    color: '#698196',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

