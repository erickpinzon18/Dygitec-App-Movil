import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentService, customerService } from '../services/firebase';
import { Equipment, Customer } from '../types';
import { EquipmentsStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, shadows } from '../constants/theme';

type NewEquipmentFormRouteProp = RouteProp<EquipmentsStackParamList, 'NewEquipmentForm'>;

export const NewEquipmentForm: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<NewEquipmentFormRouteProp>();
  const { user, client } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [isPreselectedCustomer, setIsPreselectedCustomer] = useState(false);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    serialNumber: '',
    description: '',
    customerId: '',
    notes: '',
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadCustomers();
  }, [client?.id]);

  // Manejar cliente preseleccionado
  useEffect(() => {
    const preselectedCustomer = route.params?.preselectedCustomer;
    if (preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
      setFormData(prev => ({
        ...prev,
        customerId: preselectedCustomer.id
      }));
      setIsPreselectedCustomer(true);
    }
  }, [route.params?.preselectedCustomer]);

  // Recargar clientes cuando la pantalla toma foco (usuario regresa de crear cliente)
  useFocusEffect(
    React.useCallback(() => {
      loadCustomers();
    }, [client?.id])
  );

  const loadCustomers = async () => {
    if (!client?.id) return;
    
    try {
      const customersList = await customerService.getByClientId(client.id);
      const sortedCustomers = customersList.sort((a: Customer, b: Customer) => a.name.localeCompare(b.name));
      setCustomers(sortedCustomers);
      setFilteredCustomers(sortedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Filtrar clientes por texto de búsqueda
  useEffect(() => {
    if (!customerSearchText.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchText.toLowerCase()) ||
        customer.phone.includes(customerSearchText)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchText, customers]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setShowCustomerModal(false);
    setCustomerSearchText(''); // Limpiar búsqueda al seleccionar
    
    // Si el usuario selecciona un cliente diferente al preseleccionado, ocultar el indicador
    const preselectedCustomer = route.params?.preselectedCustomer;
    if (!preselectedCustomer || customer.id !== preselectedCustomer.id) {
      setIsPreselectedCustomer(false);
    }
  };

  const closeModal = () => {
    setShowCustomerModal(false);
    setCustomerSearchText(''); // Limpiar búsqueda al cerrar modal
  };

  const checkPhoneAndSuggest = (phone: string, name: string, email: string = '') => {
    const existingCustomer = customers.find(customer => customer.phone === phone);
    
    if (existingCustomer) {
      Alert.alert(
        'Cliente Existente',
        `Se encontró un cliente con este número:\n\n${existingCustomer.name}\n${existingCustomer.phone}\n\n¿Deseas usar este cliente existente?`,
        [
          {
            text: 'Crear Nuevo',
            style: 'cancel',
            onPress: () => createNewCustomerAndEquipment(name, phone, email)
          },
          {
            text: 'Usar Existente',
            onPress: () => handleCustomerSelect(existingCustomer)
          }
        ]
      );
    } else {
      createNewCustomerAndEquipment(name, phone, email);
    }
  };

  const createNewCustomerAndEquipment = async (name: string, phone: string, email: string = '') => {
    if (!client?.id || !user?.id) {
      Alert.alert('Error', 'No se pudo obtener la información de autenticación.');
      return;
    }

    setIsLoading(true);

    try {
      // Crear nuevo cliente
      const newCustomer: Omit<Customer, 'id' | 'createdAt'> = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        clientId: client.id,
        registerBy: user.id,
      };

      const createdCustomerId = await customerService.create(newCustomer);
      
      // Usar el cliente recién creado
      const newCustomerWithId = { ...newCustomer, id: createdCustomerId, createdAt: new Date() };
      setSelectedCustomer(newCustomerWithId);
      setFormData(prev => ({ ...prev, customerId: createdCustomerId }));
      setIsPreselectedCustomer(false); // El cliente creado ya no es el preseleccionado
      
      // Recargar lista de clientes
      await loadCustomers();
      
      Alert.alert('Éxito', 'Cliente creado correctamente. Ahora completa la información del equipo.');
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'No se pudo crear el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomerWithPrompts = () => {
    Alert.prompt(
      'Nuevo Cliente',
      'Ingresa el nombre del cliente:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Siguiente',
          onPress: (name) => {
            if (name?.trim()) {
              Alert.prompt(
                'Teléfono',
                'Ingresa el teléfono del cliente:',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Siguiente',
                    onPress: (phone) => {
                      if (phone?.trim()) {
                        // Preguntar por email opcionalmente
                        Alert.prompt(
                          'Email (Opcional)',
                          'Ingresa el email del cliente:',
                          [
                            { text: 'Omitir', onPress: () => checkPhoneAndSuggest(phone.trim(), name.trim(), '') },
                            {
                              text: 'Crear Cliente',
                              onPress: (email) => {
                                checkPhoneAndSuggest(phone.trim(), name.trim(), email?.trim() || '');
                              }
                            }
                          ],
                          'plain-text'
                        );
                      }
                    }
                  }
                ],
                'plain-text'
              );
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!formData.brand.trim() || !formData.model.trim()) {
      Alert.alert('Error', 'Por favor completa la marca y modelo del equipo');
      return;
    }

    if (!selectedCustomer) {
      Alert.alert('Error', 'Por favor selecciona un cliente');
      return;
    }

    // Validación de autenticación
    if (!client?.id || !user?.id) {
      Alert.alert('Error', 'No se pudo obtener la información de autenticación. Por favor inicia sesión nuevamente.');
      return;
    }

    setIsLoading(true);

    try {
      const newEquipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'> = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: formData.year.trim() ? parseInt(formData.year.trim()) : undefined,
        serialNumber: formData.serialNumber.trim(),
        description: formData.description.trim(),
        customerId: selectedCustomer.id,
        clientId: client.id,
        registerBy: user.id,
      };

      await equipmentService.create(newEquipment);
      
      Alert.alert(
        'Éxito',
        'Equipo registrado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating equipment:', error);
      Alert.alert('Error', 'No se pudo registrar el equipo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.title}>Nuevo Equipo</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Equipo</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marca *</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(text) => setFormData(prev => ({ ...prev, brand: text }))}
                placeholder="Ej: HP, Dell, Lenovo"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Modelo *</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}
                placeholder="Ej: Pavilion 15, Inspiron 3000"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Año</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => setFormData(prev => ({ ...prev, year: text }))}
                placeholder="Ej: 2023, 2022"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de Serie</Text>
              <TextInput
                style={styles.input}
                value={formData.serialNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, serialNumber: text }))}
                placeholder="Número de serie del equipo"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Descripción del equipo"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Cliente {isPreselectedCustomer && (
                <Text style={styles.preselectedIndicator}>(preseleccionado)</Text>
              )}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cliente *</Text>
              <TouchableOpacity
                style={styles.customerSelector}
                onPress={() => {
                  setCustomerSearchText(''); // Limpiar búsqueda anterior
                  setShowCustomerModal(true);
                }}
              >
                <View style={styles.customerSelectorContent}>
                  {selectedCustomer ? (
                    <>
                      <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                      <Text style={styles.selectedCustomerPhone}>{selectedCustomer.phone}</Text>
                    </>
                  ) : (
                    <Text style={styles.customerPlaceholder}>Seleccionar cliente</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Registrando...</Text>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.submitButtonText}>Registrar Equipo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de selección de cliente */}
      <Modal
        visible={showCustomerModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o teléfono"
                placeholderTextColor={colors.textSecondary}
                value={customerSearchText}
                onChangeText={setCustomerSearchText}
              />
              {customerSearchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setCustomerSearchText('')}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.customerListContainer}>
              <Text style={styles.customerListTitle}>
                {customerSearchText.trim() 
                  ? `${filteredCustomers.length} cliente(s) encontrado(s)`
                  : `${customers.length} cliente(s) registrado(s)`
                }
              </Text>
              
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.customerItem}
                    onPress={() => handleCustomerSelect(item)}
                  >
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      <Text style={styles.customerPhone}>{item.phone}</Text>
                      {item.email && item.email.trim() && (
                        <Text style={styles.customerEmail}>{item.email}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                style={styles.customerList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyStateTitle}>
                      {customerSearchText.trim() ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </Text>
                    <Text style={styles.emptyStateSubtitle}>
                      {customerSearchText.trim() 
                        ? 'Intenta con otro término de búsqueda'
                        : 'Crea tu primer cliente usando el botón de abajo'
                      }
                    </Text>
                  </View>
                )}
              />
            </View>

            <TouchableOpacity
              style={styles.newClientButton}
              onPress={() => {
                closeModal(); // Cerrar el modal de selección
                
                try {
                  // Navegar al tab de Customers
                  const parentNavigator = navigation.getParent();
                  if (parentNavigator) {
                    parentNavigator.navigate('Customers');
                  } else {
                    (navigation as any).navigate('Customers');
                  }
                } catch (error) {
                  console.log('Navigation failed:', error);
                  Alert.alert('Error', 'No se pudo navegar a la sección de Clientes');
                }
              }}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.newClientButtonText}>Crear Nuevo Cliente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600' as const,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    ...typography.button,
    color: 'white',
    marginLeft: spacing.sm,
  },
  // Estilos para selector de cliente
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  customerSelectorContent: {
    flex: 1,
  },
  selectedCustomerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600' as const,
  },
  selectedCustomerPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerPlaceholder: {
    ...typography.body,
    color: colors.textSecondary,
  },
  // Estilos para modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: spacing.lg,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  customerListContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  customerListTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600' as const,
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600' as const,
  },
  customerPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center' as const,
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  newClientButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
    ...shadows.sm,
  },
  newClientButtonText: {
    ...typography.button,
    color: 'white',
    marginLeft: spacing.sm,
  },
  preselectedIndicator: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
