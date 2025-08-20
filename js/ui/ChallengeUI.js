/**
 * Interfaz de Usuario para el Modo Desafío
 * Maneja toda la interacción visual del modo desafío
 */
class ChallengeUI {    constructor() {
        this.challengeEngine = null;
        this.currentScreen = null;
        this.elements = {};
        this.animations = {
            questionTimer: null,
            scoreAnimation: null
        };        // Estado para manejar idioma original/traducido
        this.questionDisplay = {
            showingOriginal: false,
            originalQuestion: null,
            translatedQuestion: null,
            originalAnswers: null,
            translatedAnswers: null
        };
        
        // Control del estado del juego
        this.gameEnded = false; // Bandera para indicar si el juego ha terminado
        this.pendingTimeouts = new Set(); // Para rastrear timeouts pendientes
    }

    /**
     * Inicializa la UI del modo desafío
     * @param {ChallengeEngine} challengeEngine - Motor del desafío
     */    initialize(challengeEngine) {
        console.log('🎨 Inicializando UI del Modo Desafío...');
        
        this.challengeEngine = challengeEngine;
        this.cacheElements();
        this.bindEvents();
        this.setupEventListeners();
        
        // Optimizar para móviles si es necesario
        this.optimizeForMobile();

        console.log('✅ UI del Modo Desafío inicializada');
    }

    /**
     * Cachea los elementos DOM necesarios
     */
    cacheElements() {
        // Elementos del menú de configuración
        this.elements.challengeConfigScreen = document.getElementById('challenge-config-screen');
        this.elements.challengeBackBtn = document.getElementById('challenge-back-btn');
        this.elements.challengeStartBtn = document.getElementById('challenge-start-btn');
        
        // Elementos de configuración
        this.elements.challengeDifficulty = document.getElementById('challenge-difficulty');
        this.elements.challengeTimer = document.getElementById('challenge-timer');
        this.elements.challengeQuestionType = document.getElementById('challenge-question-type');
        
        // Checkboxes de categorías principales
        this.elements.categoriesCheckboxes = {
            // Categorías principales
            'historia': document.getElementById('challenge-historia'),
            'ciencia': document.getElementById('challenge-ciencia'),
            'deportes': document.getElementById('challenge-deportes'),
            'arte': document.getElementById('challenge-arte'),
            'geografia': document.getElementById('challenge-geografia'),
            'entretenimiento': document.getElementById('challenge-entretenimiento'),
            
            // Categorías adicionales - Entretenimiento
            'conocimiento-general': document.getElementById('challenge-conocimiento-general'),
            'libros': document.getElementById('challenge-libros'),
            'musica': document.getElementById('challenge-musica'),
            'television': document.getElementById('challenge-television'),
            'videojuegos': document.getElementById('challenge-videojuegos'),
            'comics': document.getElementById('challenge-comics'),
            'anime-manga': document.getElementById('challenge-anime-manga'),
            'animacion': document.getElementById('challenge-animacion'),
            'musicales-teatro': document.getElementById('challenge-musicales-teatro'),
            'juegos-mesa': document.getElementById('challenge-juegos-mesa'),
            
            // Categorías adicionales - Ciencia y Tecnología
            'informatica': document.getElementById('challenge-informatica'),
            'matematicas': document.getElementById('challenge-matematicas'),
            'gadgets': document.getElementById('challenge-gadgets'),
            
            // Categorías adicionales - Cultura
            'mitologia': document.getElementById('challenge-mitologia'),
            'politica': document.getElementById('challenge-politica'),
            
            // Categorías adicionales - Ocio
            'celebridades': document.getElementById('challenge-celebridades'),
            'animales': document.getElementById('challenge-animales'),
            'vehiculos': document.getElementById('challenge-vehiculos')
        };

        // Elementos de control de categorías
        this.elements.additionalCategoriesToggle = document.getElementById('additional-categories-toggle');
        this.elements.additionalCategories = document.getElementById('additional-categories');
        this.elements.selectAllCategoriesBtn = document.getElementById('select-all-categories');
        this.elements.deselectAllCategoriesBtn = document.getElementById('deselect-all-categories');
        this.elements.selectMainCategoriesBtn = document.getElementById('select-main-categories');

        // Otros elementos importantes
        this.elements.menuScreen = document.getElementById('menu-screen');
        this.elements.challengeModeBtn = document.getElementById('challenge-mode-btn');
    }

    /**
     * Vincula los eventos de los elementos
     */
    bindEvents() {        
        // Eventos del menú - usando event listeners optimizados para móviles
        if (this.elements.challengeModeBtn) {
            this.addMobileOptimizedListener(this.elements.challengeModeBtn, () => this.showChallengeConfig());
        }

        if (this.elements.challengeBackBtn) {
            this.addMobileOptimizedListener(this.elements.challengeBackBtn, () => this.showMainMenu());
        }        

        if (this.elements.challengeStartBtn) {
            this.addMobileOptimizedListener(this.elements.challengeStartBtn, () => this.startChallengeFromConfig());
        }

        // Event listener para el selector de dificultad
        if (this.elements.challengeDifficulty) {
            this.elements.challengeDifficulty.addEventListener('change', (e) => this.onDifficultyChange(e));
        }

        // Event listener para el selector de tipo de pregunta
        if (this.elements.challengeQuestionType) {
            this.elements.challengeQuestionType.addEventListener('change', (e) => this.onQuestionTypeChange(e));
        }

        // Event listeners para categorías adicionales - usando simple click para evitar problemas
        if (this.elements.additionalCategoriesToggle) {
            this.addSimpleClickListener(this.elements.additionalCategoriesToggle, () => this.toggleAdditionalCategories());
        }

        if (this.elements.selectAllCategoriesBtn) {
            this.addMobileOptimizedListener(this.elements.selectAllCategoriesBtn, () => this.selectAllCategories());
        }

        if (this.elements.deselectAllCategoriesBtn) {
            this.addMobileOptimizedListener(this.elements.deselectAllCategoriesBtn, () => this.deselectAllCategories());
        }

        if (this.elements.selectMainCategoriesBtn) {
            this.addMobileOptimizedListener(this.elements.selectMainCategoriesBtn, () => this.selectMainCategories());
        }
    }    /**
     * Configura los listeners de eventos del motor de desafío
     */
    setupEventListeners() {
        document.addEventListener('challengeStarted', (e) => this.onChallengeStarted(e.detail));
        document.addEventListener('newChallengeQuestion', (e) => this.onNewQuestion(e.detail));
        document.addEventListener('challengeAnswerProcessed', (e) => this.onAnswerProcessed(e.detail));
        document.addEventListener('challengeTimerUpdate', (e) => this.onTimerUpdate(e.detail));
        document.addEventListener('challengeTimeOut', (e) => this.onTimeOut(e.detail));
        document.addEventListener('challengeEnded', (e) => this.onChallengeEnded(e.detail));
        document.addEventListener('challengeError', (e) => this.onChallengeError(e.detail));
        document.addEventListener('challengePaused', (e) => this.onChallengePaused(e.detail));
        document.addEventListener('challengeResumed', (e) => this.onChallengeResumed(e.detail));
        document.addEventListener('challengeInactivityWarning', (e) => this.onInactivityWarning(e.detail));
        document.addEventListener('challengeInactivityResolved', (e) => this.onInactivityResolved(e.detail));
        // Comentado: El juego ahora continúa después de respuestas incorrectas
        // document.addEventListener('survivalGameOver', (e) => this.onSurvivalGameOver(e.detail));
    }

    /**
     * Muestra la pantalla de configuración del desafío
     */
    showChallengeConfig() {
        console.log('📋 Mostrando configuración del desafío');
        
        this.hideAllScreens();
        this.elements.challengeConfigScreen.classList.add('active');
        this.currentScreen = 'challenge-config';

        // Cargar configuración guardada si existe
        this.loadSavedConfig();
        
        // Inicializar estado de categorías adicionales
        this.initializeCategoryControls();
    }

    /**
     * Inicializa los controles de categorías adicionales
     */
    initializeCategoryControls() {
        
        // Restaurar texto del toggle
        if (this.elements.additionalCategoriesToggle) {
            const toggleSpan = this.elements.additionalCategoriesToggle.querySelector('span');
            if (toggleSpan) {
                toggleSpan.textContent = '▼ Mostrar categorías adicionales';
            }
        }
        
        // Mostrar estadísticas iniciales
        setTimeout(() => {
            this.showCategoryStats();
        }, 100);
    }

    /**
     * Muestra el menú principal
     */
    showMainMenu() {
        console.log('🏠 Volviendo al menú principal');
        
        this.hideAllScreens();
        this.elements.menuScreen.classList.add('active');
        this.currentScreen = 'menu';
    }

