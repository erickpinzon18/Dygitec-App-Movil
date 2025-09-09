import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { partService } from '../services/firebase';
import { Part } from '../types';
import { PartsStackParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing, shadows } from '../constants/theme';

type PartDetailScreenProps = NativeStackScreenProps<PartsStackParamList, 'PartDetail'>;

export const PartDetailScreen: React.FC<PartDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { part: initialPart } = route.params;
  const [part, setPart] = useState(initialPart);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: part.quantity.toString(),
    cost: part.cost.toString(),
    location: part.location || '',
    notes: part.notes || '',
  });

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return colors.error;
    if (quantity <= 1) return colors.warning;
    return colors.success;
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity === 0) return 'Sin stock';
    if (quantity <= 1) return 'Stock bajo';
    return 'En stock';
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const updatedData = {
        quantity: parseInt(formData.quantity) || 0,
        cost: parseFloat(formData.cost) || 0,
        location: formData.location.trim(),
        notes: formData.notes.trim(),
        updatedAt: new Date(),
      };

      await partService.update(part.id, updatedData);

      const updatedPart = { ...part, ...updatedData };
      setPart(updatedPart);
      setIsEditing(false);

      Alert.alert('Éxito', 'Pieza actualizada correctamente');
    } catch (error) {
      console.error('Error updating part:', error);
      Alert.alert('Error', 'No se pudo actualizar la pieza');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      quantity: part.quantity.toString(),
      cost: part.cost.toString(),
      location: part.location || '',
      notes: part.notes || '',
    });
    setIsEditing(false);
  };

  const handleSellPart = async () => {
    Alert.alert(
      'Vender Pieza',
      '¿Estás seguro que quieres marcar esta pieza como vendida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar como Vendida',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              const updatedData = {
                quantity: 0,
                updatedAt: new Date(),
              };

              await partService.update(part.id, updatedData);

              Alert.alert(
                'Éxito', 
                'Pieza marcada como vendida',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  }
                ]
              );
            } catch (error) {
              console.error('Error updating part:', error);
              Alert.alert('Error', 'No se pudo marcar la pieza como vendida');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{part.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStockStatusColor(part.quantity) }]}>
            <Text style={styles.statusText}>{getStockStatusText(part.quantity)}</Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Marca:</Text>
            <Text style={styles.value}>{part.brand || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Modelo:</Text>
            <Text style={styles.value}>{part.model || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Categoría:</Text>
            <Text style={styles.value}>{part.category}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Cantidad actual:</Text>
            <Text style={[styles.value, { fontWeight: '600', fontSize: 18 }]}>
              {part.quantity} unidades
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Costo:</Text>
            <Text style={[styles.value, styles.costValue]}>${part.cost.toFixed(2)}</Text>
          </View>
          
          {part.location && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ubicación:</Text>
              <Text style={styles.value}>📍 {part.location}</Text>
            </View>
          )}
        </View>

        {/* Compatibility */}
        {part.compatibility.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compatibilidad</Text>
            <View style={styles.compatibilityContainer}>
              {part.compatibility.map((comp, index) => (
                <View key={index} style={styles.compatibilityTag}>
                  <Text style={styles.compatibilityText}>{comp}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Editable Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Inventario</Text>
          
          {isEditing ? (
            <>
              <InputField
                label="Cantidad"
                value={formData.quantity}
                onChangeText={(value) => setFormData(prev => ({ ...prev, quantity: value }))}
                keyboardType="numeric"
                placeholder="0"
              />

              <InputField
                label="Costo"
                value={formData.cost}
                onChangeText={(value) => setFormData(prev => ({ ...prev, cost: value }))}
                keyboardType="numeric"
                placeholder="0.00"
              />

              <InputField
                label="Ubicación"
                value={formData.location}
                onChangeText={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholder="Estante, gaveta, etc."
              />

              <InputField
                label="Notas"
                value={formData.notes}
                onChangeText={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                multiline
                numberOfLines={4}
                placeholder="Notas adicionales sobre la pieza"
              />
            </>
          ) : (
            <>
              {/* {part.notes && ( */}
                {/* <> */}
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Notas:</Text>
                  </View>
                  <Text style={styles.description}>{part.notes || 'No hay notas'}</Text>
                {/* </> */}
              {/* )} */}
            </>
          )}
        </View>

        {/* Quick Actions */}
        {!isEditing && part.quantity > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <Button
              title="Marcar como Vendida"
              onPress={handleSellPart}
              style={styles.sellButton}
            />
          </View>
        )}

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
                      id: part.id,
                      type: 'part' as const,
                      title: part.name,
                      subtitle: `${part.brand} ${part.model}`,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontWeight: '600',
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
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    width: 120,
  },
  value: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  costValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compatibilityTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  compatibilityText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sellButton: {
    backgroundColor: colors.error,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  barcodeButton: {
    marginBottom: spacing.md,
    borderColor: colors.primary,
  },
  editButton: {
    marginBottom: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    marginBottom: spacing.md,
  },
});
