# Dygitec - Sistema de Gestión de Reparaciones

## 📱 Descripción

Dygitec es una aplicación móvil desarrollada con React Native y Expo para la gestión integral de un negocio de reparación de computadoras. La app permite administrar reparaciones, inventario de piezas, clientes, equipos y generar códigos QR para un seguimiento eficiente.

## ✨ Características Principales

### 🔧 Gestión de Reparaciones Inteligente
- **Navegación contextual**: Crear reparaciones desde equipos con datos preseleccionados
- **Selectores elegantes**: Modales con búsqueda en tiempo real y filtrado avanzado
- **Estados de seguimiento**: Pendiente, En Progreso, Esperando Piezas, Completada, Entregada, Cancelada
- **Filtrado y búsqueda**: Por estado, cliente, descripción, marca, modelo
- **Códigos QR**: Generación automática para cada reparación con visualización mejorada

### � Gestión de Equipos Avanzada
- **Registro inteligente**: Cliente preseleccionado al crear desde contexto de reparación
- **Detalles completos**: Marca, modelo, año, número de serie, descripción
- **Asociación automática**: Vinculación directa con clientes
- **Navegación fluida**: Integración perfecta con el flujo de reparaciones

### 👥 Gestión de Clientes Mejorada
- **Información completa**: Nombre, teléfono, email
- **Historial detallado**: Todas las reparaciones y equipos asociados
- **Selección elegante**: Modal con búsqueda y filtrado en tiempo real
- **Indicadores visuales**: Estados de selección previa y búsqueda dinámica

### �📦 Inventario de Piezas
- **Gestión completa**: Nombre, marca, modelo, categoría, compatibilidad
- **Control de stock**: Cantidad, ubicación, costo
- **Filtrado avanzado**: Por categoría, stock disponible, piezas vendidas
- **Códigos QR**: Para cada pieza con etiquetas imprimibles

### 🎨 Experiencia de Usuario Mejorada
- **Modales transparentes**: Diseño moderno con overlay elegante
- **Búsqueda en tiempo real**: Filtrado instantáneo mientras escribes
- **Estados de carga**: Indicadores visuales de actualizaciones
- **Navegación intuitiva**: Headers consistentes con botones de regreso claros
- **Preselección inteligente**: Datos automáticos basados en contexto

### 📱 Funcionalidades Técnicas Avanzadas
- **Auto-actualización**: Listas que se refrescan automáticamente al regresar
- **Gestión de estado**: Estados de preselección que se adaptan dinámicamente
- **Navegación cruzada**: Flujo fluido entre diferentes secciones
- **Validación inteligente**: Formularios que se adaptan al contexto
- **Interfaz responsiva**: Diseño adaptable y consistente

## 🛠️ Tecnologías Utilizadas

