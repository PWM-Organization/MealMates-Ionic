# 🍳 MealMates - App de Recetas Ionic + Firebase

## 📱 Descripción del Proyecto

MealMates es una aplicación móvil desarrollada con **Ionic 8** y **Angular 19** que permite a los usuarios explorar recetas, guardar favoritos y gestionar su perfil culinario. La app integra **Firebase** para autenticación y almacenamiento de datos, junto con **SQLite** para gestión local de favoritos.

## ✨ Características Principales

### 🔐 **Autenticación**

- Registro de usuarios con Firebase Auth
- Inicio de sesión con email/password
- Gestión de perfiles de usuario
- Cierre de sesión seguro

### 🍽️ **Gestión de Recetas**

- Exploración de recetas públicas desde Firestore
- Visualización detallada de recetas con ingredientes e instrucciones
- Información nutricional completa
- Categorización por dificultad, tiempo y tipo de comida

### ❤️ **Sistema de Favoritos**

- Almacenamiento local con SQLite
- Marcado/desmarcado de recetas favoritas
- Lista personalizada de favoritos por usuario
- Sincronización offline

### 🎨 **Diseño y UX**

- Tema naranja cálido (#ff6b35) como color principal
- Componentes nativos de Ionic para consistencia
- Navegación por tabs en la parte inferior
- Splash screen personalizada
- Responsive design para móviles y tablets

## 🚀 Tecnologías Utilizadas

### **Frontend**

- **Ionic 8** - Framework de aplicaciones híbridas
- **Angular 19** - Framework web con señales (signals)
- **TypeScript** - Lenguaje de programación
- **SCSS** - Preprocesador CSS

### **Backend & Base de Datos**

- **Firebase Auth** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **SQLite** (Capacitor Community) - Base de datos local para favoritos

### **Herramientas de Desarrollo**

- **Capacitor** - Capa nativa para dispositivos móviles
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── guards/
│   │   └── auth.guard.ts           # Protección de rutas
│   ├── pages/
│   │   ├── landing/                # Página de bienvenida
│   │   ├── login/                  # Inicio de sesión
│   │   ├── register/               # Registro de usuario
│   │   ├── favorites/              # Lista de favoritos
│   │   ├── explore/                # Exploración de recetas
│   │   └── recipe-detail/          # Detalle de receta
│   ├── services/
│   │   ├── auth.service.ts         # Servicio de autenticación
│   │   ├── recipe.service.ts       # Servicio de recetas
│   │   └── sqlite.service.ts       # Servicio SQLite
│   └── tabs/                       # Navegación por tabs
├── models/
│   ├── user.model.ts               # Modelo de usuario
│   ├── recipe.model.ts             # Modelo de receta
│   └── favorite.model.ts           # Modelo de favorito
├── assets/
│   └── icon/                       # Iconos de la aplicación
├── theme/
│   └── variables.scss              # Variables de tema
└── firebase.config.ts              # Configuración Firebase
```

## 🔧 Configuración e Instalación

### **Prerrequisitos**

```bash
# Node.js 20.x
# npm 10.x
# Ionic CLI
npm install -g @ionic/cli

# Capacitor CLI
npm install -g @capacitor/cli
```

### **Instalación**

```bash
# Clonar el repositorio
git clone [url-del-repositorio]
cd MealMates-Ionic

# Instalar dependencias
npm install

# Sincronizar Capacitor
npx cap sync
```

### **Configuración Firebase**

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Configurar Authentication con Email/Password
3. Crear base de datos Firestore
4. Actualizar `src/firebase.config.ts` con las credenciales del proyecto

### **Configuración SQLite**

```bash
# Instalar plugin SQLite
npm install @capacitor-community/sqlite
npm install @ionic/storage-angular

# Sincronizar
npx cap sync
```

## 🏃‍♂️ Ejecución del Proyecto

### **Desarrollo Web**

```bash
# Servidor de desarrollo
ionic serve

# Build para web
ionic build
```

### **Desarrollo Móvil**

```bash
# Agregar plataformas
ionic capacitor add android
ionic capacitor add ios

# Build y abrir en IDE nativo
ionic capacitor build android
ionic capacitor open android

ionic capacitor build ios
ionic capacitor open ios
```

### **Generar APK**

```bash
# Build de producción
ionic build --prod

# Sincronizar con Capacitor
npx cap sync android

# Abrir Android Studio
npx cap open android
# En Android Studio: Build → Generate Signed Bundle/APK
```

## 📊 Modelos de Datos

### **Usuario (Firestore)**

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  preferences: UserPreferences;
  dietaryRestrictions: string[];
  favoriteRecipes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### **Receta (Firestore)**

```typescript
interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  imageUrl: string;
  authorId: string;
  nutritionInfo?: NutritionInfo;
  isPublic: boolean;
  likes: number;
  saves: number;
}
```

### **Favorito (SQLite)**

```typescript
interface Favorite {
  id: number;
  recipeId: string;
  userId: string;
  addedAt: Date;
}
```

## 🔐 Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer/escribir su propio perfil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Recetas públicas son legibles para usuarios autenticados
    match /recipes/{recipeId} {
      allow read: if request.auth != null && resource.data.isPublic == true;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

## 🎨 Sistema de Diseño

### **Colores Principales**

- **Primary**: `#ff6b35` (Naranja cálido)
- **Secondary**: `#ff8a65` (Naranja claro)
- **Success**: `#2dd36f` (Verde fresco)
- **Warning**: `#ffc409` (Amarillo cálido)
- **Danger**: `#eb445a` (Rojo)

