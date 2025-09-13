import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
    TouchableOpacity,
    Image,
    FlatList,
    ActionSheetIOS,
    Platform,
    Modal,
    Dimensions,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { repairService, storageService } from "../services/firebase";
import { RepairWithDetails, RepairStatus, Priority, EvidencePhoto } from "../types";
import { RepairsStackParamList } from "../types/navigation";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { colors, typography, spacing, shadows } from "../constants/theme";

type RepairDetailScreenProps = NativeStackScreenProps<
    RepairsStackParamList,
    "RepairDetail"
>;

export const RepairDetailScreen: React.FC<RepairDetailScreenProps> = ({
    navigation,
    route,
}) => {
    const { repair: initialRepair } = route.params;
    
    // Deserializar fechas de ISO strings a objetos Date
    const deserializedRepair = {
        ...initialRepair,
        entryDate: initialRepair.entryDate ? new Date(initialRepair.entryDate) : undefined,
        expectedCompletionDate: initialRepair.expectedCompletionDate ? new Date(initialRepair.expectedCompletionDate) : undefined,
        completionDate: initialRepair.completionDate ? new Date(initialRepair.completionDate) : undefined,
    };
    
    const [repair, setRepair] = useState(deserializedRepair);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: repair.status,
        priority: repair.priority,
        cost: repair.cost?.toString() || "",
        notes: repair.notes || "",
    });
    
    // Estado para evidencias fotográficas
    const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
    const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    
    // Estado para modal de imagen en grande
    const [selectedImage, setSelectedImage] = useState<EvidencePhoto | null>(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    // Cargar evidencias existentes al montar el componente
    useEffect(() => {
        loadExistingEvidences();
    }, []);

    const loadExistingEvidences = async () => {
        try {
            if (!repair.customer?.id || !repair.equipment?.id) {
                return;
            }

            const existingPhotos = await storageService.getRepairEvidencePhotos(
                repair.clientId,
                repair.customer.id,
                repair.equipment.id,
                repair.id
            );

            const evidenceObjects: EvidencePhoto[] = existingPhotos.map((url, index) => ({
                id: `existing_${index}`,
                repairId: repair.id,
                url,
                filename: `evidence_${index}.jpg`,
                uploadedAt: new Date(), // En una implementación real, esto vendría de metadata
                uploadedBy: 'unknown', // En una implementación real, esto vendría de metadata
            }));

            setEvidencePhotos(evidenceObjects);
        } catch (error) {
            console.error('Error loading existing evidences:', error);
        }
    };

    const getStatusColor = (status: RepairStatus) => {
        switch (status) {
            case RepairStatus.PENDING:
                return colors.warning;
            case RepairStatus.IN_PROGRESS:
                return colors.primary;
            case RepairStatus.WAITING_PARTS:
                return colors.secondary;
            case RepairStatus.WAITING_AUTHORIZATION:
                return colors.secondary;
            case RepairStatus.COMPLETED:
                return colors.success;
            case RepairStatus.DELIVERED:
                return colors.textMuted;
            case RepairStatus.CANCELLED:
                return colors.error;
            default:
                return colors.secondary;
        }
    };

    const getStatusText = (status: RepairStatus) => {
        switch (status) {
            case RepairStatus.PENDING:
                return "Pendiente";
            case RepairStatus.IN_PROGRESS:
                return "En Progreso";
            case RepairStatus.WAITING_PARTS:
                return "Esperando Piezas";
            case RepairStatus.WAITING_AUTHORIZATION:
                return "Espera de autorización";
            case RepairStatus.COMPLETED:
                return "Completada";
            case RepairStatus.DELIVERED:
                return "Entregada";
            case RepairStatus.CANCELLED:
                return "Cancelada";
            default:
                return status;
        }
    };

    const getPriorityText = (priority: Priority) => {
        switch (priority) {
            case Priority.LOW:
                return "Baja";
            case Priority.MEDIUM:
                return "Media";
            case Priority.HIGH:
                return "Alta";
            case Priority.URGENT:
                return "Urgente";
            default:
                return priority;
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updateData: any = {
                status: formData.status,
                priority: formData.priority,
                notes: formData.notes || "",
                cost: formData.cost ? parseFloat(formData.cost) : 0,
            };

            if (formData.cost) {
                updateData.cost = parseFloat(formData.cost);
            }

            // Set completion date if status is completed
            if (
                formData.status === RepairStatus.COMPLETED &&
                repair.status !== RepairStatus.COMPLETED
            ) {
                updateData.completionDate = new Date();
            }

            await repairService.update(repair.id, updateData);

            // Actualizar estado local solo con campos básicos (no fechas)
            setRepair(prevRepair => ({
                ...prevRepair,
                status: formData.status,
                priority: formData.priority,
                notes: formData.notes || "",
                cost: formData.cost ? parseFloat(formData.cost) : prevRepair.cost || 0,
            }));

            setIsEditing(false);
            Alert.alert("Éxito", "Reparación actualizada exitosamente");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo actualizar la reparación");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            status: repair.status,
            priority: repair.priority,
            cost: repair.cost?.toString() || "",
            notes: repair.notes || "",
        });
        setIsEditing(false);
    };

    // Funciones para manejar evidencias
    const requestPermissions = async () => {
        const cameraPermissions = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraPermissions.status !== 'granted' || mediaLibraryPermissions.status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Se necesitan permisos de cámara y galería para tomar y seleccionar fotos.'
            );
            return false;
        }
        return true;
    };

    const showImageSourceOptions = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tomar Foto', 'Seleccionar de Galería'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        pickImageFromCamera();
                    } else if (buttonIndex === 2) {
                        pickImageFromGallery();
                    }
                }
            );
        } else {
            Alert.alert(
                'Agregar Evidencia',
                'Selecciona una opción',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Tomar Foto', onPress: pickImageFromCamera },
                    { text: 'Seleccionar de Galería', onPress: pickImageFromGallery },
                ]
            );
        }
    };

    const pickImageFromCamera = async () => {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                allowsMultipleSelection: true,
                allowsEditing: false,
                aspect: [3, 4],
                quality: 0.2,
                cameraType: ImagePicker.CameraType.back,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setEvidenceImages(prev => [...prev, imageUri]);
                Alert.alert('Éxito', 'Evidencia fotográfica agregada correctamente');
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'No se pudo tomar la foto');
        }
    };

    const pickImageFromGallery = async () => {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setEvidenceImages(prev => [...prev, imageUri]);
                Alert.alert('Éxito', 'Evidencia fotográfica agregada correctamente');
            }
        } catch (error) {
            console.error('Error selecting photo:', error);
            Alert.alert('Error', 'No se pudo seleccionar la foto');
        }
    };

    const handleAddEvidence = () => {
        showImageSourceOptions();
    };

    const handleRemoveEvidence = (index: number) => {
        Alert.alert(
            'Eliminar Evidencia',
            '¿Estás seguro de que deseas eliminar esta evidencia?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        setEvidenceImages(prev => prev.filter((_, i) => i !== index));
                        Alert.alert('Éxito', 'Evidencia eliminada correctamente');
                    }
                }
            ]
        );
    };

    const handleSaveEvidences = async () => {
        if (evidenceImages.length === 0) {
            Alert.alert('Sin evidencias', 'No hay evidencias para guardar');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Verificar que tenemos los IDs necesarios
            if (!repair.customer?.id || !repair.equipment?.id) {
                throw new Error('Información incompleta del cliente o equipo');
            }

            const downloadURLs = await storageService.uploadMultipleEvidencePhotos(
                evidenceImages,
                repair.clientId,
                repair.customer.id,
                repair.equipment.id,
                repair.id,
                (progress, currentIndex) => {
                    setUploadProgress(progress);
                }
            );

            // Crear objetos EvidencePhoto para el estado local
            const newEvidencePhotos: EvidencePhoto[] = downloadURLs.map((url, index) => ({
                id: `evidence_${Date.now()}_${index}`,
                repairId: repair.id,
                url,
                filename: `photo_${Date.now()}_${index}.jpg`,
                uploadedAt: new Date(),
                uploadedBy: 'current_user', // TODO: obtener del contexto de usuario
            }));

            // Actualizar el estado local
            setEvidencePhotos(prev => [...prev, ...newEvidencePhotos]);
            
            // Limpiar las imágenes locales
            setEvidenceImages([]);
            
            Alert.alert(
                'Éxito', 
                `Se guardaron ${downloadURLs.length} evidencias fotográficas correctamente`
            );

        } catch (error) {
            console.error('Error saving evidences:', error);
            Alert.alert(
                'Error', 
                'No se pudieron guardar las evidencias. Intenta nuevamente.'
            );
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const previewImage = (imageUri: string, index: number) => {
        // Crear objeto temporal para imagen local
        const tempEvidencePhoto: EvidencePhoto = {
            id: `temp_${index}`,
            repairId: repair.id,
            url: imageUri,
            filename: `evidencia_local_${index + 1}.jpg`,
            uploadedAt: new Date(),
            uploadedBy: 'Usuario actual',
        };
        
        Alert.alert(
            `Evidencia Local ${index + 1}`,
            'Opciones de la imagen',
            [
                { text: 'Cerrar', style: 'cancel' },
                {
                    text: 'Ver en Grande',
                    onPress: () => {
                        setSelectedImage(tempEvidencePhoto);
                        setImageModalVisible(true);
                    }
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => handleRemoveEvidence(index)
                }
            ]
        );
    };

    const previewSavedImage = (evidencePhoto: EvidencePhoto, index: number) => {
        setSelectedImage(evidencePhoto);
        setImageModalVisible(true);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{repair.title}</Text>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(repair.status) },
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {getStatusText(repair.status)}
                        </Text>
                    </View>
                </View>

                {/* Customer Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cliente</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>{repair.customer.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Teléfono:</Text>
                        <Text style={styles.value}>
                            {repair.customer.phone}
                        </Text>
                    </View>
                    {repair.customer.email && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>
                                {repair.customer.email || ""}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Equipment Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Equipo</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Marca:</Text>
                        <Text style={styles.value}>
                            {repair?.equipment?.brand || ""}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Modelo:</Text>
                        <Text style={styles.value}>
                            {repair?.equipment?.model || ""}
                        </Text>
                    </View>
                    {repair?.equipment?.year && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Año:</Text>
                            <Text style={styles.value}>
                                {repair?.equipment?.year || ""}
                            </Text>
                        </View>
                    )}
                    {repair?.equipment?.serialNumber && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Serie:</Text>
                            <Text style={styles.value}>
                                {repair?.equipment?.serialNumber || ""}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Repair Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reparación</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Descripción:</Text>
                    </View>
                    <Text style={styles.description}>
                        {repair?.description || ""}
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Fecha de entrada:</Text>
                        <Text style={styles.value}>
                            {repair?.entryDate?.toLocaleDateString("es-ES") ||
                                ""}
                        </Text>
                    </View>

                    {repair?.expectedCompletionDate && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Fecha estimada:</Text>
                            <Text style={styles.value}>
                                {repair?.expectedCompletionDate?.toLocaleDateString(
                                    "es-ES"
                                ) || ""}
                            </Text>
                        </View>
                    )}

                    {repair?.completionDate && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>
                                Fecha de finalización:
                            </Text>
                            <Text style={styles.value}>
                                {repair?.completionDate?.toLocaleDateString(
                                    "es-ES"
                                ) || ""}
                            </Text>
                        </View>
                    )}

                    {isEditing ? (
                        <>
                            <View style={styles.pickerContainer}>
                                <Text style={styles.label}>Estado:</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={formData.status}
                                        onValueChange={(value: RepairStatus) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                status: value,
                                            }))
                                        }
                                        style={styles.picker}
                                    >
                                        <Picker.Item
                                            label="Pendiente"
                                            value={RepairStatus.PENDING}
                                        />
                                        <Picker.Item
                                            label="En Progreso"
                                            value={RepairStatus.IN_PROGRESS}
                                        />
                                        <Picker.Item
                                            label="Esperando Piezas"
                                            value={RepairStatus.WAITING_PARTS}
                                        />
                                        <Picker.Item
                                            label="Espera de autorización"
                                            value={RepairStatus.WAITING_AUTHORIZATION}
                                        />
                                        <Picker.Item
                                            label="Completada"
                                            value={RepairStatus.COMPLETED}
                                        />
                                        <Picker.Item
                                            label="Entregada"
                                            value={RepairStatus.DELIVERED}
                                        />
                                        <Picker.Item
                                            label="Cancelada"
                                            value={RepairStatus.CANCELLED}
                                        />
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.pickerContainer}>
                                <Text style={styles.label}>Prioridad:</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={formData.priority}
                                        onValueChange={(value: Priority) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                priority: value,
                                            }))
                                        }
                                        style={styles.picker}
                                    >
                                        <Picker.Item
                                            label="Baja"
                                            value={Priority.LOW}
                                        />
                                        <Picker.Item
                                            label="Media"
                                            value={Priority.MEDIUM}
                                        />
                                        <Picker.Item
                                            label="Alta"
                                            value={Priority.HIGH}
                                        />
                                        <Picker.Item
                                            label="Urgente"
                                            value={Priority.URGENT}
                                        />
                                    </Picker>
                                </View>
                            </View>

                            <InputField
                                label="Costo"
                                value={formData.cost}
                                onChangeText={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        cost: value,
                                    }))
                                }
                                keyboardType="numeric"
                                placeholder="0.00"
                            />

                            <InputField
                                label="Notas"
                                value={formData.notes}
                                onChangeText={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        notes: value,
                                    }))
                                }
                                multiline
                                numberOfLines={4}
                                placeholder="Notas adicionales"
                            />
                        </>
                    ) : (
                        <>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Prioridad:</Text>
                                <Text style={styles.value}>
                                    {getPriorityText(repair.priority)}
                                </Text>
                            </View>

                            {repair.cost && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Costo:</Text>
                                    <Text style={styles.value}>
                                        ${repair.cost.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            {repair.notes && (
                                <>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>Notas:</Text>
                                    </View>
                                    <Text style={styles.description}>
                                        {repair.notes || ""}
                                    </Text>
                                </>
                            )}
                        </>
                    )}
                </View>

                {/* Evidence Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Evidencias Fotográficas</Text>
                        {isEditing && (
                            <TouchableOpacity
                                style={styles.addEvidenceButton}
                                onPress={handleAddEvidence}
                            >
                                <Ionicons name="camera" size={20} color={colors.primary} />
                                <Text style={styles.addEvidenceText}>Agregar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {(evidenceImages.length > 0 || evidencePhotos.length > 0) ? (
                        <View style={styles.evidenceContainer}>
                            {/* Evidencias guardadas en Firebase */}
                            {evidencePhotos.length > 0 && (
                                <View>
                                    <Text style={styles.evidenceSectionTitle}>Evidencias Guardadas</Text>
                                    <FlatList
                                        data={evidencePhotos}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item, index }) => (
                                            <View style={styles.evidenceItem}>
                                                <TouchableOpacity
                                                    onPress={() => previewSavedImage(item, index)}
                                                    style={styles.imageContainer}
                                                >
                                                    <Image source={{ uri: item.url }} style={styles.evidenceImage} />
                                                </TouchableOpacity>
                                                <Text style={styles.evidenceLabel}>Guardada {index + 1}</Text>
                                            </View>
                                        )}
                                        contentContainerStyle={styles.evidenceList}
                                    />
                                </View>
                            )}

                            {/* Evidencias locales pendientes de guardar */}
                            {evidenceImages.length > 0 && (
                                <View>
                                    <Text style={styles.evidenceSectionTitle}>
                                        Evidencias Pendientes {isUploading && `(Subiendo... ${uploadProgress.toFixed(0)}%)`}
                                    </Text>
                                    <FlatList
                                        data={evidenceImages}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        keyExtractor={(item, index) => `local-${index}`}
                                        renderItem={({ item, index }) => (
                                            <View style={styles.evidenceItem}>
                                                <TouchableOpacity
                                                    onPress={() => previewImage(item, index)}
                                                    style={styles.imageContainer}
                                                >
                                                    <Image source={{ uri: item }} style={styles.evidenceImage} />
                                                    {isUploading && (
                                                        <View style={styles.uploadOverlay}>
                                                            <Text style={styles.uploadText}>
                                                                {uploadProgress.toFixed(0)}%
                                                            </Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                                {isEditing && !isUploading && (
                                                    <TouchableOpacity
                                                        style={styles.removeEvidenceButton}
                                                        onPress={() => handleRemoveEvidence(index)}
                                                    >
                                                        <Ionicons name="close-circle" size={24} color={colors.error} />
                                                    </TouchableOpacity>
                                                )}
                                                <Text style={styles.evidenceLabel}>Evidencia {index + 1}</Text>
                                            </View>
                                        )}
                                        contentContainerStyle={styles.evidenceList}
                                    />
                                </View>
                            )}
                            
                            {isEditing && evidenceImages.length > 0 && !isUploading && (
                                <View style={styles.evidenceActions}>
                                    <Button
                                        title="💾 Guardar Evidencias"
                                        onPress={handleSaveEvidences}
                                        variant="outline"
                                        style={styles.saveEvidencesButton}
                                    />
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.noEvidenceContainer}>
                            <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
                            <Text style={styles.noEvidenceText}>
                                {isEditing 
                                    ? "Toca 'Agregar' para añadir evidencias fotográficas"
                                    : "No hay evidencias fotográficas registradas"
                                }
                            </Text>
                            {isEditing && (
                                <TouchableOpacity
                                    style={styles.addFirstEvidenceButton}
                                    onPress={handleAddEvidence}
                                >
                                    <Text style={styles.addFirstEvidenceText}>Agregar Primera Evidencia</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {isEditing ? (
                        <>
                            <Button
                                title="Guardar"
                                onPress={handleSave}
                                style={styles.saveButton}
                            />
                            <Button
                                title="Cancelar"
                                onPress={handleCancel}
                                variant="outline"
                                style={styles.cancelButton}
                            />
                        </>
                    ) : (
                        <>
                            <View style={styles.actionButtonsRow}>
                                <Button
                                    title="📱 Ver QR"
                                    onPress={() => {
                                        const parentNav = navigation.getParent();
                                        if (parentNav && repair.equipment) {
                                            parentNav.navigate('BarcodeDisplay', {
                                                id: repair.equipment.id,
                                                type: 'equipment' as const,
                                                title: `${repair.equipment.brand} ${repair.equipment.model}`,
                                                subtitle: `Serie: ${repair.equipment.serialNumber || 'N/A'}`,
                                            });
                                        } else {
                                            Alert.alert(
                                                'Error',
                                                'No se pudo cargar la información del equipo'
                                            );
                                        }
                                    }}
                                    style={styles.actionButton}
                                    variant="outline"
                                />
                                <Button
                                    title="📄 Generar Nota"
                                    onPress={() => {
                                        const parentNav = navigation.getParent();
                                        if (parentNav) {
                                            parentNav.navigate('RepairNoteDisplay', {
                                                repair: repair,
                                            });
                                        } else {
                                            Alert.alert(
                                                'Error',
                                                'No se pudo generar la nota'
                                            );
                                        }
                                    }}
                                    style={styles.actionButton}
                                    variant="outline"
                                />
                            </View>
                            <Button
                                title="Editar"
                                onPress={() => setIsEditing(true)}
                                style={styles.editButton}
                            />
                        </>
                    )}
                </View>
            </ScrollView>
            
            {/* Modal para ver imagen en grande */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Header del modal */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Evidencia Fotográfica</Text>
                                {selectedImage && (
                                    <Text style={styles.modalSubtitle}>
                                        {selectedImage.id.startsWith('temp_') ? '📱 Pendiente de guardar' : '☁️ Guardada en Firebase'}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setImageModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Imagen en grande */}
                        {selectedImage && (
                            <>
                                <View style={styles.imageFullContainer}>
                                    <Image 
                                        source={{ uri: selectedImage.url }} 
                                        style={styles.imageFullSize}
                                        resizeMode="contain"
                                    />
                                </View>
                                
                                {/* Información de la evidencia */}
                                <View style={styles.imageInfoContainer}>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                        <Text style={styles.modalInfoLabel}>Fecha:</Text>
                                        <Text style={styles.modalInfoValue}>
                                            {selectedImage.uploadedAt.toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                        <Text style={styles.modalInfoLabel}>Hora:</Text>
                                        <Text style={styles.modalInfoValue}>
                                            {selectedImage.uploadedAt.toLocaleTimeString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="build-outline" size={16} color={colors.textSecondary} />
                                        <Text style={styles.modalInfoLabel}>Reparación:</Text>
                                        <Text style={styles.modalInfoValue}>{repair.title}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                        
                        {/* Botón de cerrar */}
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setImageModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        flex: 1,
        marginRight: spacing.md,
    },
    statusBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
    },
    statusText: {
        ...typography.bodySmall,
        color: colors.background,
        fontWeight: "600",
    },
    section: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: spacing.sm,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: "600",
        width: 120,
    },
    value: {
        ...typography.body,
        color: colors.text,
        flex: 1,
    },
    description: {
        ...typography.body,
        color: colors.text,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    pickerContainer: {
        marginBottom: spacing.md,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.background,
        marginTop: spacing.xs,
    },
    picker: {},
    buttonContainer: {
        marginTop: spacing.lg,
    },
    editButton: {
        marginBottom: spacing.md,
    },
    barcodeButton: {
        marginBottom: spacing.md,
        borderColor: colors.primary,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        borderColor: colors.primary,
    },
    saveButton: {
        marginBottom: spacing.md,
    },
    cancelButton: {
        marginBottom: spacing.md,
    },
    // Estilos para la sección de evidencias
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // marginBottom: spacing.md,
    },
    addEvidenceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    addEvidenceText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    evidenceContainer: {
        // marginTop: spacing.sm,
    },
    evidenceList: {
        paddingRight: spacing.lg,
    },
    evidenceItem: {
        marginTop: 10,
        marginRight: spacing.md,
        alignItems: 'center',
        position: 'relative',
    },
    imageContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    evidenceImage: {
        width: 120,
        height: 120,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    removeEvidenceButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error,
    },
    evidenceLabel: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    evidenceActions: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    saveEvidencesButton: {
        minWidth: 200,
    },
    noEvidenceContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    noEvidenceText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    addFirstEvidenceButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 8,
    },
    addFirstEvidenceText: {
        ...typography.body,
        color: colors.background,
        fontWeight: '600',
        textAlign: 'center',
    },
    // Estilos para evidencias de Firebase Storage
    evidenceSectionTitle: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    uploadOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    uploadText: {
        ...typography.bodySmall,
        color: colors.background,
        fontWeight: '600',
    },
    // Estilos para modal de imagen en grande
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: spacing.lg,
        margin: spacing.lg,
        maxHeight: '90%',
        width: '90%',
        ...shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
    },
    modalSubtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    closeButton: {
        padding: spacing.xs,
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    imageFullContainer: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.sm,
    },
    imageFullSize: {
        width: Dimensions.get('window').width * 0.7,
        height: Dimensions.get('window').height * 0.4,
        borderRadius: 8,
    },
    imageInfoContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.md,
    },
    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    modalInfoLabel: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
        marginLeft: spacing.sm,
        minWidth: 80,
    },
    modalInfoValue: {
        ...typography.body,
        color: colors.text,
        flex: 1,
        marginLeft: spacing.sm,
    },
    modalCloseButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
    },
    modalCloseText: {
        ...typography.button,
        color: colors.background,
        fontWeight: '600',
    },
});
