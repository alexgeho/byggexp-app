import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';
import { projectService, taskService } from '../../../services';

const DATE_PICKER_DISPLAY = Platform.OS === 'ios' ? 'inline' : 'calendar';

const FieldIcon = ({ library = 'feather', name, size = 20, color = '#052D50' }) => {
  if (library === 'material-community') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Icon name={name} size={size} color={color} />;
};

const getFileExtension = (fileName = '') => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
};

const isImageDocument = (document) => {
  const mimeType = document?.mimeType || '';
  const extension = getFileExtension(document?.name || '').toLowerCase();
  return mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic'].includes(extension);
};

const getDocumentTypeMeta = (document) => {
  const extension = getFileExtension(document?.name || '');
  const mimeType = document?.mimeType || '';

  if (isImageDocument(document)) {
    return { icon: 'image', label: extension || 'IMAGE' };
  }

  if (mimeType.includes('pdf') || extension === 'PDF') {
    return { icon: 'file-text', label: 'PDF' };
  }

  if (['DOC', 'DOCX', 'TXT', 'RTF'].includes(extension)) {
    return { icon: 'file-text', label: extension || 'DOC' };
  }

  if (['XLS', 'XLSX', 'CSV'].includes(extension)) {
    return { icon: 'grid', label: extension || 'XLS' };
  }

  return { icon: 'file', label: extension || 'FILE' };
};

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const GroupCard = ({ children }) => (
  <View style={styles.groupCard}>{children}</View>
);

const GroupRow = ({ children, isLast = false }) => (
  <View style={[styles.groupRow, isLast && styles.groupRowLast]}>{children}</View>
);

