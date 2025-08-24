/**
 * Gestor de transiciones del menú principal
 * Maneja las animaciones de entrada cuando la aplicación está lista
 */

class MenuTransitionManager {
    constructor() {
        this.isInitialized = false;
        this.menuContainer = null;
        this.gameTitle = null;
        this.menuOptions = null;
        
        this.init();
    }
    
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }
    
    setupElements() {
        // Intentar obtener elementos con reintentos más agresivos
        const checkElements = (attempt = 1, maxAttempts = 20) => {
            this.menuContainer = document.querySelector('.menu-container');
            this.gameTitle = document.querySelector('.game-title');
            this.menuOptions = document.querySelector('.menu-options');
            
            if (this.menuContainer && this.gameTitle && this.menuOptions) {
                this.setupInitialState();
                return;
            }
            
            if (attempt < maxAttempts) {
                // Reintentar cada 200ms hasta 20 intentos (4 segundos total)
                setTimeout(() => checkElements(attempt + 1, maxAttempts), 200);
            } else {
                console.error('❌ No se pudieron encontrar todos los elementos del menú después de', maxAttempts, 'intentos');
                console.log('🔍 Elementos encontrados:', {
                    menuContainer: !!this.menuContainer,
                    gameTitle: !!this.gameTitle,
                    menuOptions: !!this.menuOptions
                });
            }
        };
        
        checkElements();
    }
    
    setupInitialState() {
        // Establecer estado inicial: solo título visible, botones ocultos
        if (this.menuContainer) {
            this.menuContainer.classList.add('initializing');
        }
        
        if (this.gameTitle) {
            this.gameTitle.classList.add('centered');
        }
        
        if (this.menuOptions) {
            this.menuOptions.classList.add('hidden');
        }
    }
    
    // Método público para forzar configuración del estado inicial
    forceSetupInitialState() {
        // Re-buscar elementos por si se perdieron las referencias
        this.menuContainer = document.querySelector('.menu-container');
        this.gameTitle = document.querySelector('.game-title');
        this.menuOptions = document.querySelector('.menu-options');
        
        if (this.menuContainer && this.gameTitle && this.menuOptions) {
            this.setupInitialState();
            return true;
        } else {
            return false;
        }
    }
    
    // Método para activar las transiciones cuando la app esté lista
    activateTransitions() {
        if (this.isInitialized) return;
        
        // Re-verificar elementos por si se perdieron las referencias
        if (!this.gameTitle || !this.menuOptions || !this.menuContainer) {
            this.menuContainer = document.querySelector('.menu-container');
            this.gameTitle = document.querySelector('.game-title');
            this.menuOptions = document.querySelector('.menu-options');
        }
        
        if (!this.gameTitle || !this.menuOptions) {
            console.error('❌ No se pueden activar transiciones: elementos no encontrados');
            console.log('🔍 Estado actual:', {
                menuContainer: !!this.menuContainer,
                gameTitle: !!this.gameTitle,
                menuOptions: !!this.menuOptions
            });
            return;
        }
        
        this.isInitialized = true;
        
        // Remover estado de inicialización
        if (this.menuContainer) {
            this.menuContainer.classList.remove('initializing');
            this.menuContainer.classList.add('ready');
        }
        
        // Transición del título - SIMPLE: solo cambiar las clases
        
        // Cambio directo y simple
        this.gameTitle.classList.remove('centered');
        this.gameTitle.classList.add('positioned');
        
        // Mostrar botones con animación
        if (this.menuOptions) {
            this.menuOptions.classList.remove('hidden');
            this.menuOptions.classList.add('visible');
        }

        setTimeout(() => {
            this.menuOptions.style.overflow = 'auto';
        }, 1000); // Asegurar que el overflow se aplique después de la animación
        
        // Disparar evento de menú listo
        document.dispatchEvent(new CustomEvent('menuTransitionComplete'));
    }
    
    // Método para forzar activar transiciones (fallback)
    forceActivate() {
        if (!this.isInitialized) {
            this.activateTransitions();
        }
    }
}

// Inicializar el gestor de transiciones DESPUÉS de que los módulos estén cargados
document.addEventListener('modulesReady', () => {
    window.menuTransitionManager = new MenuTransitionManager();
    
    // Fallback: forzar activación si toma demasiado tiempo
    setTimeout(() => {
        if (window.menuTransitionManager && !window.menuTransitionManager.isInitialized) {
            window.menuTransitionManager.forceActivate();
        }
    }, 5000);
});

// Fallback para casos donde no se usen módulos dinámicos
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si no se ha inicializado ya con modulesReady
    setTimeout(() => {
        if (!window.menuTransitionManager) {
            window.menuTransitionManager = new MenuTransitionManager();
        }
    }, 1000);
});
