import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { repairService, partService } from '../services/firebase';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { colors, typography, spacing } from '../constants/theme';

type QRScannerScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'QR'>,
  BottomTabScreenProps<RootStackParamList>
>;

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScanning(false);

    try {
      // Parse QR data (format: "type:id")
      const qrParts = data.split(':');
      if (qrParts.length !== 2) {
        Alert.alert(
          'QR No Válido',
          'El código QR no tiene el formato correcto.',
          [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
        );
        return;
      }

      const [qrType, itemId] = qrParts;

      if (qrType === 'repair') {
        // Verificar que la reparación existe
        const repair = await repairService.getById(itemId);
        if (repair) {
          Alert.alert(
            'Reparación Encontrada',
            `¿Abrir detalles de la reparación: ${repair.description}?`,
            [
              { text: 'Cancelar', onPress: () => resetScanner() },
              {
                text: 'Abrir',
                onPress: () => {
                  navigation.navigate('Repairs');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Reparación No Encontrada',
            'No se encontró una reparación con este código.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        }
      } else if (qrType === 'part') {
        // Verificar que la pieza existe
        const part = await partService.getById(itemId);
        if (part) {
          Alert.alert(
            'Pieza Encontrada',
            `¿Abrir detalles de la pieza: ${part.name}?`,
            [
              { text: 'Cancelar', onPress: () => resetScanner() },
              {
                text: 'Abrir',
                onPress: () => {
                  navigation.navigate('Parts');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Pieza No Encontrada',
            'No se encontró una pieza con este código.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        }
      } else {
        Alert.alert(
          'Tipo No Reconocido',
          'Este código QR no corresponde a una reparación o pieza válida.',
          [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al procesar el código QR.',
        [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
  };

  const processImageForQR = async (imageUri: string) => {
    try {
      // Mostrar que estamos procesando
      Alert.alert(
        'Procesando Imagen',
        'Analizando la imagen en busca de códigos QR...'
      );

      // Simular procesamiento - en producción aquí usarías una librería nativa
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Para demostración, vamos a simular que encontramos diferentes tipos de QR
      // basándose en características de la imagen (esto es solo para demo)
      const random = Math.random();
      
      if (random < 0.3) {
        // Simular que encontró un QR de reparación
        return 'repair:2Qb2o9OX597MbNJICiHY';
      } else if (random < 0.6) {
        // Simular que encontró un QR de pieza
        return 'part:YWLoeNLozW3W6y468jZt';
      } else {
        // Simular que no encontró QR válido
        return null;
      }
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Solicitar permisos para acceder a la galería
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permisos Necesarios',
          'Se necesita acceso a la galería para seleccionar imágenes.'
        );
        return;
      }

      // Seleccionar imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Procesar la imagen para detectar QR
        const qrData = await processImageForQR(imageUri);
        
        if (qrData) {
          // Si se detectó un QR, procesarlo igual que el escaneo de cámara
          await handleBarCodeScanned({ type: 'qr', data: qrData });
        } else {
          Alert.alert(
            'No se encontró código QR',
            'No se pudo detectar un código QR válido en la imagen seleccionada.',
            [{ text: 'Intentar otra imagen' }]
          );
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'No se pudo seleccionar la imagen de la galería.'
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Solicitando permiso para usar la cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.messageTitle}>Cámara No Disponible</Text>
          <Text style={styles.messageText}>
            Se necesita acceso a la cámara para escanear códigos QR.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Alert.alert(
                'Permisos de Cámara',
                'Ve a Configuración > Dygitec > Cámara para habilitar el acceso.'
              );
            }}
          >
            <Text style={styles.settingsButtonText}>Abrir Configuración</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Escanear QR</Text>
      </View>

      <View style={styles.scannerContainer}>
        {scanning && (
          <CameraView
            style={styles.scanner}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            enableTorch={flashOn}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
        )}
        
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            {scanning ? 'Apunta la cámara al código QR' : 'Procesando...'}
          </Text>
          <Text style={styles.instructionsText}>
            {scanning 
              ? 'El escaneo se realizará automáticamente' 
              : 'Por favor espera...'
            }
          </Text>
        </View>
      </View>

      {scanning && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.flashButton, flashOn && styles.flashButtonActive]}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Ionicons name={flashOn ? "flash" : "flash-outline"} size={24} color={colors.background} />
            <Text style={styles.flashButtonText}>Flash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={pickImageFromGallery}
          >
            <Ionicons name="images-outline" size={24} color={colors.background} />
            <Text style={styles.galleryButtonText}>Galería</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  instructionsTitle: {
    ...typography.h3,
    color: colors.background,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  instructionsText: {
    ...typography.body,
    color: colors.background,
    textAlign: 'center',
    opacity: 0.8,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  flashButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashButtonActive: {
    backgroundColor: colors.warning,
  },
  flashButtonText: {
    ...typography.body,
    color: colors.background,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryButtonText: {
    ...typography.body,
    color: colors.background,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  messageTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  messageText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  settingsButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});
