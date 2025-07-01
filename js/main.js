/**
 * Archivo principal de la aplicación Trivial
 * Inicializa el juego y coordina todos los componentes
 */

// Variables globales
let gameEngine;
let menuUI;
let gameUI;
let challengeEngine;
let challengeUI;

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, esperando módulos...');
    
    // Fallback: Si los módulos no se cargan en 3 segundos, intentar inicialización
    setTimeout(() => {
        if (!window.gameEngine) {
            console.log('⚠️ Fallback: Módulos no cargados en tiempo esperado, intentando inicialización...');
            attemptInitialization();
        }
    }, 3000);
});

/**
 * Inicializa la aplicación cuando todos los módulos están cargados
 */
document.addEventListener('modulesReady', () => {
    console.log('Módulos cargados, inicializando aplicación...');
    
    // Pequeña demora para asegurar que todos los elementos estén disponibles
    setTimeout(() => {
        attemptInitialization();
    }, 100);
});

/**
 * Inicializa la aplicación cuando todos los módulos están cargados (fallback)
 */
document.addEventListener('appReady', () => {
    console.log('Evento appReady recibido');
    if (!window.gameEngine) {
        console.log('Inicializando desde appReady...');
        attemptInitialization();
    }
});

/**
 * Inicializa todos los componentes de la aplicación
 */
function initializeApplication() {
    // Track tiempo de inicialización de la aplicación
    const initStartTime = performance.now();
    
    // Inicializar motor del juego
    gameEngine = new GameEngine();
    
    // Inicializar interfaces de usuario
    menuUI = new MenuUI(gameEngine);
    gameUI = new GameUI(gameEngine);
    
    // Inicializar modo Desafío
    challengeEngine = new ChallengeEngine();
    challengeUI = new ChallengeUI();
    challengeUI.initialize(challengeEngine);
    
    // Establecer referencia bidireccional para persistencia del historial
    gameEngine.gameUI = gameUI;
    
    // Hacer las instancias globalmente accesibles para el modo individual
    window.gameEngine = gameEngine;
    window.menuUI = menuUI;
    window.gameUI = gameUI;
    window.challengeEngine = challengeEngine;
    window.challengeUI = challengeUI;
    
    // Configurar navegación entre pantallas
    setupScreenNavigation();
    
    // Configurar event listeners globales
    setupGlobalEventListeners();
    
    // Inicializar event listeners de redimensionamiento
    setupResizeHandlers();
    
    // Verificar compatibilidad del navegador
    checkBrowserCompatibility();
    
    // Mostrar pantalla inicial
    showInitialScreen();
    
    // Track tiempo de inicialización completa
    const initTime = performance.now() - initStartTime;
    if (window.trivialAnalytics) {
        window.trivialAnalytics.trackLoadTime('app_initialization', initTime);
        window.trivialAnalytics.trackPageView('App_Initialized');
    }
    
    console.log(`✅ Aplicación inicializada en ${Math.round(initTime)}ms`);
}

/**
 * Configura la navegación entre pantallas
 */
function setupScreenNavigation() {
    // Escuchar evento de volver al menú
    document.addEventListener('backToMenu', () => {
        // Track navegación de vuelta al menú
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackMenuNavigation('game', 'main-menu', 'back_button');
        }
        menuUI.showMenuScreen();
    });
    
    // Escuchar eventos del motor del juego para cambios de pantalla
    gameEngine.on('gameStarted', () => {
        // Track inicio de juego
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackMenuNavigation('main-menu', 'game-board', 'game_start');
        }
        // La pantalla de juego ya se muestra desde MenuUI
    });
    
    gameEngine.on('gameQuit', () => {
        // Track salida del juego
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackMenuNavigation('game-board', 'main-menu', 'quit_button');
        }
        menuUI.showMenuScreen();
    });
}

/**
 * Configura event listeners globales
 */
