# Dygitec - Sistema de Gestión de Reparaciones

## 📱 Descripción

Dygitec es una aplicación móvil desarrollada con React Native y Expo para la gestión integral de un negocio de reparación de computadoras. La app permite administrar reparaciones, inventario de piezas, clientes y generar códigos QR para un seguimiento eficiente.

## ✨ Características Principales

### 🔧 Gestión de Reparaciones
- **Registro completo**: Cliente, computadora, problema y estado
- **Estados de seguimiento**: Pendiente, En Progreso, Esperando Piezas, Completada, Entregada, Cancelada
- **Filtrado y búsqueda**: Por estado, cliente, descripción, marca, modelo, etc.
- **Códigos QR**: Generación automática para cada reparación

### 📦 Inventario de Piezas
- **Gestión completa**: Nombre, marca, modelo, categoría, compatibilidad
- **Control de stock**: Cantidad, ubicación, costo
- **Filtrado avanzado**: Por categoría, stock disponible, piezas vendidas
- **Códigos QR**: Para cada pieza con etiquetas imprimibles

### 👥 Gestión de Clientes
- **Información completa**: Nombre, teléfono, email
- **Historial**: Todas las reparaciones asociadas

### 💻 Gestión de Computadoras
- **Detalles técnicos**: Marca, modelo, número de serie
- **Asociación**: Vinculación con clientes y reparaciones

### 📱 Funcionalidades Avanzadas
- **Lector QR integrado**: Escaneo desde cámara o galería
- **Navegación inteligente**: Desde QR a detalles automáticamente
- **Exportación de QR**: Guardado en galería para impresión
- **Interfaz intuitiva**: Diseño moderno y fácil de usar

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

### Gestión de Reparaciones
1. **Nueva Reparación**: Botón "+" en la pestaña Reparaciones
2. **Seguimiento**: Cambiar estados desde los detalles
3. **QR**: Generar código QR para cada reparación

### Inventario de Piezas
1. **Agregar Pieza**: Botón "+" en la pestaña Piezas
2. **Filtrar**: Usar categorías y búsqueda
3. **Vender**: Marcar pieza como vendida (stock = 0)

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
│   ├── PartsScreen.tsx
│   ├── QRScannerScreen.tsx
│   └── ...
├── services/          # Servicios externos
│   └── firebase.ts
├── types/            # Tipos TypeScript
│   ├── index.ts
│   └── navigation.ts
└── App.tsx           # Componente principal
```

## 🎨 Diseño y UX

- **Tema oscuro/claro**: Adaptable según preferencias del sistema
- **Iconografía**: Ionicons para consistencia visual
- **Navegación**: Tab navigation con stack navigation anidado
- **Feedback**: Loading states y mensajes informativos
- **Accesibilidad**: Cumple estándares de accesibilidad móvil

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

### v1.0.0 (2025-09-09)
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

- [ ] Notificaciones push para recordatorios
- [ ] Generación de reportes PDF
- [ ] Backup y restauración de datos
- [ ] Búsqueda avanzada
- [ ] Dashboard con métricas
- [ ] Gestión de proveedores
- [ ] Historial de precios de piezas

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