const DateFieldModal = ({ visible, title, value, onChange, onClose }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.datePickerOverlay}>
      <View style={styles.datePickerCard}>
        <Text style={styles.datePickerTitle}>{title}</Text>
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={DATE_PICKER_DISPLAY}
          onChange={(_event, date) => {
            if (date) {
              onChange(date);
            }
          }}
        />
        <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
          <Text style={styles.datePickerButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { projectId, projectName: initialProjectName } = route.params || {};

  const [projectName, setProjectName] = useState(initialProjectName || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationsInput, setNotificationsInput] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId || projectName) {
      return;
    }

    const fetchProject = async () => {
      try {
        setLoadingProject(true);
        const project = await projectService.getById(projectId);
        setProjectName(project?.name || '');
      } catch (error) {
        console.error('Failed to load project for task creation:', error);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, projectName]);

  const notifications = useMemo(
    () => notificationsInput
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    [notificationsInput]
  );

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const pickedAssets = result.assets || [];
      setSelectedDocuments((prev) => [...prev, ...pickedAssets]);
    } catch (error) {
      console.error('Error picking task documents:', error);
      Alert.alert('Documents error', 'Unable to select documents right now.');
    }
  };

  const createTask = async () => {
    if (!projectId) {
      Alert.alert('Validation error', 'Project is required to create a task.');
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert('Validation error', 'Task title is required.');
      return;
    }

    try {
      setSaving(true);
      const taskData = new FormData();

      taskData.append('projectId', projectId);
      taskData.append('taskTitle', taskTitle.trim());

      if (taskDescription.trim()) {
        taskData.append('taskDescription', taskDescription.trim());
      }

      if (notes.trim()) {
        taskData.append('notes', notes.trim());
      }

      if (notifications.length > 0) {
        taskData.append('notifications', JSON.stringify(notifications));
      }

      if (startDate) {
        taskData.append('startDate', startDate.toISOString());
      }

      if (dueDate) {
        taskData.append('dueDate', dueDate.toISOString());
      }

      selectedDocuments.forEach((item, index) => {
        taskData.append('documents', {
          uri: item.uri,
          name: item.name || `task-document-${index + 1}`,
          type: item.mimeType || 'application/octet-stream',
        });
      });

      await taskService.create(taskData);
      Alert.alert('Success', 'Task created successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', error?.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProject) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <GlassBackButton
          backgroundColor={'rgb(253 253 253)'}
          tint="light"
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require('../../../assets/Arrow-left.png')}
        />
        <Text style={styles.headerTitle}>Create task</Text>
        <View style={styles.placeholder} />
      </View>

      <SectionLabel>General</SectionLabel>
      <GroupCard>
        <GroupRow>
          <View style={styles.rowContent}>
            <View style={styles.rowIcon}>
              <FieldIcon name="folder" />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Project</Text>
              <Text style={[styles.rowValue, !projectName && styles.rowPlaceholder]}>
                {projectName || 'Project not selected'}
              </Text>
            </View>
          </View>
        </GroupRow>
        <GroupRow isLast={true}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Task title *</Text>
            <TextInput
              style={styles.input}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="Enter task title"
              placeholderTextColor="rgba(5, 45, 80, 0.45)"
            />
          </View>
        </GroupRow>
      </GroupCard>

      <SectionLabel>Schedule</SectionLabel>
      <GroupCard>
        <TouchableOpacity style={styles.groupRow} onPress={() => setShowStartDatePicker(true)} activeOpacity={0.85}>
          <View style={styles.rowContent}>
            <View style={styles.rowIcon}>
              <FieldIcon name="calendar" />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Start date</Text>
              <Text style={[styles.rowValue, !startDate && styles.rowPlaceholder]}>
                {startDate ? startDate.toLocaleDateString() : 'Select date'}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="#052D50" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.groupRow, styles.groupRowLast]} onPress={() => setShowDueDatePicker(true)} activeOpacity={0.85}>
          <View style={styles.rowContent}>
            <View style={styles.rowIcon}>
              <FieldIcon name="clock" />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Due date</Text>
              <Text style={[styles.rowValue, !dueDate && styles.rowPlaceholder]}>
                {dueDate ? dueDate.toLocaleDateString() : 'Select date'}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="#052D50" />
        </TouchableOpacity>
      </GroupCard>

      <SectionLabel>Details</SectionLabel>
      <GroupCard>
        <GroupRow>
          <View style={styles.textAreaWrapper}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              multiline={true}
              style={[styles.input, styles.textArea]}
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="Add task description"
              placeholderTextColor="rgba(5, 45, 80, 0.45)"
            />
          </View>
        </GroupRow>
        <GroupRow isLast={true}>
          <View style={styles.textAreaWrapper}>
            <Text style={styles.inputLabel}>Notifications</Text>
            <TextInput
              multiline={true}
              style={[styles.input, styles.textArea]}
              value={notificationsInput}
              onChangeText={setNotificationsInput}
              placeholder="One notification per line"
              placeholderTextColor="rgba(5, 45, 80, 0.45)"
            />
          </View>
        </GroupRow>
      </GroupCard>

      <SectionLabel>Files</SectionLabel>
      <GroupCard>
        <TouchableOpacity style={[styles.groupRow, styles.groupRowLast]} onPress={pickDocuments} activeOpacity={0.85}>
          <View style={styles.rowContent}>
            <View style={styles.rowIcon}>
              <FieldIcon name="paperclip" />
            </View>
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Documents</Text>
              <Text style={[styles.rowValue, selectedDocuments.length === 0 && styles.rowPlaceholder]}>
                {selectedDocuments.length > 0
                  ? `${selectedDocuments.length} file${selectedDocuments.length > 1 ? 's' : ''}`
                  : 'Add files'}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="#052D50" />
        </TouchableOpacity>
      </GroupCard>

      {selectedDocuments.length > 0 ? (
        <View style={styles.documentsGrid}>
          {selectedDocuments.map((document, index) => {
            const typeMeta = getDocumentTypeMeta(document);
            const imageDocument = isImageDocument(document);

            return (
              <View key={`${document.uri}-${index}`} style={styles.documentCard}>
                {imageDocument ? (
                  <Image source={{ uri: document.uri }} style={styles.documentImage} />
                ) : (
                  <View style={styles.documentFileContent}>
                    <FieldIcon name={typeMeta.icon} size={18} />
                    <Text numberOfLines={2} style={styles.documentName}>{document.name}</Text>
                    <Text style={styles.documentTypeBadge}>{typeMeta.label}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      <SectionLabel>Notes</SectionLabel>
      <GroupCard>
        <GroupRow isLast={true}>
          <View style={styles.textAreaWrapper}>
            <Text style={styles.inputLabel}>Internal notes</Text>
            <TextInput
              multiline={true}
              style={[styles.input, styles.textAreaLarge]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes"
              placeholderTextColor="rgba(5, 45, 80, 0.45)"
            />
          </View>
        </GroupRow>
      </GroupCard>

      <TouchableOpacity
        style={[styles.createButton, saving && styles.createButtonDisabled]}
        onPress={createTask}
        disabled={saving}
      >
        {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.createButtonText}>Create Task</Text>}
      </TouchableOpacity>

      <DateFieldModal
        visible={showStartDatePicker}
        title="Start date"
        value={startDate}
        onChange={setStartDate}
        onClose={() => setShowStartDatePicker(false)}
      />
      <DateFieldModal
        visible={showDueDatePicker}
        title="Due date"
        value={dueDate}
        onChange={setDueDate}
        onClose={() => setShowDueDatePicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF5FB',
  },
  contentContainer: {
    padding: 12,
    paddingTop: 48,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5FB',
  },
  loadingText: {
    marginTop: 12,
    color: '#698196',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#052D50',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    color: '#698196',
    fontSize: 13,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
  },
  groupRow: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 45, 80, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupRowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    color: '#698196',
    fontSize: 12,
    marginBottom: 2,
  },
  rowValue: {
    color: '#052D50',
    fontSize: 16,
  },
  rowPlaceholder: {
    color: 'rgba(5, 45, 80, 0.45)',
  },
  inputWrapper: {
    width: '100%',
  },
  textAreaWrapper: {
    width: '100%',
  },
  inputLabel: {
    color: '#698196',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    color: '#052D50',
    fontSize: 16,
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 6,
  },
  textAreaLarge: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 6,
  },
  documentsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  documentCard: {
    width: '23%',
    height: 84,
    backgroundColor: '#EFEFF0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  documentFileContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 8,
  },
  documentName: {
    color: '#052D50',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  },
  documentTypeBadge: {
    color: '#052D50',
    fontSize: 10,
    fontWeight: '700',
  },
  createButton: {
    height: 56,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: '#0091FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 45, 80, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  datePickerTitle: {
    color: '#052D50',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  datePickerButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#0091FF',
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