function setupGlobalEventListeners() {
    // Manejar errores no capturados
    window.addEventListener('error', (event) => {
        console.error('Error no capturado:', event.error);
        
        // Track error en analytics
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackError('JAVASCRIPT_ERROR', 
                `${event.message} at ${event.filename}:${event.lineno}`);
        }
        
        showError('Se produjo un error inesperado. El juego continuará funcionando.');
    });
    
    // Manejar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Promesa rechazada no manejada:', event.reason);
        
        // Track promise rejection en analytics
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackError('UNHANDLED_PROMISE_REJECTION', 
                event.reason?.message || 'Unknown promise rejection');
        }
        
        event.preventDefault(); // Evitar que aparezca en la consola del navegador
    });
    
    // Manejar cierre de la aplicación
    window.addEventListener('beforeunload', (event) => {
        if (gameEngine.gameState === 'playing') {
            // Track abandono del juego
            if (window.trivialAnalytics) {
                const sessionTime = Date.now() - (gameEngine.gameStartTime || Date.now());
                window.trivialAnalytics.trackPageView('Game_Abandoned');
                // El evento de session_duration se trackea automáticamente en Analytics.js
            }
            
            // Guardar automáticamente el juego antes de cerrar
            gameEngine.saveGameState();
            
            // Mostrar advertencia al usuario
            const message = '¿Estás seguro de que quieres salir? Tu progreso se guardará automáticamente.';
            event.returnValue = message;
            return message;
        }
    });
    
    // Manejar cambios de visibilidad de la página
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameEngine.gameState === 'playing') {
            // Track cuando el usuario cambia de pestaña durante el juego
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackPageView('Game_Tab_Hidden');
            }
            
            // Pausar el juego cuando la página se oculta
            gameEngine.pauseGame();
        } else if (!document.hidden && gameEngine.gameState === 'paused') {
            // Track cuando el usuario vuelve a la pestaña
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackPageView('Game_Tab_Visible');
            }
        }
    });
    
    // Manejar atajos de teclado
    document.addEventListener('keydown', (event) => {
        handleKeyboardShortcuts(event);
    });
    
    // Manejar clicks fuera de modales para cerrarlos
    document.addEventListener('click', (event) => {
        handleModalClicks(event);
    });
    
    // Inicializar sistema de animaciones de scroll
    setupScrollAnimations();
}

/**
 * Configura el sistema de animaciones de scroll
 */
function setupScrollAnimations() {
    // Crear observer para animaciones de scroll
    const scrollObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    // Opcional: remover la clase si el elemento sale de vista
                    // entry.target.classList.remove('visible');
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    // Observar todos los elementos con la clase animate-on-scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(element => {
        scrollObserver.observe(element);
    });

    // Función para añadir nuevos elementos al observer
    window.addScrollAnimation = function(element) {
        if (element.classList.contains('animate-on-scroll')) {
            scrollObserver.observe(element);
        }
    };
}

/**
 * Maneja atajos de teclado globales
 */
function handleKeyboardShortcuts(event) {
    // Solo procesar atajos si no hay elementos de input activos
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return;
    }
    
    switch (event.key) {
        case 'Escape':
            // Pausar juego o cerrar modales
            if (gameEngine.gameState === 'playing') {
                gameEngine.pauseGame();
            }
            break;
            
        case ' ':
            // Tirar dado con espacio (solo en juego)
            if (gameEngine.gameState === 'playing') {
                event.preventDefault();
                gameUI.rollDice();
            }
            break;
            
        case 'p':
            // Pausar/reanudar con P
            if (gameEngine.gameState === 'playing') {
                gameEngine.pauseGame();
            } else if (gameEngine.gameState === 'paused') {
                gameEngine.resumeGame();
            }
            break;
            
        case 's':
            // Guardar con S (solo en juego)
            if (gameEngine.gameState === 'playing' && event.ctrlKey) {
                event.preventDefault();
                gameEngine.saveGameState();
                showNotification('Juego guardado', 'success');
            }
            break;
            
        case 'F11':
            // Pantalla completa
            event.preventDefault();
            toggleFullscreen();
            break;
    }
}

/**
 * Maneja clicks en modales para cerrarlos
 */
function handleModalClicks(event) {
    if (event.target.classList.contains('modal')) {
        // No cerrar el modal de pregunta para evitar perder preguntas activas
        if (event.target.id === 'question-modal') {
            // Mostrar animación de "no se puede cerrar" en lugar de cerrar
            const modalContent = event.target.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('shake');
                setTimeout(() => {
                    modalContent.classList.remove('shake');
                }, 500);
            }
            return;
        }
        
        // Click en el fondo del modal - cerrar otros modales
        //event.target.classList.remove('active');
    }
}

/**
 * Configura manejadores de redimensionamiento
 */
function setupResizeHandlers() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        // Debounce para evitar múltiples llamadas
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleResize();
        }, 250);
    });
    
    // Manejar cambios de orientación en móviles
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            handleOrientationChange();
        }, 500); // Esperar a que se complete el cambio de orientación
    });
    
    // Listener adicional para detectar cambios de orientación en navegadores modernos
    if (screen.orientation) {
        screen.orientation.addEventListener('change', () => {
            setTimeout(() => {
                handleOrientationChange();
            }, 300);
        });
    }
}

/**
 * Maneja el redimensionamiento de la ventana
 */
