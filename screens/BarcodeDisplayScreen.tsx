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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  const [selectedLabelSize, setSelectedLabelSize] = useState<string>('medium');
  const qrRef = useRef<ViewShot>(null);
  const labelRef = useRef<ViewShot>(null);

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

  const captureLabelImage = async (size: string) => {
    try {
      setSelectedLabelSize(size);
      
      // Esperar un momento para que se actualice el render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (labelRef.current && labelRef.current.capture) {
        const uri = await labelRef.current.capture();
        return uri;
      }
      throw new Error('No se pudo capturar la etiqueta');
    } catch (error) {
      console.error('Error capturing label:', error);
      throw error;
    }
  };

  const getLabelConfig = (size: string) => {
    const configs = {
      small: { 
        containerWidth: 150, 
        containerHeight: 150, 
        qrSize: 90, 
        fontSize: 10, 
        padding: 8,
        companyFontSize: 12 
      },
      medium: { 
        containerWidth: 225, 
        containerHeight: 225, 
        qrSize: 130, 
        fontSize: 12, 
        padding: 12,
        companyFontSize: 14 
      },
      large: { 
        containerWidth: 300, 
        containerHeight: 300, 
        qrSize: 170, 
        fontSize: 14, 
        padding: 16,
        companyFontSize: 16 
      },
      xlarge: { 
        containerWidth: 375, 
        containerHeight: 375, 
        qrSize: 220, 
        fontSize: 16, 
        padding: 20,
        companyFontSize: 18 
      }
    };
    return configs[size as keyof typeof configs] || configs.medium;
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
      
      Alert.alert(
        'Imprimir Etiqueta QR',
        'Selecciona el tamaño de etiqueta térmica adhesiva:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Pequeña (20x20mm)',
            onPress: () => generateLabelPDF('small'),
          },
          {
            text: 'Mediana (30x30mm)', 
            onPress: () => generateLabelPDF('medium'),
          },
          {
            text: 'Grande (40x40mm)',
            onPress: () => generateLabelPDF('large'),
          },
          {
            text: 'Extra Grande (50x50mm)',
            onPress: () => generateLabelPDF('xlarge'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo preparar la etiqueta para imprimir');
    } finally {
      setLoading(false);
    }
  };

  const generateLabelHTML = (size: string) => {
    const typeInfo = getTypeInfo(type);
    const qrData = generateQRData(id, type);
    
    // Configuración de tamaños para etiquetas térmicas (solo ancho fijo, altura automática)
    const labelSizes = {
      small: { width: '53mm', qrSize: 80, fontSize: '8px', companySize: '10px' },
      medium: { width: '71mm', qrSize: 100, fontSize: '9px', companySize: '11px' },
      large: { width: '88mm', qrSize: 120, fontSize: '10px', companySize: '12px' },
      xlarge: { width: '106mm', qrSize: 140, fontSize: '11px', companySize: '13px' }
    };
    
    const config = labelSizes[size as keyof typeof labelSizes];
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Etiqueta QR - Dygitec</title>
      <style>
        body {
          margin: 0;
          padding: 3mm;
          font-family: Arial, sans-serif;
          width: ${config.width};
          background: white;
          box-sizing: border-box;
        }
        .label-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2mm 0;
        }
        .company-logo {
          font-size: ${config.companySize};
          font-weight: bold;
          color: #2563EB;
          margin-bottom: 2mm;
          letter-spacing: 1px;
        }
        .qr-container {
          margin: 2mm 0;
          display: flex;
          justify-content: center;
        }
        .item-info {
          font-size: ${config.fontSize};
          color: #374151;
          font-weight: 600;
          margin-top: 2mm;
          line-height: 1.2;
        }
        .item-id {
          font-size: ${config.fontSize};
          color: #6B7280;
          margin-top: 1mm;
          font-family: monospace;
          font-weight: bold;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="label-container">
        <div class="company-logo">DYGITEC</div>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=${config.qrSize}x${config.qrSize}&data=${encodeURIComponent(qrData)}&format=png&ecc=H" 
               alt="QR Code" 
               style="width: ${config.qrSize}px; height: ${config.qrSize}px;" />
        </div>
        <div class="item-info">${typeInfo.emoji} ${typeInfo.name}</div>
        <div class="item-id">#${id}</div>
      </div>
    </body>
    </html>`;
  };

  const generateLabelPDF = async (size: string) => {
    try {
      setLoading(true);
      
      const sizeNames = {
        small: 'Pequeña (20x20mm)',
        medium: 'Mediana (30x30mm)', 
        large: 'Grande (40x40mm)',
        xlarge: 'Extra Grande (50x50mm)'
      };
      
      // Generar HTML para la etiqueta térmica
      const htmlContent = generateLabelHTML(size);
      
      // Configurar dimensiones para PDF como en RepairNoteDisplayScreen (anchos fijos, altura automática)
      const pdfSizes = {
        small: { width: 150 },     // ~53mm - etiqueta pequeña
        medium: { width: 200 },    // ~71mm - etiqueta mediana  
        large: { width: 250 },     // ~88mm - etiqueta grande
        xlarge: { width: 300 }     // ~106mm - etiqueta extra grande
      };
      
      const pdfConfig = pdfSizes[size as keyof typeof pdfSizes];
      
      // Generar PDF optimizado para etiquetas térmicas (igual que RepairNoteDisplayScreen)
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: pdfConfig.width,
        height: undefined, // Altura automática como en RepairNoteDisplayScreen
        margins: { left: 0, top: 0, right: 0, bottom: 0 },
      });

      // Compartir el PDF generado
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Etiqueta QR ${sizeNames[size as keyof typeof sizeNames]} - Dygitec`,
          UTI: 'com.adobe.pdf',
        });
        
        Alert.alert(
          '✅ Etiqueta PDF Lista', 
          `Etiqueta ${sizeNames[size as keyof typeof sizeNames]} generada correctamente.\n\n🏷️ PDF listo para imprimir en etiqueta térmica adhesiva.`
        );
      } else {
        Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
      }
      
    } catch (error) {
      console.error('Error generating label PDF:', error);
      Alert.alert('Error', 'No se pudo generar la etiqueta');
    } finally {
      setLoading(false);
    }
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

        {/* Etiqueta térmica invisible para captura */}
        <View style={styles.hiddenContainer}>
          <ViewShot 
            ref={labelRef} 
            style={[styles.labelContainer, {
              width: getLabelConfig(selectedLabelSize).containerWidth,
              height: getLabelConfig(selectedLabelSize).containerHeight,
            }]}
            options={{ format: "jpg", quality: 1.0 }}
          >
            <View style={styles.labelContent}>
              {/* Logo Dygitec */}
              <Text style={[styles.labelCompany, { 
                fontSize: getLabelConfig(selectedLabelSize).companyFontSize 
              }]}>
                DYGITEC
              </Text>
              
              {/* QR Code */}
              <View style={styles.labelQRContainer}>
                <QRCode
                  value={generateQRData(id, type)}
                  size={getLabelConfig(selectedLabelSize).qrSize}
                  color="#000"
                  backgroundColor="white"
                  quietZone={5}
                  ecl="H"
                />
              </View>
              
              {/* Info del item */}
              <Text style={[styles.labelItemInfo, { 
                fontSize: getLabelConfig(selectedLabelSize).fontSize 
              }]}>
                {getTypeInfo(type).emoji} {getTypeInfo(type).name}
              </Text>
              
              {/* ID */}
              <Text style={[styles.labelItemId, { 
                fontSize: getLabelConfig(selectedLabelSize).fontSize - 2 
              }]}>
                #{id}
              </Text>
            </View>
          </ViewShot>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          <Text style={styles.sectionTitle}>Opciones de Exportar</Text>
          
          <Button
            title="🏷️ Generar Etiqueta Térmica"
            onPress={handlePrint}
            style={styles.printButton}
          />

          <Button
            title="📤 Compartir Imagen"
            onPress={handleShare}
            style={styles.shareButton}
            variant="outline"
          />

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
    backgroundColor: colors.primary,
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
  // Estilos para etiquetas térmicas
  hiddenContainer: {
    position: 'absolute',
    left: -10000, // Ocultar fuera de la pantalla
    top: -10000,
  },
  labelContainer: {
    backgroundColor: 'white',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  labelCompany: {
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: spacing.xs,
    letterSpacing: 1,
    textAlign: 'center',
  },
  labelQRContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  labelItemInfo: {
    color: '#374151',
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  labelItemId: {
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: spacing.xs / 2,
    textAlign: 'center',
  },
});
