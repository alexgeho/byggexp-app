import { memo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import { getWorkerStatusBadge } from "../../../utils/workerStatusBadge";
import { styles } from "./CreateProjectScreen.styles";

export const getUserInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
};

export const FieldIcon = ({
  library = "feather",
  name,
  size = 20,
  color = "rgba(5, 45, 80, 1)",
}) => {
  if (library === "material-community") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Icon name={name} size={size} color={color} />;
};

const getFileExtension = (fileName = "") => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
};

export const isImageDocument = (document) => {
  const mimeType = document?.mimeType || "";
  const extension = getFileExtension(document?.name || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"].includes(extension)
  );
};

export const getDocumentTypeMeta = (document) => {
  const extension = getFileExtension(document?.name || "");
  const mimeType = document?.mimeType || "";

  if (isImageDocument(document)) {
    return { icon: "image", label: extension || "IMAGE" };
  }

  if (mimeType.includes("pdf") || extension === "PDF") {
    return { icon: "file-text", label: "PDF" };
  }

  if (["DOC", "DOCX", "TXT", "RTF"].includes(extension)) {
    return { icon: "file-text", label: extension || "DOC" };
  }

  if (["XLS", "XLSX", "CSV"].includes(extension)) {
    return { icon: "grid", label: extension || "XLS" };
  }

  return { icon: "file", label: extension || "FILE" };
};

export const ToolsListModal = memo(function ToolsListModal({
  visible,
  onClose,
  selectedTools,
  toggleSelection,
  onSave,
  toolSearch,
  onToolSearchChange,
  filteredTools,
  checkboxStyle,
  checkboxSelectedStyle,
}) {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.workersModalContainer}>
        <View style={styles.workersModalHeader}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.workersModalTitle}>
            {t("createProject.attachToolsTitle")}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={toolSearch}
            onChangeText={onToolSearchChange}
            placeholder={t("createProject.searchInstruments")}
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={filteredTools}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          keyboardShouldPersistTaps="handled"
          extraData={selectedTools}
          renderItem={({ item }) => {
            const toolId = item._id;
            const isSelected = selectedTools.includes(toolId);

            return (
              <TouchableOpacity
                style={styles.workerCard}
                onPress={() => toggleSelection(toolId)}
                activeOpacity={0.85}
              >
                <View style={styles.workerCardInfo}>
                  <Text numberOfLines={1} style={styles.workerCardName}>
                    {item.name || t("createProject.unnamedInstrument")}
                  </Text>
                  {item.notes ? (
                    <Text numberOfLines={1} style={styles.workerCardProfession}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.workerCheckbox,
                    checkboxStyle,
                    isSelected && styles.workerCheckboxSelected,
                    isSelected && checkboxSelectedStyle,
                  ]}
                >
                  {isSelected ? (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>
                {t("tools.emptyTitle")}
              </Text>
            </View>
          }
        />

        <View style={styles.workersModalFooter}>
          <TouchableOpacity style={styles.closeButton} onPress={onSave}>
            <Text style={styles.closeButtonText}>
              {selectedTools.length > 0
                ? t("createProject.saveCount", { count: selectedTools.length })
                : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

export const WorkersListModal = memo(function WorkersListModal({
  visible,
  onClose,
  selectedWorkers,
  toggleSelection,
  onSave,
  workerSearch,
  onWorkerSearchChange,
  filteredWorkers,
  checkboxStyle,
  checkboxSelectedStyle,
}) {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.workersModalContainer}>
        <View style={styles.workersModalHeader}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.workersModalTitle}>
            {t("createProject.projectTeamTitle")}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={workerSearch}
            onChangeText={onWorkerSearchChange}
            placeholder={t("createProject.searchWorkers")}
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          keyboardShouldPersistTaps="handled"
          extraData={selectedWorkers}
          renderItem={({ item }) => (
            <PersonListItem
              person={item}
              subtitle={item.profession || t("employees.noProfession")}
              statusBadge={getWorkerStatusBadge(item, null, t)}
              selectable
              selected={selectedWorkers.includes(item._id)}
              onPress={() => toggleSelection(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>
                {t("workers.notFound")}
              </Text>
            </View>
          }
        />

        <View style={styles.workersModalFooter}>
          <TouchableOpacity style={styles.closeButton} onPress={onSave}>
            <Text style={styles.closeButtonText}>
              {selectedWorkers.length > 0
                ? t("createProject.saveCount", {
                    count: selectedWorkers.length,
                  })
                : t("common.save")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

export const SelectedItem = ({
  title,
  value,
  onPress,
  showArrow = true,
  iconName = "briefcase",
  iconLibrary = "feather",
  containerStyle,
  badgeStyle,
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.selectableRow, { borderBottomWidth: 0 }, containerStyle]}
      onPress={onPress}
    >
      <View style={styles.rowCenter}>
        <View style={[styles.iconContainer, badgeStyle]}>
          <FieldIcon
            library={iconLibrary}
            name={iconName}
            size={14}
            color="#FFFFFF"
          />
        </View>
        <View>
          <Text style={styles.label}>{title}</Text>
          {value ? (
            <Text style={styles.selectedValue}>{value}</Text>
          ) : (
            <Text style={styles.placeholderText}>
              {t("createProject.selectPlaceholder")}
            </Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Image
          style={styles.arrowIcon}
          source={require("../../../assets/Arrow-right.png")}
          resizeMode="contain"
        />
      )}
    </TouchableOpacity>
  );
};

export const CompaniesListModal = ({
  visible,
  onClose,
  onSelect,
  selectedCompanyId,
  companies,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {t("createProject.selectClientCompany")}
          </Text>
          <FlatList
            data={companies}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  selectedCompanyId === item._id && styles.selectedUserItem,
                ]}
                onPress={() => onSelect(item._id)}
              >
                <Text style={styles.userName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text>{t("createProject.noCompanies")}</Text>}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>
              {t("createProject.close")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const SingleUserPickerModal = ({
  visible,
  onClose,
  title,
  searchValue,
  onSearchChange,
  selectedUserId,
  onSelect,
  data,
  checkboxStyle,
  checkboxSelectedStyle,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.workersModalContainer}>
        <View style={styles.workersModalHeader}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.workersModalTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={t("createProject.searchWorkers")}
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          renderItem={({ item }) => (
            <PersonListItem
              person={item}
              subtitle={item.profession || t("employees.noProfession")}
              statusBadge={getWorkerStatusBadge(item, null, t)}
              selectable
              selected={selectedUserId === item._id}
              onPress={() => onSelect(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>
                {t("workers.notFound")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};
