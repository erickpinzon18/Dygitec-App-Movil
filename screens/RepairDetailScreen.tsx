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
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { repairService } from "../services/firebase";
import { RepairWithDetails, RepairStatus, Priority } from "../types";
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
    const [repair, setRepair] = useState(initialRepair);
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

    const getStatusColor = (status: RepairStatus) => {
        switch (status) {
            case RepairStatus.PENDING:
                return colors.warning;
            case RepairStatus.IN_PROGRESS:
                return colors.primary;
            case RepairStatus.WAITING_PARTS:
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

            // Update local state
            setRepair({
                ...repair,
                ...updateData,
                completionDate:
                    updateData.completionDate || repair.completionDate,
            });

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

    const handleSaveEvidences = () => {
        Alert.alert(
            'Guardar Evidencias',
            `Se guardarán ${evidenceImages.length} evidencias fotográficas. Esta funcionalidad estará disponible pronto.`
        );
    };

    const previewImage = (imageUri: string, index: number) => {
        Alert.alert(
            `Evidencia ${index + 1}`,
            'Opciones de la imagen',
            [
                { text: 'Cerrar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => handleRemoveEvidence(index)
                }
            ]
        );
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
                    
                    {evidenceImages.length > 0 ? (
                        <View style={styles.evidenceContainer}>
                            <FlatList
                                data={evidenceImages}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, index) => `evidence-${index}`}
                                renderItem={({ item, index }) => (
                                    <View style={styles.evidenceItem}>
                                        <TouchableOpacity
                                            onPress={() => previewImage(item, index)}
                                            style={styles.imageContainer}
                                        >
                                            <Image source={{ uri: item }} style={styles.evidenceImage} />
                                        </TouchableOpacity>
                                        {isEditing && (
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
                            
                            {isEditing && (
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
        marginBottom: spacing.md,
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
        marginTop: spacing.sm,
    },
    evidenceList: {
        paddingRight: spacing.lg,
    },
    evidenceItem: {
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
});