function handleResize() {
    // Notificar a las UIs
    if (menuUI) {
        menuUI.handleResize();
    }
    
    if (gameUI) {
        gameUI.handleResize();
    }
    
    // Actualizar variables CSS para viewport
    updateViewportVariables();
}

/**
 * Maneja cambios de orientación de la pantalla
 */
function handleOrientationChange() {
    // Pequeño delay para permitir que el navegador se ajuste
    setTimeout(() => {
        if (gameUI && gameUI.gameEngine.board) {
            gameUI.handleResize();
        }
        
        // Actualizar variables CSS para viewport
        updateViewportVariables();
        
        console.log('Orientación cambiada - Dimensiones actualizadas');
    }, 100);
}

/**
 * Actualiza variables CSS para el viewport
 */
function updateViewportVariables() {
    const vh = window.innerHeight * 0.01;
    const vw = window.innerWidth * 0.01;
    
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--vw', `${vw}px`);
}

/**
 * Verifica la compatibilidad del navegador
 */
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'localStorage',
        'fetch',
        'Promise',
        'requestAnimationFrame'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => {
        switch (feature) {
            case 'localStorage':
                return !window.localStorage;
            case 'fetch':
                return !window.fetch;
            case 'Promise':
                return !window.Promise;
            case 'requestAnimationFrame':
                return !window.requestAnimationFrame;
            default:
                return false;
        }
    });
    
    if (missingFeatures.length > 0) {
        showCriticalError(`Tu navegador no es compatible. Características faltantes: ${missingFeatures.join(', ')}`);
        return false;
    }
    
    // Verificar Canvas 2D
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        showCriticalError('Tu navegador no soporta Canvas 2D, necesario para el juego.');
        return false;
    }
    
    return true;
}

/**
 * Muestra la pantalla inicial
 */
function showInitialScreen() {
    // Verificar si hay un juego guardado
    if (gameEngine.hasSavedGame()) {
        // Mostrar notificación de juego guardado
        setTimeout(() => {
            showNotification('Tienes una partida guardada. Puedes continuarla desde el menú principal.', 'info');
        }, 1000);
    }
    
    // Actualizar variables de viewport
    updateViewportVariables();
    
    // Mostrar menú principal
    menuUI.showMenuScreen();
}

/**
 * Alterna pantalla completa
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn('Error al entrar en pantalla completa:', err);
        });
    } else {
        document.exitFullscreen().catch(err => {
            console.warn('Error al salir de pantalla completa:', err);
        });
    }
}

/**
 * Muestra una notificación
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('active');
    }, 100);

    const autoClose = setTimeout(() => {
        closeNotification(notification);
    }, duration);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoClose);
        closeNotification(notification);
    });
}

/**
 * Cierra una notificación
 */
function closeNotification(notification) {
    notification.classList.remove('active');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Muestra un error crítico
 */
function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'critical-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h2>Error Crítico</h2>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">Recargar Página</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * Muestra un error normal
 */
function showError(message) {
    showNotification(message, 'error', 5000);
}

/**
 * Función de utilidad para debug
 */
function debugInfo() {
    if (gameEngine) {
        console.log('=== DEBUG INFO ===');
        console.log('Game Engine:', gameEngine.getDebugInfo());
        console.log('Local Storage:', {
            hasGameState: gameEngine.hasSavedGame(),
            stats: gameEngine.getGameStats(),
            config: gameEngine.config
        });
        console.log('==================');
    }
}

/**
 * Función para limpiar todos los datos (debug)
 */
function clearAllData() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos del juego?')) {
        gameEngine.storage.clearAll();
        location.reload();
    }
}

/**
 * Función para exportar datos de juego
 */
