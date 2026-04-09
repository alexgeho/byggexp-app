import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, StyleSheet, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect, useContext } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthContext from '../../../contexts/AuthContext';
import { projectService, userService, companyService } from '../../../services';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export default function CreateProjectScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);

    // Проверка прав доступа - только для companyAdmin и projectAdmin
    const canManageProjects = ['companyAdmin', 'projectAdmin'].includes(user?.role);
    
    if (!canManageProjects) {
        return (
            <View style={styles.accessDeniedContainer}>
                <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
                <Text style={styles.accessDeniedSubtext}>Только администраторы могут создавать проекты</Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Вернуться назад</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [beginningDate, setBeginningDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [selectedManager, setSelectedManager] = useState(null);
    const [selectedClientCompany, setSelectedClientCompany] = useState(null);
    const [selectedWorkers, setSelectedWorkers] = useState([]);

    const [showOwnersModal, setShowOwnersModal] = useState(false);
    const [showManagersModal, setShowManagersModal] = useState(false);
    const [showCompaniesModal, setShowCompaniesModal] = useState(false);
    const [showWorkersModal, setShowWorkersModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsersAndCompanies();
    }, []);

    const fetchUsersAndCompanies = async () => {
        try {
            // Получаем мою компанию
            const myCompany = await companyService.getMyCompany();
            setCompanies([myCompany]);
            setSelectedClientCompany(myCompany._id);
            
            // Получаем пользователей моей компании
            const usersData = await userService.getByCompany(myCompany._id);
            setUsers(usersData);
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', `Failed to load data: ${error.message}`);
            setLoading(false);
        }
    };

    const handleSelectUser = (userId, type) => {
        switch(type) {
            case 'owner':
                setSelectedOwner(userId);
                setShowOwnersModal(false);
                break;
            case 'manager':
                setSelectedManager(userId);
                setShowManagersModal(false);
                break;
        }
    };

    const handleSelectCompany = (companyId) => {
        setSelectedClientCompany(companyId);
        setShowCompaniesModal(false);
    };

    const toggleWorkerSelection = (workerId) => {
        setSelectedWorkers(prev => {
            if (prev.includes(workerId)) {
                return prev.filter(id => id !== workerId);
            } else {
                return [...prev, workerId];
            }
        });
    };

    const createProject = async () => {
        if (!projectName || !selectedOwner || !selectedManager || !selectedClientCompany) {
            Alert.alert('Validation Error', 'Please fill all required fields marked with *');
            return;
        }

        setSaving(true);

        try {
            const projectData = {
                ownerId: selectedOwner,
                projectManagerId: selectedManager,
                clientCompanyId: selectedClientCompany,
                name: projectName,
                status: 'planning',
                location: location || undefined,
                contractNumber: contractNumber || undefined,
                beginningDate: beginningDate ? beginningDate.toISOString() : undefined,
                endDate: endDate ? endDate.toISOString() : undefined,
                description: description || undefined,
                workers: selectedWorkers.length > 0 ? selectedWorkers : undefined
            };

            const result = await projectService.create(projectData);
            
            console.log('Project created:', result);
            Alert.alert('Success', 'Project created successfully!');

            navigation.goBack();
        } catch (error) {
            console.error('Error creating project:', error);
            Alert.alert('Error', error.message || 'Failed to create project');
        } finally {
            setSaving(false);
        }
    };

    const SelectedItem = ({ title, value, onPress, showArrow = true }) => (
        <TouchableOpacity 
            style={[styles.selectableRow, {borderBottomWidth: 0}]} 
            onPress={onPress}
        >
            <View style={styles.rowCenter}>
                <View style={styles.iconContainer}>
                    <Image source={require('../../../assets/Account.png')} style={styles.smallIcon} />
                </View>
                <View>
                    <Text style={styles.label}>{title}</Text>
                    {value ? (
                        <Text style={styles.selectedValue}>{value}</Text>
                    ) : (
                        <Text style={styles.placeholderText}>Select...</Text>
                    )}
                </View>
            </View>
            {showArrow && <Image style={styles.arrowIcon} source={require('../../../assets/Arrow-right.png')} />}
        </TouchableOpacity>
    );

    const UsersListModal = ({ visible, onClose, onSelect, title, selectedUserId }) => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.userItem,
                                    selectedUserId === item._id && styles.selectedUserItem
                                ]}
                                onPress={() => onSelect(item._id)}
                            >
                                <Text style={styles.userName}>{item.name}</Text>
                                <Text style={styles.userEmail}>{item.email}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text>No users found</Text>}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const CompaniesListModal = ({ visible, onClose, onSelect, selectedCompanyId }) => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Client Company</Text>
                    <FlatList
                        data={companies}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.userItem,
                                    selectedCompanyId === item._id && styles.selectedUserItem
                                ]}
                                onPress={() => onSelect(item._id)}
                            >
                                <Text style={styles.userName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text>No companies found</Text>}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const WorkersListModal = ({ visible, onClose, selectedWorkers, toggleSelection }) => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Workers</Text>
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.userItem,
                                    selectedWorkers.includes(item._id) && styles.selectedUserItem
                                ]}
                                onPress={() => toggleSelection(item._id)}
                            >
                                <Text style={styles.userName}>{item.name}</Text>
                                <Text style={styles.userEmail}>{item.email}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text>No users found</Text>}
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0091FF" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, {paddingTop: 48}]}>
            <View style={styles.header}>
                <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
                <Text style={[styles.headerTitle, { fontFamily: theme.text.fontFamily['bold'] }]}>Create project</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.inputsContainer}>
                <TextInput 
                    style={[styles.input, styles.firstInput]} 
                    placeholder='Project name *' 
                    value={projectName}
                    onChangeText={setProjectName}
                />
                <TextInput 
                    style={styles.input} 
                    placeholder='Project description' 
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
                <TextInput 
                    style={styles.input} 
                    placeholder='Project address' 
                    value={location}
                    onChangeText={setLocation}
                />
                <TextInput 
                    style={styles.input} 
                    placeholder='Contract number' 
                    value={contractNumber}
                    onChangeText={setContractNumber}
                />
            </View>

            <SelectedItem 
                title="Owner *" 
                value={users.find(u => u._id === selectedOwner)?.name || ''}
                onPress={() => setShowOwnersModal(true)}
            />

            <SelectedItem 
                title="Project Manager *" 
                value={users.find(u => u._id === selectedManager)?.name || ''}
                onPress={() => setShowManagersModal(true)}
            />

            <SelectedItem 
                title="Client Company *" 
                value={companies.find(c => c._id === selectedClientCompany)?.name || ''}
                onPress={() => setShowCompaniesModal(true)}
            />

            <SelectedItem 
                title="Workers" 
                value={`${selectedWorkers.length} selected`}
                onPress={() => setShowWorkersModal(true)}
            />

            <View style={styles.datesContainer}>
                <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                >
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>
                        {beginningDate ? beginningDate.toLocaleDateString() : 'Select date'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                >
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>
                        {endDate ? endDate.toLocaleDateString() : 'Select date'}
                    </Text>
                </TouchableOpacity>
            </View>

            {showStartDatePicker && (
                <DateTimePicker
                    value={beginningDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) setBeginningDate(date);
                    }}
                />
            )}

            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) setEndDate(date);
                    }}
                />
            )}

            <TextInput
                multiline={true}
                placeholder='Note'
                style={styles.noteInput}
                value={description}
                onChangeText={setDescription}
            />

            <TouchableOpacity 
                style={styles.createButton}
                onPress={createProject}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.createButtonText}>Create Project</Text>
                )}
            </TouchableOpacity>

            <UsersListModal
                visible={showOwnersModal}
                onClose={() => setShowOwnersModal(false)}
                onSelect={(id) => handleSelectUser(id, 'owner')}
                title="Select Owner"
                selectedUserId={selectedOwner}
            />

            <UsersListModal
                visible={showManagersModal}
                onClose={() => setShowManagersModal(false)}
                onSelect={(id) => handleSelectUser(id, 'manager')}
                title="Select Project Manager"
                selectedUserId={selectedManager}
            />

            <CompaniesListModal
                visible={showCompaniesModal}
                onClose={() => setShowCompaniesModal(false)}
                onSelect={handleSelectCompany}
                selectedCompanyId={selectedClientCompany}
            />

            <WorkersListModal
                visible={showWorkersModal}
                onClose={() => setShowWorkersModal(false)}
                selectedWorkers={selectedWorkers}
                toggleSelection={toggleWorkerSelection}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
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
    placeholder: {
        width: 36,
    },
    backIcon: {
        width: 20,
        height: 20,
    },
    headerTitle: {
        color: '#052D50',
        fontSize: 18,
        textAlign: 'center',
    },
    inputsContainer: {
        padding: 18,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '100%',
        gap: 8,
        marginBottom: 12,
    },
    input: {
        paddingBottom: 12,
        paddingTop: 12,
        color: '#052D5050',
        borderBottomWidth: 1,
        borderBottomColor: '#052D5050',
    },
    firstInput: {
        borderBottomWidth: 1,
        borderColor: '#052D5050'
    },
    selectableRow: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 27,
        height: 27,
        backgroundColor: '#FF9500',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallIcon: {
        width: 16,
        height: 16,
    },
    label: {
        color: '#052D50',
        fontSize: 14,
    },
    selectedValue: {
        color: '#052D50',
        fontSize: 16,
    },
    placeholderText: {
        color: '#052D5050',
        fontSize: 14,
    },
    arrowIcon: {
        width: 10,
        height: 16,
    },
    datesContainer: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateButton: {
        flex: 1,
        padding: 8,
    },
    dateLabel: {
        color: '#052D50',
        fontSize: 12,
        marginBottom: 4,
    },
    dateValue: {
        color: '#052D50',
        fontSize: 14,
    },
    noteInput: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        width: '100%',
        marginBottom: 20,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        backgroundColor: '#0091FF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 100,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    userItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedUserItem: {
        backgroundColor: '#e6f7ff',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    closeButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#0091FF',
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#EEF5FB',
    },
    accessDeniedText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#052D50',
        marginBottom: 12,
    },
    accessDeniedSubtext: {
        fontSize: 16,
        color: '#698196',
        textAlign: 'center',
        marginBottom: 32,
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

