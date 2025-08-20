/**
 * Motor del Modo Desafío - Sistema independiente de juego
 * Maneja toda la lógica específica del modo desafío
 */
class ChallengeEngine {
    constructor() {
        this.isActive = false;
        this.questionQueue = []; // Cola de preguntas precargadas para agilizar el gameplay
        
        // Configuración por defecto con todas las categorías disponibles
        this.config = {
            difficulty: 'medium',
            timer: 20,
            mode: 'continuous', // Modo continuo por defecto (no termina por respuestas incorrectas)
            questionType: 'multiple', // Nuevo: tipo de pregunta ('multiple' o 'boolean')
            categories: {
                // Categorías principales
                'historia': true,
                'ciencia': true,
                'deportes': true,
                'arte': true,
                'geografia': true,
                'entretenimiento': true,
                
                // Categorías adicionales - inicialmente desactivadas
                'conocimiento-general': false,
                'libros': false,
                'musica': false,
                'television': false,
                'videojuegos': false,
                'comics': false,
                'anime-manga': false,
                'animacion': false,
                'musicales-teatro': false,
                'juegos-mesa': false,
                'informatica': false,
                'matematicas': false,
                'gadgets': false,
                'mitologia': false,
                'politica': false,
                'celebridades': false,
                'animales': false,
                'vehiculos': false
            }
        };

        this.gameState = {
            currentQuestion: null,
            score: 0,
            streak: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            timeRemaining: 0,
            gameStartTime: null,
            isGameRunning: false,
            lives: -1, // -1 significa vidas ilimitadas en modo continuo
            isAlive: true, // Estado de supervivencia
            consecutiveTimeouts: 0 // Contador de timeouts consecutivos
        };
        
        this.timerInterval = null;
        this.apiClient = null;
        this.pendingTimeouts = new Set(); // Para rastrear timeouts pendientes
    }

    /**
     * Inicializa el motor de desafío con la configuración especificada
     * @param {Object} config - Configuración del desafío
     */
    async initialize(config) {
        console.log('🚀 Inicializando Modo Desafío...');
        
        // Track configuración del desafío
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeSetup(
                config.mode || 'continuous',
                config.timer || 20,
                config.questionCount || 0
            );
        }
        
        // Actualizar configuración
        this.config = { ...this.config, ...config };
        
        // Inicializar cliente API
        if (!this.apiClient) {
            console.log('🔧 Creando nueva instancia de ApiClient...');
            this.apiClient = new ApiClient();
        }
        
        // Mostrar estadísticas de categorías
        const categoryStats = this.getCategoryStats();
        console.log('📊 Estadísticas de categorías:', categoryStats);
        
        // Validar que hay categorías habilitadas
        if (categoryStats.enabled === 0) {
            throw new Error('No hay categorías habilitadas para el desafío');
        }
        
        // Resetear estado del juego
        this.resetGameState();
        
        console.log('✅ Modo Desafío inicializado con', categoryStats.enabled, 'categorías');
        console.log('🎯 Categorías activas:', categoryStats.list);
        
