import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { partService } from '../services/firebase';
import { Part } from '../types';
import { PartsStackParamList } from '../types/navigation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing, shadows } from '../constants/theme';

type PartsScreenProps = NativeStackScreenProps<PartsStackParamList, 'PartsList'>;

export const PartsScreen: React.FC<PartsScreenProps> = ({ navigation }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false); // Cambiado a false para evitar loader inicial
  const [refreshing, setRefreshing] = useState(false); // Estado separado para pull-to-refresh
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Carga inicial cuando se monta el componente
  useEffect(() => {
    loadParts();
  }, []);

  // Recargar datos cada vez que la pantalla se enfoque (para ver cambios actualizados)
  useFocusEffect(
    React.useCallback(() => {
      loadParts();
    }, [])
  );

  useEffect(() => {
    filterParts();
  }, [parts, searchQuery, selectedCategory]);

  const loadParts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const partsData = await partService.getAll();
      setParts(partsData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las piezas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterParts = () => {
    let filtered = parts;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'vendidos') {
        // Mostrar solo piezas con cantidad 0 (vendidas)
        filtered = filtered.filter(part => part.quantity === 0);
      } else {
        // Para todas las demás categorías, mostrar solo piezas con stock > 0
        filtered = filtered.filter(part => 
          part.category.toLowerCase() === selectedCategory.toLowerCase() && part.quantity > 0
        );
      }
    } else {
      // Para "Todas", mostrar solo piezas con stock > 0
      filtered = filtered.filter(part => part.quantity > 0);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.compatibility.some(comp => 
          comp.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredParts(filtered);
  };

  const getCategories = () => {
    const categories = [...new Set(parts.map(part => part.category))];
    return ['all', ...categories, 'vendidos'];
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return colors.error;
    if (quantity <= 1) return colors.warning;
    return colors.success;
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity === 0) return 'Sin stock';
    if (quantity <= 1) return 'Stock bajo';
    return 'En stock';
  };

  const renderPartItem = ({ item }: { item: Part }) => (
    <TouchableOpacity
      style={styles.partCard}
      onPress={() => navigation.navigate('PartDetail', { part: item })}
    >
      <View style={styles.partHeader}>
        <View style={styles.partInfo}>
          <Text style={styles.partName}>{item.name}</Text>
          <Text style={styles.partBrand}>{item.brand} - {item.model}</Text>
          <Text style={styles.partCategory}>{item.category}</Text>
        </View>
        
        <View style={styles.stockInfo}>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <View style={[
            styles.stockBadge, 
            { backgroundColor: getStockStatusColor(item.quantity) }
          ]}>
            <Text style={styles.stockText}>
              {getStockStatusText(item.quantity)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.partFooter}>
        <Text style={styles.cost}>${item.cost.toFixed(2)}</Text>
        {item.location && (
          <Text style={styles.location}>📍 {item.location}</Text>
        )}
      </View>

      {item.compatibility.length > 0 && (
        <View style={styles.compatibilityContainer}>
          <Text style={styles.compatibilityLabel}>Compatible con:</Text>
          <View style={styles.compatibilityTags}>
            {item.compatibility.slice(0, 3).map((comp, index) => (
              <View key={index} style={styles.compatibilityTag}>
                <Text style={styles.compatibilityText}>{comp}</Text>
              </View>
            ))}
            {item.compatibility.length > 3 && (
              <Text style={styles.moreCompat}>+{item.compatibility.length - 3}</Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const CategoryFilter = ({ category }: { category: string }) => {
    const isActive = selectedCategory === category;
    const displayName = category === 'all' ? 'Todas' : 
                       category === 'vendidos' ? 'Vendidos' : 
                       category;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isActive && styles.categoryButtonActive,
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text
          style={[
            styles.categoryButtonText,
            isActive && styles.categoryButtonTextActive,
          ]}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  // Componente de loading para el área de la lista
  const ListLoadingView = () => (
    <View style={styles.listLoadingContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.loadingText}>Cargando piezas...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventario de Piezas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewPart')}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar piezas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.placeholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={getCategories()}
          renderItem={({ item }) => <CategoryFilter category={item} />}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.listContainer}>
        {loading && parts.length === 0 ? (
          <ListLoadingView />
        ) : (
          <FlatList
            data={filteredParts}
            renderItem={renderPartItem}
            keyExtractor={(item) => item.id}
            style={styles.flatList}
            contentContainerStyle={filteredParts.length === 0 ? styles.emptyListContainer : styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadParts(true)}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'No se encontraron piezas con estos filtros'
                      : 'No hay piezas en el inventario'
                    }
                  </Text>
                  {!searchQuery && selectedCategory === 'all' && (
                    <Text style={styles.emptySubtext}>
                      Agrega tu primera pieza presionando el botón "+"
                    </Text>
                  )}
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  categoriesContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  flatList: {
    flex: 1,
  },
  partCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  partBrand: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  partCategory: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  quantity: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  stockText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  partFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cost: {
    ...typography.h3,
    color: colors.primary,
  },
  location: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  compatibilityContainer: {
    marginTop: spacing.sm,
  },
  compatibilityLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  compatibilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  compatibilityTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  compatibilityText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  moreCompat: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  // Estilos para el loading optimizado
  listLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  flatListContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