### **Componentes**

- **Cards**: Bordes redondeados (16px), sombras suaves
- **Buttons**: Altura 48px, bordes redondeados (12px)
- **Chips**: Tamaño compacto para metadatos
- **Tab Bar**: Posición inferior con iconos nativos

## 📱 Navegación

### **Flujo de Autenticación**

```
Landing → Login/Register → Favorites (Home)
```

### **Navegación Principal (Tabs)**

- **Favoritos**: Lista de recetas guardadas
- **Explorar**: Búsqueda y exploración de recetas
- **Inicio**: Landing page y perfil

### **Navegación Secundaria**

- **Detalle de Receta**: Información completa + toggle favoritos
- **Perfil**: Configuración de usuario (futuro)

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start              # ionic serve
npm run build              # ionic build
npm run test               # ng test
npm run lint               # ng lint

# Capacitor
npm run cap:sync           # npx cap sync
npm run cap:android        # npx cap open android
npm run cap:ios            # npx cap open ios

# Firebase
npm run deploy:functions   # firebase deploy --only functions
npm run deploy:rules       # firebase deploy --only firestore:rules
```

## 🚀 Deployment

### **Web (Firebase Hosting)**

```bash
# Build de producción
ionic build --prod

# Deploy a Firebase Hosting
firebase deploy --only hosting
```

### **Android Play Store**

1. Generar APK firmado en Android Studio
2. Crear cuenta de desarrollador en Google Play Console
3. Subir APK y completar información de la app
4. Publicar para revisión

### **iOS App Store**

1. Abrir proyecto en Xcode
2. Configurar certificados de desarrollo
3. Crear archivo en App Store Connect
4. Subir build con Xcode o Transporter

## 🧪 Testing

### **Unit Tests**

```bash
# Ejecutar tests unitarios
ng test

# Tests con coverage
ng test --code-coverage
```

### **E2E Tests**

```bash
# Instalar Cypress
npm install --save-dev cypress

# Ejecutar tests E2E
npx cypress open
```

## 📈 Performance

### **Optimizaciones Implementadas**

- Lazy loading de páginas
- Preload de módulos principales
- Imágenes optimizadas de Unsplash
- Componentes standalone para menor bundle
- SQLite para datos críticos offline

### **Métricas Objetivo**

- First Contentful Paint: < 2s
- Time to Interactive: < 3s
- Bundle size: < 2MB

## 🐛 Troubleshooting

### **Errores Comunes**

**Error de compilación TypeScript**

```bash
# Limpiar cache
rm -rf node_modules
npm install
npx cap sync
```

**Problemas con SQLite**

```bash
# Reinstalar plugin
npm uninstall @capacitor-community/sqlite
npm install @capacitor-community/sqlite
npx cap sync
```

**Firebase no conecta**

- Verificar credenciales en `firebase.config.ts`
- Comprobar reglas de Firestore
- Revisar configuración de Authentication

## 🔮 Roadmap Futuro

### **Sprint 5**

- [ ] Creación de recetas por usuarios
- [ ] Sistema de comentarios y valoraciones
- [ ] Filtros avanzados de búsqueda
- [ ] Categorías personalizadas

### **Sprint 6**

- [ ] Planificación de menús semanales
- [ ] Listas de compras generadas automáticamente
- [ ] Modo offline completo
- [ ] Notificaciones push

### **Sprint 7**

- [ ] Red social (seguir usuarios)
- [ ] Compartir recetas en redes sociales
- [ ] Modo oscuro
- [ ] Soporte multiidioma

## 👥 Contribución

### **Guías de Desarrollo**

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### **Estándares de Código**

- Usar ESLint y Prettier
- Comentarios en español
- Nombres de variables/funciones en inglés
- Commits descriptivos en español

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: jdelhorno@gmail.com
- **Firebase Project**: pwm-angular
- **Ionic Version**: 8.x
- **Angular Version**: 19.x

---

**Desarrollado con ❤️ usando Ionic + Firebase**
