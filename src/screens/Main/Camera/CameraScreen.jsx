import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, InteractionManager, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomBar } from '../../../components/common/BottomBar/BottomBar';
import { shiftService } from '../../../services';
import { formatDuration, formatShiftDate, resolveUploadUrl } from '../../../utils/shifts';

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const autoLaunchTriggeredRef = useRef(false);
  const cameraLaunchInFlightRef = useRef(false);

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
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await uploadAssets(result.assets);
      Alert.alert('Success', 'File attached to the current shift.');
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
      Alert.alert('Success', 'Photo attached to the current shift.');
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0091FF" />
      </View>
    );
  }

  if (!shift) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No active shift</Text>
        <Text style={styles.emptyText}>Start or resume a shift on the main screen before using the camera.</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
          <Text style={styles.actionButtonText}>Back</Text>
        </TouchableOpacity>
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
      <Text style={styles.title}>Shift camera</Text>
      <Text style={styles.subtitle}>{shift.projectName}</Text>
      <Text style={styles.metaText}>{shift.location || 'No location'}</Text>
      <Text style={styles.metaText}>{formatShiftDate(shift.shiftDate)} · {formatDuration(shift.durationMs)}</Text>
      <Text style={styles.hintText}>Camera access is required on iPhone/TestFlight. If unavailable, you can attach an image file instead.</Text>

      <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionButtonText}>Take photo</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleAttachFile} disabled={uploading}>
        <Text style={styles.secondaryButtonText}>Attach file</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.gallery}>
        {shift.photos?.length ? shift.photos.map((photo, index) => (
          <Image
            key={`${photo.url}-${index}`}
            source={{ uri: resolveUploadUrl(photo.url) }}
            style={styles.photo}
          />
        )) : (
          <Text style={styles.emptyText}>No photos attached yet.</Text>
        )}
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
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: '#EEEEEE',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 140,
    backgroundColor: '#EEEEEE',
  },
  title: {
    fontSize: 17,
    fontFamily: 'DMSans-SemiBold',
    color: '#052D50',
  },
  subtitle: {
    fontSize: 18,
    color: '#052D50',
    fontWeight: '600',
  },
  metaText: {
    fontSize: 14,
    color: '#698196',
  },
  hintText: {
    fontSize: 13,
    color: '#698196',
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: '#0091FF',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: '0px 2px 7px 0px rgba(0, 0, 0, 0.25)',
  },
  secondaryButton: {
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#0091FF',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#0091FF',
    fontSize: 16,
    fontWeight: '700',
  },
  gallery: {
    gap: 12,
    paddingBottom: 140,
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