- **Framework**: React Native con Expo SDK 53
- **Lenguaje**: TypeScript
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Navegación**: React Navigation v7
- **Componentes UI**: Ionicons, componentes personalizados
- **QR Codes**: react-native-qrcode-svg, expo-camera
- **Multimedia**: expo-image-picker, expo-media-library

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- Cuenta de Firebase configurada

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd Dygitec
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Crear proyecto en [Firebase Console](https://console.firebase.google.com)
   - Habilitar Authentication y Firestore
   - Descargar `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)
   - Configurar las credenciales en `services/firebase.ts`

4. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env con las credenciales de Firebase
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

5. **Ejecutar la aplicación**
   ```bash
   npm start
   ```

## 📱 Uso de la Aplicación

### Primer Uso
1. **Registro/Login**: Crear cuenta o iniciar sesión
2. **Navegación**: Usar las pestañas inferiores para navegar

### Gestión de Reparaciones Inteligente
1. **Nueva Reparación**: 
   - Desde pestañas Reparaciones: Selección manual de cliente y equipo
   - Desde Equipos: Cliente y equipo preseleccionados automáticamente
2. **Selectores Elegantes**: 
   - Búsqueda en tiempo real con filtrado instantáneo
   - Modales transparentes con diseño moderno
   - Indicadores de estado de carga y actualización
3. **Seguimiento**: Cambiar estados desde los detalles
4. **QR**: Generar código QR para cada reparación

### Gestión de Equipos Mejorada
1. **Agregar Equipo**: 
   - Desde lista de equipos: Selección manual de cliente
   - Desde reparaciones: Cliente preseleccionado automáticamente
   - Desde cliente específico: Cliente preseleccionado
2. **Indicadores**: Mensaje "(preseleccionado)" que desaparece al cambiar
3. **Auto-actualización**: Lista se actualiza al regresar de crear equipo

### Gestión de Clientes
1. **Agregar Cliente**: Formulario con validación inteligente
2. **Búsqueda**: Filtrado en tiempo real por nombre, teléfono o email
3. **Selección**: Modal elegante con estados visuales claros

### Inventario de Piezas
1. **Agregar Pieza**: Botón "+" en la pestaña Piezas
2. **Filtrar**: Usar categorías y búsqueda
3. **Vender**: Marcar pieza como vendida (stock = 0)

### Flujos de Trabajo Optimizados

#### Flujo 1: Reparación desde Cliente
1. Buscar cliente → Seleccionar equipo → Crear reparación
2. Lista de equipos se actualiza automáticamente

#### Flujo 2: Reparación desde Equipo
1. Seleccionar equipo → Datos preseleccionados → Completar información

#### Flujo 3: Nuevo Equipo en Contexto
1. Creando reparación → Falta equipo → "Registrar Nuevo Equipo"
2. Cliente ya preseleccionado → Solo completar datos del equipo
3. Regresar → Equipo disponible en lista actualizada

### Escaneo QR
1. **Cámara**: Usar la pestaña QR para escanear en tiempo real
2. **Galería**: Importar imagen desde galería
3. **Navegación**: Automática al escanear código válido

## 🏗️ Estructura del Proyecto

```
Dygitec/
├── components/          # Componentes reutilizables
│   ├── Button.tsx
│   ├── InputField.tsx
│   └── LoadingSpinner.tsx
├── constants/           # Constantes y temas
│   └── theme.ts
├── contexts/           # Contextos de React
│   └── AuthContext.tsx
├── navigation/         # Configuración de navegación
│   └── AppNavigator.tsx
├── screens/           # Pantallas de la aplicación
│   ├── LoginScreen.tsx
│   ├── RepairsScreen.tsx
│   ├── NewRepairScreen.tsx    # ⭐ Con navegación inteligente
│   ├── EquipmentsScreen.tsx   # ⭐ Lista con auto-actualización
│   ├── NewEquipmentForm.tsx   # ⭐ Con preselección de cliente
│   ├── CustomersScreen.tsx    # ⭐ Con selectores elegantes
│   ├── PartsScreen.tsx
│   ├── QRScannerScreen.tsx
│   └── ...
├── services/          # Servicios externos
│   └── firebase.ts
├── types/            # Tipos TypeScript
│   ├── index.ts
│   └── navigation.ts    # ⭐ Con parámetros de navegación mejorados
└── App.tsx           # Componente principal
```

## 🎨 Diseño y UX Mejorado

### Componentes Inteligentes
- **Modales Transparentes**: Overlay con bordes redondeados y animaciones suaves
- **Búsqueda en Tiempo Real**: Filtrado instantáneo con indicadores de resultado
- **Estados de Carga**: Spinners y mensajes contextuales ("Actualizando lista...")
- **Selección Visual**: Estados claros de selección e interacción

### Navegación Inteligente
- **Preselección Contextual**: Datos automáticos según el origen de navegación
- **Headers Consistentes**: Botones de regreso uniformes en toda la app
- **Auto-actualización**: Listas que se refrescan al regresar de crear/editar
- **Indicadores Dinámicos**: Mensajes que aparecen y desaparecen según el contexto

### Experiencia de Usuario
- **Flujos Optimizados**: Menos pasos para completar tareas comunes
- **Feedback Visual**: Confirmaciones claras de acciones completadas
- **Estados Vacíos**: Mensajes útiles cuando no hay datos
- **Validación Inteligente**: Formularios que se adaptan al contexto

### Características de Accesibilidad
- **Iconografía**: Ionicons para consistencia visual
- **Contraste**: Colores que cumplen estándares WCAG
- **Tamaños Táctiles**: Botones y controles de tamaño apropiado
- **Feedback Háptico**: Confirmaciones táctiles en acciones importantes

## 🔐 Seguridad

- **Autenticación**: Firebase Auth con email/contraseña
- **Autorización**: Reglas de Firestore para acceso seguro
- **Validación**: Validación de datos en cliente y servidor
- **Permisos**: Solicitud explícita de permisos de cámara y galería

## 📊 Base de Datos

### Colecciones Firestore
- **users**: Información de usuarios
- **customers**: Datos de clientes
- **computers**: Información de computadoras
- **repairs**: Registros de reparaciones
- **parts**: Inventario de piezas

### Estructura de Datos
```typescript
// Repair
{
  id: string,
  customerId: string,
  computerId: string,
  description: string,
  status: RepairStatus,
  createdAt: Date,
  updatedAt: Date,
  notes?: string
}

// Part
{
  id: string,
  name: string,
  brand: string,
  model: string,
  category: string,
  compatibility: string[],
  quantity: number,
  cost: number,
  location?: string,
  notes?: string
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 📦 Build y Deployment

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build:prod
```

### Expo Build
```bash
# Android
expo build:android

# iOS
expo build:ios
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Changelog

### v2.0.0 (2025-09-10) - ⭐ Major UX Update
#### 🚀 Nuevas Funcionalidades
- ✅ **Navegación Inteligente**: Crear reparaciones desde equipos con datos preseleccionados
- ✅ **Selectores Elegantes**: Modales transparentes con búsqueda en tiempo real
- ✅ **Auto-actualización**: Listas que se refrescan automáticamente al regresar
- ✅ **Preselección de Cliente**: En NewEquipmentForm según contexto de navegación
- ✅ **Indicadores Dinámicos**: Mensajes "(preseleccionado)" que desaparecen al cambiar
- ✅ **Estados de Carga**: Feedback visual durante actualizaciones de datos

#### 🎨 Mejoras de Diseño
- ✅ **Modales Transparentes**: Overlay elegante con animaciones suaves
- ✅ **Búsqueda Instantánea**: Filtrado en tiempo real mientras escribes
- ✅ **Headers Consistentes**: Navegación uniforme en toda la aplicación
- ✅ **Estados Vacíos Mejorados**: Mensajes contextuales y acciones sugeridas

#### 🔧 Mejoras Técnicas
- ✅ **Tipos de Navegación**: Parámetros mejorados para preselección de datos
- ✅ **Gestión de Estado**: Estados de preselección que se adaptan dinámicamente
- ✅ **Optimización de Flujos**: Menos pasos para completar tareas comunes
- ✅ **Validación Inteligente**: Formularios que se adaptan al contexto

#### 🚀 Flujos de Trabajo Optimizados
- ✅ **Flujo Reparación desde Equipo**: Datos preseleccionados automáticamente
- ✅ **Flujo Nuevo Equipo en Contexto**: Cliente preseleccionado al crear desde reparación
- ✅ **Flujo Cliente → Equipo → Reparación**: Navegación fluida con datos conservados

### v1.0.0 (2025-09-09) - Initial Release
- ✅ Sistema completo de gestión de reparaciones
- ✅ Inventario de piezas con filtrado avanzado
- ✅ Generación y lectura de códigos QR
- ✅ Lector QR desde cámara y galería
- ✅ Interfaz intuitiva con navegación por pestañas
- ✅ Autenticación y base de datos Firebase

## 🐛 Problemas Conocidos

- La detección de QR en imágenes de galería está en desarrollo
- Algunos permisos pueden requerir configuración manual en iOS

## 📞 Soporte

Para soporte técnico o preguntas:
- **Email**: soporte@dygitec.com
- **Issues**: Crear issue en GitHub
- **Documentación**: Wiki del proyecto

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado por el equipo de Dygitec

---

## 🚀 Quick Start

```bash
# Instalación rápida
git clone <repo-url>
cd Dygitec
npm install
npm start
```

¡Gracias por usar Dygitec! 🎉
  - Historial de equipos
- **Diseño Minimalista**: Interface limpia y fácil de usar

## 🛠️ Tecnologías

- **React Native** con **Expo**
- **TypeScript** para tipado estático
- **Firebase** (Authentication & Firestore)
- **React Navigation** para navegación
- **Expo Vector Icons** para iconografía

## 📱 Pantallas

### Autenticación
- Login
- Registro

### Navegación Principal (Tabs)
- **Reparaciones**: Lista, nueva reparación, detalles
- **Piezas**: Inventario, nueva pieza, búsqueda
- **Configuración**: Ajustes y opciones

## 🔧 Configuración

### 1. Prerrequisitos

#### Para desarrollo general:
```bash
npm install -g @expo/cli
```

#### Para Android:
- Instalar [Android Studio](https://developer.android.com/studio)
- Configurar Android SDK
- Habilitar Developer Options y USB Debugging en tu dispositivo Android

#### Para iOS (solo macOS):
- Instalar [Xcode](https://developer.apple.com/xcode/) desde App Store
- Instalar iOS Simulator
- Configurar certificados de desarrollo (para dispositivos físicos)

### 2. Configuración rápida
```bash
# Ejecutar script de configuración
./setup.sh

# O manualmente:
npm install
```

### 3. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication (Email/Password)
3. Crea una base de datos Firestore
4. Obtén las credenciales de configuración
5. Reemplaza los valores en `config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-auth-domain",
  projectId: "tu-project-id",
  storageBucket: "tu-storage-bucket",
  messagingSenderId: "tu-messaging-sender-id",
  appId: "tu-app-id"
};
```

### 4. Ejecutar la aplicación

#### Desarrollo (con Expo)
```bash
# Iniciar servidor de desarrollo
npm start

# Escanea el QR code con:
# - Android: Expo Go app
# - iOS: Cámara nativa o Expo Go app
```

#### Compilación nativa
```bash
# Android (requiere Android Studio)
npm run android

# iOS (requiere Xcode y macOS)
npm run ios

# Web (para testing)
npm run web
```

### 5. Testing en dispositivos

#### Android:
1. Habilita "Developer Options" en tu dispositivo
2. Activa "USB Debugging"
3. Conecta el dispositivo por USB
4. Ejecuta `npm run android`

#### iOS:
1. Conecta el dispositivo por USB
2. Confía en el certificado de desarrollo
3. Ejecuta `npm run ios`

### 6. Construcción para producción

```bash
# Android APK
eas build --platform android

# iOS (requiere cuenta de Apple Developer)
eas build --platform ios

# Configurar EAS primero:
npm install -g eas-cli
eas login
eas build:configure
```

## 📊 Estructura de Datos

### Firestore Collections

#### Users
```typescript
{
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
```

#### Customers
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: Date;
}
```

#### Computers
```typescript
{
  id: string;
  customerId: string;
  brand: string;
  model: string;
  year?: number;
  serialNumber?: string;
  description?: string;
  createdAt: Date;
}
```

#### Repairs
```typescript
{
  id: string;
  computerId: string;
  customerId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  entryDate: Date;
  expectedCompletionDate?: Date;
  completionDate?: Date;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Parts
```typescript
{
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  compatibility: string[];
  quantity: number;
  cost: number;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎨 Sistema de Diseño

La aplicación utiliza un sistema de diseño consistente definido en `constants/theme.ts`:

- **Colores**: Paleta azul minimalista
- **Tipografía**: Jerarquía clara y legible
- **Espaciado**: Sistema consistente
- **Sombras**: Elevación sutil
- **Componentes**: Reutilizables y consistentes

## 📁 Estructura del Proyecto

```
/
├── components/          # Componentes reutilizables
├── config/             # Configuración (Firebase)
├── constants/          # Constantes (tema, colores)
├── contexts/           # Contextos de React
├── navigation/         # Configuración de navegación
├── screens/            # Pantallas de la aplicación
├── services/           # Servicios (Firebase, API)
├── types/              # Definiciones de TypeScript
└── App.tsx             # Componente principal
```

## 🔒 Seguridad

- Autenticación obligatoria para todas las funciones
- Validación de datos en formularios
- Reglas de seguridad en Firestore (por configurar)

## 🚀 Próximas Características

### Funcionalidades Planificadas
- [ ] **Notificaciones Push**: Recordatorios de reparaciones pendientes
- [ ] **Generación de Reportes**: PDFs con estadísticas y resúmenes
- [ ] **Backup Automático**: Sincronización y restauración de datos
- [ ] **Dashboard Avanzado**: Métricas de rendimiento y estadísticas
- [ ] **Gestión de Proveedores**: Control de compras y inventario
- [ ] **Historial de Precios**: Seguimiento de costos de piezas

### Mejoras de UX Planificadas  
- [ ] **Modo Offline**: Funcionamiento sin conexión con sincronización posterior
- [ ] **Temas Personalizables**: Más opciones de personalización visual
- [ ] **Shortcuts**: Accesos rápidos a funciones frecuentes
- [ ] **Búsqueda Global**: Buscar en todas las secciones desde un lugar
- [ ] **Widgets**: Información rápida en pantalla de inicio
- [ ] **Gestos**: Acciones rápidas con swipe y long press

### Integraciones Futuras
- [ ] **Exportación Excel**: Reportes en formato Excel
- [ ] **WhatsApp Business**: Notificaciones directas a clientes
- [ ] **Impresoras Térmicas**: Impresión directa de etiquetas QR
- [ ] **API REST**: Integración con sistemas externos
- [ ] **Analytics**: Métricas detalladas de uso y rendimiento

## 📄 Licencia

Este proyecto es de uso interno para Dygitec.

## 👥 Desarrollo

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## 📞 Soporte

Para soporte técnico o consultas sobre la aplicación, contacta al equipo de desarrollo.
