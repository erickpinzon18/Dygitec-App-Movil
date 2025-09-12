import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Button } from '../components/Button';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { RepairWithDetails, RepairStatus, Priority } from '../types';

type RepairNoteDisplayScreenProps = NativeStackScreenProps<RootStackParamList, 'RepairNoteDisplay'>;

export const RepairNoteDisplayScreen: React.FC<RepairNoteDisplayScreenProps> = ({
  navigation,
  route,
}) => {
  const { repair } = route.params;
  const [loading, setLoading] = useState(false);
  const noteRef = useRef<ViewShot>(null);

  // Generar datos para el código QR de la reparación
  const generateRepairQRData = (repairId: string) => {
    return `repair:${repairId}`;
  };

  // Generar datos para el código QR del equipo
  const generateEquipmentQRData = (equipmentId: string) => {
    return `equipment:${equipmentId}`;
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

  const captureNote = async () => {
    try {
      if (noteRef.current && noteRef.current.capture) {
        const uri = await noteRef.current.capture();
        return uri;
      }
      throw new Error('No se pudo capturar la nota');
    } catch (error) {
      console.error('Error capturing note:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      
      // Solicitar permisos para acceder a la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Se necesitan permisos para guardar y compartir la imagen'
        );
        return;
      }

      // Capturar y generar la imagen
      const imageUri = await captureNote();
      
      if (imageUri) {
        // Primero guardar en la galería
        await MediaLibrary.saveToLibraryAsync(imageUri);
        
        // Compartir solo la imagen sin texto adicional
        await Share.share({
          url: imageUri,
        });
        
        Alert.alert(
          'Éxito', 
          'Nota guardada en galería y compartida. Perfecta para enviar a impresoras.'
        );
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen de la nota');
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      Alert.alert('Error', 'No se pudo compartir la nota');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      setLoading(true);
      
      // Solicitar permisos para acceder a la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Se necesitan permisos para guardar la imagen en tu galería'
        );
        return;
      }

      const imageUri = await captureNote();
      
      if (imageUri) {
        await MediaLibrary.saveToLibraryAsync(imageUri);
        Alert.alert('Éxito', 'Nota guardada en la galería exitosamente');
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen de la nota');
      }
    } catch (error) {
      console.error('Error saving note to gallery:', error);
      Alert.alert('Error', 'No se pudo guardar la nota en la galería');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ViewShot 
          ref={noteRef} 
          style={styles.noteContainer}
          options={{ format: "jpg", quality: 0.9 }}
        >
          {/* Header */}
          <View style={styles.noteHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.noteTitle}>📋 NOTA DE REPARACIÓN</Text>
              <Text style={styles.noteSubtitle}>ID: {repair.id}</Text>
            </View>
            
            {/* QR Codes */}
            <View style={styles.qrCodesContainer}>
              {/* QR de la Reparación */}
              <View style={styles.qrContainer}>
                <Text style={styles.qrLabel}>🔧 Reparación</Text>
                <QRCode
                  value={generateRepairQRData(repair.id)}
                  size={70}
                  color={colors.text}
                  backgroundColor="white"
                />
              </View>
              
              {/* QR del Equipo */}
              <View style={styles.qrContainer}>
                <Text style={styles.qrLabel}>💻 Equipo</Text>
                <QRCode
                  value={generateEquipmentQRData(repair.equipment.id)}
                  size={70}
                  color={colors.text}
                  backgroundColor="white"
                />
              </View>
            </View>
          </View>

          {/* Repair Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Información de Reparación</Text>
            <Text style={styles.itemTitle}>{repair.title}</Text>
            <Text style={styles.itemDescription}>{repair.description}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Estado:</Text>
                <Text style={styles.infoValue}>{getStatusText(repair.status)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prioridad:</Text>
                <Text style={styles.infoValue}>{getPriorityText(repair.priority)}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha de entrada:</Text>
                <Text style={styles.infoValue}>
                  {repair.entryDate?.toLocaleDateString('es-ES') || 'No especificada'}
                </Text>
              </View>
              {repair.expectedCompletionDate && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Fecha estimada:</Text>
                  <Text style={styles.infoValue}>
                    {repair.expectedCompletionDate.toLocaleDateString('es-ES')}
                  </Text>
                </View>
              )}
            </View>

            {repair.cost && repair.cost > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Costo:</Text>
                <Text style={styles.costValue}>${repair.cost.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Información del Cliente</Text>
            <Text style={styles.customerName}>{repair.customer.name}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{repair.customer.phone}</Text>
              </View>
              {repair.customer.email && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{repair.customer.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Equipment Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💻 Información del Equipo</Text>
            <Text style={styles.equipmentName}>
              {repair.equipment.brand} {repair.equipment.model}
            </Text>
            
            <View style={styles.infoGrid}>
              {repair.equipment.year && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Año:</Text>
                  <Text style={styles.infoValue}>{repair.equipment.year}</Text>
                </View>
              )}
              {repair.equipment.serialNumber && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Serie:</Text>
                  <Text style={styles.infoValue}>{repair.equipment.serialNumber}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Notes */}
          {repair.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Notas Adicionales</Text>
              <Text style={styles.notesText}>{repair.notes}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
            </Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="📤 Guardar y Compartir"
            onPress={handleShare}
            disabled={loading}
            style={styles.shareButton}
          />
          <Button
            title="💾 Solo Guardar"
            onPress={handleSaveToGallery}
            disabled={loading}
            variant="outline"
            style={styles.saveButton}
          />
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
  noteContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: 'white',
    borderRadius: 12,
    ...shadows.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerContent: {
    flex: 1,
  },
  noteTitle: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  noteSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginHorizontal: spacing.xs,
  },
  qrCodesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  qrLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  itemTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  itemDescription: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  customerName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  equipmentName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  infoItem: {
    width: '50%',
    paddingRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
  },
  costValue: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: spacing.lg,
  },
  shareButton: {
    marginBottom: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
});