    /**
     * Oculta todas las pantallas
     */
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }    /**
     * Inicia el desafío desde la configuración
     */
    async startChallengeFromConfig() {
        console.log('🚀 Iniciando desafío desde configuración...');

        // Mostrar indicador de carga en el botón
        this.showButtonLoading(true);

        try {
            // Recoger configuración del formulario
            const config = this.collectConfigFromForm();

            // Validar configuración
            if (!this.validateConfig(config)) {
                this.showButtonLoading(false);
                return;
            }

            // Guardar configuración
            this.saveConfig(config);

            // Inicializar y comenzar desafío
            if (this.challengeEngine.initialize(config)) {
                await this.challengeEngine.startChallenge();
            } else {
                this.showButtonLoading(false);
            }
        } catch (error) {
            console.error('❌ Error al iniciar el desafío:', error);
            this.showButtonLoading(false);
            this.showError('Error al iniciar el desafío. Inténtalo de nuevo.');
        }
    }



    /**
     * Recopila la configuración del formulario
     */
    collectConfigFromForm() {
        const config = {
            difficulty: this.elements.challengeDifficulty.value,
            timer: parseInt(this.elements.challengeTimer.value),
            questionType: this.elements.challengeQuestionType ? this.elements.challengeQuestionType.value : 'multiple',
            categories: {}
        };

        // Recoger categorías seleccionadas
        Object.keys(this.elements.categoriesCheckboxes).forEach(category => {
            const checkbox = this.elements.categoriesCheckboxes[category];
            config.categories[category] = checkbox ? checkbox.checked : false;
        });

        return config;
    }

    /**
     * Valida la configuración antes de iniciar
     */
    validateConfig(config) {
        // Usar el método de validación mejorado
        if (!this.validateCategorySelection()) {
            return false;
        }

        // Verificar configuración adicional
        if (!config.difficulty || !config.timer && config.timer !== 0) {
            this.showError('⚠️ Configuración incompleta. Verifica la dificultad y el tiempo.');
            return false;
        }

        // Verificar tipo de pregunta
        if (!config.questionType) {
            config.questionType = 'multiple'; // Valor por defecto
        }

        // Mostrar estadísticas de categorías seleccionadas
        this.showCategoryStats();

        return true;
    }

    /**
     * Guarda la configuración en localStorage
     */
    saveConfig(config) {
        try {
            localStorage.setItem('trivial-challenge-config', JSON.stringify(config));
            console.log('💾 Configuración del desafío guardada');
        } catch (error) {
            console.warn('⚠️ No se pudo guardar la configuración:', error);
        }
    }

    /**
     * Carga la configuración guardada
     */
    loadSavedConfig() {
        try {
            const savedConfig = localStorage.getItem('trivial-challenge-config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.applyConfigToForm(config);
                console.log('📥 Configuración del desafío cargada');
            }
        } catch (error) {
            console.warn('⚠️ No se pudo cargar la configuración guardada:', error);
        }
    }

    /**
     * Aplica la configuración al formulario
     */
    applyConfigToForm(config) {
        // Aplicar dificultad
        if (this.elements.challengeDifficulty && config.difficulty) {
            this.elements.challengeDifficulty.value = config.difficulty;
        }

        // Aplicar timer
        if (this.elements.challengeTimer && config.timer) {
            this.elements.challengeTimer.value = config.timer.toString();
        }

        // Aplicar tipo de pregunta
        if (this.elements.challengeQuestionType && config.questionType) {
            this.elements.challengeQuestionType.value = config.questionType;
        }

        // Aplicar categorías
        if (config.categories) {
            Object.keys(config.categories).forEach(category => {
                const checkbox = this.elements.categoriesCheckboxes[category];
                if (checkbox) {
                    checkbox.checked = config.categories[category];
                }
            });
        }
    }    /**
     * Maneja el evento de desafío iniciado
     */    
    onChallengeStarted(data) {
        console.log('🎯 Desafío iniciado, creando interfaz de juego...');
        
        // Reiniciar el estado del juego
        this.gameEnded = false;
        this.cancelAllTimeouts();
        
        // Ocultar indicador de carga del botón
        this.showButtonLoading(false);
        
        this.createChallengeGameScreen();
        
        // Esperar a que el DOM se actualice antes de mostrar la pantalla
        setTimeout(() => {
            this.showChallengeGame();
            
            // Inicializar el timer basado en la configuración después de que los elementos estén disponibles
            const timerConfig = data.config && data.config.timer;
            if (this.elements.challengeTimerText) {
                if (timerConfig === 0) {
                    this.elements.challengeTimerText.textContent = '∞';
                    if (this.elements.challengeTimerCircle) {
                        this.elements.challengeTimerCircle.className = 'timer-circle timer-unlimited';
                    }
                } else {
                    this.elements.challengeTimerText.textContent = timerConfig || '∞';
                    if (this.elements.challengeTimerCircle) {
                        this.elements.challengeTimerCircle.className = 'timer-circle';
                    }
                }
            }
            
            // Mostrar carga inicial después de mostrar la pantalla
            this.showInitialLoading('Preparando primera pregunta...');
            
            // Simular proceso de carga y luego ocultar
            setTimeout(() => {
                this.hideInitialLoading();
                console.log('🎮 Interfaz de juego mostrada');
            }, 2000);
        }, 150);
    }

    /**
     * Crea la pantalla del juego de desafío
     */    createChallengeGameScreen() {
        // Crear la pantalla si no existe
        let gameScreen = document.getElementById('challenge-game-screen');
        if (!gameScreen) {
            gameScreen = document.createElement('div');
            gameScreen.id = 'challenge-game-screen';
            gameScreen.className = 'screen challenge-game-screen';
            
            // Añadir clase para móvil si es necesario
            if (this.isMobileDevice()) {
                gameScreen.classList.add('mobile-optimized');
            }
            
            gameScreen.innerHTML = `
                <div class="challenge-game-container">
                    <!-- Indicador de carga inicial -->
                    <div id="challenge-loading-screen" class="loading-screen active">
                        <div class="loading-content">
                            <div class="loading-spinner"></div>
                            <h3>🎯 Preparando Desafío...</h3>
                            <p id="loading-status">Configurando el juego</p>
                        </div>
                    </div>

                    <!-- Indicador de carga entre preguntas -->
                    <div id="question-loading" class="question-loading">
                        <div class="loading-content">
                            <div class="loading-spinner small"></div>
                            <p>Cargando siguiente pregunta...</p>
                        </div>
                    </div>                    <!-- Área de la pregunta -->
                    <div class="challenge-question-area">
                        <!-- Estadísticas simplificadas encima de la pregunta -->
                        <div class="question-stats">
                            <div class="stat-item">
                                <span class="stat-label">Correctas:</span>
                                <span id="challenge-correct-answers" class="stat-value">0</span>
                            </div>
                            <div class="challenge-timer">
                                <div id="challenge-timer-circle" class="timer-circle">
                                    <span id="challenge-timer-text">∞</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contenedor central para la pregunta -->
                        <div class="question-content-center">
                            <div class="question-category">
                                <span id="challenge-question-category">Categoría</span>
                            </div>
                            <div class="question-type-indicator">
                                <span id="challenge-question-type-badge">📝 Opción Múltiple</span>
                            </div>
                            <div class="question-text">
                                <h3 id="challenge-question-text">Pregunta aparecerá aquí...</h3>
                            </div>
                            <div class="question-controls">
                                <button id="toggle-original-btn" class="btn btn-small btn-secondary">
                                    🌐 Ver Original
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Opciones de respuesta -->
                    <div class="challenge-answers">
                        <button id="challenge-answer-0" class="challenge-answer-btn">Opción A</button>
                        <button id="challenge-answer-1" class="challenge-answer-btn">Opción B</button>
                        <button id="challenge-answer-2" class="challenge-answer-btn">Opción C</button>
                        <button id="challenge-answer-3" class="challenge-answer-btn">Opción D</button>
                    </div>                    <!-- Controles del juego -->
                    <div class="challenge-controls">
                        <button id="challenge-exit-btn" class="btn btn-danger">🚪 Salir</button>
                    </div>
                </div>                <!-- Modal de confirmación de salida -->
                <div id="challenge-exit-modal" class="modal">
                    <div class="modal-content">
                        <h3>🚪 Salir del Desafío</h3>
                        <p>¿Estás seguro de que quieres salir del desafío? Se perderá el progreso actual.</p>
                        <div class="modal-buttons">
                            <button id="challenge-continue-btn" class="btn btn-secondary">↩️ Continuar Jugando</button>
                            <button id="challenge-exit-confirm-btn" class="btn btn-danger">🚪 Salir</button>
                        </div>
                    </div>
                </div>

                <!-- Modal de Game Over -->
                <div id="survival-gameover-modal" class="modal">
                    <div class="modal-content gameover-content">
                        <div class="gameover-header">
                            <h2 id="gameover-title">💀 GAME OVER</h2>
                            <p id="gameover-cause">Has fallado en modo supervivencia</p>
                        </div>
                        
                        <div class="gameover-stats">
                            <div class="final-stat">
                                <span class="final-stat-label">Puntuación Final:</span>
                                <span id="final-score" class="final-stat-value">0</span>
                            </div>
                            <div class="final-stat">
                                <span class="final-stat-label">Preguntas Respondidas:</span>
                                <span id="final-questions" class="final-stat-value">0</span>
                            </div>
                            <div class="final-stat">
                                <span class="final-stat-label">Respuestas Correctas:</span>
                                <span id="final-correct" class="final-stat-value">0</span>
                            </div>
                            <div class="final-stat">
                                <span class="final-stat-label">Racha Máxima:</span>
                                <span id="final-streak" class="final-stat-value">0</span>
                            </div>
                        </div>
                        
                        <div class="gameover-buttons">
                            <button id="play-again-btn" class="btn btn-primary">🔄 Jugar de Nuevo</button>
                            <button id="back-to-menu-btn" class="btn btn-secondary">🏠 Menú Principal</button>
                        </div>
                    </div>
                </div>
            `;            document.body.appendChild(gameScreen);

            // Cachear inmediatamente el elemento principal
            this.elements.challengeGameScreen = gameScreen;
            console.log('✅ Pantalla de juego creada y cacheada');

            // Cachear nuevos elementos con un pequeño delay para asegurar que el DOM se haya actualizado
            setTimeout(() => {
                console.log('🔄 Cacheando elementos del juego...');
                this.cacheGameElements();
                this.bindGameEvents();
                console.log('✅ Elementos cacheados:', {
                    challengeScore: !!this.elements.challengeScore,
                    challengeQuestionText: !!this.elements.challengeQuestionText,
                    challengeQuestionCategory: !!this.elements.challengeQuestionCategory,
                    challengeAnswerBtns: this.elements.challengeAnswerBtns ? this.elements.challengeAnswerBtns.length : 0
                });
            }, 100);
        }
    }    /**
     * Cachea los elementos del juego
     */
    cacheGameElements() {
        console.log('🔧 Iniciando cacheo de elementos...');
        
        // Verificar que la pantalla del juego existe
        if (!this.elements.challengeGameScreen) {
            this.elements.challengeGameScreen = document.getElementById('challenge-game-screen');
        }
        
        if (!this.elements.challengeGameScreen) {
            console.error('❌ challenge-game-screen no encontrado');
            return;
        }
        
        console.log('✅ challenge-game-screen encontrada');
          // Elementos de estadísticas simplificadas
        this.elements.challengeCorrectAnswers = document.getElementById('challenge-correct-answers');
          // Elementos del temporizador
        this.elements.challengeTimerCircle = document.getElementById('challenge-timer-circle');
        this.elements.challengeTimerText = document.getElementById('challenge-timer-text');
        
        // Elementos de carga
        this.elements.challengeLoadingScreen = document.getElementById('challenge-loading-screen');
        this.elements.loadingStatus = document.getElementById('loading-status');
        this.elements.questionLoading = document.getElementById('question-loading');
          // Elementos de la pregunta
        this.elements.challengeQuestionCategory = document.getElementById('challenge-question-category');
        this.elements.challengeQuestionTypeBadge = document.getElementById('challenge-question-type-badge');
        this.elements.challengeQuestionText = document.getElementById('challenge-question-text');
        this.elements.toggleOriginalBtn = document.getElementById('toggle-original-btn');
        
        // Botones de respuesta
        this.elements.challengeAnswerBtns = [
            document.getElementById('challenge-answer-0'),
            document.getElementById('challenge-answer-1'),
            document.getElementById('challenge-answer-2'),
            document.getElementById('challenge-answer-3')
        ];
          // Elementos de control
        this.elements.challengeExitBtn = document.getElementById('challenge-exit-btn');
        this.elements.challengeExitModal = document.getElementById('challenge-exit-modal');
        this.elements.challengeContinueBtn = document.getElementById('challenge-continue-btn');
        this.elements.challengeExitConfirmBtn = document.getElementById('challenge-exit-confirm-btn');
        
        // Debug de elementos del modal de salida
        console.log('🔍 Debug elementos modal de salida:', {
            challengeExitBtn: !!this.elements.challengeExitBtn,
            challengeExitModal: !!this.elements.challengeExitModal,
            challengeContinueBtn: !!this.elements.challengeContinueBtn,
            challengeExitConfirmBtn: !!this.elements.challengeExitConfirmBtn
        });
        
        // Elementos del Game Over
        this.elements.survivalGameOverModal = document.getElementById('survival-gameover-modal');
        this.elements.gameOverTitle = document.getElementById('gameover-title');
        this.elements.gameOverCause = document.getElementById('gameover-cause');
        this.elements.finalScore = document.getElementById('final-score');
        this.elements.finalQuestions = document.getElementById('final-questions');
        this.elements.finalCorrect = document.getElementById('final-correct');
        this.elements.finalStreak = document.getElementById('final-streak');
        this.elements.playAgainBtn = document.getElementById('play-again-btn');
        this.elements.backToMenuBtn = document.getElementById('back-to-menu-btn');
        
        // Elementos del modal de advertencia de inactividad
        this.elements.inactivityWarningModal = document.getElementById('inactivity-warning-modal');
        this.elements.inactivityContinueBtn = document.getElementById('inactivity-continue-btn');
        this.elements.inactivityQuitBtn = document.getElementById('inactivity-quit-btn');
        
        // Verificar elementos críticos
        const criticalElements = [
            'challengeCorrectAnswers',
            'challengeQuestionText',
            'challengeQuestionCategory',
            'challengeQuestionTypeBadge',
            'toggleOriginalBtn'
        ];
        
        const missingElements = criticalElements.filter(elementName => !this.elements[elementName]);
        
        if (missingElements.length > 0) {
            console.error('❌ Elementos críticos no encontrados:', missingElements);
        } else {
            console.log('✅ Todos los elementos críticos cacheados correctamente');
        }
        
        // Verificación específica del botón toggle
        if (this.elements.toggleOriginalBtn) {
            console.log('✅ Botón toggleOriginalBtn cacheado correctamente');
            // Hacer visible por defecto para depuración
            this.elements.toggleOriginalBtn.style.display = 'inline-block';
        } else {
            console.error('❌ toggleOriginalBtn no se pudo cachear');
        }
    }

    /**
     * Vincula los eventos del juego
     */    bindGameEvents() {
        // Eventos de respuesta - usando event listeners optimizados para móviles
        this.elements.challengeAnswerBtns.forEach((btn, index) => {
            if (btn) {
                this.addMobileOptimizedListener(btn, () => this.selectAnswer(index));
            }
        });

        // Evento del botón de idioma original
        if (this.elements.toggleOriginalBtn) {
            this.addMobileOptimizedListener(this.elements.toggleOriginalBtn, () => this.toggleOriginalLanguage());
        }

        // Eventos de control - usando event listeners optimizados
        if (this.elements.challengeExitBtn) {
            this.addMobileOptimizedListener(this.elements.challengeExitBtn, (event) => {
                console.log('🚪 Botón de salir presionado');
                this.handleEventWithPrevention(event, () => this.showExitConfirmation());
            }, { allowPreventDefault: true });
        } else {
            console.error('❌ challengeExitBtn no encontrado durante la configuración!');
        }

        if (this.elements.challengeContinueBtn) {
            this.addMobileOptimizedListener(this.elements.challengeContinueBtn, (event) => {
                this.handleEventWithPrevention(event, () => this.continueChallenge());
            }, { allowPreventDefault: true });
        }

        if (this.elements.challengeExitConfirmBtn) {
            this.addMobileOptimizedListener(this.elements.challengeExitConfirmBtn, (event) => {
                this.handleEventWithPrevention(event, () => this.confirmExitChallenge());
            }, { allowPreventDefault: true });
        }

        // Eventos del Game Over - usando event listeners optimizados
        if (this.elements.playAgainBtn) {
            this.addMobileOptimizedListener(this.elements.playAgainBtn, () => this.playAgain());
        }

        if (this.elements.backToMenuBtn) {
            this.addMobileOptimizedListener(this.elements.backToMenuBtn, () => this.backToMenuFromGameOver());
        }

        // Eventos del modal de advertencia de inactividad
        if (this.elements.inactivityContinueBtn) {
            this.addMobileOptimizedListener(this.elements.inactivityContinueBtn, () => this.onInactivityContinue());
        }

        if (this.elements.inactivityQuitBtn) {
            this.addMobileOptimizedListener(this.elements.inactivityQuitBtn, () => this.onInactivityQuit());
        }

        // Configurar el modal de confirmación de salida para prevenir propagación de eventos
        this.setupExitModalEventPrevention();
    }/**
     * Muestra la pantalla del juego de desafío
     */
    showChallengeGame() {
        console.log('🎮 Mostrando interfaz del desafío');
        
        // Verificar que la pantalla del juego existe antes de mostrarla
        if (!this.elements.challengeGameScreen) {
            console.warn('⚠️ challengeGameScreen no encontrada, intentando cachear...');
            this.cacheGameElements();
            
            // Si aún no existe, buscarla directamente en el DOM
            if (!this.elements.challengeGameScreen) {
                this.elements.challengeGameScreen = document.getElementById('challenge-game-screen');
            }
            
            // Si aún no existe, hay un problema
            if (!this.elements.challengeGameScreen) {
                console.error('❌ No se pudo encontrar challenge-game-screen');
                return;
            }
        }
        
        this.hideAllScreens();
        this.elements.challengeGameScreen.classList.add('active');
        this.currentScreen = 'challenge-game';
    }/**
     * Maneja una nueva pregunta
     */
    onNewQuestion(data) {
        console.log('❓ Nueva pregunta del desafío');
        
        // Mostrar carga de pregunta brevemente
        this.showQuestionLoading();
        
        // Procesar la pregunta después de un breve delay
        setTimeout(() => {
            this.processNewQuestion(data);
            this.hideQuestionLoading();
        }, 800);
    }

    /**
     * Procesa una nueva pregunta (separado para manejar la carga)
     */
    processNewQuestion(data) {
        const question = data.question;
        
        // Limpiar focus de botones anteriores para nueva pregunta
        this.elements.challengeAnswerBtns.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('selected', 'correct', 'incorrect');
                btn.blur(); // Limpiar focus especialmente en móviles
                btn.style.pointerEvents = ''; // Restaurar eventos de pointer
            }
        });
        
        // Limpiar focus general en móviles
        if (this.isMobileDevice() && document.activeElement) {
            document.activeElement.blur();
        }
        
        // Verificar que los elementos existen antes de usarlos
        if (!this.elements.challengeQuestionCategory || !this.elements.challengeQuestionText) {
            console.warn('⚠️ Elementos de UI no encontrados, usando recuperación de emergencia...');
            this.forceElementCaching();
            
            // Intentar de nuevo después del cacheo de emergencia
            setTimeout(() => {
                this.processNewQuestion(data);
            }, 300);
            return;        
        }
        
        // Almacenar versiones original y traducida
        this.storeQuestionVersions(question);
        
        // Resetear estado de visualización
        this.questionDisplay.showingOriginal = false;
        
        // Verificar que el botón existe antes de actualizar
        if (this.elements.toggleOriginalBtn) {
            console.log('🔍 Botón de toggle encontrado, actualizando...');
            this.updateToggleButton();
        } else {
            console.warn('⚠️ Botón de toggle no encontrado, intentando re-cachear...');
            setTimeout(() => {
                this.cacheGameElements();
                this.updateToggleButton();
            }, 100);
        }
        
        // Actualizar categoría
        if (this.elements.challengeQuestionCategory) {
            this.elements.challengeQuestionCategory.textContent = this.getCategoryName(question.categoria);
        } else {
            console.error('❌ challengeQuestionCategory no encontrado');
        }
        
        // Mostrar pregunta (inicialmente la traducida si está disponible)
        this.displayCurrentQuestion();
        
        // Actualizar estadísticas
        this.updateStats(data.gameState);
        
        // Mostrar el tiempo inicial correcto inmediatamente
        if (this.challengeEngine) {
            const timerConfig = this.challengeEngine.config.timer;
            if (this.elements.challengeTimerText) {
                if (timerConfig === 0) {
                    this.elements.challengeTimerText.textContent = '∞';
                    if (this.elements.challengeTimerCircle) {
                        this.elements.challengeTimerCircle.className = 'timer-circle timer-unlimited';
                    }
                } else {
                    this.elements.challengeTimerText.textContent = timerConfig;
                    if (this.elements.challengeTimerCircle) {
                        this.elements.challengeTimerCircle.className = 'timer-circle';
                    }
                }
                console.log(`⏱️ Timer UI actualizado a: ${timerConfig === 0 ? '∞' : timerConfig}`);
            }
        }
        
        // IMPORTANTE: Iniciar el timer solo después de que la pregunta esté completamente mostrada
        // Esto soluciona el problema de que la cuenta atrás empezaba durante la carga
        setTimeout(() => {
            if (this.challengeEngine && this.challengeEngine.gameState.isGameRunning) {
                console.log('⏱️ Iniciando timer después de mostrar la pregunta completamente');
                this.challengeEngine.startQuestionTimer(); // Usar el nuevo método público
            }
        }, 200); // Pequeño delay para asegurar que la UI esté completamente renderizada
    }

    /**
     * Obtiene el nombre de la categoría en español
     */
    getCategoryName(category) {
        const categoryNames = {
            historia: '📚 Historia',
            ciencia: '🔬 Ciencia',
            deportes: '⚽ Deportes',
            arte: '🎨 Arte',
            geografia: '🌍 Geografía',
            entretenimiento: '🎬 Entretenimiento'
        };
        return categoryNames[category] || category;
    }    /**
     * Actualiza las estadísticas en pantalla
     */
    updateStats(gameState) {
        // Verificar que gameState existe
        if (!gameState) {
            console.warn('⚠️ gameState no proporcionado para updateStats');
            return;
        }
        
        // Verificar que los elementos existen
        if (!this.elements.challengeCorrectAnswers) {
            console.warn('⚠️ Elementos de estadísticas no encontrados, re-cacheando...');
            this.cacheGameElements();
        }
          
        // Actualizar solo el contador de respuestas correctas
        if (this.elements.challengeCorrectAnswers) {
            const correctAnswers = gameState.correctAnswers || 0;
            this.elements.challengeCorrectAnswers.textContent = correctAnswers;
        } else {
            console.warn('⚠️ challengeCorrectAnswers element no encontrado');
        }
    }/**
     * Maneja la actualización del temporizador
     */
    onTimerUpdate(data) {
        const timeRemaining = data.timeRemaining;
        const isUnlimited = data.isUnlimited || false;
        
        if (this.elements.challengeTimerText) {
            if (isUnlimited) {
                this.elements.challengeTimerText.textContent = '∞';
            } else {
                this.elements.challengeTimerText.textContent = timeRemaining;
            }
        }
        
        // Cambiar color del temporizador según el tiempo restante
        if (this.elements.challengeTimerCircle) {
            this.elements.challengeTimerCircle.className = 'timer-circle';
            
            if (isUnlimited) {
                // Estilo especial para tiempo ilimitado
                this.elements.challengeTimerCircle.classList.add('timer-unlimited');
            } else if (timeRemaining <= 5) {
                this.elements.challengeTimerCircle.classList.add('timer-critical');
            } else if (timeRemaining <= 10) {
                this.elements.challengeTimerCircle.classList.add('timer-warning');
            }
        }
    }    /**
     * Selecciona una respuesta
     */
    selectAnswer(answerIndex) {
        console.log(`📝 Respuesta seleccionada: ${answerIndex}`);
        
        // Deshabilitar todos los botones y limpiar focus inmediatamente
        this.elements.challengeAnswerBtns.forEach((btn, index) => {
            if (btn) {
                btn.disabled = true;
                // Quitar focus de TODOS los botones, no solo del seleccionado
                btn.blur();
                // Prevenir cualquier evento residual
                btn.style.pointerEvents = 'none';
            }
        });
        
        // Marcar respuesta seleccionada
        if (this.elements.challengeAnswerBtns[answerIndex]) {
            this.elements.challengeAnswerBtns[answerIndex].classList.add('selected');
        }
        
        // Limpiar focus general del documento en dispositivos móviles
        if (document.activeElement) {
            document.activeElement.blur();
        }
        
        // Forzar que el documento pierda focus en móviles
        if (this.isMobileDevice()) {
            // Crear un elemento temporal invisible para cambiar el focus
            const tempElement = document.createElement('div');
            tempElement.tabIndex = -1;
            tempElement.style.position = 'absolute';
            tempElement.style.left = '-9999px';
            document.body.appendChild(tempElement);
            tempElement.focus();
            tempElement.blur();
            document.body.removeChild(tempElement);
        }
        
        // Procesar respuesta - SIEMPRE usar las respuestas traducidas para la lógica del juego
        // para mantener consistencia con el sistema de puntuación
        const currentQuestion = this.challengeEngine.gameState.currentQuestion;
        if (currentQuestion && this.questionDisplay.translatedAnswers) {
            const selectedAnswer = this.questionDisplay.translatedAnswers[answerIndex];
            this.challengeEngine.processAnswer(selectedAnswer);
        }
    }    /**
     * Maneja la respuesta procesada
     */
    onAnswerProcessed(data) {
        const { isCorrect, correctAnswer } = data;
        
        // Encontrar el índice de la respuesta correcta usando las respuestas traducidas
        const correctIndex = this.questionDisplay.translatedAnswers.indexOf(correctAnswer);
        
        // Marcar respuesta correcta
        if (correctIndex !== -1 && this.elements.challengeAnswerBtns[correctIndex]) {
            this.elements.challengeAnswerBtns[correctIndex].classList.add('correct');
        }
        
        // Marcar respuesta incorrecta si es necesario
        this.elements.challengeAnswerBtns.forEach((btn, index) => {
            if (btn && btn.classList.contains('selected') && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Actualizar estadísticas
        this.updateStats(data.gameState);
        
        console.log(isCorrect ? '✅ Respuesta correcta!' : '❌ Respuesta incorrecta');
        
        // En el nuevo modo continuo, SIEMPRE mostrar carga de siguiente pregunta
        console.log('🔄 Preparando siguiente pregunta...');
        
        this.createSafeTimeout(() => {
            this.showQuestionLoading();
        }, 2000); // Dar tiempo para ver el resultado
    }    /**
     * Maneja el timeout de una pregunta
     */
    onTimeOut(data) {
        console.log('⏰ Tiempo agotado - Mostrando respuesta correcta');
        
        // Marcar todas las respuestas como deshabilitadas (igual que timeout)
        this.elements.challengeAnswerBtns.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.add('timeout');
            }
        });
        
        // USAR EXACTAMENTE LA MISMA LÓGICA QUE onAnswerProcessed
        const { correctAnswer } = data;
        
        console.log('🔍 DEBUG - Buscando respuesta correcta:');
        console.log('  - correctAnswer:', correctAnswer);
        console.log('  - translatedAnswers:', this.questionDisplay.translatedAnswers);
        
        // Encontrar el índice de la respuesta correcta usando las respuestas traducidas
        const correctIndex = this.questionDisplay.translatedAnswers.indexOf(correctAnswer);
        
        console.log('  - correctIndex encontrado:', correctIndex);
        
        // Marcar respuesta correcta (IGUAL QUE onAnswerProcessed)
        if (correctIndex !== -1 && this.elements.challengeAnswerBtns[correctIndex]) {
            this.elements.challengeAnswerBtns[correctIndex].classList.add('correct');
            console.log(`✅ Respuesta correcta mostrada en índice ${correctIndex}: "${correctAnswer}"`);
        } else {
            console.warn(`⚠️ No se encontró la respuesta correcta "${correctAnswer}" en:`, this.questionDisplay.translatedAnswers);
        }
        
        // Actualizar estadísticas
        this.updateStats(data.gameState);
        
        // Proporcionar feedback táctil para timeout
        this.provideTactileFeedback(null, 'timeout');
        
        console.log('⏰ Tiempo agotado - Respuesta correcta marcada');
        
        // En el nuevo modo continuo, SIEMPRE continuar después del timeout
        console.log('⏰ Tiempo agotado, pero continuamos con la siguiente pregunta');
        
        this.createSafeTimeout(() => {
            this.showQuestionLoading();
        }, 2000); // Dar tiempo para ver el resultado
    }/**
     * Muestra la confirmación de salida
     */
    showExitConfirmation() {
        console.log('🚪 Mostrando modal de confirmación de salida');
        
        if (!this.elements.challengeExitModal) {
            console.error('❌ challengeExitModal no encontrado!');
            return;
        }
        
        // Marcar modal como recién abierto para prevenir cierre inmediato
        if (this.markModalAsJustOpened) {
            this.markModalAsJustOpened();
        }
        
        // Solo mostrar el modal, sin pausar el juego
        this.elements.challengeExitModal.classList.add('active');
        console.log('✅ Modal de confirmación de salida abierto');
    }

    /**
     * Continúa el desafío (cierra el modal de salida)
     */
    continueChallenge() {
        // Solo cerrar el modal, sin afectar el estado del juego
        this.elements.challengeExitModal.classList.remove('active');
        
        // Limpiar focus después de cerrar el modal
        setTimeout(() => {
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
            
            // En móviles, forzar cambio de focus para evitar clicks accidentales
            if (this.isMobileDevice()) {
                const tempElement = document.createElement('div');
                tempElement.tabIndex = -1;
                tempElement.style.position = 'absolute';
                tempElement.style.left = '-9999px';
                document.body.appendChild(tempElement);
                tempElement.focus();
                tempElement.blur();
                document.body.removeChild(tempElement);
            }
        }, 100);
    }

    /**
     * Confirma la salida del desafío
     */
    confirmExitChallenge() {
        this.challengeEngine.endChallenge();
        this.elements.challengeExitModal.classList.remove('active');
        
        // Limpiar focus antes de cambiar de pantalla
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        
        this.showMainMenu();
    }

    /**
     * Maneja el fin del desafío
     */
    onChallengeEnded(data) {
        console.log('🏁 Desafío terminado');
        
        // Limpiar cualquier estado de carga activo
        this.clearAllLoadingIndicators();
        
        // Cancelar cualquier timeout pendiente en la UI
        this.cancelAllTimeouts();
        
        // Marcar que el juego ha terminado
        this.gameEnded = true;
        
        this.showChallengeResults(data.results);
    }

    /**
     * Muestra los resultados del desafío
     */
    showChallengeResults(results) {
        console.log('📊 Resultados del desafío:', results);
        
        // Si el juego terminó por inactividad (puntuación 0 y pocas preguntas), regresar al menú
        if (results.questionsAnswered <= 1 && results.score === 0) {
            console.log('🚪 Regresando al menú principal (desafío terminado por inactividad)');
            this.returnToMainMenu();
            return;
        }
        
        // Para otros casos, mostrar pantalla de resultados (a implementar en el futuro)
        console.log('🏆 Aquí se mostrará la pantalla de resultados completa');
        
        // Por ahora, regresar al menú después de un breve delay
        setTimeout(() => {
            this.returnToMainMenu();
        }, 2000);
    }

    /**
     * Regresa al menú principal
     */
    returnToMainMenu() {
        console.log('🔙 Regresando al menú principal...');
        
        // Limpiar el estado del desafío
        this.cleanup();
        
        // Mostrar el menú principal
        this.showMainMenu();
    }

    /**
     * Maneja errores del desafío
     */
    onChallengeError(data) {
        console.error('❌ Error en el desafío:', data.error);
        this.showError(data.error);
    }    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        // Ocultar indicador de carga del botón si está visible
        this.showButtonLoading(false);
        
        // Implementar sistema de notificaciones
        alert(`Error: ${message}`);
    }

    /**
     * Maneja el evento de pausa
     */
    onChallengePaused(data) {
        console.log('⏸️ Desafío pausado');
    }

    /**
     * Maneja el evento de reanudación
     */
    onChallengeResumed(data) {
        console.log('▶️ Desafío reanudado');
    }    /**
     * Maneja el evento de Game Over en modo supervivencia
     */      onSurvivalGameOver(data) {
        console.log('💀 Game Over en modo supervivencia:', data);
        
        // Marcar el juego como terminado INMEDIATAMENTE
        this.gameEnded = true;
        
        // Cancelar todos los timeouts pendientes
        this.cancelAllTimeouts();
        
        // Limpiar todos los indicadores de carga
        this.clearAllLoadingIndicators();
          // Actualizar estadísticas del juego inmediatamente
        const safeGameState = {
            correctAnswers: data.correctAnswers || 0
        };
        this.updateStats(safeGameState);
        
        // Retrasar la aparición del modal para dar tiempo a ver el resultado
        setTimeout(() => {
            // Actualizar estadísticas finales del modal
            if (this.elements.finalScore) {
                const finalScore = data.finalScore || 0;
                this.elements.finalScore.textContent = finalScore.toLocaleString();
            }
            
            if (this.elements.finalQuestions) {
                this.elements.finalQuestions.textContent = data.questionsAnswered || 0;
            }
            
            if (this.elements.finalCorrect) {
                this.elements.finalCorrect.textContent = data.correctAnswers || 0;
            }
            
            if (this.elements.finalStreak) {
                this.elements.finalStreak.textContent = data.maxStreak || 0;
            }

            // Actualizar mensaje según la causa de muerte
            if (this.elements.gameOverCause) {
                const causeMessages = {
                    'wrong_answer': 'Has fallado una pregunta en modo supervivencia',
                    'timeout': 'Se te agotó el tiempo en modo supervivencia'
                };
                this.elements.gameOverCause.textContent = causeMessages[data.causeOfDeath] || 'Game Over';
            }

            // Mostrar modal de Game Over con un delay
            if (this.elements.survivalGameOverModal) {
                this.elements.survivalGameOverModal.classList.add('active');
                console.log('📱 Modal de Game Over mostrado');
            }
        }, 3000); // Retraso de 3 segundos para ver el resultado
    }    /**
     * Jugar de nuevo después del Game Over
     */    playAgain() {
        console.log('🔄 Reiniciando desafío...');
          // Mostrar indicador de carga en el botón
        const playAgainBtn = this.elements.playAgainBtn;
        if (playAgainBtn) {
            const originalText = playAgainBtn.textContent;
            playAgainBtn.innerHTML = '<span class="loading-spinner"></span> Reiniciando...';
            playAgainBtn.disabled = true;
            playAgainBtn.classList.add('loading');
            
            // Usar setTimeout para permitir que se vea la animación de carga
            setTimeout(() => {
                try {
                    // Reiniciar el estado del juego
                    this.gameEnded = false;
                    this.cancelAllTimeouts();
                    
                    // Obtener configuración actual y reiniciar
                    const config = this.collectConfigFromForm();
                    this.challengeEngine.initialize(config);
                    this.challengeEngine.startChallenge();
                    
                    // Cerrar modal después de inicializar
                    if (this.elements.survivalGameOverModal) {
                        this.elements.survivalGameOverModal.classList.remove('active');
                    }
                      // Restaurar botón
                    playAgainBtn.innerHTML = originalText;
                    playAgainBtn.disabled = false;
                    playAgainBtn.classList.remove('loading');
                    
                } catch (error) {
                    console.error('Error al reiniciar el desafío:', error);                    // Restaurar botón en caso de error
                    playAgainBtn.innerHTML = originalText;
                    playAgainBtn.disabled = false;
                    playAgainBtn.classList.remove('loading');
                }
            }, 500); // 500ms de delay para mostrar la animación
        }
    }

    /**
     * Volver al menú desde Game Over
     */
    backToMenuFromGameOver() {
        console.log('🏠 Volviendo al menú desde Game Over...');
        
        // Cerrar modal
        if (this.elements.survivalGameOverModal) {
            this.elements.survivalGameOverModal.classList.remove('active');
        }

        // Limpiar el desafío
        this.challengeEngine.cleanup();

        // Volver al menú principal
        this.showMainMenu();
    }    /**
     * Muestra la pantalla de carga inicial del desafío
     */
    showInitialLoading(status = 'Configurando el juego') {
        console.log('⏳ Mostrando carga inicial del desafío');
        
        // Buscar el elemento si no está cacheado
        if (!this.elements.challengeLoadingScreen) {
            this.elements.challengeLoadingScreen = document.getElementById('challenge-loading-screen');
        }
        
        if (!this.elements.loadingStatus) {
            this.elements.loadingStatus = document.getElementById('loading-status');
        }
        
        if (this.elements.challengeLoadingScreen) {
            this.elements.challengeLoadingScreen.classList.add('active');
            
            if (this.elements.loadingStatus) {
                this.elements.loadingStatus.textContent = status;
            }
            console.log('✅ Carga inicial mostrada');
        } else {
            console.warn('⚠️ No se pudo mostrar la carga inicial - elemento no encontrado');
        }
    }    /**
     * Oculta la pantalla de carga inicial del desafío
     */
    hideInitialLoading() {
        console.log('✅ Ocultando carga inicial del desafío');
        
        // Buscar el elemento si no está cacheado
        if (!this.elements.challengeLoadingScreen) {
            this.elements.challengeLoadingScreen = document.getElementById('challenge-loading-screen');
        }
        
        if (this.elements.challengeLoadingScreen) {
            this.elements.challengeLoadingScreen.classList.remove('active');
            console.log('✅ Carga inicial ocultada');
        } else {
            console.log('⚠️ Elemento challenge-loading-screen no encontrado (posiblemente ya destruido)');
        }
    }

    /**
     * Muestra el indicador de carga entre preguntas
     */    showQuestionLoading() {
        // No mostrar carga si el juego ha terminado
        if (this.gameEnded) {
            console.log('⚠️ No se mostrará carga de pregunta: el juego ha terminado');
            return;
        }
        
        console.log('⏳ Mostrando carga de pregunta');
        
        // Verificar que el elemento existe antes de usarlo
        if (!this.elements.questionLoading) {
            this.elements.questionLoading = document.getElementById('question-loading');
        }
        
        // Solo mostrar si el elemento existe (no se ha destruido la interfaz)
        if (this.elements.questionLoading) {
            this.elements.questionLoading.classList.add('active');
        } else {
            console.log('⚠️ No se puede mostrar carga de pregunta: elemento no existe (interfaz destruida)');
        }
    }

    /**
     * Oculta el indicador de carga entre preguntas
     */
    hideQuestionLoading() {
        console.log('✅ Ocultando carga de pregunta');
        
        // Verificar que el elemento existe antes de usarlo
        if (!this.elements.questionLoading) {
            this.elements.questionLoading = document.getElementById('question-loading');
        }
        
        if (this.elements.questionLoading) {
            this.elements.questionLoading.classList.remove('active');
        } else {
            console.log('⚠️ Elemento question-loading no encontrado (posiblemente ya destruido)');
        }
    }    /**
     * Actualiza el estado de la carga inicial
     */
    updateLoadingStatus(status) {
        // Buscar el elemento si no está cacheado
        if (!this.elements.loadingStatus) {
            this.elements.loadingStatus = document.getElementById('loading-status');
        }
        
        if (this.elements.loadingStatus) {
            this.elements.loadingStatus.textContent = status;
            console.log(`📝 Estado actualizado: ${status}`);
        } else {
            console.warn('⚠️ No se pudo actualizar el estado - elemento no encontrado');
        }
    }    /**
     * Muestra/oculta el indicador de carga en el botón de inicio
     * @param {boolean} show - Si mostrar el indicador de carga
     */
    showButtonLoading(show) {
        // Verificar que el elemento existe antes de usarlo
        if (!this.elements.challengeStartBtn) {
            this.elements.challengeStartBtn = document.getElementById('challenge-start-btn');
        }
        
        if (!this.elements.challengeStartBtn) {
            console.log('⚠️ challengeStartBtn no encontrado (posiblemente ya destruido)');
            return;
        }

        if (show) {
            // Guardar el texto original si no se ha hecho ya
            if (!this.elements.challengeStartBtn.dataset.originalText) {
                this.elements.challengeStartBtn.dataset.originalText = this.elements.challengeStartBtn.textContent;
            }

            // Mostrar estado de carga usando clases CSS
            this.elements.challengeStartBtn.innerHTML = `
                <div class="loading-spinner small"></div>
                Iniciando...
            `;
            this.elements.challengeStartBtn.disabled = true;
            this.elements.challengeStartBtn.classList.add('loading');
        } else {
            // Restaurar texto original
            const originalText = this.elements.challengeStartBtn.dataset.originalText || '🚀 Iniciar Desafío';
            this.elements.challengeStartBtn.innerHTML = originalText;
            this.elements.challengeStartBtn.disabled = false;
            this.elements.challengeStartBtn.classList.remove('loading');
        }
    }

    /**
     * Limpia la UI y libera recursos
     */    cleanup() {
        // Marcar el juego como terminado
        this.gameEnded = true;
        
        // Cancelar todos los timeouts pendientes
        this.cancelAllTimeouts();
        
        // Limpiar todos los indicadores de carga
        this.clearAllLoadingIndicators();
        
        // Limpiar animaciones
        Object.values(this.animations).forEach(animation => {
            if (animation) {
                clearInterval(animation);
            }
        });
        
        // Remover pantalla de juego si existe
        const gameScreen = document.getElementById('challenge-game-screen');
        if (gameScreen) {
            gameScreen.remove();
        }
        
        console.log('🧹 UI del desafío limpiada');
    }

    /**
     * Método de emergencia para forzar la creación y cacheo de elementos
     */
    forceElementCaching() {
        console.log('🚨 Forzando creación y cacheo de elementos...');
        
        // Verificar si la pantalla de juego existe
        let gameScreen = document.getElementById('challenge-game-screen');
        if (!gameScreen) {
            console.log('🔧 Creando pantalla de juego de emergencia...');
            this.createChallengeGameScreen();
        }
        
        // Esperar y cachear elementos
        setTimeout(() => {
            this.cacheGameElements();
            console.log('✅ Cacheo de emergencia completado');
        }, 200);
    }

    /**
     * Diagnóstico de la UI del modo desafío
     */
    runUIDiagnostic() {
        console.log('🔍 === DIAGNÓSTICO DE UI DEL MODO DESAFÍO ===');
        
        // 1. Verificar si la pantalla de juego existe
        const gameScreen = document.getElementById('challenge-game-screen');
        console.log('🎮 Pantalla de juego existe:', !!gameScreen);
          // 2. Verificar elementos cacheados
        console.log('🔗 Elementos cacheados:', {
            challengeCorrectAnswers: !!this.elements.challengeCorrectAnswers,
            challengeQuestionCategory: !!this.elements.challengeQuestionCategory,
            challengeQuestionText: !!this.elements.challengeQuestionText,
            challengeAnswerBtns: this.elements.challengeAnswerBtns ? this.elements.challengeAnswerBtns.filter(btn => !!btn).length : 0
        });
          // 3. Verificar elementos en el DOM
        console.log('🌐 Elementos en DOM:', {
            'challenge-correct-answers': !!document.getElementById('challenge-correct-answers'),
            'challenge-question-text': !!document.getElementById('challenge-question-text'),
            'challenge-question-category': !!document.getElementById('challenge-question-category'),
            'challenge-answer-0': !!document.getElementById('challenge-answer-0')
        });
          // 4. Intentar reparar si es necesario
        if (!this.elements.challengeCorrectAnswers && gameScreen) {
            console.log('🔧 Intentando reparar cacheo...');
            this.cacheGameElements();
        }
        
        console.log('🏁 === FIN DEL DIAGNÓSTICO UI ===');
    }    /**
     * Almacena las versiones original y traducida de la pregunta
     */
    storeQuestionVersions(question) {
        console.log('📝 Almacenando versiones de pregunta:', question);
        
        // Verificar si la pregunta tiene información original preservada
        if (question.originalQuestion && question.originalAnswers) {
            // Usar la información original preservada por el ChallengeEngine
            this.questionDisplay.originalQuestion = question.originalQuestion;
            this.questionDisplay.originalAnswers = question.originalAnswers;
            this.questionDisplay.translatedQuestion = question.pregunta;
            this.questionDisplay.translatedAnswers = question.opciones;
            console.log('✅ Versiones original y traducida detectadas desde pregunta preservada');
        } else {
            // Fallback: usar la pregunta actual como ambas versiones
            this.questionDisplay.originalQuestion = question.pregunta;
            this.questionDisplay.originalAnswers = question.opciones;
            this.questionDisplay.translatedQuestion = question.pregunta;
            this.questionDisplay.translatedAnswers = question.opciones;
            console.log('ℹ️ Solo una versión disponible, usando como original y traducida');
        }
        
        console.log('💾 Estado final de questionDisplay:', {
            original: this.questionDisplay.originalQuestion,
            translated: this.questionDisplay.translatedQuestion,
            hasDifferences: this.questionDisplay.originalQuestion !== this.questionDisplay.translatedQuestion
        });
    }

    /**
     * Muestra la pregunta actual según el estado de visualización
     */
    displayCurrentQuestion() {
        const question = this.questionDisplay.showingOriginal 
            ? this.questionDisplay.originalQuestion 
            : this.questionDisplay.translatedQuestion;
        
        const answers = this.questionDisplay.showingOriginal 
            ? this.questionDisplay.originalAnswers 
            : this.questionDisplay.translatedAnswers;

        // Actualizar texto de la pregunta
        if (this.elements.challengeQuestionText) {
            this.elements.challengeQuestionText.textContent = question;
            // Ajustar automáticamente el tamaño de la fuente
            this.adjustQuestionTextSize(this.elements.challengeQuestionText);
        }

        // Determinar si es pregunta de verdadero/falso
        const isBooleanQuestion = answers && answers.length === 2 && (
            (answers.some(a => a.toLowerCase().includes('verdadero') || a.toLowerCase().includes('true')) &&
             answers.some(a => a.toLowerCase().includes('falso') || a.toLowerCase().includes('false'))) ||
            (answers[0] === 'Verdadero' && answers[1] === 'Falso') ||
            (answers[0] === 'True' && answers[1] === 'False')
        );

        console.log(`🔍 Análisis de pregunta:`, {
            answersCount: answers?.length,
            answers: answers,
            isBooleanQuestion: isBooleanQuestion,
            questionType: this.challengeEngine?.config?.questionType
        });

        // Actualizar opciones de respuesta
        if (answers && this.elements.challengeAnswerBtns) {
            // Mostrar u ocultar botones según el tipo de pregunta
            this.elements.challengeAnswerBtns.forEach((btn, index) => {
                if (btn) {
                    if (isBooleanQuestion && index >= 2) {
                        // Ocultar botones 3 y 4 para preguntas de verdadero/falso
                        btn.style.display = 'none';
                    } else if (index < answers.length) {
                        // Mostrar y configurar botones necesarios
                        btn.style.display = 'block';
                        btn.textContent = answers[index];
                        btn.disabled = false;
                        btn.className = 'challenge-answer-btn';
                        
                        // Añadir clase especial para preguntas booleanas
                        if (isBooleanQuestion) {
                            btn.classList.add('boolean-answer');
                        }
                    } else {
                        // Ocultar botones no necesarios
                        btn.style.display = 'none';
                    }
                }
            });

            // Ajustar el estilo del contenedor para preguntas booleanas
            const answersContainer = document.querySelector('.challenge-answers');
            if (answersContainer) {
                if (isBooleanQuestion) {
                    answersContainer.classList.add('boolean-answers');
                } else {
                    answersContainer.classList.remove('boolean-answers');
                }
            }

            // Actualizar el indicador de tipo de pregunta
            if (this.elements.challengeQuestionTypeBadge) {
                if (isBooleanQuestion) {
                    this.elements.challengeQuestionTypeBadge.textContent = '✓✗ Verdadero/Falso';
                    this.elements.challengeQuestionTypeBadge.className = 'question-type-badge boolean-type';
                } else {
                    this.elements.challengeQuestionTypeBadge.textContent = '📝 Opción Múltiple';
                    this.elements.challengeQuestionTypeBadge.className = 'question-type-badge multiple-type';
                }
            }
        }

        console.log(`📝 Pregunta mostrada:`, {
            type: isBooleanQuestion ? 'boolean' : 'multiple',
            questionLength: question?.length,
            answersCount: answers?.length
        });
    }

    /**
     * Alterna entre idioma original y traducido
     */
    toggleOriginalLanguage() {
        // Solo permitir toggle si hay diferencias entre original y traducido
        if (this.questionDisplay.originalQuestion === this.questionDisplay.translatedQuestion) {
            console.log('📝 No hay diferencias entre original y traducción');
            return;
        }

        this.questionDisplay.showingOriginal = !this.questionDisplay.showingOriginal;
        this.displayCurrentQuestion();
        this.updateToggleButton();
        
        console.log(`🌐 Cambiado a: ${this.questionDisplay.showingOriginal ? 'Original' : 'Traducido'}`);
    }    /**
     * Actualiza el texto del botón de toggle
     */
    updateToggleButton() {
        if (this.elements.toggleOriginalBtn) {
            // Verificar si hay diferencias para mostrar/ocultar el botón
            const hasDifferences = this.questionDisplay.originalQuestion !== this.questionDisplay.translatedQuestion;
            
            console.log('🔍 Verificando diferencias:', {
                original: this.questionDisplay.originalQuestion,
                translated: this.questionDisplay.translatedQuestion,
                hasDifferences: hasDifferences
            });
            
            // Mostrar siempre el botón para depuración por ahora
            this.elements.toggleOriginalBtn.style.display = 'inline-block';
            
            if (hasDifferences) {
                this.elements.toggleOriginalBtn.textContent = this.questionDisplay.showingOriginal 
                    ? '🌐 Ver Traducción' 
                    : '🌐 Ver Original';
                console.log('✅ Botón de toggle mostrado con diferencias');
            } else {
                this.elements.toggleOriginalBtn.textContent = '🌐 Ver Original (Sin diferencias)';
                console.log('ℹ️ No hay diferencias, pero mostrando botón para depuración');
            }
        } else {
            console.error('❌ toggleOriginalBtn no encontrado en updateToggleButton');
        }
    }

    /**
     * Limpia todos los indicadores de carga activos
     * Útil cuando el juego termina inesperadamente
     */
    clearAllLoadingIndicators() {
        console.log('🧹 Limpiando todos los indicadores de carga...');
        
        // Ocultar carga inicial
        this.hideInitialLoading();
        
        // Ocultar carga de pregunta
        this.hideQuestionLoading();
        
        // Ocultar carga del botón
        this.showButtonLoading(false);
        
        console.log('✅ Todos los indicadores de carga limpiados');
    }

    /**
     * Crea un timeout que se puede cancelar si el juego termina
     */
    createSafeTimeout(callback, delay) {
        if (this.gameEnded) {
            console.log('⚠️ No se creará timeout: el juego ya ha terminado');
            return null;
        }
        
        const timeoutId = setTimeout(() => {
            // Verificar nuevamente si el juego ha terminado
            if (!this.gameEnded) {
                callback();
            } else {
                console.log('⚠️ Timeout cancelado: el juego ha terminado');
            }
            // Remover de la lista de timeouts pendientes
            this.pendingTimeouts.delete(timeoutId);
        }, delay);
        
        // Añadir a la lista de timeouts pendientes
        this.pendingTimeouts.add(timeoutId);
        return timeoutId;
    }

    /**
     * Cancela todos los timeouts pendientes
     */
    cancelAllTimeouts() {
        console.log(`🚫 Cancelando ${this.pendingTimeouts.size} timeouts pendientes...`);
        this.pendingTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.pendingTimeouts.clear();
    }

    /**
     * Detecta si el dispositivo es móvil
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768 
            || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    }

    /**
     * Optimiza la interfaz para dispositivos móviles
     */
    optimizeForMobile() {
        if (!this.isMobileDevice()) return;
        
        console.log('📱 Optimizando interfaz para dispositivo móvil...');
        
        // Añadir clase CSS para móvil
        document.body.classList.add('mobile-device');
        
        // Optimizar viewport
        this.setMobileViewport();
        
        // Prevenir zoom en inputs
        this.preventZoomOnInputs();
        
        // Optimizar scroll
        this.optimizeMobileScroll();
        
        // Manejar orientación
        this.handleOrientationChange();
        
        console.log('✅ Interfaz optimizada para móvil');
    }
    
    /**
     * Configura el viewport para móviles sin restricciones
     */
    setMobileViewport() {
        let viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover';
    }
    
    /**
     * Añade event listener optimizado para móviles
     * @param {Element} element - Elemento DOM
     * @param {Function} callback - Función callback
     * @param {Object} options - Opciones del listener
     * @param {boolean} options.allowPreventDefault - Si permitir preventDefault en el callback (default: false)
     */
    addMobileOptimizedListener(element, callback, options = {}) {
        if (!element) return;
        
        const { allowPreventDefault = false } = options;
        let touchExecuted = false;
        let touchStartTime = 0;
        
        // Touch events para dispositivos móviles
        element.addEventListener('touchstart', (e) => {
            element.classList.add('touch-active');
            touchStartTime = Date.now();
            touchExecuted = false;
        }, { passive: !allowPreventDefault });
        
        element.addEventListener('touchend', (e) => {
            element.classList.remove('touch-active');
            
            // Solo ejecutar si es un tap rápido (menos de 500ms)
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 500 && !touchExecuted) {
                touchExecuted = true;
                callback(e);
                
                // Prevenir el click fantasma que viene después
                setTimeout(() => {
                    touchExecuted = false;
                }, 350);
            }
        }, { passive: !allowPreventDefault });
        
        // Click events para dispositivos de escritorio y como fallback
        element.addEventListener('click', (e) => {
            // Solo ejecutar si no se ejecutó por touch
            if (!touchExecuted) {
                callback(e);
            }
        });
    }
    
    /**
     * Función helper para manejar eventos con prevención de propagación
     * @param {Event} event - Evento a procesar
     * @param {Function} callback - Función a ejecutar
     */
    handleEventWithPrevention(event, callback) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        callback();
    }
    
    /**
     * Configura la prevención de eventos para el modal de confirmación de salida
     */
    setupExitModalEventPrevention() {
        if (!this.elements.challengeExitModal) return;
        
        // Flag para prevenir cierre inmediato después de abrir
        let modalJustOpened = false;
        
        // Método para marcar el modal como recién abierto
        this.markModalAsJustOpened = () => {
            modalJustOpened = true;
            setTimeout(() => {
                modalJustOpened = false;
            }, 500); // Evitar cierre por 500ms después de abrir
        };
        
        // Función helper para prevenir propagación
        const preventPropagation = (e) => e.stopPropagation();
        
        // Prevenir propagación en todo el modal
        this.elements.challengeExitModal.addEventListener('touchstart', preventPropagation, { passive: false });
        this.elements.challengeExitModal.addEventListener('touchend', preventPropagation, { passive: false });
        
        // Manejar click en backdrop
        this.elements.challengeExitModal.addEventListener('click', (e) => {
            if (e.target === this.elements.challengeExitModal && !modalJustOpened) {
                console.log('🖱️ Click en backdrop - cerrando modal');
                this.continueChallenge();
            } else if (modalJustOpened) {
                console.log('🚫 Modal recién abierto - ignorando click en backdrop');
            }
            e.stopPropagation();
        });

        // Prevenir propagación en el contenido del modal
        const modalContent = this.elements.challengeExitModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('touchstart', preventPropagation, { passive: false });
            modalContent.addEventListener('touchend', preventPropagation, { passive: false });
            modalContent.addEventListener('click', preventPropagation);
        }
    }
    
    /**
     * Añade event listener simple usando solo click events
     * Útil para elementos que tienen problemas con touch events
     * @param {Element} element - Elemento DOM
     * @param {Function} callback - Función callback
     */
    addSimpleClickListener(element, callback) {
        if (!element) return;
        
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            callback();
        });
        
        // Añadir efecto visual para touch
        element.addEventListener('touchstart', (e) => {
            element.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            element.classList.remove('touch-active');
        }, { passive: true });
    }

    /**
     * Configuración básica de viewport para móviles
     */
    preventZoomOnInputs() {
        // Configuración básica del viewport sin restricciones excesivas
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
        }
    }
    
    /**
     * Optimiza el scroll para móviles
     */
    optimizeMobileScroll() {
        // Smooth scrolling para navegadores que lo soporten
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Momentum scrolling para iOS
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.overflowScrolling = 'touch';
    }    /**
     * Método de testing para probar la vibración de timeout
     */
    testTimeoutVibration() {
        console.log('🧪 Probando vibración de timeout...');
        this.provideTactileFeedback(null, 'timeout');
        return 'Vibración de timeout enviada (si el dispositivo lo soporta)';
    }

    /**
     * Proporciona feedback táctil para dispositivos móviles
     */
    provideTactileFeedback(element, type = 'light') {
        // Vibración si está disponible
        if (navigator.vibrate) {
            switch (type) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(25);
                    break;
                case 'heavy':
                    navigator.vibrate(50);
                    break;
                case 'error':
                    navigator.vibrate([50, 50, 50]);
                    break;
                case 'success':
                    navigator.vibrate([25, 25, 100]);
                    break;
                case 'timeout':
                    // Patrón distintivo para timeouts: tres pulsos cortos seguidos de uno largo
                    navigator.vibrate([100, 50, 100, 50, 100, 100, 200]);
                    break;
            }
        }
        
        // Feedback visual
        if (element) {
            element.style.transform = 'scale(0.95)';
            setTimeout(() => {
                element.style.transform = '';
            }, 100);
        }
    }
    
    /**
     * Maneja los eventos de orientación en móviles
     */
    handleOrientationChange() {
        if (!this.isMobileDevice()) return;
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayoutForOrientation();
            }, 100);
        });
        
        window.addEventListener('resize', () => {
            if (this.isMobileDevice()) {
                this.adjustLayoutForOrientation();
            }
        });
    }
    
    /**
     * Ajusta el layout según la orientación
     */
    adjustLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const gameContainer = document.querySelector('.challenge-game-container');
        
        if (gameContainer) {
            if (isLandscape && window.innerHeight < 600) {
                gameContainer.classList.add('landscape-mode');
                console.log('📱 Modo paisaje activado');
            } else {
                gameContainer.classList.remove('landscape-mode');
                console.log('📱 Modo retrato activado');
            }        }
    }

    /**
     * Maneja el cambio en el selector de dificultad
     */
    onDifficultyChange(event) {
        const selectedDifficulty = event.target.value;
        console.log(`🎯 Dificultad seleccionada: ${selectedDifficulty}`);
        
        // Mostrar información sobre la dificultad aleatoria
        if (selectedDifficulty === 'random') {
            this.showDifficultyInfo('🎲 Dificultad Aleatoria: Cada pregunta tendrá una dificultad aleatoria (Principiante, Intermedio o Experto)');
        } else {
            this.hideDifficultyInfo();
        }
    }

    /**
     * Maneja el cambio en el selector de tipo de pregunta
     */
    onQuestionTypeChange(event) {
        const selectedType = event.target.value;
        console.log(`📝 Tipo de pregunta seleccionado: ${selectedType}`);
        
        if (selectedType === 'boolean') {
            this.showQuestionTypeInfo('✓✗ Verdadero o Falso: Las preguntas tendrán solo dos opciones. Ideal para respuestas rápidas y conceptos fundamentales.');
        } else if (selectedType === 'mixed') {
            this.showQuestionTypeInfo('🎲 Tipo Mixto: Se alternarán aleatoriamente preguntas de opción múltiple y verdadero/falso. Máxima variedad y desafío.');
        } else {
            this.showQuestionTypeInfo('📝 Opción Múltiple: Las preguntas tendrán 4 opciones. Formato clásico de trivia con mayor variedad de respuestas.');
        }
    }

    /**
     * Muestra información sobre el tipo de pregunta seleccionado
     */
    showQuestionTypeInfo(message) {
        // Buscar o crear el elemento de información
        let infoElement = document.getElementById('question-type-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'question-type-info';
            infoElement.className = 'question-type-info';
            
            // Insertar después del selector de tipo de pregunta
            const typeOption = this.elements.challengeQuestionType.closest('.config-option');
            if (typeOption) {
                typeOption.parentNode.insertBefore(infoElement, typeOption.nextSibling);
            }
        }
        
        infoElement.textContent = message;
        infoElement.style.display = 'block';
        
        // Añadir animación de entrada
        infoElement.classList.add('show');
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            this.hideQuestionTypeInfo();
        }, 5000);
    }

    /**
     * Oculta la información de tipo de pregunta
     */
    hideQuestionTypeInfo() {
        const infoElement = document.getElementById('question-type-info');
        if (infoElement) {
            infoElement.classList.remove('show');
            setTimeout(() => {
                infoElement.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Muestra información sobre la dificultad seleccionada
     */
    showDifficultyInfo(message) {
        // Buscar o crear el elemento de información
        let infoElement = document.getElementById('difficulty-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'difficulty-info';
            infoElement.className = 'difficulty-info';
            
            // Insertar después del selector de dificultad
            const difficultyOption = this.elements.challengeDifficulty.closest('.config-option');
            if (difficultyOption) {
                difficultyOption.parentNode.insertBefore(infoElement, difficultyOption.nextSibling);
            }
        }
        
        infoElement.textContent = message;
        infoElement.style.display = 'block';
        
        // Añadir animación de entrada
        infoElement.classList.add('show');
    }

    /**
     * Oculta la información de dificultad
     */
    hideDifficultyInfo() {
        const infoElement = document.getElementById('difficulty-info');
        if (infoElement) {
            infoElement.classList.remove('show');
            setTimeout(() => {
                infoElement.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Alterna la visibilidad de las categorías adicionales
     */
    toggleAdditionalCategories() {
        console.log('🔄 Ejecutando toggleAdditionalCategories...');
        
        const toggle = this.elements.additionalCategoriesToggle;
        const categories = this.elements.additionalCategories;
        
        if (!toggle || !categories) {
            console.warn('⚠️ Elementos no encontrados:', { toggle: !!toggle, categories: !!categories });
            return;
        }
        
        const isVisible = categories.classList.contains('show');
        console.log('📱 Estado actual de categorías adicionales:', { isVisible });
        
        const toggleSpan = toggle.querySelector('span');
        if (!toggleSpan) {
            console.warn('⚠️ Span del toggle no encontrado');
            return;
        }
        
        if (isVisible) {
            categories.classList.remove('show');
            categories.classList.add('hidden');
            toggleSpan.textContent = '▼ Mostrar categorías adicionales';
            console.log('✅ Categorías adicionales ocultadas');
        } else {
            categories.classList.remove('hidden');
            categories.classList.add('show');
            toggleSpan.textContent = '▲ Ocultar categorías adicionales';
            console.log('✅ Categorías adicionales mostradas');
        }
        
        // Actualizar estadísticas después del cambio
        setTimeout(() => {
            this.showCategoryStats();
        }, 100);
    }

    /**
     * Selecciona todas las categorías
     */
    selectAllCategories() {
        Object.values(this.elements.categoriesCheckboxes).forEach(checkbox => {
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    /**
     * Deselecciona todas las categorías
     */
    deselectAllCategories() {
        Object.values(this.elements.categoriesCheckboxes).forEach(checkbox => {
            if (checkbox) {
                checkbox.checked = false;
            }
        });
    }

    /**
     * Selecciona solo las categorías principales
     */
    selectMainCategories() {
        const mainCategories = ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'];
        
        // Primero deseleccionar todas
        Object.keys(this.elements.categoriesCheckboxes).forEach(categoryKey => {
            const checkbox = this.elements.categoriesCheckboxes[categoryKey];
            if (checkbox) {
                checkbox.checked = mainCategories.includes(categoryKey);
            }
        });
    }

    /**
     * Obtiene las categorías seleccionadas
     */
    getSelectedCategories() {
        const selectedCategories = {};
        
        Object.keys(this.elements.categoriesCheckboxes).forEach(categoryKey => {
            const checkbox = this.elements.categoriesCheckboxes[categoryKey];
            if (checkbox) {
                selectedCategories[categoryKey] = checkbox.checked;
            }
        });
        
        return selectedCategories;
    }

    /**
     * Valida que al menos una categoría esté seleccionada
     */
    validateCategorySelection() {
        const selectedCategories = this.getSelectedCategories();
        const hasSelectedCategories = Object.values(selectedCategories).some(selected => selected);
        
        if (!hasSelectedCategories) {
            this.showError('⚠️ Debes seleccionar al menos una categoría para jugar');
            return false;
        }
        
        return true;
    }

    /**
     * Muestra el estado de las categorías seleccionadas
     */
    showCategoryStats() {
        const selectedCategories = this.getSelectedCategories();
        const selectedCount = Object.values(selectedCategories).filter(selected => selected).length;
        const totalCount = Object.keys(selectedCategories).length;
        
        console.log(`📊 Categorías seleccionadas: ${selectedCount}/${totalCount}`);
        console.log('📋 Categorías activas:', Object.keys(selectedCategories).filter(key => selectedCategories[key]));
        
        return { selectedCount, totalCount, selectedCategories };
    }

    /**
     * Ajusta automáticamente el tamaño de la fuente del texto de la pregunta
     * para que quepa en el contenedor
     * @param {HTMLElement} element - Elemento de texto de la pregunta
     */
    adjustQuestionTextSize(element) {
        if (!element) return;

        // Restaurar tamaño de fuente por defecto
        element.style.fontSize = '';
        element.classList.remove('text-small', 'text-smaller', 'text-tiny');

        // Obtener dimensiones del contenedor
        const containerHeight = element.parentElement.clientHeight;
        const containerWidth = element.parentElement.clientWidth;
        
        // Si el contenedor no tiene dimensiones aún, intentar más tarde
        if (!containerHeight || !containerWidth) {
            setTimeout(() => this.adjustQuestionTextSize(element), 100);
            return;
        }

        // Verificar si el texto se desborda
        const textHeight = element.scrollHeight;
        const textWidth = element.scrollWidth;
        
        // Definir los tamaños de fuente disponibles (usando clases CSS)
        const fontSizeClasses = [
            { class: '', priority: 0 }, // Tamaño normal
            { class: 'text-small', priority: 1 }, // Ligeramente más pequeño
            { class: 'text-smaller', priority: 2 }, // Más pequeño
            { class: 'text-tiny', priority: 3 } // El más pequeño
        ];

        // Función para aplicar una clase de tamaño y verificar si cabe
        const tryFontSize = (fontClass) => {
            // Limpiar clases anteriores
            element.classList.remove('text-small', 'text-smaller', 'text-tiny');
            
            // Aplicar nueva clase si no es vacía
            if (fontClass.class) {
                element.classList.add(fontClass.class);
            }

            // Verificar si ahora cabe (con un pequeño margen de seguridad)
            const newHeight = element.scrollHeight;
            const newWidth = element.scrollWidth;
            const fitsHeight = newHeight <= containerHeight * 0.95;
            const fitsWidth = newWidth <= containerWidth * 0.95;
            
            return fitsHeight && fitsWidth;
        };

        // Intentar cada tamaño de fuente hasta encontrar uno que funcione
        let bestFit = fontSizeClasses[0];
        
        for (const fontClass of fontSizeClasses) {
            if (tryFontSize(fontClass)) {
                bestFit = fontClass;
                break;
            }
        }

        // Aplicar el mejor tamaño encontrado
        element.classList.remove('text-small', 'text-smaller', 'text-tiny');
        if (bestFit.class) {
            element.classList.add(bestFit.class);
        }

        console.log(`📏 Texto de pregunta ajustado:`, {
            originalLength: element.textContent.length,
            containerSize: { width: containerWidth, height: containerHeight },
            appliedClass: bestFit.class || 'normal',
            finalSize: { width: element.scrollWidth, height: element.scrollHeight }
        });
    }

    /**
     * Maneja el evento de advertencia de inactividad
     */
    onInactivityWarning(data) {
        console.log('⚠️ Mostrando advertencia de inactividad');
        
        // Mostrar el modal de inactividad
        this.showInactivityWarning(data.consecutiveTimeouts);
    }

    /**
     * Maneja el evento de resolución de inactividad
     */
    onInactivityResolved(data) {
        console.log('✅ Advertencia de inactividad resuelta');
        
        // Ocultar el modal de inactividad
        this.hideInactivityWarning();
    }

    /**
     * Muestra el modal de advertencia de inactividad
     */
    showInactivityWarning(consecutiveTimeouts) {
        console.log(`⚠️ Mostrando advertencia: ${consecutiveTimeouts} timeouts consecutivos`);
        
        if (this.elements.inactivityWarningModal) {
            this.elements.inactivityWarningModal.classList.add('active');
        } else {
            console.error('❌ Modal de inactividad no encontrado');
        }
    }

    /**
     * Oculta el modal de advertencia de inactividad
     */
    hideInactivityWarning() {
        console.log('✅ Ocultando advertencia de inactividad');
        
        if (this.elements.inactivityWarningModal) {
            this.elements.inactivityWarningModal.classList.remove('active');
        }
    }

    /**
     * Maneja el clic en "Sí, continuar" en la advertencia de inactividad
     */
    onInactivityContinue() {
        console.log('✅ Usuario eligió continuar después de la advertencia');
        
        // Llamar al método del ChallengeEngine
        if (this.challengeEngine) {
            this.challengeEngine.confirmUserActive();
        }
    }

    /**
     * Maneja el clic en "No, salir" en la advertencia de inactividad
     */
    onInactivityQuit() {
        console.log('❌ Usuario eligió salir después de la advertencia');
        
        // Marcar que el juego ha terminado INMEDIATAMENTE para prevenir nuevas acciones
        this.gameEnded = true;
        
        // Cancelar todos los timeouts pendientes antes de limpiar
        this.cancelAllTimeouts();
        
        // Limpiar cualquier indicador de carga activo
        this.clearAllLoadingIndicators();
        
        // Limpiar referencias a elementos DOM que se van a destruir
        this.elements.questionLoading = null;
        this.elements.challengeLoadingScreen = null;
        
        // Llamar al método del ChallengeEngine
        if (this.challengeEngine) {
            this.challengeEngine.confirmUserInactive();
        }
    }

    // ...existing code...
}

// Exportar para uso global
window.ChallengeUI = ChallengeUI;
