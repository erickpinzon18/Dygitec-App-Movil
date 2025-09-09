import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authService } from '../services/firebase';
import { SettingsStackParamList } from '../types/navigation';
import { colors, typography, spacing, shadows } from '../constants/theme';

type SettingsScreenProps = NativeStackScreenProps<SettingsStackParamList, 'SettingsList'>;

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    destructive = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <View style={[
          styles.iconContainer,
          destructive && styles.iconContainerDestructive
        ]}>
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={destructive ? colors.error : colors.primary} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingsTitle,
            destructive && styles.settingsTitleDestructive
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.textSecondary} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <SettingsItem
            icon="business-outline"
            title="Información del Negocio"
            subtitle="Datos de la empresa"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          />
          
          {/* <SettingsItem
            icon="notifications-outline"
            title="Notificaciones"
            subtitle="Configurar alertas y recordatorios"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          /> */}
          
          <SettingsItem
            icon="document-text-outline"
            title="Generar Reportes"
            subtitle="Reportes de reparaciones y inventario"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          />
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          
          <SettingsItem
            icon="cloud-upload-outline"
            title="Respaldo de Datos"
            subtitle="Crear copia de seguridad"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          />
          
          <SettingsItem
            icon="cloud-download-outline"
            title="Restaurar Datos"
            subtitle="Restaurar desde copia de seguridad"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          />
        </View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          
          <SettingsItem
            icon="information-circle-outline"
            title="Acerca de Dygitec"
            subtitle="Versión 1.0.0"
            onPress={() => Alert.alert(
              'Dygitec v1.0.0',
              'Aplicación de gestión de reparaciones de computadoras.\n\nDesarrollado para facilitar el control de reparaciones, inventario de piezas y seguimiento de clientes.\n\n- github.com/erickpinzon18',
              [{ text: 'OK' }]
            )}
          />
          
          <SettingsItem
            icon="help-circle-outline"
            title="Ayuda y Soporte"
            subtitle="Obtener ayuda"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
          />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon="log-out-outline"
            title="Cerrar Sesión"
            onPress={handleSignOut}
            showArrow={false}
            destructive={true}
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
  section: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerDestructive: {
    backgroundColor: `${colors.error}15`,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  settingsTitleDestructive: {
    color: colors.error,
  },
  settingsSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
