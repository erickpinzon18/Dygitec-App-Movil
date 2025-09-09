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
import { repairService, customerService, computerService } from '../services/firebase';
import { RepairStatus, Priority } from '../types';
import { RepairsStackParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { colors, typography, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type NewRepairScreenProps = NativeStackScreenProps<RepairsStackParamList, 'NewRepair'>;

export const NewRepairScreen: React.FC<NewRepairScreenProps> = ({ navigation }) => {
  const { client, user } = useAuth();
  const [formData, setFormData] = useState({
    // Customer info
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    
    // Computer info
    computerBrand: '',
    computerModel: '',
    computerYear: '',
    serialNumber: '',
    computerDescription: '',
    
    // Repair info
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    expectedDays: '',
    cost: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Customer validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre del cliente es requerido';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es requerido';
    }

    // Computer validation
    if (!formData.computerBrand.trim()) {
      newErrors.computerBrand = 'La marca es requerida';
    }
    if (!formData.computerModel.trim()) {
      newErrors.computerModel = 'El modelo es requerido';
    }

    // Repair validation
    if (!formData.title.trim()) {
      newErrors.title = 'El título de la reparación es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create customer
      console.log('Creating customer with data:', {
        clientId: client!.id,
        registerBy: user!.id,
        name: formData.customerName,
        phone: formData.customerPhone,
        email: formData.customerEmail || "",
      });
      const customerId = await customerService.create({
        clientId: client!.id,
        registerBy: user!.id,
        name: formData.customerName,
        phone: formData.customerPhone,
        email: formData.customerEmail || "",
      });

      // Create computer
      const computerId = await computerService.create({
        clientId: client!.id,
        registerBy: user!.id,
        customerId,
        brand: formData.computerBrand,
        model: formData.computerModel,
        year: formData.computerYear ? parseInt(formData.computerYear) : 0,
        serialNumber: formData.serialNumber || "",
        description: formData.computerDescription || "",
      });

      // Calculate expected completion date
      const expectedCompletionDate = new Date();
      if (formData.expectedDays) {
        expectedCompletionDate.setDate(
          expectedCompletionDate.getDate() + parseInt(formData.expectedDays)
        );
      }

      console.log('Creating repair with data:', {
        customerId,
        computerId,
        title: formData.title,
        description: formData.description,
        status: RepairStatus.PENDING,
        priority: formData.priority,
        entryDate: new Date(),
        expectedCompletionDate: formData.expectedDays ? expectedCompletionDate : "",
        cost: formData.cost ? parseFloat(formData.cost) : "",
        notes: formData.notes || "",
      })

      // Create repair
      const repairId = await repairService.create({
        clientId: client!.id,
        registerBy: user!.id,
        customerId,
        computerId,
        title: formData.title,
        description: formData.description,
        status: RepairStatus.PENDING,
        priority: formData.priority,
        entryDate: new Date(),
        expectedCompletionDate: formData.expectedDays ? expectedCompletionDate : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes || "",
      });

      Alert.alert(
        'Éxito', 
        'Reparación registrada exitosamente',
        [
          {
            text: 'Ver Código',
            onPress: () => {
              // Navegar al stack principal usando getParent
              const parentNav = navigation.getParent();
              if (parentNav) {
                parentNav.navigate('BarcodeDisplay', {
                  id: repairId,
                  type: 'repair' as const,
                  title: formData.title,
                  subtitle: `${formData.computerBrand} ${formData.computerModel}`,
                });
              }
            },
          },
          { 
            text: 'Continuar', 
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
        console.error('Error creating repair:', error);
      Alert.alert('Error', 'No se pudo registrar la reparación');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Información del Cliente</Text>
        
        <InputField
          label="Nombre del cliente *"
          value={formData.customerName}
          onChangeText={(value) => updateFormData('customerName', value)}
          error={errors.customerName}
          placeholder="Nombre completo"
        />

        <InputField
          label="Teléfono *"
          value={formData.customerPhone}
          onChangeText={(value) => updateFormData('customerPhone', value)}
          keyboardType="phone-pad"
          error={errors.customerPhone}
          placeholder="Número de teléfono"
        />

        <InputField
          label="Email (opcional)"
          value={formData.customerEmail}
          onChangeText={(value) => updateFormData('customerEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="email@ejemplo.com"
        />

        <Text style={styles.sectionTitle}>Información del Equipo</Text>

        <InputField
          label="Marca *"
          value={formData.computerBrand}
          onChangeText={(value) => updateFormData('computerBrand', value)}
          error={errors.computerBrand}
          placeholder="HP, Dell, Lenovo, etc."
        />

        <InputField
          label="Modelo *"
          value={formData.computerModel}
          onChangeText={(value) => updateFormData('computerModel', value)}
          error={errors.computerModel}
          placeholder="Pavilion, Inspiron, ThinkPad, etc."
        />

        <InputField
          label="Año (opcional)"
          value={formData.computerYear}
          onChangeText={(value) => updateFormData('computerYear', value)}
          keyboardType="numeric"
          placeholder="2020"
        />

        <InputField
          label="Número de serie (opcional)"
          value={formData.serialNumber}
          onChangeText={(value) => updateFormData('serialNumber', value)}
          placeholder="Número de serie del equipo"
        />

        <InputField
          label="Descripción del equipo (opcional)"
          value={formData.computerDescription}
          onChangeText={(value) => updateFormData('computerDescription', value)}
          multiline
          numberOfLines={3}
          placeholder="Color, características especiales, etc."
        />

        <Text style={styles.sectionTitle}>Información de la Reparación</Text>

        <InputField
          label="Título de la reparación *"
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
          error={errors.title}
          placeholder="Problema principal"
        />

        <InputField
          label="Descripción del problema *"
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          error={errors.description}
          multiline
          numberOfLines={4}
          placeholder="Describe detalladamente el problema"
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.priority}
              onValueChange={(value: Priority) => updateFormData('priority', value)}
              style={styles.picker}
            >
              <Picker.Item label="Baja" value={Priority.LOW} />
              <Picker.Item label="Media" value={Priority.MEDIUM} />
              <Picker.Item label="Alta" value={Priority.HIGH} />
              <Picker.Item label="Urgente" value={Priority.URGENT} />
            </Picker>
          </View>
        </View>

        <InputField
          label="Días estimados (opcional)"
          value={formData.expectedDays}
          onChangeText={(value) => updateFormData('expectedDays', value)}
          keyboardType="numeric"
          placeholder="5"
        />

        <InputField
          label="Costo estimado (opcional)"
          value={formData.cost}
          onChangeText={(value) => updateFormData('cost', value)}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <InputField
          label="Notas adicionales (opcional)"
          value={formData.notes}
          onChangeText={(value) => updateFormData('notes', value)}
          multiline
          numberOfLines={3}
          placeholder="Información adicional"
        />

        <Button
          title={loading ? 'Registrando...' : 'Registrar Reparación'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  picker: {
    // height: 44,
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
