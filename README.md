# 🎲 Trivial - Juego de Preguntas Interactivo

Un moderno juego de trivial multiplayer desarrollado con HTML5, CSS3 y JavaScript vanilla. Diseñado para 2-6 jugadores con preguntas dinámicas y una interfaz atractiva.

## 🚀 Características

### 🎯 Funcionalidades Principales
- **Multijugador local**: Soporte para 2-6 jugadores
- **Sistema de preguntas dinámico**: Integración con Open Trivia Database API
- **Tablero interactivo**: Renderizado con Canvas 2D
- **6 categorías**: Historia, Ciencia, Deportes, Arte, Geografía, Entretenimiento
- **Múltiples dificultades**: Fácil, Medio, Difícil
- **Persistencia**: Guarda automáticamente el progreso del juego
- **Diseño responsivo**: Optimizado para desktop y tablet

### 🎨 Interfaz de Usuario
- **Animaciones fluidas**: Transiciones suaves y efectos visuales
- **Tema moderno**: Gradientes y colores vibrantes
- **Feedback visual**: Indicadores claros de progreso y estado
- **Temporizador opcional**: Control de tiempo por pregunta
- **Tutorial integrado**: Guía paso a paso para nuevos jugadores

### 🔧 Características Técnicas
- **Modo offline**: Preguntas de respaldo cuando no hay internet
- **Caché inteligente**: Evita repetición de preguntas
- **Manejo de errores**: Degradación elegante ante fallos
- **Accesibilidad**: Navegación por teclado y contrastes adecuados
- **Optimización**: Rendimiento optimizado para Canvas y DOM

## 🚀 Inicio Rápido

### Requisitos
- Navegador moderno con soporte para ES6+
- Conexión a internet (opcional, tiene modo offline)

### Instalación
1. Clona o descarga el proyecto
2. Abre `index.html` en tu navegador
3. ¡Empieza a jugar!

```bash
# Si usas un servidor local (recomendado)
npx http-server .
# O con Python
python -m http.server 8000
```

### Primer Uso
1. **Configuración**: Ajusta número de jugadores, dificultad y temporizador
2. **Tutorial**: Sigue la guía de 3 pasos para aprender a jugar

## 🌐 GitHub Pages Deploy

Este proyecto está configurado para desplegarse automáticamente en GitHub Pages:

### 🚀 Deploy automático
- **URL de producción**: `https://tu-usuario.github.io/nombre-repositorio`
- **Deploy automático**: Cada push a la rama `main` activa el deploy
- **GitHub Actions**: Workflow configurado en `.github/workflows/deploy.yml`

### 📋 Pasos para alojar en GitHub Pages:

1. **Crear repositorio en GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Trivial game ready for GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/nombre-repositorio.git
   git push -u origin main
   ```

2. **Activar GitHub Pages**:
   - Ve a tu repositorio en GitHub
   - Settings → Pages
   - Source: "GitHub Actions"
   - El workflow automáticamente detectará y desplegará tu sitio

3. **Verificar deploy**:
   - El sitio estará disponible en pocos minutos
   - GitHub te notificará cuando el deploy esté completo
   - URL: `https://tu-usuario.github.io/nombre-repositorio`

### ✅ Optimizaciones para GitHub Pages incluidas:
- Workflow de GitHub Actions configurado
- Estructura de archivos optimizada para hosting estático
- Rutas relativas para compatibilidad
- Fallback offline que funciona sin servidor

## 🎮 Cómo Jugar

### Objetivo
Sé el primero en recopilar una cuña de cada categoría y responder correctamente la pregunta final.

### Mecánica del Juego
1. **Tira el dado** para moverte por el tablero
2. **Responde preguntas** de la categoría donde caigas
3. **Gana cuñas** respondiendo correctamente en casillas especiales
4. **Pregunta final** cuando tengas todas las cuñas

### Tipos de Casillas
- **🔵 Normales**: Pregunta de la categoría correspondiente
- **⭐ Cuña**: Pregunta para ganar cuña de esa categoría
- **💎 Especiales**: Efectos especiales como volver a tirar

### Categorías
- 📚 **Historia**: Eventos históricos y personajes
- 🔬 **Ciencia**: Física, química, biología y naturaleza
- ⚽ **Deportes**: Deportes populares y competiciones
- 🎨 **Arte**: Pintura, escultura y artistas famosos
- 🌍 **Geografía**: Países, capitales y geografía física
- 🎬 **Entretenimiento**: Cine, música y cultura popular

