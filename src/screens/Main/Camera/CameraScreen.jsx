import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { shiftService } from '../../../services';
import { formatDuration, formatShiftDate, resolveUploadUrl } from '../../../utils/shifts';

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const handleTakePhoto = async () => {
    if (!shift?.id) {
      Alert.alert('Shift required', 'Start a shift before attaching photos.');
      return;
    }

    try {
      setUploading(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Camera permission', 'Allow camera access to attach photos to the shift.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const updatedShift = await shiftService.uploadPhotos(shift.id, result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `shift-photo-${Date.now()}-${index + 1}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        type: asset.mimeType || 'image/jpeg',
      })));

      setShift(updatedShift);
      Alert.alert('Success', 'Photo attached to the current shift.');
    } catch (error) {
      console.error('Failed to capture shift photo:', error);
      Alert.alert(
        'Camera error',
        error?.response?.data?.message || error?.message || 'Unable to attach a photo right now.',
      );
    } finally {
      setUploading(false);
    }
  };

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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift camera</Text>
      <Text style={styles.subtitle}>{shift.projectName}</Text>
      <Text style={styles.metaText}>{shift.location || 'No location'}</Text>
      <Text style={styles.metaText}>{formatShiftDate(shift.shiftDate)} · {formatDuration(shift.durationMs)}</Text>

      <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionButtonText}>Take photo</Text>}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
  actionButton: {
    marginTop: 12,
    backgroundColor: '#0091FF',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  gallery: {
    gap: 12,
    paddingBottom: 32,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#EEF5FB',
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