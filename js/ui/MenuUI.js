/**
 * Clase para manejar la interfaz de usuario de los menús
 */
class MenuUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentScreen = 'menu';
        this.tutorialStep = 1;
        this.maxTutorialSteps = 3;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateContinueButton();
    }    /**
     * Inicializa las referencias a elementos del DOM
     */
    initializeElements() {          // Pantallas
        this.screens = {
            menu: document.getElementById('menu-screen'),
            config: document.getElementById('config-screen'),
            settings: document.getElementById('settings-screen'),
            tutorial: document.getElementById('tutorial-screen'),
            game: document.getElementById('game-screen')
        };        // Botones del menú principal
        this.menuButtons = {
            startGame: document.getElementById('start-game-btn'),
            continueGame: document.getElementById('continue-game-btn'),
            settings: document.getElementById('settings-btn'),
            tutorial: document.getElementById('tutorial-btn')
        };

        // Verificar que todos los elementos críticos estén disponibles
        if (!this.screens.menu || !this.menuButtons.startGame) {
            console.error('❌ Elementos críticos del menú no encontrados en el DOM');
            console.log('Elementos encontrados:', {
                menu: !!this.screens.menu,
                startGame: !!this.menuButtons.startGame,
                settings: !!this.menuButtons.settings,
                tutorial: !!this.menuButtons.tutorial
            });
            throw new Error('Elementos del menú no disponibles');
        }

        // Elementos de configuración
        this.configElements = {
            playerCount: document.getElementById('player-count'),
            difficulty: document.getElementById('difficulty'),
            timer: document.getElementById('timer'),
            soundEnabled: document.getElementById('sound-enabled'),
            translationEnabled: document.getElementById('translation-enabled'),
            backBtn: document.getElementById('config-back-btn'),
            saveBtn: document.getElementById('config-save-btn')
        };

        // Elementos de configuración general
        this.settingsElements = {
            playerCount: document.getElementById('settings-player-count'),
            difficulty: document.getElementById('settings-difficulty'),
            timer: document.getElementById('settings-timer'),
            soundEnabled: document.getElementById('settings-sound-enabled'),
            translationEnabled: document.getElementById('settings-translation-enabled'),
            backBtn: document.getElementById('settings-back-btn'),
            saveBtn: document.getElementById('settings-save-btn')
        };

        // Elementos del tutorial
        this.tutorialElements = {
            steps: document.querySelectorAll('.tutorial-step'),
            prevBtn: document.getElementById('tutorial-prev-btn'),
            nextBtn: document.getElementById('tutorial-next-btn'),
            closeBtn: document.getElementById('tutorial-close-btn'),            
            progress: document.getElementById('tutorial-progress')
        };
    }    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Verificar que los elementos existen antes de añadir listeners
        if (!this.menuButtons.startGame) {
            console.error('❌ No se pueden configurar event listeners - elementos no disponibles');
            return;
        }

        // Menú principal - usando event listeners optimizados para móviles
        this.addMobileOptimizedListener(this.menuButtons.startGame, () => {
            // Verificar si el botón está deshabilitado
            if (this.menuButtons.startGame.disabled) {
                console.log('🚫 Botón Multijugador deshabilitado');
                return;
            }
            
            // Track clic en botón de inicio
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackButtonClick('start-game-btn', 'Comenzar Juego', 'main-menu');
            }
            this.showConfigScreen();
        });
        
        this.addMobileOptimizedListener(this.menuButtons.continueGame, () => {
            // Verificar si el botón está deshabilitado
            if (this.menuButtons.continueGame.disabled) {
                console.log('🚫 Botón Continuar Partida deshabilitado');
                return;
            }
            
            // Track clic en continuar juego
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackButtonClick('continue-game-btn', 'Continuar Juego', 'main-menu');
            }
            this.continueGame();
        });
        
        this.addMobileOptimizedListener(this.menuButtons.settings, () => {
            // Track apertura de configuración
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackSettingsOpen('main-menu');
                window.trivialAnalytics.trackButtonClick('settings-btn', 'Configuración', 'main-menu');
            }
            this.showSettingsScreen();
        });
        
        this.addMobileOptimizedListener(this.menuButtons.tutorial, () => {
            // Verificar si el botón está deshabilitado
            if (this.menuButtons.tutorial.disabled) {
                console.log('🚫 Botón Tutorial deshabilitado');
                return;
            }
            
            // Track inicio de tutorial
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackTutorialStart('game-basics', 'menu');
                window.trivialAnalytics.trackButtonClick('tutorial-btn', 'Tutorial', 'main-menu');
            }
            this.showTutorialScreen();
        });

        // Configuración - usando event listeners optimizados
        if (this.configElements.backBtn && this.configElements.saveBtn) {
            this.addMobileOptimizedListener(this.configElements.backBtn, () => {
                // Track navegación hacia atrás
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackBackButton('game-config', 'button');
                    window.trivialAnalytics.trackMenuNavigation('game-config', 'main-menu', 'back_button');
                }
                this.showMenuScreen();
            });
            
            this.addMobileOptimizedListener(this.configElements.saveBtn, () => {
                // Track guardado de configuración
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackButtonClick('save-config-btn', 'Guardar Configuración', 'game-config');
                }
                this.saveConfiguration();
            });
        }

        // Configuración general - usando event listeners optimizados
        if (this.settingsElements.backBtn && this.settingsElements.saveBtn) {
            this.addMobileOptimizedListener(this.settingsElements.backBtn, () => {
                // Track salida de configuración
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackBackButton('settings', 'button');
                    window.trivialAnalytics.trackMenuNavigation('settings', 'main-menu', 'back_button');
                }
                this.showMenuScreen();
            });
            
            this.addMobileOptimizedListener(this.settingsElements.saveBtn, () => {
                // Track guardado de configuración general
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackButtonClick('save-settings-btn', 'Guardar Configuración', 'settings');
                }
                this.saveSettings();
            });
        }

        // Tutorial - usando event listeners optimizados
        if (this.tutorialElements.prevBtn && this.tutorialElements.nextBtn && this.tutorialElements.closeBtn) {
            this.addMobileOptimizedListener(this.tutorialElements.prevBtn, () => {
                // Track navegación en tutorial
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackButtonClick('tutorial-prev', 'Anterior', 'tutorial');
                }
                this.previousTutorialStep();
            });
            
            this.addMobileOptimizedListener(this.tutorialElements.nextBtn, () => {
                // Track avance en tutorial
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackButtonClick('tutorial-next', 'Siguiente', 'tutorial');
                }
                this.nextTutorialStep();
            });
            
            this.addMobileOptimizedListener(this.tutorialElements.closeBtn, () => {
                // Track cierre de tutorial
                if (window.trivialAnalytics) {
                    window.trivialAnalytics.trackButtonClick('tutorial-close', 'Cerrar', 'tutorial');
                    window.trivialAnalytics.trackMenuNavigation('tutorial', 'main-menu', 'close_button');
                }
                this.showMenuScreen();
            });
        }
        // Escuchar cambios en configuración
        Object.values(this.configElements).forEach(element => {
            if (element && (element.tagName === 'SELECT' || element.tagName === 'INPUT')) {
                element.addEventListener('change', () => this.updateConfigPreview());
            }
        });

        // Escuchar cambios en configuración general
        Object.values(this.settingsElements).forEach(element => {
            if (element && (element.tagName === 'SELECT' || element.tagName === 'INPUT')) {
                element.addEventListener('change', () => this.updateSettingsPreview());
            }
        });
        
        console.log('✅ Event listeners del menú configurados correctamente');
    }

    /**
     * Muestra una pantalla específica
     */
    showScreen(screenName) {
        // Ocultar todas las pantallas
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // Mostrar la pantalla solicitada
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
            
            // Agregar clases de animación
            this.screens[screenName].classList.add('entering');
            setTimeout(() => {
                this.screens[screenName].classList.remove('entering');
            }, 500);
        }
    }

    /**
     * Muestra el menú principal
     */
    showMenuScreen() {
        this.showScreen('menu');
        this.updateContinueButton();
    }    /**
     * Muestra la pantalla de configuración
     */
    showConfigScreen() {
        // Track apertura del modal de configuración
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackModalOpen('game-config', 'navigation', 'main-menu');
            window.trivialAnalytics.trackFormStart('game-config-form', 'game_setup');
        }
        
        this.showScreen('config');
        this.loadConfiguration();
    }

    /**
     * Muestra la pantalla de configuración general
     */
    showSettingsScreen() {
        // Track apertura del modal de configuración general
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackModalOpen('settings', 'navigation', 'main-menu');
        }
        
        this.showScreen('settings');
        this.loadSettings();
    }

    /**
     * Muestra la pantalla del tutorial
     */
    showTutorialScreen() {
        // Track apertura del tutorial
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackModalOpen('tutorial', 'navigation', 'main-menu');
        }
        
        this.showScreen('tutorial');
        this.tutorialStep = 1;
        this.updateTutorialDisplay();
    }

    /**
     * Muestra la pantalla de juego
     */
    showGameScreen() {
        this.showScreen('game');
    }

    /**
     * Inicia un nuevo juego
     */
    async startNewGame() {
        try {
            // Mostrar indicador de carga
            this.showLoadingIndicator('Iniciando nuevo juego...');

            // Obtener configuración actual
            const config = this.getCurrentConfig();

            // Iniciar juego
            const success = await this.gameEngine.startNewGame(config);

            if (success) {
                this.showGameScreen();
                this.hideLoadingIndicator();
            } else {
                throw new Error('No se pudo iniciar el juego');
            }
        } catch (error) {
            console.error('Error al iniciar nuevo juego:', error);
            this.hideLoadingIndicator();
            this.showError('Error al iniciar el juego. Por favor, inténtalo de nuevo.');
        }
    }

    /**
     * Continúa un juego guardado
     */
    async continueGame() {
        try {
            this.showLoadingIndicator('Cargando juego guardado...');

            const success = await this.gameEngine.continueGame();

            if (success) {
                this.showGameScreen();
                this.hideLoadingIndicator();
            } else {
                throw new Error('No se pudo cargar el juego guardado');
            }
        } catch (error) {
            console.error('Error al continuar juego:', error);
            this.hideLoadingIndicator();
            this.showError('No se pudo cargar el juego guardado.');
        }
    }    /**
     * Carga la configuración actual en los elementos
     */
    loadConfiguration() {
        const config = this.gameEngine.config;        this.configElements.playerCount.value = config.playerCount || 4;
        this.configElements.difficulty.value = config.difficulty || 'medium';
        this.configElements.timer.value = config.timer !== undefined ? config.timer : 30;
        this.configElements.soundEnabled.checked = config.soundEnabled !== false;
        this.configElements.translationEnabled.checked = config.translationEnabled !== false;
    }

    /**
     * Obtiene la configuración actual de los elementos
     */    getCurrentConfig() {
        return {
            playerCount: parseInt(this.configElements.playerCount.value),
            difficulty: this.configElements.difficulty.value,
            timer: parseInt(this.configElements.timer.value),
            soundEnabled: this.configElements.soundEnabled.checked,
            translationEnabled: this.configElements.translationEnabled.checked
        };
    }    /**
     * Guarda la configuración e inicia el juego multijugador
     */
    async saveConfiguration() {
        try {
            const config = this.getCurrentConfig();
            
            // Track envío del formulario de configuración
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackFormSubmit('game-config-form', 'game_setup', true, 0);
                
                // Track cada configuración específica
                window.trivialAnalytics.trackSettingChange('player_count', config.playerCount, this.gameEngine.config.playerCount, 'game');
                window.trivialAnalytics.trackSettingChange('difficulty', config.difficulty, this.gameEngine.config.difficulty, 'game');
                window.trivialAnalytics.trackSettingChange('timer', config.timer, this.gameEngine.config.timer, 'game');
                window.trivialAnalytics.trackSettingChange('sound_enabled', config.soundEnabled, this.gameEngine.config.soundEnabled, 'audio');
                window.trivialAnalytics.trackSettingChange('translation_enabled', config.translationEnabled, this.gameEngine.config.translationEnabled, 'accessibility');
            }
            
            this.gameEngine.updateConfig(config);
            
            // Mostrar indicador de carga
            this.showLoadingIndicator('Iniciando juego multijugador...');

            // Iniciar el juego con la nueva configuración
            const success = await this.gameEngine.startNewGame(config);

            if (success) {
                this.showGameScreen();
                this.hideLoadingIndicator();
                this.showSuccess('¡Juego multijugador iniciado!');
            } else {
                throw new Error('No se pudo iniciar el juego multijugador');
            }
        } catch (error) {
            console.error('Error al iniciar juego multijugador:', error);
            
            // Track error en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackError('GAME_CONFIG_ERROR', error.message);
                window.trivialAnalytics.trackFormError('game-config-form', 'general', 'startup_error', error.message);
            }
            
            this.hideLoadingIndicator();
            this.showError('Error al iniciar el juego multijugador. Por favor, inténtalo de nuevo.');
        }
    }

    /**
     * Carga la configuración general en los elementos
     */
    loadSettings() {
        const config = this.gameEngine.config;
        
        this.settingsElements.playerCount.value = config.playerCount || 4;
        this.settingsElements.difficulty.value = config.difficulty || 'medium';
        this.settingsElements.timer.value = config.timer !== undefined ? config.timer : 30;
        this.settingsElements.soundEnabled.checked = config.soundEnabled !== false;
        this.settingsElements.translationEnabled.checked = config.translationEnabled !== false;
    }

    /**
     * Obtiene la configuración general actual de los elementos
     */
    getCurrentSettings() {
        return {
            playerCount: parseInt(this.settingsElements.playerCount.value),
            difficulty: this.settingsElements.difficulty.value,
            timer: parseInt(this.settingsElements.timer.value),
            soundEnabled: this.settingsElements.soundEnabled.checked,
            translationEnabled: this.settingsElements.translationEnabled.checked
        };
    }

    /**
     * Guarda la configuración general sin iniciar juego
     */
    saveSettings() {
        try {
            const config = this.getCurrentSettings();
            this.gameEngine.updateConfig(config);
            
            this.showSuccess('Configuración guardada correctamente');
            
            // Volver al menú principal
            this.showMenuScreen();
        } catch (error) {
            console.error('Error al guardar configuración general:', error);
            this.showError('Error al guardar la configuración general');
        }
    }

    /**
     * Actualiza la vista previa de configuración general
     */
    updateSettingsPreview() {
        const config = this.getCurrentSettings();        
        console.log('Configuración general actualizada:', config);
    }

    /**
     * Actualiza la vista previa de configuración
     */
    updateConfigPreview() {
        const config = this.getCurrentConfig();
        
        // Aquí podrías mostrar una vista previa de cómo afectará la configuración
        console.log('Configuración actualizada:', config);
    }    /**
     * Actualiza el botón de continuar juego
     */
    updateContinueButton() {
        const hasSavedGame = this.gameEngine.hasSavedGame();
        
        if (hasSavedGame) {
            this.menuButtons.continueGame.style.display = 'block';
            
            // Usar el sistema de animación de scroll correctamente
            this.menuButtons.continueGame.classList.add('animate-on-scroll');
            
            // Verificar si el elemento está en vista y añadir la clase visible
            setTimeout(() => {
                if (window.addScrollAnimation) {
                    window.addScrollAnimation(this.menuButtons.continueGame);
                }
                // Añadir visible inmediatamente ya que el botón está en el viewport
                this.menuButtons.continueGame.classList.add('visible');
            }, 100);
        } else {
            this.menuButtons.continueGame.style.display = 'none';
            this.menuButtons.continueGame.classList.remove('animate-on-scroll', 'visible');
        }
    }

    /**
     * Avanza al siguiente paso del tutorial
     */
    nextTutorialStep() {
        if (this.tutorialStep < this.maxTutorialSteps) {
            this.tutorialStep++;
            this.updateTutorialDisplay();
        } else {
            this.showMenuScreen();
        }
    }

    /**
     * Retrocede al paso anterior del tutorial
     */
    previousTutorialStep() {
        if (this.tutorialStep > 1) {
            this.tutorialStep--;
            this.updateTutorialDisplay();
        }
    }

    /**
     * Actualiza la visualización del tutorial
     */
    updateTutorialDisplay() {
        // Ocultar todos los pasos
        this.tutorialElements.steps.forEach(step => {
            step.classList.remove('active');
        });

        // Mostrar el paso actual
        const currentStep = document.getElementById(`tutorial-step-${this.tutorialStep}`);
        if (currentStep) {
            currentStep.classList.add('active');
        }

        // Actualizar botones
        this.tutorialElements.prevBtn.disabled = this.tutorialStep === 1;
        
        if (this.tutorialStep === this.maxTutorialSteps) {
            this.tutorialElements.nextBtn.textContent = 'Empezar a Jugar';
        } else {
            this.tutorialElements.nextBtn.textContent = 'Siguiente';
        }

        // Actualizar progreso
        this.tutorialElements.progress.textContent = `${this.tutorialStep} / ${this.maxTutorialSteps}`;
    }

    /**
     * Muestra un indicador de carga
     */
    showLoadingIndicator(message = 'Cargando...') {
        // Crear o mostrar indicador de carga
        let loader = document.getElementById('loading-indicator');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-indicator';
            loader.className = 'loading-indicator';
            loader.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loading-message').textContent = message;
        }
        
        loader.style.display = 'flex';
        loader.classList.add('active');
    }

    /**
     * Oculta el indicador de carga
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.classList.remove('active');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Muestra un mensaje de éxito
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Muestra una notificación
     */
    showNotification(message, type = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Agregar al DOM
        document.body.appendChild(notification);

        // Mostrar notificación
        setTimeout(() => {
            notification.classList.add('active');
        }, 100);

        // Configurar cierre automático
        const autoClose = setTimeout(() => {
            this.closeNotification(notification);
        }, 5000);

        // Configurar cierre manual
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoClose);
            this.closeNotification(notification);
        });
    }

    /**
     * Cierra una notificación
     */
    closeNotification(notification) {
        notification.classList.remove('active');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Obtiene estadísticas para mostrar
     */
    getDisplayStats() {
        const stats = this.gameEngine.getGameStats();
        
        if (!stats) {
            return {
                gamesPlayed: 0,
                winRate: 0,
                averageTime: 0,
                totalQuestions: 0,
                accuracy: 0
            };
        }

        return {
            gamesPlayed: stats.gamesPlayed || 0,
            winRate: stats.gamesPlayed > 0 ? 
                Math.round((stats.gamesWon || 0) / stats.gamesPlayed * 100) : 0,
            averageTime: Math.round(stats.averageGameTime / 60) || 0, // en minutos
            totalQuestions: stats.totalQuestions || 0,
            accuracy: stats.totalQuestions > 0 ? 
                Math.round((stats.correctAnswers || 0) / stats.totalQuestions * 100) : 0
        };
    }

    /**
     * Actualiza la visualización de estadísticas en el menú
     */
    updateStatsDisplay() {
        const stats = this.getDisplayStats();
        
        // Si existe un elemento de estadísticas en el menú, actualizarlo
        const statsElement = document.getElementById('menu-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Partidas jugadas:</span>
                    <span class="stat-value">${stats.gamesPlayed}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tasa de victoria:</span>
                    <span class="stat-value">${stats.winRate}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tiempo promedio:</span>
                    <span class="stat-value">${stats.averageTime} min</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Precisión:</span>
                    <span class="stat-value">${stats.accuracy}%</span>
                </div>
            `;
        }
    }

    /**
     * Maneja el redimensionamiento de la ventana
     */
    handleResize() {
        // Ajustar elementos según el tamaño de la ventana
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            document.body.classList.add('mobile-layout');
        } else {
            document.body.classList.remove('mobile-layout');
        }
    }

    /**
     * Inicializa los event listeners globales
     */
    initializeGlobalListeners() {
        // Redimensionamiento
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();

        // Navegación con teclado
        document.addEventListener('keydown', (event) => {
            if (this.currentScreen === 'tutorial') {
                if (event.key === 'ArrowLeft') {
                    this.previousTutorialStep();
                } else if (event.key === 'ArrowRight') {
                    this.nextTutorialStep();
                }
            }
        });

        // Actualizar estadísticas cuando se muestre el menú
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentScreen === 'menu') {
                this.updateStatsDisplay();
                this.updateContinueButton();
            }
        });
    }

    /**
     * Destruye la instancia y limpia event listeners
     */
    destroy() {
        // Remover event listeners específicos si es necesario
        // Limpiar notificaciones activas
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.closeNotification(notification);
        });

        // Ocultar indicador de carga
        this.hideLoadingIndicator();    }

    /**
     * Añade event listener simple sin optimizaciones
     * @param {Element} element - Elemento DOM
     * @param {Function} callback - Función callback
     */
    addMobileOptimizedListener(element, callback) {
        if (!element) return;
        
        // Touch events - ejecutar siempre
        element.addEventListener('touchstart', (e) => {
            element.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            element.classList.remove('touch-active');
            // Ejecutar siempre sin condiciones
            callback();
        });
        
        // Click events - ejecutar siempre
        element.addEventListener('click', (e) => {
            callback();
        });
    }
}