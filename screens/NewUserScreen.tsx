import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authService, userService } from '../services/firebase';
import { UserType } from '../types';
import { SettingsStackParamList } from '../types/navigation';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type NewUserScreenProps = NativeStackScreenProps<SettingsStackParamList, 'NewUser'>;

export const NewUserScreen: React.FC<NewUserScreenProps> = ({ navigation }) => {
  const { client, user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: UserType.WORKER // Tipo por defecto: Trabajador
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'La contraseña es requerida');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!client) {
      Alert.alert('Error', 'No se pudo obtener la información de la empresa');
      return;
    }

    setLoading(true);

    try {
      // Verificar permisos para crear administradores
      if (formData.type === UserType.ADMIN && currentUser?.type !== UserType.ADMIN) {
        Alert.alert(
          'Permisos Insuficientes',
          'Solo los administradores pueden crear otros usuarios administradores.'
        );
        setLoading(false);
        return;
      }

      // Mostrar advertencia especial para administradores
      if (formData.type === UserType.ADMIN) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Crear Administrador',
            'Estás creando un usuario con privilegios de administrador. Este usuario podrá gestionar otros usuarios y tendrá acceso completo al sistema.',
            [
              { text: 'Cancelar', onPress: () => resolve(false) },
              { text: 'Continuar', onPress: () => resolve(true) }
            ]
          );
        });
        
        if (!shouldContinue) {
          setLoading(false);
          return;
        }
      }

      // Crear el usuario usando el método para admins
      await authService.createUserAsAdmin(
        formData.email.trim(),
        formData.password,
        formData.name.trim(),
        client.id,
        formData.type
      );

      Alert.alert(
        'Éxito',
        'Usuario creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'No se pudo crear el usuario';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email no es válido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const UserTypeOption = ({ type, title, description }: { 
    type: UserType; 
    title: string; 
    description: string; 
  }) => (
    <TouchableOpacity
      style={[
        styles.typeOption,
        formData.type === type && styles.typeOptionSelected
      ]}
      onPress={() => setFormData({ ...formData, type })}
    >
      <View style={styles.typeOptionContent}>
        <Text style={[
          styles.typeOptionTitle,
          formData.type === type && styles.typeOptionTitleSelected
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.typeOptionDescription,
          formData.type === type && styles.typeOptionDescriptionSelected
        ]}>
          {description}
        </Text>
      </View>
      <View style={[
        styles.radioButton,
        formData.type === type && styles.radioButtonSelected
      ]}>
        {formData.type === type && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666666" />
          <Text style={styles.loadingText}>Creando usuario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Usuario</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ingrese el nombre completo"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Ingrese el email"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña *</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Contraseña *</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Confirme la contraseña"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Usuario</Text>
            
            <UserTypeOption
              type={UserType.ADMIN}
              title="Administrador"
              description="Acceso completo y gestión de usuarios de la empresa"
            />
            
            <UserTypeOption
              type={UserType.WORKER}
              title="Trabajador"
              description="Acceso completo a todas las funciones operativas"
            />
            
            <UserTypeOption
              type={UserType.USER}
              title="Básico"
              description="Acceso de solo lectura y funciones básicas limitadas"
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Crear Usuario</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  placeholder: {
    width: 40,
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  typeOptionTitleSelected: {
    color: colors.primary,
  },
  typeOptionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  typeOptionDescriptionSelected: {
    color: colors.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