function exportGameData() {
    const data = gameEngine.storage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `trivial-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Función para importar datos de juego
 */
function importGameData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (gameEngine.storage.importData(data)) {
                        showNotification('Datos importados correctamente', 'success');
                        location.reload();
                    } else {
                        showError('Error al importar los datos');
                    }
                } catch (error) {
                    showError('Archivo de datos inválido');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/**
 * Función que intenta inicializar la aplicación con reintentos
 */
function attemptInitialization(retryCount = 0, maxRetries = 3) {
    const delay = 1000 * (retryCount + 1); // Incrementar delay con cada reintento
    
    setTimeout(() => {
        try {            // Verificar que los elementos críticos están disponibles
            const criticalElements = [
                'menu-screen',
                'start-game-btn',
                'settings-btn',
                'tutorial-btn',
                'game-board' // Añadir el canvas del juego
            ];
            
            const elementsAvailable = criticalElements.every(id => {
                const element = document.getElementById(id);
                if (!element) {
                    console.log(`❌ Elemento no encontrado: ${id}`);
                    return false;
                }
                return true;
            });
            
            if (!elementsAvailable) {
                if (retryCount < maxRetries) {
                    console.log(`🔄 Elementos no disponibles, reintentando en ${delay}ms... (intento ${retryCount + 1}/${maxRetries + 1})`);
                    attemptInitialization(retryCount + 1, maxRetries);
                    return;
                } else {
                    throw new Error('Elementos críticos no disponibles después de múltiples intentos');
                }
            }
            
            initializeApplication();
            console.log('✅ Aplicación inicializada correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            if (retryCount < maxRetries) {
                console.log(`🔄 Reintentando inicialización en ${delay}ms... (intento ${retryCount + 1}/${maxRetries + 1})`);
                attemptInitialization(retryCount + 1, maxRetries);
            } else {
                showCriticalError('Error al inicializar la aplicación después de múltiples intentos. Por favor, recarga la página.');
            }
        }
    }, delay);
}

// Hacer funciones disponibles globalmente para debug
if (typeof window !== 'undefined') {
    window.debugInfo = debugInfo;
    window.clearAllData = clearAllData;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
}

/**
 * Función de debug para verificar el estado de la aplicación
 * Puede ser llamada desde la consola del navegador
 */
window.debugTrivial = function() {
    console.log('🔍 Estado de la aplicación Trivial:');
    console.log('================================');
    
    // Verificar módulos cargados
    console.log('📦 Contenedores de módulos:');
    const modules = ['menu-module', 'game-module', 'modals-module'];
    modules.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? '✅ Encontrado' : '❌ No encontrado'}`);
        if (element) {
            console.log(`    - Contenido: ${element.innerHTML.length} caracteres`);
        }
    });
      // Verificar elementos críticos del menú
    console.log('\n🎯 Elementos críticos del menú:');
    const criticalElements = [        'menu-screen',
        'start-game-btn',
        'settings-btn',
        'tutorial-btn',
        'continue-game-btn',
        'game-board' // Canvas del juego
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? '✅ Encontrado' : '❌ No encontrado'}`);
        if (element) {
            console.log(`    - Visible: ${getComputedStyle(element).display !== 'none'}`);
            console.log(`    - Listeners: ${element._listeners ? Object.keys(element._listeners).length : 'Desconocido'}`);
        }
    });
    
    // Verificar instancias globales
    console.log('\n🌍 Instancias globales:');
    console.log(`  gameEngine: ${window.gameEngine ? '✅ Disponible' : '❌ No disponible'}`);
    console.log(`  menuUI: ${window.menuUI ? '✅ Disponible' : '❌ No disponible'}`);
    console.log(`  gameUI: ${window.gameUI ? '✅ Disponible' : '❌ No disponible'}`);
    
    // Verificar errores en consola
    console.log('\n📊 Resumen:');
    const totalElements = criticalElements.length;
    const foundElements = criticalElements.filter(id => document.getElementById(id)).length;
    console.log(`  Elementos encontrados: ${foundElements}/${totalElements}`);
    console.log(`  Aplicación inicializada: ${window.gameEngine ? 'Sí' : 'No'}`);
    
    return {
        modulesLoaded: modules.every(id => document.getElementById(id)),
        elementsFound: foundElements,
        totalElements: totalElements,
        appInitialized: !!window.gameEngine
    };
};

// Manejar errores de CSS no críticos
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que los estilos se hayan cargado
    setTimeout(() => {
        const testElement = document.createElement('div');
        testElement.className = 'btn btn-primary';
        testElement.style.position = 'absolute';
        testElement.style.visibility = 'hidden';
        testElement.style.top = '-9999px';
        document.body.appendChild(testElement);
        
        const styles = window.getComputedStyle(testElement);
        const hasBackground = styles.background && styles.background !== 'none' && 
                            styles.background !== 'rgba(0, 0, 0, 0)' && 
                            styles.background !== 'transparent';
        const hasPadding = styles.padding && styles.padding !== '0px';
        
        if (!hasBackground && !hasPadding) {
            console.warn('Los estilos CSS pueden no haberse cargado correctamente');
            // Solo mostrar notificación en desarrollo, no en producción
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                showNotification('Los estilos pueden no haberse cargado completamente. Recarga la página si algo se ve mal.', 'warning');
            }
        } else {
            console.log('Estilos CSS cargados correctamente');
        }
        
        document.body.removeChild(testElement);
    }, 1000);
});

console.log('Archivo main.js cargado correctamente');