        return true;
    }

    /**
     * Resetea el estado del juego a valores iniciales
     */
    resetGameState() {
        this.gameState = {
            currentQuestion: null,
            score: 0,
            streak: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            timeRemaining: this.config.timer || 0, // 0 significa tiempo ilimitado
            gameStartTime: null,
            isGameRunning: false,
            lives: this.config.mode === 'survival' ? 1 : -1, // -1 significa vidas ilimitadas
            isAlive: true, // Estado de supervivencia
            consecutiveTimeouts: 0 // Resetear contador de timeouts consecutivos
        };
        this.questionQueue = []; // Resetear cola de preguntas precargadas
        this.pendingTimeouts = new Set(); // Limpiar timeouts pendientes
    }

    /**
     * Inicia una nueva partida de desafío
     */
    async startChallenge() {
        console.log('🎯 Iniciando nuevo desafío...');
        
        try {
            this.resetGameState();
            this.gameState.gameStartTime = Date.now();
            this.gameState.isGameRunning = true;
            this.isActive = true;

            // Track inicio del desafío
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengeStart(
                    this.config.mode || 'continuous',
                    this.config.timer || 20
                );
            }

            // Precargar 2 preguntas al inicio para mejorar la fluidez
            console.log('📦 Precargando 2 preguntas iniciales...');
            await this.preloadInitialQuestions(2);
            
            // Cargar primera pregunta desde la cola
            await this.loadNextQuestionFromQueue();
            
            // Disparar evento de inicio (SIN iniciar temporizador aquí)
            this.dispatchEvent('challengeStarted', {
                config: this.config,
                gameState: this.gameState
            });

            console.log('✅ Desafío iniciado correctamente con', this.questionQueue.length + 1, 'preguntas cargadas');
            return true;

        } catch (error) {
            console.error('❌ Error al iniciar desafío:', error);
            
            // Track error en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackError('CHALLENGE_START_ERROR', error.message);
            }
            
            this.dispatchEvent('challengeError', { error: error.message });
            return false;
        }
    }

    /**
     * Precarga un número específico de preguntas al inicio del desafío
     * @param {number} amount - Cantidad de preguntas a precargar
     */
    async preloadInitialQuestions(amount = 2) {
        console.log(`⚡ Precargando ${amount} preguntas iniciales...`);
        
        const promises = [];
        for (let i = 0; i < amount; i++) {
            promises.push(this.generateSingleQuestion());
        }
        
        try {
            const questions = await Promise.all(promises);
            this.questionQueue = questions.filter(q => q !== null);
            console.log(`✅ ${this.questionQueue.length} preguntas precargadas correctamente`);
        } catch (error) {
            console.warn('⚠️ Error al precargar preguntas:', error);
            this.questionQueue = [];
        }
    }

    /**
     * Carga la siguiente pregunta desde la cola o genera una nueva
     */
    async loadNextQuestionFromQueue() {
        try {
            let question = null;
            
            // Si hay preguntas en la cola, usar la primera
            if (this.questionQueue.length > 0) {
                question = this.questionQueue.shift();
                console.log('📤 Pregunta cargada desde la cola. Quedan:', this.questionQueue.length);
            } else {
                // Si no hay preguntas en la cola, generar una nueva
                console.log('🔄 Cola vacía, generando nueva pregunta...');
                question = await this.generateSingleQuestion();
            }
            
            // Si no se pudo obtener pregunta, usar una de emergencia
            if (!question) {
                console.warn('🚨 Usando pregunta de emergencia');
                question = this.createTestQuestion(this.getEffectiveDifficulty());
            }
            
            this.gameState.currentQuestion = question;
            this.gameState.timeRemaining = this.config.timer || 0;

            // Disparar evento de nueva pregunta
            this.dispatchEvent('newChallengeQuestion', {
                question: question,
                gameState: this.gameState
            });

            // Precargar otra pregunta en segundo plano para mantener la cola
            if (this.questionQueue.length < 2) {
                this.preloadBackgroundQuestion();
            }

            console.log('📝 Pregunta cargada desde cola:', question.pregunta);
            
        } catch (error) {
            console.error('❌ Error crítico al cargar pregunta desde cola:', error);
            
            // Como último recurso, usar una pregunta de emergencia
            const emergencyQuestion = this.createTestQuestion(this.getEffectiveDifficulty());
            this.gameState.currentQuestion = emergencyQuestion;
            this.gameState.timeRemaining = this.config.timer || 0;

            this.dispatchEvent('newChallengeQuestion', {
                question: emergencyQuestion,
                gameState: this.gameState
            });
        }
    }

    /**
     * Genera una sola pregunta (método auxiliar)
     */
    async generateSingleQuestion() {
        try {
            // Obtener categorías habilitadas
            const enabledCategories = this.getEnabledCategories();
            if (enabledCategories.length === 0) {
                throw new Error('No hay categorías seleccionadas');
            }

            // Seleccionar categoría aleatoria
            const randomCategory = enabledCategories[Math.floor(Math.random() * enabledCategories.length)];
            const effectiveDifficulty = this.getEffectiveDifficulty();
            
            // Seleccionar tipo de pregunta efectivo (puede ser aleatorio para tipo mixto)
            const effectiveQuestionType = this.getEffectiveQuestionType();
            
            console.log(`🎲 Generando pregunta: ${randomCategory}, dificultad: ${effectiveDifficulty}, tipo: ${effectiveQuestionType}`);
            
            let question = null;

            try {
                // Intentar cargar pregunta de la API
                const questions = await this.apiClient.getQuestions(randomCategory, effectiveDifficulty, 1, effectiveQuestionType);
                if (questions && questions.length > 0) {
                    question = this.convertApiQuestionToChallengeFormat(questions[0], effectiveDifficulty);
                }
            } catch (apiError) {
                // Comprobar si es un error de rate limiting para ajustar la estrategia
                if (apiError.message.includes('Rate Limit') || apiError.message.includes('429')) {
                    console.warn('⚠️ Rate limit detectado, reduciendo precarga en segundo plano');
                    // Podríamos reducir la precarga automática aquí
                } else {
                    console.warn('⚠️ Error de API al generar pregunta:', apiError.message);
                }
            }

            // Si no se pudo obtener de la API, usar pregunta de prueba
            if (!question) {
                question = this.createTestQuestion(effectiveDifficulty);
            }

            return question;
            
        } catch (error) {
            console.error('❌ Error al generar pregunta individual:', error);
            return null;
        }
    }

    /**
     * Precarga una pregunta en segundo plano para mantener la cola
     */
    async preloadBackgroundQuestion() {
        if (!this.gameState.isGameRunning) {
            return; // No precargar si el juego no está activo
        }

        // Reducir la precarga agresiva para evitar rate limiting
        if (this.questionQueue.length >= 2) {
            console.log('📋 Cola tiene suficientes preguntas, omitiendo precarga');
            return;
        }

        try {
            console.log('⚡ Precargando pregunta en segundo plano...');
            const question = await this.generateSingleQuestion();
            
            if (question && this.questionQueue.length < 2) { // Reducido de 3 a 2
                this.questionQueue.push(question);
                console.log('🎯 Pregunta precargada en segundo plano. Cola:', this.questionQueue.length);
            }
        } catch (error) {
            // Si hay errores de rate limiting, ser menos agresivo con la precarga
            if (error.message.includes('Rate Limit') || error.message.includes('429')) {
                console.warn('⚠️ Rate limit en precarga, reduciendo frecuencia');
            } else {
                console.error('❌ Error en precarga de segundo plano:', error.message);
            }
            // No es crítico, el juego puede continuar
        }
    }

    /**
     * Carga la siguiente pregunta del desafío (método legacy - ahora usa la cola)
     */
    async loadNextQuestion() {
        // Redirigir al nuevo método basado en cola
        return this.loadNextQuestionFromQueue();
    }

    /**
     * Carga una pregunta desde la API (método separado para reutilización)
     */
    async loadQuestionFromAPI() {
        // Obtener categorías habilitadas usando el nuevo método
        const enabledCategories = this.getEnabledCategories();

        if (enabledCategories.length === 0) {
            throw new Error('No hay categorías seleccionadas');
        }

        // Seleccionar categoría aleatoria
        const randomCategory = enabledCategories[Math.floor(Math.random() * enabledCategories.length)];
        
        // Obtener dificultad efectiva (puede ser aleatoria)
        const effectiveDifficulty = this.getEffectiveDifficulty();
        
        // Obtener tipo de pregunta efectivo (puede ser aleatorio para tipo mixto)
        const effectiveQuestionType = this.getEffectiveQuestionType();
        
        console.log(`🎲 Categoría seleccionada: ${randomCategory}, dificultad: ${effectiveDifficulty}, tipo: ${effectiveQuestionType}`);
        
        // Mostrar nombre de categoría en español si está disponible
        if (this.apiClient && this.apiClient.getCategoryDisplayName) {
            const displayName = this.apiClient.getCategoryDisplayName(randomCategory);
            console.log(`📚 Categoría (mostrar): ${displayName}`);
        }
        
        let question = null;

        try {
            // Intentar cargar pregunta de la API
            console.log('🔄 Solicitando pregunta a la API...');
            const questions = await this.apiClient.getQuestions(randomCategory, effectiveDifficulty, 1, effectiveQuestionType);
            console.log('📦 Respuesta de la API:', questions);
              
            if (questions && questions.length > 0) {
                const apiQuestion = questions[0];
                console.log('🔧 Pregunta antes de conversión:', apiQuestion);
                question = this.convertApiQuestionToChallengeFormat(apiQuestion, effectiveDifficulty);
                console.log('✅ Pregunta después de conversión:', question);
            }
        } catch (apiError) {
            console.warn('⚠️ Error de API, intentando con pregunta de prueba:', apiError);
        }

        // Si no se pudo obtener de la API, usar pregunta de prueba
        if (!question) {
            console.log('🧪 Usando pregunta de prueba...');
            question = this.createTestQuestion(effectiveDifficulty);
        }

        this.gameState.currentQuestion = question;
        this.gameState.timeRemaining = this.config.timer || 0;

        // Disparar evento de nueva pregunta
        this.dispatchEvent('newChallengeQuestion', {
            question: question,
            gameState: this.gameState
        });

        console.log('📝 Nueva pregunta cargada exitosamente:', question.pregunta);
    }

    /**
     * Convierte una pregunta del formato API al formato esperado por el desafío
     * @param {Object} apiQuestion - Pregunta en formato API
     * @returns {Object} Pregunta en formato del desafío
     */
    convertApiQuestionToChallengeFormat(apiQuestion, effectiveDifficulty = null) {
        console.log('🔄 Convirtiendo pregunta de API:', apiQuestion);
          
        // Verificar si es formato API (con campo 'question') o fallback (con campo 'question' también)
        if (apiQuestion.question && apiQuestion.answers) {
            // Formato API o fallback moderno
            const convertedQuestion = {
                pregunta: apiQuestion.question,
                opciones: apiQuestion.answers,
                respuesta_correcta: apiQuestion.answers[apiQuestion.correct],
                categoria: apiQuestion.category || 'general',
                dificultad: effectiveDifficulty || apiQuestion.difficulty || 'medium',
                fuente: apiQuestion.source || 'api',
                originalQuestion: apiQuestion.originalQuestion || apiQuestion.question,
                originalAnswers: apiQuestion.originalAnswers || apiQuestion.answers,
                translatedQuestion: apiQuestion.translatedQuestion || apiQuestion.question,
                translatedAnswers: apiQuestion.translatedAnswers || apiQuestion.answers            
            };
            
            // Debug: Verificar si hay diferencias reales entre original y traducido
            const hasOriginalDifferences = convertedQuestion.originalQuestion !== convertedQuestion.pregunta ||
                JSON.stringify(convertedQuestion.originalAnswers) !== JSON.stringify(convertedQuestion.opciones);
            
            console.log('🔍 Verificación de diferencias:', {
                originalQuestion: convertedQuestion.originalQuestion,
                translatedQuestion: convertedQuestion.pregunta,
                originalAnswers: convertedQuestion.originalAnswers,
                translatedAnswers: convertedQuestion.opciones,
                hasOriginalDifferences: hasOriginalDifferences
            });
            
            console.log('✅ Pregunta convertida con información original preservada:', convertedQuestion);
            return convertedQuestion;
        } else {
            // Intentar otros formatos posibles
            console.warn('Formato de pregunta desconocido:', apiQuestion);
            const convertedQuestion = {
                pregunta: apiQuestion.pregunta || apiQuestion.question || 'Pregunta no disponible',
                opciones: apiQuestion.opciones || apiQuestion.answers || [],
                respuesta_correcta: apiQuestion.respuesta_correcta || (apiQuestion.opciones ? apiQuestion.opciones[0] : 'Sin respuesta'),
                categoria: apiQuestion.categoria || apiQuestion.category || 'general',
                dificultad: effectiveDifficulty || apiQuestion.dificultad || apiQuestion.difficulty || 'medium',
                fuente: apiQuestion.fuente || apiQuestion.source || 'unknown',
                originalQuestion: apiQuestion.originalQuestion || apiQuestion.pregunta || apiQuestion.question || 'Pregunta no disponible',
                originalAnswers: apiQuestion.originalAnswers || apiQuestion.opciones || apiQuestion.answers || []
            };
            
            console.log('⚠️ Pregunta de formato desconocido convertida:', convertedQuestion);
            return convertedQuestion;
        }
    }

    /**
     * Procesa la respuesta del jugador
     * @param {string} answer - Respuesta seleccionada
     */
    async processAnswer(answer) {
        if (!this.gameState.isGameRunning || !this.gameState.currentQuestion) {
            return;
        }

        // Calcular tiempo de respuesta
        const responseTime = this.config.timer - this.gameState.timeRemaining;

        // Parar temporizador
        this.stopTimer();

        const isCorrect = answer === this.gameState.currentQuestion.respuesta_correcta;
        this.gameState.questionsAnswered++;
        
        // Resetear contador de timeouts consecutivos ya que el usuario respondió
        this.gameState.consecutiveTimeouts = 0;

        // Track respuesta en challenge
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeQuestion(
                this.gameState.questionsAnswered,
                this.gameState.timeRemaining,
                isCorrect,
                responseTime
            );
        }

        if (isCorrect) {
            this.gameState.correctAnswers++;
            this.gameState.streak++;
            this.gameState.score += this.calculateScore();
            
            // Track racha si es significativa
            if (window.trivialAnalytics && this.gameState.streak >= 3) {
                window.trivialAnalytics.trackChallengeStreak(
                    this.config.mode || 'continuous',
                    this.gameState.streak,
                    'correct'
                );
            }
            
            // Track bonus por velocidad si respondió rápido
            if (responseTime <= 5 && window.trivialAnalytics) {
                const bonusPoints = Math.floor((5 - responseTime) * 10);
                window.trivialAnalytics.trackChallengeSpeedBonus(
                    this.config.mode || 'continuous',
                    bonusPoints,
                    responseTime
                );
            }
            
            console.log('✅ Respuesta correcta! Puntuación:', this.gameState.score);
        } else {
            this.gameState.streak = 0;
            console.log('❌ Respuesta incorrecta. Streak perdido.');
        }

        // Disparar evento de respuesta procesada
        this.dispatchEvent('challengeAnswerProcessed', {
            isCorrect,
            correctAnswer: this.gameState.currentQuestion.respuesta_correcta,
            gameState: this.gameState
        });

        // En el nuevo modo continuo, SIEMPRE continuar a la siguiente pregunta
        await this.handleQuestionResult(isCorrect);
    }

    /**
     * Maneja el resultado de una pregunta y decide el siguiente paso
     * @param {boolean} isCorrect - Si la respuesta fue correcta
     */
    async handleQuestionResult(isCorrect) {
        console.log(`🎯 Procesando resultado: ${isCorrect ? 'Correcto' : 'Incorrecto'}`);
        
        if (isCorrect) {
            console.log(`✅ ¡Respuesta correcta! Racha: ${this.gameState.streak}, Puntuación: ${this.gameState.score}`);
        } else {
            console.log('❌ Respuesta incorrecta, pero el juego continúa');
        }
        
        // En el nuevo modo continuo, SIEMPRE continuar a la siguiente pregunta
        console.log('🔄 Continuando con la siguiente pregunta...');
        
        // Continuar con la siguiente pregunta después de una pausa
        this.createSafeTimeout(async () => {
            if (this.gameState.isGameRunning && this.gameState.isAlive) {
                await this.loadNextQuestion();
                // NO iniciar timer aquí - se iniciará cuando la UI esté lista
                // this.startTimer(); // Movido al UI
            }
        }, 2000);
    }

    /**
     * Calcula la puntuación basada en el tiempo restante y racha
     */
    calculateScore() {
        const baseScore = 100;
        
        // Si es tiempo ilimitado (timer = 0), no dar bonificación de tiempo
        const timeBonus = (this.config.timer === 0) ? 0 : this.gameState.timeRemaining * 2;
        const streakBonus = this.gameState.streak * 10;
        const difficultyMultiplier = this.getDifficultyMultiplier();
        
        // Bonificación especial por jugar sin límite de tiempo (menos puntos base)
        const unlimitedTimePenalty = (this.config.timer === 0) ? 0.8 : 1.0;

        return Math.floor((baseScore + timeBonus + streakBonus) * difficultyMultiplier * unlimitedTimePenalty);
    }

    /**
     * Obtiene el multiplicador basado en la dificultad
     */
    getDifficultyMultiplier() {
        const multipliers = {
            easy: 1.0,
            medium: 1.2,
            hard: 1.5,
            random: 1.3 // Multiplicador promedio para dificultad aleatoria
        };
        
        // Si es dificultad aleatoria, usar el multiplicador de la dificultad efectiva actual
        let effectiveDifficulty = this.config.difficulty;
        if (this.config.difficulty === 'random' && this.gameState.currentQuestion) {
            // Usar la dificultad de la pregunta actual si está disponible
            effectiveDifficulty = this.gameState.currentQuestion.dificultad || 'medium';
        }
        
        return multipliers[effectiveDifficulty] || 1.0;
    }

    /**
     * Inicia el temporizador de la pregunta actual (método público para llamar desde UI)
     */
    startQuestionTimer() {
        console.log('⏱️ Iniciando temporizador desde UI cuando la pregunta está lista...');
        this.startTimer();
    }

    /**
     * Inicia el temporizador de la pregunta current (método público)
     */
    startTimer() {
        this.stopTimer(); // Asegurarse de limpiar cualquier temporizador previo

        // Si el tiempo está configurado a 0, no iniciar temporizador (tiempo ilimitado)
        if (this.config.timer === 0) {
            console.log('⏳ Modo sin límite de tiempo activado');
            this.gameState.timeRemaining = 0; // Indicar tiempo ilimitado
            
            // Disparar evento de actualización para mostrar "Sin límite"
            this.dispatchEvent('challengeTimerUpdate', {
                timeRemaining: 0,
                isUnlimited: true
            });
            return;
        }

        // IMPORTANTE: Reiniciar el tiempo al valor completo del timer
        this.gameState.timeRemaining = this.config.timer;
        console.log(`⏱️ Timer reiniciado a ${this.config.timer} segundos`);
        
        // Disparar evento inicial para mostrar el tiempo completo
        this.dispatchEvent('challengeTimerUpdate', {
            timeRemaining: this.gameState.timeRemaining,
            isUnlimited: false
        });

        this.timerInterval = setInterval(() => {
            this.gameState.timeRemaining--;

            // Disparar evento de actualización del temporizador
            this.dispatchEvent('challengeTimerUpdate', {
                timeRemaining: this.gameState.timeRemaining,
                isUnlimited: false
            });

            // Si se acaba el tiempo
            if (this.gameState.timeRemaining <= 0) {
                this.handleTimeOut();
            }
        }, 1000);
    }

    /**
     * Detiene el temporizador current
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Reanuda el temporizador (igual que startTimer pero sin reiniciar el tiempo)
     */
    resumeTimer() {
        this.stopTimer(); // Limpiar cualquier temporizador previo

        // Si el tiempo está configurado a 0, no iniciar temporizador (tiempo ilimitado)
        if (this.config.timer === 0) {
            console.log('⏳ Reanudando en modo sin límite de tiempo');
            this.dispatchEvent('challengeTimerUpdate', {
                timeRemaining: 0,
                isUnlimited: true
            });
            return;
        }

        console.log(`⏱️ Reanudando timer con ${this.gameState.timeRemaining} segundos restantes`);
        
        // Disparar evento inicial para mostrar el tiempo actual
        this.dispatchEvent('challengeTimerUpdate', {
            timeRemaining: this.gameState.timeRemaining,
            isUnlimited: false
        });

        this.timerInterval = setInterval(() => {
            this.gameState.timeRemaining--;

            // Disparar evento de actualización del temporizador
            this.dispatchEvent('challengeTimerUpdate', {
                timeRemaining: this.gameState.timeRemaining,
                isUnlimited: false
            });

            // Si se acaba el tiempo
            if (this.gameState.timeRemaining <= 0) {
                this.handleTimeOut();
            }
        }, 1000);
    }

    /**
     * Maneja cuando se acaba el tiempo para responder
     */
    handleTimeOut() {
        console.log('⏰ Tiempo agotado!');
        this.stopTimer();
        
        // Procesar como respuesta incorrecta
        this.processTimeOut();
    }

    /**
     * Procesa el timeout como respuesta incorrecta
     */
    async processTimeOut() {
        // Verificar que tenemos una pregunta actual
        if (!this.gameState.currentQuestion) {
            console.error('❌ processTimeOut: No hay pregunta actual');
            this.endChallenge();
            return;
        }

        this.gameState.questionsAnswered++;
        this.gameState.streak = 0;
        
        // Incrementar contador de timeouts consecutivos
        this.gameState.consecutiveTimeouts++;
        console.log(`⏰ Timeout ${this.gameState.consecutiveTimeouts}/3`);

        // Track timeout en analytics
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeTimeout(
                this.config.mode || 'continuous',
                this.gameState.currentQuestion.categoria || 'unknown',
                this.config.timer || 20
            );
        }

        // Disparar evento de timeout
        this.dispatchEvent('challengeTimeOut', {
            correctAnswer: this.gameState.currentQuestion.respuesta_correcta,
            gameState: this.gameState,
            consecutiveTimeouts: this.gameState.consecutiveTimeouts
        });

        // Verificar si hemos alcanzado 3 timeouts consecutivos
        if (this.gameState.consecutiveTimeouts >= 3) {
            console.log('⚠️ 3 timeouts consecutivos detectados - Activando advertencia de inactividad');
            this.handleInactivityWarning();
            return; // No continuar con la siguiente pregunta
        }

        // Continuar normalmente si no hay 3 timeouts consecutivos
        console.log('⏰ Tiempo agotado, pero el juego continúa');
        
        // Continuar con la siguiente pregunta después de una pausa
        this.createSafeTimeout(async () => {
            if (this.gameState.isGameRunning && this.gameState.isAlive) {
                await this.loadNextQuestion();
                // NO iniciar timer aquí - se iniciará cuando la UI esté lista
                // this.startTimer(); // Movido al UI
            }
        }, 2000);
    }

    /**
     * Maneja la advertencia de inactividad después de 3 timeouts consecutivos
     */
    handleInactivityWarning() {
        console.log('⚠️ Mostrando advertencia de inactividad');
        
        // Cancelar todos los timeouts pendientes para evitar que continúe cargando preguntas
        this.cancelAllTimeouts();
        
        // Pausar el juego
        this.pauseChallenge();
        
        // Track evento de inactividad
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeInactivity(
                this.config.mode || 'continuous',
                this.gameState.questionsAnswered,
                this.gameState.score
            );
        }
        
        // Disparar evento para que la UI muestre el modal de advertencia
        this.dispatchEvent('challengeInactivityWarning', {
            consecutiveTimeouts: this.gameState.consecutiveTimeouts,
            gameState: this.gameState
        });
    }

    /**
     * Confirma que el usuario sigue activo (botón "Sí")
     */
    confirmUserActive() {
        console.log('✅ Usuario confirmó que sigue activo');
        
        // Resetear contador de timeouts
        this.gameState.consecutiveTimeouts = 0;
        
        // Track confirmación de actividad
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeActivityConfirmed(
                this.config.mode || 'continuous',
                this.gameState.questionsAnswered
            );
        }
        
        // Disparar evento para cerrar el modal
        this.dispatchEvent('challengeInactivityResolved', {
            userActive: true,
            gameState: this.gameState
        });
        
        // Reanudar el juego
        this.resumeChallenge();
    }

    /**
     * El usuario confirma que no quiere continuar (botón "No")
     */
    confirmUserInactive() {
        console.log('❌ Usuario confirmó que no quiere continuar');
        
        // Cancelar todos los timeouts pendientes inmediatamente
        this.cancelAllTimeouts();
        
        // Detener el temporizador si está activo
        this.stopTimer();
        
        // Marcar el juego como inactivo
        this.gameState.isGameRunning = false;
        this.gameState.isAlive = false;
        
        // Track abandono por inactividad
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeAbandonedInactivity(
                this.config.mode || 'continuous',
                this.gameState.questionsAnswered,
                this.gameState.score
            );
        }
        
        // Disparar evento para cerrar el modal
        this.dispatchEvent('challengeInactivityResolved', {
            userActive: false,
            gameState: this.gameState
        });
        
        // Terminar el desafío
        this.endChallenge();
    }

    /**
     * Obtiene estadísticas de timeouts (método de debugging)
     */
    getTimeoutStats() {
        return {
            consecutiveTimeouts: this.gameState.consecutiveTimeouts,
            isWarningActive: this.gameState.consecutiveTimeouts >= 3
        };
    }

    /**
     * Método de testing para simular timeouts consecutivos
     * @param {number} count - Número de timeouts a simular
     */
    simulateTimeouts(count = 1) {
        console.log(`🧪 Simulando ${count} timeout(s) para testing`);
        
        for (let i = 0; i < count; i++) {
            this.gameState.consecutiveTimeouts++;
            console.log(`⏰ Timeout simulado ${this.gameState.consecutiveTimeouts}/3`);
            
            if (this.gameState.consecutiveTimeouts >= 3) {
                console.log('⚠️ 3 timeouts alcanzados, activando advertencia');
                this.handleInactivityWarning();
                break;
            }
        }
        
        return this.getTimeoutStats();
    }

    /**
     * Crea un timeout que se puede cancelar si el juego termina
     */
    createSafeTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            this.pendingTimeouts.delete(timeoutId);
            // Verificar que el juego sigue activo antes de ejecutar callback
            if (this.gameState.isGameRunning && this.gameState.isAlive) {
                callback();
            } else {
                console.log('⏰ Timeout cancelado: juego ya no está activo');
            }
        }, delay);
        
        this.pendingTimeouts.add(timeoutId);
        console.log(`⏰ Timeout creado: ${timeoutId}, total pendientes: ${this.pendingTimeouts.size}`);
        return timeoutId;
    }

    /**
     * Cancela todos los timeouts pendientes
     */
    cancelAllTimeouts() {
        console.log(`🧹 Cancelando ${this.pendingTimeouts.size} timeouts pendientes`);
        for (const timeoutId of this.pendingTimeouts) {
            clearTimeout(timeoutId);
        }
        this.pendingTimeouts.clear();
    }

    /**
     * Termina el desafío actual
     */
    endChallenge() {
        console.log('🏁 Finalizando desafío...');
        
        this.stopTimer();
        this.cancelAllTimeouts(); // Cancelar todos los timeouts pendientes
        this.gameState.isGameRunning = false;
        this.isActive = false;

        const gameResults = {
            score: this.gameState.score,
            questionsAnswered: this.gameState.questionsAnswered,
            correctAnswers: this.gameState.correctAnswers,
            accuracy: this.gameState.questionsAnswered > 0 
                ? Math.round((this.gameState.correctAnswers / this.gameState.questionsAnswered) * 100) 
                : 0,
            maxStreak: this.gameState.streak,
            duration: Date.now() - this.gameState.gameStartTime,
            difficulty: this.config.difficulty
        };

        // Track finalización del desafío
        if (window.trivialAnalytics) {
            const timeUsed = Math.round(gameResults.duration / 1000);
            
            window.trivialAnalytics.trackChallengeComplete(
                this.config.mode || 'continuous',
                gameResults.score,
                timeUsed,
                gameResults.correctAnswers,
                gameResults.questionsAnswered
            );
        }

        // Disparar evento de fin de desafío
        this.dispatchEvent('challengeEnded', { results: gameResults });

        console.log('📊 Resultados del desafío:', gameResults);
        return gameResults;
    }

    /**
     * Pausa el desafío actual
     */
    pauseChallenge() {
        if (this.gameState.isGameRunning) {
            this.stopTimer();
            
            // Track pausa en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengePause(
                    this.config.mode || 'continuous',
                    this.gameState.questionsAnswered,
                    this.gameState.score
                );
            }
            
            this.dispatchEvent('challengePaused', { gameState: this.gameState });
            console.log('⏸️ Desafío pausado');
        }
    }

    /**
     * Reanuda el desafío pausado
     */
    resumeChallenge() {
        if (this.gameState.isGameRunning && this.gameState.currentQuestion) {
            this.resumeTimer(); // Cambio: usar resumeTimer en lugar de startTimer
            
            // Track reanudación en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengeResume(
                    this.config.mode || 'continuous',
                    this.gameState.questionsAnswered,
                    this.gameState.score
                );
            }
            
            this.dispatchEvent('challengeResumed', { gameState: this.gameState });
            console.log('▶️ Desafío reanudado');
        }
    }

    /**
     * Obtiene las estadísticas actuales del desafío
     */
    getStats() {
        return {
            ...this.gameState,
            accuracy: this.gameState.questionsAnswered > 0 
                ? Math.round((this.gameState.correctAnswers / this.gameState.questionsAnswered) * 100) 
                : 0,
            elapsedTime: this.gameState.gameStartTime 
                ? Date.now() - this.gameState.gameStartTime 
                : 0
        };
    }

    /**
     * Dispara un evento personalizado
     * @param {string} eventName - Nombre del evento
     * @param {Object} data - Datos del evento
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * Limpia recursos y resetea el motor
     */
    cleanup() {
        this.stopTimer();
        this.cancelAllTimeouts(); // Cancelar todos los timeouts pendientes
        this.resetGameState();
        this.questionQueue = []; // Limpiar cola de preguntas
        this.isActive = false;
        console.log('🧹 Motor de desafío limpiado');
    }

    /**
     * Selecciona una dificultad aleatoria si está configurada como 'random'
     */
    getEffectiveDifficulty() {
        if (this.config.difficulty === 'random') {
            const difficulties = ['easy', 'medium', 'hard'];
            const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
            console.log(`🎲 Dificultad aleatoria seleccionada: ${randomDifficulty}`);
            return randomDifficulty;
        }
        return this.config.difficulty;
    }

    /**
     * Selecciona un tipo de pregunta aleatorio si está configurado como 'mixed'
     */
    getEffectiveQuestionType() {
        if (this.config.questionType === 'mixed') {
            const types = ['multiple', 'boolean'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            console.log(`🎲 Tipo de pregunta aleatorio seleccionado: ${randomType}`);
            return randomType;
        }
        return this.config.questionType;
    }

    /**
     * Crea una pregunta de prueba para testing
     */    
    createTestQuestion(effectiveDifficulty = 'medium') {
        const testQuestions = [
            {
                pregunta: "¿Cuál es la capital de Francia?",
                opciones: ["París", "Londres", "Madrid", "Roma"],
                respuesta_correcta: "París",
                categoria: "geografia",
                dificultad: effectiveDifficulty,
                fuente: "test",
                type: "multiple",
                originalQuestion: "What is the capital of France?",
                originalAnswers: ["Paris", "London", "Madrid", "Rome"]
            },
            {
                pregunta: "¿En qué año terminó la Segunda Guerra Mundial?",
                opciones: ["1945", "1944", "1946", "1943"],
                respuesta_correcta: "1945",
                categoria: "historia",
                dificultad: effectiveDifficulty,
                fuente: "test",
                type: "multiple",
                originalQuestion: "In what year did World War II end?",
                originalAnswers: ["1945", "1944", "1946", "1943"]
            },
            {
                pregunta: "¿El sol es una estrella?",
                opciones: ["Verdadero", "Falso"],
                respuesta_correcta: "Verdadero",
                categoria: "ciencia",
                dificultad: effectiveDifficulty,
                fuente: "test",
                type: "boolean",
                originalQuestion: "Is the sun a star?",
                originalAnswers: ["True", "False"]
            },
            {
                pregunta: "¿JavaScript fue inventado en 1995?",
                opciones: ["Verdadero", "Falso"],
                respuesta_correcta: "Verdadero",
                categoria: "informatica",
                dificultad: effectiveDifficulty,
                fuente: "test",
                type: "boolean",
                originalQuestion: "Was JavaScript invented in 1995?",
                originalAnswers: ["True", "False"]
            }
        ];
        
        // Filtrar según el tipo de pregunta configurado
        let availableQuestions = testQuestions;
        const effectiveType = this.getEffectiveQuestionType();
        
        if (effectiveType === 'boolean') {
            availableQuestions = testQuestions.filter(q => q.type === 'boolean');
        } else if (effectiveType === 'multiple') {
            availableQuestions = testQuestions.filter(q => q.type === 'multiple');
        }
        // Si es 'mixed', usar todas las preguntas disponibles
        
        const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        console.log(`🧪 Pregunta de prueba creada (${selectedQuestion.type}):`, selectedQuestion);
        return selectedQuestion;
    }

    /**
     * Obtiene las categorías habilitadas y válidas
     */
    getEnabledCategories() {
        // Obtener todas las categorías configuradas
        const allCategories = Object.keys(this.config.categories);
        
        // Filtrar solo las categorías que están habilitadas
        const enabledCategories = allCategories.filter(category => 
            this.config.categories[category] === true
        );
        
        console.log(`🎯 Categorías habilitadas: ${enabledCategories.length}`, enabledCategories);
        return enabledCategories;
    }

    /**
     * Obtiene estadísticas de categorías
     */
    getCategoryStats() {
        const enabledCategories = this.getEnabledCategories();
        
        return {
            total: Object.keys(this.config.categories).length,
            enabled: enabledCategories.length,
            list: enabledCategories
        };
    }
}

// Exportar para uso global
window.ChallengeEngine = ChallengeEngine;
