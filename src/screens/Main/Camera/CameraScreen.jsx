import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, InteractionManager, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BackButton } from '../../../components/common/BackButton/BackButton';
import { BottomBar } from '../../../components/common/BottomBar/BottomBar';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { shiftService } from '../../../services';
import {
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
  standardScreenContainer,
} from '../../../styles/screenLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { formatShiftDayLabel, resolveUploadUrl } from '../../../utils/shifts';
import { IMAGE_DOCUMENT_TYPES, pickUploadAssets } from '../../../utils/uploadPicker';

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const autoLaunchTriggeredRef = useRef(false);
  const cameraLaunchInFlightRef = useRef(false);

  const getPhotoFileName = useCallback((photo) => {
    if (photo?.name) {
      return photo.name;
    }

    const urlSegment = photo?.url?.split('/').pop();
    return urlSegment || 'Photo';
  }, []);

  const formatPhotoCountLabel = useCallback((count) => {
    return `${count} ${count === 1 ? 'photo' : 'photos'}`;
  }, []);

  const loadShift = useCallback(async () => {
    try {
      setLoading(true);
      const currentShift = await shiftService.getCurrent();

      if (route.params?.shiftId && currentShift?.id !== route.params.shiftId) {
        setShift(null);
        return;
      }

      setShift(currentShift);
    } catch (error) {
      console.error('Failed to load current shift for camera:', error);
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, [route.params?.shiftId]);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const uploadAssets = useCallback(async (assets) => {
    if (!shift?.id || !assets?.length) {
      return;
    }

    const updatedShift = await shiftService.uploadPhotos(
      shift.id,
      assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || asset.name || `shift-photo-${Date.now()}-${index + 1}.jpg`,
        mimeType: asset.mimeType || asset.type || 'image/jpeg',
        type: asset.mimeType || asset.type || 'image/jpeg',
      })),
    );

    setShift(updatedShift);
  }, [shift?.id]);

  const handleAttachFile = useCallback(async () => {
    if (!shift?.id) {
      Alert.alert('Shift required', 'Start a shift before attaching files.');
      return;
    }

    try {
      setUploading(true);
      const pickedAssets = await pickUploadAssets({
        documentTypes: IMAGE_DOCUMENT_TYPES,
        fileNamePrefix: 'shift-photo',
      });

      if (!pickedAssets.length) {
        return;
      }

      await uploadAssets(pickedAssets);
      showSuccess({
        title: 'File attached',
        message: 'File attached to the current shift.',
      });
    } catch (error) {
      console.error('Failed to attach shift file:', error);
      Alert.alert(
        'Attach error',
        error?.response?.data?.message || error?.message || 'Unable to attach a file right now.',
      );
    } finally {
      setUploading(false);
    }
  }, [shift?.id, uploadAssets]);

  const promptOpenSettings = useCallback(() => {
    Alert.alert(
      'Camera access needed',
      'Enable camera access for ByggExp in iPhone Settings to take photos in TestFlight builds.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (cameraLaunchInFlightRef.current || uploading) {
      return;
    }

    if (!shift?.id) {
      Alert.alert('Shift required', 'Start a shift before attaching photos.');
      return;
    }

    try {
      cameraLaunchInFlightRef.current = true;
      setUploading(true);
      let permission = await ImagePicker.getCameraPermissionsAsync();

      if (!permission.granted) {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (!permission.granted) {
        if (permission.canAskAgain === false) {
          promptOpenSettings();
          return;
        }

        Alert.alert(
          'Camera access needed',
          'Allow camera access to take a shift photo. You can still attach an image from your files.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Attach file', onPress: () => handleAttachFile() },
          ],
        );
        return;
      }

      let result;

      try {
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      } catch (cameraError) {
        console.warn('Camera unavailable, falling back to file picker:', cameraError);
        Alert.alert(
          'Camera unavailable',
          'Camera is unavailable on this device right now. You can attach an image from your files instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Attach file', onPress: () => handleAttachFile() },
          ],
        );
        return;
      }

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await uploadAssets(result.assets);
      showSuccess({
        title: 'Photo attached',
        message: 'Photo attached to the current shift.',
      });
    } catch (error) {
      console.error('Failed to capture shift photo:', error);
      Alert.alert(
        'Camera error',
        error?.response?.data?.message || error?.message || 'Unable to attach a photo right now.',
      );
    } finally {
      cameraLaunchInFlightRef.current = false;
      setUploading(false);
    }
  }, [handleAttachFile, promptOpenSettings, shift?.id, uploadAssets, uploading]);

  useEffect(() => {
    if (!route.params?.autoOpen || loading || !shift?.id || autoLaunchTriggeredRef.current) {
      return;
    }

    autoLaunchTriggeredRef.current = true;

    let timeoutId;
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      timeoutId = setTimeout(() => {
        handleTakePhoto();
      }, 350);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      interactionTask.cancel();
    };
  }, [handleTakePhoto, loading, route.params?.autoOpen, shift?.id]);

  const renderHeader = () => (
    <View style={styles.header}>
      <BackButton
        backgroundColor="rgba(255, 255, 255, 0.6)"
        tint="light"
        borderColor="#FFFFFF50"
        onPress={() => navigation.goBack()}
        iconSource={require('../../../assets/Arrow-left.png')}
      />
      <Text
        style={[
          styles.headerTitle,
          { fontFamily: theme.text.fontFamily.semiBold },
        ]}
      >
        Camera
      </Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        {renderHeader()}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0091FF" />
        </View>
      </View>
    );
  }

  if (!shift) {
    return (
      <View style={styles.centered}>
        {renderHeader()}
        <View style={styles.emptyStateContent}>
          <Text style={styles.emptyTitle}>No active shift</Text>
          <Text style={styles.emptyText}>
            Start or resume a shift on the main screen before using the camera.
          </Text>
        </View>
        <BottomBar
          onLeftPress={() => navigation.navigate('Main')}
          onRightPress={() => navigation.navigate('Menu')}
          showAddButton={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.projectCard}>
          <View style={styles.projectCardHeader}>
            <Text
              style={[
                styles.projectCardLabel,
                { fontFamily: theme.text.fontFamily.medium },
              ]}
            >
              Current project
            </Text>
            <View style={styles.activeShiftBadge}>
              <Text
                style={[
                  styles.activeShiftBadgeText,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                Active shift
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.projectName,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {shift.projectName || '—'}
          </Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.buttonContent}>
              <Image
                source={require('../../../assets/Camera-white.png')}
                style={styles.buttonIcon}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                Take photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleAttachFile} disabled={uploading}>
          <View style={styles.buttonContent}>
            <Image
              source={require('../../../assets/Paperclip-blue.png')}
              style={styles.secondaryButtonIcon}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              Attach file
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.cameraHint}>
          If camera is unavailable, attach a file instead.
        </Text>

        <View style={styles.photosCard}>
          {!shift.photos?.length ? (
            <>
              <Text
                style={[
                  styles.photosCardTitle,
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                Photos for this shift
              </Text>

              <View style={styles.photosEmptyBlock}>
                <Image
                  source={require('../../../assets/Camera-gray.png')}
                  style={styles.photosEmptyIcon}
                />
                <Text
                  style={[
                    styles.photosEmptyTitle,
                    { fontFamily: theme.text.fontFamily.semiBold },
                  ]}
                >
                  No photos attached yet.
                </Text>
                <Text
                  style={[
                    styles.photosEmptyDescription,
                    { fontFamily: theme.text.fontFamily.regular },
                  ]}
                >
                  Take a photo or attach a file to link it to the current shift.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.photosAttachedBlock}>
              <View style={styles.photosAttachedHeader}>
                <Text
                  style={[
                    styles.photosAttachedTitle,
                    { fontFamily: theme.text.fontFamily.semiBold },
                  ]}
                >
                  Attached photo
                </Text>
                <View style={styles.activeShiftBadge}>
                  <Text
                    style={[
                      styles.activeShiftBadgeText,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                  >
                    {formatPhotoCountLabel(shift.photos.length)}
                  </Text>
                </View>
              </View>

              {shift.photos.map((photo, index) => (
                <View
                  key={`${photo.url}-${index}`}
                  style={[
                    styles.attachedPhotoItem,
                    index < shift.photos.length - 1 && styles.attachedPhotoItemSpacing,
                  ]}
                >
                  <Image
                    source={{ uri: resolveUploadUrl(photo.url) }}
                    style={styles.photo}
                  />
                  <View style={styles.attachedPhotoMeta}>
                    <View style={styles.attachedPhotoMetaText}>
                      <Text
                        style={[
                          styles.attachedPhotoName,
                          { fontFamily: theme.text.fontFamily.semiBold },
                        ]}
                      >
                        {getPhotoFileName(photo)}
                      </Text>
                      <Text
                        style={[
                          styles.attachedPhotoDate,
                          { fontFamily: theme.text.fontFamily.regular },
                        ]}
                      >
                        {formatShiftDayLabel(shift.shiftDate)} shift
                      </Text>
                    </View>
                    <View style={styles.visibleInShiftsBadge}>
                      <Text
                        style={[
                          styles.visibleInShiftsBadgeText,
                          { fontFamily: theme.text.fontFamily.medium },
                        ]}
                      >
                        Visible in Work shifts
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!shift.photos?.length ? (
            <>
              <View style={styles.photosDivider} />

              <Text
                style={[
                  styles.photosFooter,
                  { fontFamily: theme.text.fontFamily.regular },
                ]}
              >
                Photos added here appear in Work shifts details.
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate('Main')}
        onRightPress={() => navigation.navigate('Menu')}
        showAddButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    gap: 0,
  },
  contentScroll: {
    flex: 1,
    width: '100%',
  },
  contentScrollContent: {
    gap: 12,
    paddingBottom: 140,
  },
  centered: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerPlaceholder: {
    ...standardScreenHeaderPlaceholder,
  },
  headerTitle: {
    color: '#052D50',
    fontSize: 17,
    textAlign: 'center',
  },
  emptyStateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 140,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 140,
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  projectCardLabel: {
    color: 'rgba(95, 117, 136, 1)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  activeShiftBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(58, 129, 219, 0.1)',
    borderRadius: 10,
  },
  activeShiftBadgeText: {
    color: 'rgba(58, 129, 219, 1)',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  projectName: {
    marginTop: 10,
    color: 'rgba(5, 45, 80, 1)',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: 'rgba(7, 133, 244, 1)',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: 1,
    borderColor: 'rgba(7, 133, 244, 0.72)',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(4.5px)',
          WebkitBackdropFilter: 'blur(4.5px)',
        }
      : {}),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
  secondaryButtonIcon: {
    width: 20,
    height: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: 'rgba(7, 133, 244, 0.9)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  cameraHint: {
    color: '#698196',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  photosCard: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(4.5px)',
          WebkitBackdropFilter: 'blur(4.5px)',
        }
      : {}),
  },
  photosCardTitle: {
    color: 'rgba(5, 45, 80, 1)',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 14,
  },
  photosEmptyBlock: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(5, 45, 80, 0.12)',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  photosEmptyIcon: {
    width: 20,
    height: 20,
    marginBottom: 10,
  },
  photosEmptyTitle: {
    color: 'rgba(5, 45, 80, 1)',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  photosEmptyDescription: {
    color: 'rgba(95, 117, 136, 1)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  photosAttachedBlock: {
    marginBottom: 14,
  },
  photosAttachedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  photosAttachedTitle: {
    color: 'rgba(5, 45, 80, 1)',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    flex: 1,
  },
  attachedPhotoItem: {
    gap: 12,
  },
  attachedPhotoItemSpacing: {
    marginBottom: 16,
  },
  attachedPhotoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  attachedPhotoMetaText: {
    flex: 1,
    gap: 2,
  },
  attachedPhotoName: {
    color: 'rgba(5, 45, 80, 1)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  attachedPhotoDate: {
    color: 'rgba(95, 117, 136, 1)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  visibleInShiftsBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(58, 129, 219, 0.1)',
    borderRadius: 10,
    flexShrink: 0,
  },
  visibleInShiftsBadgeText: {
    color: 'rgba(58, 129, 219, 1)',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  photosDivider: {
    height: 1,
    backgroundColor: 'rgba(5, 45, 80, 0.1)',
    marginBottom: 14,
  },
  photosFooter: {
    color: 'rgba(95, 117, 136, 1)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#EEEEEE',
  },
  emptyTitle: {
    color: '#052D50',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#698196',
    textAlign: 'center',
  },
});