## 🛠️ Arquitectura Técnica

### Estructura del Proyecto
```
Trivial/
├── index.html                 # Página principal
├── css/
│   ├── styles.css            # Estilos principales
│   └── animations.css        # Animaciones y efectos
├── js/
│   ├── main.js              # Archivo principal
│   ├── game/                # Lógica del juego
│   │   ├── GameEngine.js    # Motor principal
│   │   ├── Player.js        # Gestión de jugadores
│   │   ├── Board.js         # Tablero y Canvas
│   │   └── Question.js      # Sistema de preguntas
│   ├── ui/                  # Interfaz de usuario
│   │   ├── MenuUI.js        # Menús y configuración
│   │   └── GameUI.js        # UI del juego
│   └── utils/               # Utilidades
│       ├── ApiClient.js     # Cliente API
│       └── Storage.js       # Almacenamiento local
├── data/
│   └── fallback-questions.json # Preguntas offline
└── .github/
    └── copilot-instructions.md  # Instrucciones para Copilot
```

### Patrones de Diseño
- **MVC**: Separación clara entre lógica, vista y datos
- **Event-driven**: Comunicación mediante eventos
- **Modular**: Cada clase tiene una responsabilidad específica
- **Singleton**: GameEngine como controlador único

### APIs Utilizadas
- **Open Trivia Database**: Fuente principal de preguntas
- **Canvas 2D**: Renderizado del tablero
- **LocalStorage**: Persistencia de datos
- **Fetch API**: Peticiones de red

## ⚙️ Configuración

### Opciones Disponibles
- **Número de jugadores**: 2-6 jugadores
- **Dificultad**: Fácil, Medio, Difícil
- **Temporizador**: 0-45 segundos por pregunta
- **Sonidos**: Activar/desactivar efectos de sonido

### Personalización
El juego puede personalizarse modificando:
- **Colores**: Variables CSS en `styles.css`
- **Preguntas**: Archivo `fallback-questions.json`
- **Tablero**: Configuración en `Board.js`
- **Categorías**: Mapeo en `ApiClient.js`

## 🔧 Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Tirar dado |
| `P` | Pausar/reanudar |
| `Escape` | Pausar o cerrar modales |
| `Ctrl+S` | Guardar partida |
| `F11` | Pantalla completa |
| `←/→` | Navegar tutorial |

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Dispositivos
- 💻 **Desktop**: Experiencia completa
- 📱 **Tablet**: Interfaz adaptada
- 📱 **Móvil**: Funcionalidad básica

## 🐛 Resolución de Problemas

### Problemas Comunes

**El juego no carga**
- Verifica que JavaScript esté habilitado
- Usa un servidor HTTP local si es necesario
- Revisa la consola del navegador para errores

**No aparecen preguntas**
- Verifica la conexión a internet
- El juego usa preguntas offline como respaldo
- Recarga la página si persiste el problema

**El tablero no se ve correctamente**
- Verifica que Canvas 2D esté soportado
- Ajusta el zoom del navegador al 100%
- Prueba en modo pantalla completa

**Rendimiento lento**
- Cierra otras pestañas del navegador
- Reduce la calidad gráfica si es posible
- Actualiza tu navegador a la última versión

### Funciones de Debug

```javascript
// En la consola del navegador
debugInfo()        // Información del estado actual
clearAllData()     // Limpiar todos los datos guardados
exportGameData()   // Exportar estadísticas
importGameData()   // Importar datos guardados
```

## 🤝 Contribuir

### Cómo Contribuir
1. Fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Áreas de Mejora
- 🎵 Sistema de sonidos y música
- 🌐 Soporte para más idiomas
- 🤖 Modo de juego vs IA
- 📊 Estadísticas avanzadas
- 🎨 Más temas visuales
- 📱 Mejor soporte móvil

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Créditos

### Recursos Utilizados
- **Preguntas**: [Open Trivia Database](https://opentdb.com/)
- **Fuentes**: Google Fonts
- **Iconos**: Emojis Unicode

### Inspiración
Basado en el clásico juego Trivial Pursuit, adaptado para la era digital con tecnologías web modernas.

## 📞 Soporte

¿Tienes preguntas o necesitas ayuda?

- 📧 Email: [tu-email@ejemplo.com]
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/trivial/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/tu-usuario/trivial/discussions)

---

**¡Gracias por jugar Trivial! 🎲✨**

*Desarrollado con ❤️ usando tecnologías web modernas*
