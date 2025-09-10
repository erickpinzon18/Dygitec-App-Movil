import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Button } from '../components/Button';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type QRDisplayScreenProps = NativeStackScreenProps<RootStackParamList, 'BarcodeDisplay'>;

interface QRDisplayParams {
  id: string;
  type: 'repair' | 'part' | 'equipment';
  title: string;
  subtitle?: string;
}

export const BarcodeDisplayScreen: React.FC<QRDisplayScreenProps> = ({
  navigation,
  route,
}) => {
  const { id, type, title, subtitle } = route.params as QRDisplayParams;
  const [loading, setLoading] = useState(false);
  const qrRef = useRef<ViewShot>(null);

  // Generar datos para el código QR (versión simplificada)
  const generateQRData = (id: string, type: 'repair' | 'part' | 'equipment') => {
    // Solo el ID y tipo, para máxima simplicidad y legibilidad
    return `${type}:${id}`;
  };

  const getTypeInfo = (type: 'repair' | 'part' | 'equipment') => {
    switch (type) {
      case 'repair':
        return { emoji: '🔧', name: 'Reparación' };
      case 'part':
        return { emoji: '📦', name: 'Pieza' };
      case 'equipment':
        return { emoji: '💻', name: 'Equipo' };
      default:
        return { emoji: '📋', name: 'Elemento' };
    }
  };

  const qrData = generateQRData(id, type);

  const captureQR = async () => {
    try {
      if (qrRef.current && qrRef.current.capture) {
        const uri = await qrRef.current.capture();
        return uri;
      }
      throw new Error('No se pudo capturar el QR');
    } catch (error) {
      console.error('Error capturing QR:', error);
      throw error;
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setLoading(true);
      const imageUri = await captureQR();
      
      if (imageUri) {
        // Intentar abrir WhatsApp directamente para compartir imagen
        const whatsappUrl = 'whatsapp://';
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        
        if (canOpen) {
          // Compartir solo la imagen
          await Share.share({
            url: imageUri,
            title: `${getTypeInfo(type).name}: ${title}`,
          });
        } else {
          // Fallback: compartir imagen de manera general
          await Share.share({
            url: imageUri,
            title: `Código QR - ${getTypeInfo(type).name}: ${title}`,
          });
        }
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen del código QR');
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      Alert.alert('Error', 'No se pudo compartir por WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setLoading(true);
      const imageUri = await captureQR();
      
      Alert.alert(
        'Imprimir Etiqueta QR',
        'Selecciona el tamaño de etiqueta:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Pequeña (2x2 cm)',
            onPress: () => openPrintDialog('small', imageUri),
          },
          {
            text: 'Mediana (4x4 cm)', 
            onPress: () => openPrintDialog('medium', imageUri),
          },
          {
            text: 'Grande (6x6 cm)',
            onPress: () => openPrintDialog('large', imageUri),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo preparar la imagen para imprimir');
    } finally {
      setLoading(false);
    }
  };

  const openPrintDialog = (size: string, imageUri?: string) => {
    Alert.alert(
      'Preparar Impresión',
      `Etiqueta QR ${size} lista para imprimir`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Compartir para Imprimir',
          onPress: () => {
            if (imageUri) {
              Share.share({
                url: imageUri,
                title: `Etiqueta QR ${size}`,
              });
            } else {
              Alert.alert('Error', 'No se pudo preparar la imagen');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      const imageUri = await captureQR();
      
      if (imageUri) {
        await Share.share({
          url: imageUri,
          title: `Código QR - ${getTypeInfo(type).name}: ${title}`,
        });
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen del código QR');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'No se pudo compartir');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      setLoading(true);
      
      // Solicitar permisos para acceder a la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para guardar la imagen');
        return;
      }

      // Capturar la imagen del QR
      const imageUri = await captureQR();
      if (imageUri) {
        // Guardar en la galería
        const asset = await MediaLibrary.createAssetAsync(imageUri);
        await MediaLibrary.createAlbumAsync('Dygitec QR', asset, false);
        
        Alert.alert(
          '✅ Guardado', 
          'La imagen del código QR se guardó en tu galería en el álbum "Dygitec QR"'
        );
      } else {
        Alert.alert('Error', 'No se pudo generar la imagen del código QR');
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'No se pudo guardar en la galería');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {getTypeInfo(type).emoji} Código QR de {getTypeInfo(type).name}
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>ID del Documento:</Text>
            <Text style={styles.codeValue}>{id}</Text>
          </View>

          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Tipo:</Text>
            <Text style={styles.barcodeNumber}>{getTypeInfo(type).name}</Text>
          </View>
        </View>

        {/* QR Code Display */}
        <ViewShot ref={qrRef} style={styles.qrContainer}>
          <View style={styles.qrCard}>
            {type === 'part' ? (
              <>
                <Text style={styles.barcodeTitle}>{title}</Text>
                {subtitle && <Text style={styles.barcodeSubtitle}>{subtitle}</Text>}
              </>
            ) : (
              <Text style={styles.barcodeTitle}>{subtitle || title}</Text>
            )}
            
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={qrData}
                size={200}
                color="black"
                backgroundColor="white"
                quietZone={10}
                ecl="M"
              />
            </View>

            <Text style={styles.qrId}>{qrData}</Text>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          <Text style={styles.sectionTitle}>Opciones de Exportar</Text>
          
          {/* <Button
            title="📱 Compartir por WhatsApp"
            onPress={handleShareWhatsApp}
            style={styles.whatsappButton}
          />

          <Button
            title="🖨️ Imprimir Etiqueta"
            onPress={handlePrint}
            style={styles.printButton}
            variant="outline"
          />

          <Button
            title="📤 Compartir"
            onPress={handleShare}
            style={styles.shareButton}
            variant="outline"
          /> */}

          <Button
            title="📸 Guardar en Galería"
            onPress={handleCopyCode}
            style={styles.copyButton}
            variant="outline"
          />
        </View>

        {/* Back Button */}
        <View style={styles.backSection}>
          <Button
            title="Finalizar"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
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
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  codeSection: {
    marginBottom: spacing.md,
  },
  codeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  codeValue: {
    ...typography.body,
    color: colors.text,
    fontFamily: 'monospace',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: 12,
  },
  barcodeNumber: {
    ...typography.body,
    color: colors.primary,
    fontFamily: 'monospace',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  barcodeCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  qrCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  qrId: {
    ...typography.bodySmall,
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  barcodeTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  barcodeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  barcodeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  barcodeNote: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    marginBottom: spacing.md,
  },
  printButton: {
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  shareButton: {
    borderColor: colors.textSecondary,
    marginBottom: spacing.md,
  },
  copyButton: {
    borderColor: colors.primary,
    // marginBottom: spacing.md,
  },
  backSection: {
    // marginTop: spacing.lg,
  },
  backButton: {
    backgroundColor: '#25D366',
  },
});
