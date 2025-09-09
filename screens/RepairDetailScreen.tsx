import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
} from "react-native";
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
            console.log("Form Data:", updateData);

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

                {/* Computer Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Equipo</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Marca:</Text>
                        <Text style={styles.value}>
                            {repair?.computer?.brand || ""}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Modelo:</Text>
                        <Text style={styles.value}>
                            {repair?.computer?.model || ""}
                        </Text>
                    </View>
                    {repair?.computer?.year && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Año:</Text>
                            <Text style={styles.value}>
                                {repair?.computer?.year || ""}
                            </Text>
                        </View>
                    )}
                    {repair?.computer?.serialNumber && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Serie:</Text>
                            <Text style={styles.value}>
                                {repair?.computer?.serialNumber || ""}
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
                            <Button
                                title="📱 Ver Código QR"
                                onPress={() => {
                                    const parentNav = navigation.getParent();
                                    if (parentNav) {
                                        parentNav.navigate('BarcodeDisplay', {
                                            id: repair.id,
                                            type: 'repair' as const,
                                            title: repair.title,
                                            subtitle: `${repair.computer?.brand} ${repair.computer?.model}`,
                                        });
                                    }
                                }}
                                style={styles.barcodeButton}
                                variant="outline"
                            />
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
    saveButton: {
        marginBottom: spacing.md,
    },
    cancelButton: {
        marginBottom: spacing.md,
    },
});
