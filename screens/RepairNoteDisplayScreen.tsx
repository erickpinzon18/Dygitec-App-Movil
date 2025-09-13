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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

  const generateHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket de Reparación</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 300px;
          margin: 0 auto;
          padding: 10px;
          background: white;
        }
        .ticket-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .ticket-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .ticket-id {
          font-size: 12px;
          color: #666;
        }
        .repair-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .repair-description {
          font-size: 11px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .info-line {
          font-size: 11px;
          margin-bottom: 5px;
        }
        .label {
          font-weight: bold;
        }
        .cost-value {
          font-size: 14px;
          font-weight: bold;
          color: #2E7D32;
        }
        .qr-section {
          text-align: center;
          margin: 15px 0;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .qr-label {
          font-size: 10px;
          margin-bottom: 5px;
        }
        .equipment-info {
          font-size: 10px;
          margin-top: 5px;
        }
        .generated-text {
          font-size: 9px;
          text-align: center;
          color: #666;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="ticket-header">
        <div class="ticket-title">🎫 TICKET DE REPARACIÓN</div>
        <div class="ticket-id">#${repair.id}</div>
      </div>
      
      <div class="repair-title">${repair.title}</div>
      <div class="repair-description">${repair.description}</div>
      
      <div class="info-line">
        <span class="label">Estado: </span>${getStatusText(repair.status)}
      </div>
      
      <div class="info-line">
        <span class="label">Fecha de entrega: </span>
        ${repair.completionDate?.toLocaleDateString('es-ES') || 
          repair.expectedCompletionDate?.toLocaleDateString('es-ES') || 
          'Por definir'}
      </div>
      
      ${repair.cost && repair.cost > 0 ? `
        <div class="info-line">
          <span class="label">Costo: </span>
          <span class="cost-value">$${repair.cost.toFixed(2)}</span>
        </div>
      ` : ''}
      
      <div class="qr-section">
        <div class="qr-label">Código del Equipo</div>
        <div class="equipment-info">${repair.equipment.brand} ${repair.equipment.model}</div>
      </div>
      
      <div class="generated-text">
        Generado: ${new Date().toLocaleDateString('es-ES')}
      </div>
    </body>
    </html>`;
  };

  const handleSaveAsPDF = async () => {
    try {
      setLoading(true);
      
      const htmlContent = generateHTML();
      
      // Generar PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 226, // Ancho típico de impresora térmica en puntos (80mm)
        height: undefined, // Altura automática
      });

      // Compartir el PDF generado
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Ticket de Reparación',
          UTI: 'com.adobe.pdf',
        });
        
        Alert.alert('Éxito', 'PDF generado y listo para compartir');
      } else {
        Alert.alert('PDF Generado', `PDF guardado en: ${uri}`);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
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
        Alert.alert('Éxito', 'Ticket guardado en la galería exitosamente');
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen del ticket');
      }
    } catch (error) {
      console.error('Error saving ticket to gallery:', error);
      Alert.alert('Error', 'No se pudo guardar el ticket en la galería');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ViewShot 
          ref={noteRef} 
          style={styles.ticketContainer}
          options={{ format: "jpg", quality: 0.9 }}
        >
          {/* Header - Ticket Style */}
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>🎫 TICKET DE REPARACIÓN</Text>
            <Text style={styles.ticketId}>#{repair.id}</Text>
          </View>

          {/* Repair Info - Simplified for ticket */}
          <View style={styles.ticketSection}>
            <Text style={styles.repairTitle}>{repair.title}</Text>
            <Text style={styles.repairDescription}>{repair.description}</Text>
            
            <View style={styles.ticketInfo}>
              <Text style={styles.infoLine}>
                <Text style={styles.label}>Estado: </Text>
                <Text style={styles.value}>{getStatusText(repair.status)}</Text>
              </Text>
              
              <Text style={styles.infoLine}>
                <Text style={styles.label}>Fecha de entrega: </Text>
                <Text style={styles.value}>
                  {repair.completionDate?.toLocaleDateString('es-ES') || 
                   repair.expectedCompletionDate?.toLocaleDateString('es-ES') || 
                   'Por definir'}
                </Text>
              </Text>

              {repair.cost && repair.cost > 0 && (
                <Text style={styles.infoLine}>
                  <Text style={styles.label}>Costo: </Text>
                  <Text style={styles.costValue}>${repair.cost.toFixed(2)}</Text>
                </Text>
              )}
            </View>
          </View>

          {/* Equipment QR at bottom */}
          <View style={styles.ticketFooter}>
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>Código del Equipo</Text>
              <QRCode
                value={generateEquipmentQRData(repair.equipment.id)}
                size={80}
                color="#000"
                backgroundColor="white"
              />
              <Text style={styles.equipmentInfo}>
                {repair.equipment.brand} {repair.equipment.model}
              </Text>
            </View>
            
            <Text style={styles.generatedText}>
              Generado: {new Date().toLocaleDateString('es-ES')}
            </Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="📄 Generar PDF"
            onPress={handleSaveAsPDF}
            disabled={loading}
            style={styles.pdfButton}
          />
          <Button
            title="💾 Guardar Imagen"
            onPress={handleSaveToGallery}
            disabled={loading}
            variant="outline"
            style={styles.saveButton}
          />
          <Button
            title="📤 Compartir Imagen"
            onPress={handleShare}
            disabled={loading}
            variant="outline"
            style={styles.shareButton}
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
  // Estilos para formato de ticket
  ticketContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: 'white',
    borderRadius: 8,
    ...shadows.md,
    maxWidth: 320,
    alignSelf: 'center',
  },
  ticketHeader: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  ticketId: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  ticketSection: {
    marginBottom: spacing.lg,
  },
  repairTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  repairDescription: {
    fontSize: 11,
    color: '#000',
    marginBottom: spacing.md,
    lineHeight: 16,
    textAlign: 'justify',
  },
  ticketInfo: {
    marginTop: spacing.sm,
  },
  infoLine: {
    fontSize: 11,
    color: '#000',
    marginBottom: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: 'bold',
    color: '#000',
  },
  value: {
    color: '#000',
  },
  costValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  ticketFooter: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderStyle: 'dashed',
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  qrLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  equipmentInfo: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  generatedText: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Botones
  buttonContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pdfButton: {
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  shareButton: {
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
});
