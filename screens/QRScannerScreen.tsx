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
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { repairService, partService, equipmentService, customerService } from '../services/firebase';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { colors, typography, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type QRScannerScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'QR'>,
  BottomTabScreenProps<RootStackParamList>
>;

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const { client } = useAuth();
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

  // Resetear estado cada vez que la pestaña reciba foco
  useFocusEffect(
    React.useCallback(() => {
      // Resetear todos los estados al estado inicial
      setScanned(false);
      setScanning(true);
      setFlashOn(false);
      
      return () => {
        // Cleanup cuando se pierde el foco
        setScanning(false);
      };
    }, [])
  );

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
        // Verificar que la reparación existe y pertenece al cliente
        const repair = await repairService.getById(itemId);
        if (repair && repair.clientId === client?.id) {
          // Obtener también la información del customer y equipment
          const [customer, equipment] = await Promise.all([
            customerService.getById(repair.customerId),
            equipmentService.getById(repair.equipmentId)
          ]);
          
          // Crear la reparación con toda la información completa
          const repairWithDetails = {
            ...repair,
            customer: customer,
            equipment: equipment
          };

          Alert.alert(
            'Reparación Encontrada',
            `¿Abrir detalles de la reparación: ${repair.description}?`,
            [
              { text: 'Cancelar', onPress: () => resetScanner() },
              {
                text: 'Abrir',
                onPress: () => {
                  // Primero cambiar al tab de Repairs
                  navigation.navigate('Repairs');
                  
                  // Luego navegar al detalle específico usando el stack navigator de Repairs
                  setTimeout(() => {
                    // @ts-ignore - Navegación directa al stack de Repairs
                    navigation.navigate('Repairs', {
                      screen: 'RepairDetail',
                      params: { repair: repairWithDetails }
                    });
                  }, 50);
                }
              }
            ]
          );
        } else if (repair && repair.clientId !== client?.id) {
          Alert.alert(
            'Reparación No Permitida',
            'Esta reparación no pertenece a su empresa.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        } else {
          Alert.alert(
            'Reparación No Encontrada',
            'No se encontró una reparación con este código.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        }
      } else if (qrType === 'part') {
        // Verificar que la pieza existe y pertenece al cliente
        const part = await partService.getById(itemId);
        if (part && part.clientId === client?.id) {
          Alert.alert(
            'Pieza Encontrada',
            `¿Abrir detalles de la pieza: ${part.name}?`,
            [
              { text: 'Cancelar', onPress: () => resetScanner() },
              {
                text: 'Abrir',
                onPress: () => {
                  // Primero cambiar al tab de Parts
                  navigation.navigate('Parts');
                  
                  // Luego navegar al detalle específico usando el stack navigator de Parts
                  setTimeout(() => {
                    // @ts-ignore - Navegación directa al stack de Parts
                    navigation.navigate('Parts', {
                      screen: 'PartDetail',
                      params: { part }
                    });
                  }, 50);
                }
              }
            ]
          );
        } else if (part && part.clientId !== client?.id) {
          Alert.alert(
            'Pieza No Permitida',
            'Esta pieza no pertenece a su empresa.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        } else {
          Alert.alert(
            'Pieza No Encontrada',
            'No se encontró una pieza con este código.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        }
      } else if (qrType === 'equipment') {
        // Verificar que el equipo existe y pertenece al cliente
        const equipment = await equipmentService.getById(itemId);
        if (equipment && equipment.clientId === client?.id) {
          // Obtener también la información del customer
          const customer = await customerService.getById(equipment.customerId);
          
          // Crear el equipo con la información del customer
          const equipmentWithCustomer = {
            ...equipment,
            customer: customer
          };

          Alert.alert(
            'Equipo Encontrado',
            `¿Abrir detalles del equipo: ${equipment.brand} ${equipment.model}?`,
            [
              { text: 'Cancelar', onPress: () => resetScanner() },
              {
                text: 'Abrir',
                onPress: () => {
                  // Primero cambiar al tab de Equipments
                  navigation.navigate('Equipments');
                  
                  // Luego navegar al detalle específico usando el stack navigator de Equipments
                  setTimeout(() => {
                    // @ts-ignore - Navegación directa al stack de Equipments
                    navigation.navigate('Equipments', {
                      screen: 'EquipmentDetail',
                      params: { equipment: equipmentWithCustomer }
                    });
                  }, 50);
                }
              }
            ]
          );
        } else if (equipment && equipment.clientId !== client?.id) {
          Alert.alert(
            'Equipo No Permitido',
            'Este equipo no pertenece a su empresa.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        } else {
          Alert.alert(
            'Equipo No Encontrado',
            'No se encontró un equipo con este código.',
            [{ text: 'Escanear Otro', onPress: () => resetScanner() }]
          );
        }
      } else {
        Alert.alert(
          'Tipo No Reconocido',
          'Este código QR no corresponde a una reparación, pieza o equipo válido.',
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
      console.log('Processing image for QR:', imageUri);
      
      // Verificar si el método scanFromURLAsync existe
      if (!Camera.scanFromURLAsync) {
        throw new Error('Camera.scanFromURLAsync no está disponible en esta versión');
      }
      
      // Procesar la imagen usando expo-camera
      const scanningResults = await Camera.scanFromURLAsync(imageUri);
      
      console.log('Scanning results:', scanningResults);
      
      if (scanningResults && scanningResults.length > 0) {
        // Usar el primer resultado encontrado
        console.log('Code found:', scanningResults[0]);
        return scanningResults[0].data;
      } else {
        console.log('No codes found in image');
        return null;
      }
    } catch (error) {
      console.error('Error processing image for QR:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Si el método no existe, informar al usuario
      if (error instanceof Error && error.message.includes('scanFromURLAsync')) {
        throw new Error('La función de escaneo desde imagen no está disponible. Por favor, usa la cámara para escanear códigos QR.');
      }
      
      // No mostrar alert aquí, lo manejará la función que llama
      throw error;
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
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        console.log('Image details:', result.assets[0]);
        
        // Mostrar alert de procesamiento que se puede cancelar
        Alert.alert(
          'Procesando Imagen',
          'Analizando la imagen en busca de códigos QR...',
          [
            { 
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                // Resetear scanner para volver a mostrar la cámara
                resetScanner();
                console.log('Procesamiento cancelado por el usuario');
              }
            }
          ]
        );
        
        try {
          // Procesar la imagen para detectar QR usando expo-camera
          const qrData = await processImageForQR(imageUri);
          
          if (qrData) {
            console.log('QR Data found from image:', qrData);
            // Si se detectó un QR, procesarlo igual que el escaneo de cámara
            await handleBarCodeScanned({ type: 'qr', data: qrData });
          } else {
            console.log('No QR data found in image');
            Alert.alert(
              'No se encontró código QR',
              'No se pudo detectar un código QR válido en la imagen seleccionada. Asegúrate de que el código QR esté bien visible y ocupe una buena parte de la imagen.',
              [{ 
                text: 'Intentar otra imagen',
                onPress: () => resetScanner()
              }]
            );
          }
        } catch (error: any) {
          console.error('Error processing image:', error);
          Alert.alert(
            'Error al Procesar',
            `Hubo un problema al analizar la imagen: ${error?.message || 'Error desconocido'}. Por favor, asegúrate de que la imagen contenga un código QR visible y bien enfocado.`,
            [{ 
              text: 'Reintentar',
              onPress: () => resetScanner()
            }]
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
            Apunta la cámara al código QR
          </Text>
          <Text style={styles.instructionsText}>
            El escaneo se realizará automáticamente
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
