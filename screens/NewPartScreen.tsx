import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { partService } from '../services/firebase';
import { PartsStackParamList } from '../types/navigation';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { colors, typography, spacing } from '../constants/theme';

type NewPartScreenProps = NativeStackScreenProps<PartsStackParamList, 'NewPart'>;

export const NewPartScreen: React.FC<NewPartScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category: '',
    compatibility: '',
    quantity: '',
    cost: '',
    location: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la pieza es requerido';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'El modelo es requerido';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es requerida';
    }
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'La cantidad es requerida';
    } else if (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Debe ser un número válido mayor o igual a 0';
    }
    if (!formData.cost.trim()) {
      newErrors.cost = 'El costo es requerido';
    } else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0) {
      newErrors.cost = 'Debe ser un número válido mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Parse compatibility string into array
      const compatibilityArray = formData.compatibility
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const partId = await partService.create({
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        category: formData.category,
        compatibility: compatibilityArray,
        quantity: parseInt(formData.quantity),
        cost: parseFloat(formData.cost),
        location: formData.location || "",
        notes: formData.notes || "",
      });

      Alert.alert(
        'Éxito', 
        'Pieza registrada exitosamente',
        [
          {
            text: 'Ver Código',
            onPress: () => {
              // Navegar al stack principal usando getParent
              const parentNav = navigation.getParent();
              if (parentNav) {
                parentNav.navigate('BarcodeDisplay', {
                  id: partId,
                  type: 'part' as const,
                  title: formData.name,
                  subtitle: `${formData.brand} ${formData.model}`,
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
        console.error('Error creating part:', error);
      Alert.alert('Error', 'No se pudo registrar la pieza');
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

  const commonCategories = [
    'RAM',
    'Disco Duro',
    'SSD',
    'Procesador',
    'Placa Madre',
    'Fuente de Poder',
    'Tarjeta Gráfica',
    'Ventilador',
    'Pantalla',
    'Teclado',
    'Mouse',
    'Cargador',
    'Batería',
    'Cable',
    'Otro'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Registrar Nueva Pieza</Text>

        <InputField
          label="Nombre de la pieza *"
          value={formData.name}
          onChangeText={(value) => updateFormData('name', value)}
          error={errors.name}
          placeholder="Ej: Memoria RAM DDR4"
        />

        <InputField
          label="Marca *"
          value={formData.brand}
          onChangeText={(value) => updateFormData('brand', value)}
          error={errors.brand}
          placeholder="Ej: Kingston, Corsair, Samsung"
        />

        <InputField
          label="Modelo *"
          value={formData.model}
          onChangeText={(value) => updateFormData('model', value)}
          error={errors.model}
          placeholder="Ej: HyperX Fury, 970 EVO Plus"
        />

        <InputField
          label="Categoría *"
          value={formData.category}
          onChangeText={(value) => updateFormData('category', value)}
          error={errors.category}
          placeholder="Ej: RAM, SSD, Procesador"
        />

        <View style={styles.categoryHints}>
          <Text style={styles.categoryHintsTitle}>Categorías comunes:</Text>
          <View style={styles.categoryButtons}>
            {commonCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryButton}
                onPress={() => updateFormData('category', category)}
              >
                <Text style={styles.categoryButtonText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <InputField
          label="Compatibilidad (opcional)"
          value={formData.compatibility}
          onChangeText={(value) => updateFormData('compatibility', value)}
          placeholder="Ej: HP Pavilion, Dell Inspiron, Lenovo ThinkPad"
          multiline
          numberOfLines={3}
        />
        <Text style={styles.hint}>
          Separa múltiples compatibilidades con comas
        </Text>

        <InputField
          label="Cantidad en stock *"
          value={formData.quantity}
          onChangeText={(value) => updateFormData('quantity', value)}
          keyboardType="numeric"
          error={errors.quantity}
          placeholder="0"
        />

        <InputField
          label="Costo unitario *"
          value={formData.cost}
          onChangeText={(value) => updateFormData('cost', value)}
          keyboardType="numeric"
          error={errors.cost}
          placeholder="0.00"
        />

        <InputField
          label="Ubicación en almacén"
          value={formData.location}
          onChangeText={(value) => updateFormData('location', value)}
          placeholder="Ej: Estante A-3, Caja 5"
        />

        <InputField
          label="Notas adicionales"
          value={formData.notes}
          onChangeText={(value) => updateFormData('notes', value)}
          multiline
          numberOfLines={4}
          placeholder="Información adicional sobre la pieza"
        />

        <Button
          title={loading ? 'Registrando...' : 'Registrar Pieza'}
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
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  categoryHints: {
    marginBottom: spacing.lg,
  },
  categoryHintsTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
