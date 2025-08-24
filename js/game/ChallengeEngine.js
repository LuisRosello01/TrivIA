/**
 * Motor del Modo Desafío - Sistema independiente de juego
 * Maneja toda la lógica específica del modo desafío
 */
class ChallengeEngine {
    constructor() {
        this.isActive = false;
        
        // Sistema simplificado: solo pregunta actual y siguiente
        this.currentQuestion = null;
        this.nextQuestion = null;
        this.isPreloadingNext = false;
        
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
     * Inicializa el sistema de preguntas simplificado
     */
    async initializeQuestions() {
        console.log('🔧 Inicializando sistema simplificado de preguntas...');
        
        try {
            // Cargar primera pregunta
            this.currentQuestion = await this.generateSingleQuestion();
            console.log('✅ Primera pregunta cargada:', this.currentQuestion?.question || 'Error');
            
            // NO precargar la siguiente durante inicialización para evitar rate limiting
            console.log('⏳ Siguiente pregunta se precargará después de mostrar la primera');
            
        } catch (error) {
            console.error('❌ Error inicializando preguntas:', error);
            // Usar pregunta de emergencia
            this.currentQuestion = this.createTestQuestion(this.getEffectiveDifficulty());
        }
    }

    /**
     * Obtiene la siguiente pregunta y prepara la subsiguiente
     */
    async getNextQuestion() {
        console.log('🔄 Obteniendo siguiente pregunta...');
        
        // Si ya hay una pregunta actual (primera vez), usarla
        if (this.currentQuestion && !this.gameState.currentQuestion) {
            console.log('✅ Usando pregunta inicial ya cargada');
            return this.currentQuestion;
        }
        
        // Mover la pregunta precargada a actual
        if (this.nextQuestion) {
            this.currentQuestion = this.nextQuestion;
            this.nextQuestion = null;
            console.log('✅ Usando pregunta precargada');
        } else {
            // Si no hay precargada, generar una nueva
            console.warn('⚠️ No hay pregunta precargada, generando nueva...');
            
            // Notificar a la UI que se está cargando una nueva pregunta
            this.dispatchEvent('challengeError', {
                error: 'Obteniendo siguiente pregunta...'
            });
            
            this.currentQuestion = await this.generateSingleQuestion();
        }
        
        // Precargar la siguiente para el futuro (sin llamar preloadNextQuestion para evitar loops)
        
        return this.currentQuestion;
    }

    /**
     * Precarga la siguiente pregunta en segundo plano
     */
    async preloadNextQuestion() {
        if (this.isPreloadingNext) {
            console.log('🔄 Ya se está precargando una pregunta, saltando...');
            return;
        }
        
        console.log('⏳ Precargando siguiente pregunta...');
        this.isPreloadingNext = true;
        
        try {
            this.nextQuestion = await this.generateSingleQuestion();
            console.log('✅ Siguiente pregunta precargada');
        } catch (error) {
            console.error('❌ Error precargando pregunta:', error);
            
            // Detectar específicamente error 429 y emitir evento
            if (error.message && (error.message.includes('429') || error.message.includes('Rate Limit') || error.message.includes('Too Many Requests'))) {
                console.log('⚠️ Error 429 detectado en precarga de pregunta, notificando UI...');
                this.dispatchEvent('challengeError', {
                    error: 'Error 429: Demasiadas solicitudes. Esperando disponibilidad de API...'
                });
            }
            
            this.nextQuestion = null;
        } finally {
            this.isPreloadingNext = false;
        }
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
        
        console.log('⚙️ Configuración aplicada:', {
            ...this.config,
            categoriesEnabled: categoryStats.enabled
        });
        
        // Inicializar sistema de preguntas
        await this.initializeQuestions();
        
        console.log('✅ Modo Desafío inicializado correctamente');
    }

    /**
     * Inicia el desafío
     */
    async start() {
        if (this.isActive) {
            console.warn('⚠️ El desafío ya está activo');
            return;
        }

        console.log('🎯 Iniciando Modo Desafío...');
        this.isActive = true;
        
        // Reiniciar estado del juego
        this.gameState = {
            ...this.gameState,
            currentQuestion: null,
            score: 0,
            streak: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            timeRemaining: 0,
            gameStartTime: new Date(),
            isGameRunning: true,
            lives: this.config.mode === 'survival' ? 3 : -1,
            isAlive: true,
            consecutiveTimeouts: 0
        };
        
        // Cargar primera pregunta
        if (!this.currentQuestion) {
            await this.initializeQuestions();
        }
        
        // Mostrar primera pregunta
        await this.advanceToNextQuestion();
        
        console.log('🎮 Desafío iniciado correctamente');
    }

    /**
     * Avanza a la siguiente pregunta
     */
    async advanceToNextQuestion() {
        console.log('➡️ Avanzando a siguiente pregunta...');
        
        try {
            // Obtener siguiente pregunta
            const question = await this.getNextQuestion();
            
            if (!question) {
                throw new Error('No se pudo obtener la siguiente pregunta');
            }

            // Actualizar estado del juego
            this.gameState.currentQuestion = question;
            this.gameState.timeRemaining = this.config.timer || 0;

            // Disparar evento de nueva pregunta
            this.dispatchEvent('newChallengeQuestion', {
                question: question,
                gameState: this.gameState
            });
            
            // Precargar siguiente pregunta con delay para evitar rate limiting
            setTimeout(() => {
                this.preloadNextQuestion();
            }, 3500);
            
        } catch (error) {
            console.error('❌ Error crítico al avanzar pregunta:', error);
            
            // Detectar específicamente error 429 y emitir evento
            if (error.message && (error.message.includes('429') || error.message.includes('Rate Limit') || error.message.includes('Too Many Requests'))) {
                console.log('⚠️ Error 429 detectado en avance de pregunta, notificando UI...');
                this.dispatchEvent('challengeError', {
                    error: 'Error 429: Demasiadas solicitudes. Esperando disponibilidad de API...'
                });
            }
            
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
            const effectiveType = this.getEffectiveQuestionType();
            
            // Convertir 'mixed' a un tipo válido para la API
            let apiQuestionType = effectiveType;
            if (effectiveType === 'mixed') {
                // Si es mixed, elegir aleatoriamente entre multiple y boolean
                apiQuestionType = Math.random() < 0.5 ? 'multiple' : 'boolean';
            }

            console.log(`🎲 Generando pregunta: ${randomCategory} | ${effectiveDifficulty} | ${effectiveType} (API: ${apiQuestionType})`);

            // Usar ApiClient para obtener la pregunta
            const questions = await this.apiClient.getQuestions(
                randomCategory, 
                effectiveDifficulty, 
                1, 
                apiQuestionType
            );

            if (questions && questions.length > 0) {
                console.log(`✅ Pregunta obtenida de API para categoría ${randomCategory}`);
                return questions[0];
            } else {
                console.warn(`⚠️ No se pudieron obtener preguntas de API para ${randomCategory}, usando pregunta de prueba`);
                return this.createTestQuestion(effectiveDifficulty, randomCategory);
            }

        } catch (error) {
            console.error('❌ Error generando pregunta:', error);
            
            // Detectar específicamente error 429 y emitir evento
            if (error.message && (error.message.includes('429') || error.message.includes('Rate Limit') || error.message.includes('Too Many Requests'))) {
                console.log('⚠️ Error 429 detectado en generación de pregunta, notificando UI...');
                this.dispatchEvent('challengeError', {
                    error: 'Error 429: Demasiadas solicitudes. Esperando disponibilidad de API...'
                });
            }
            
            return this.createTestQuestion(this.getEffectiveDifficulty());
        }
    }

    /**
     * Maneja la respuesta del usuario a una pregunta
     * @param {string} selectedAnswer - La respuesta seleccionada
     */
    async handleAnswer(selectedAnswer) {
        if (!this.gameState.isGameRunning || !this.gameState.currentQuestion) {
            console.warn('⚠️ Intento de responder cuando el juego no está activo');
            return;
        }

        // Detener el timer
        this.stopTimer();

        const currentQuestion = this.gameState.currentQuestion;
        
        // La respuesta correcta es el índice, necesitamos obtener el texto de la respuesta
        const correctAnswerIndex = currentQuestion.correct;
        const correctAnswerText = currentQuestion.answers ? currentQuestion.answers[correctAnswerIndex] : undefined;
        const isCorrect = selectedAnswer === correctAnswerText;

        console.log(`📝 Respuesta: ${selectedAnswer} | Correcta: ${correctAnswerText} | ¿Es correcta? ${isCorrect}`);

        // Actualizar estadísticas
        this.gameState.questionsAnswered++;
        
        if (isCorrect) {
            this.gameState.correctAnswers++;
            this.gameState.streak++;
            this.gameState.score += this.calculateScore();
            this.gameState.consecutiveTimeouts = 0; // Reset timeout counter
            
            // Track respuesta correcta
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengeAnswer(
                    currentQuestion.category,
                    true,
                    this.gameState.timeRemaining,
                    this.gameState.streak
                );
            }
        } else {
            this.gameState.streak = 0;
            this.gameState.consecutiveTimeouts = 0; // Reset timeout counter
            
            // En modo supervivencia, restar una vida
            if (this.config.mode === 'survival' && this.gameState.lives > 0) {
                this.gameState.lives--;
                console.log(`💔 Vida perdida. Vidas restantes: ${this.gameState.lives}`);
                
                if (this.gameState.lives <= 0) {
                    this.gameState.isAlive = false;
                    console.log('💀 Sin vidas. Juego terminado.');
                    
                    this.dispatchEvent('challengeGameOver', {
                        reason: 'no_lives',
                        finalScore: this.gameState.score,
                        questionsAnswered: this.gameState.questionsAnswered,
                        correctAnswers: this.gameState.correctAnswers,
                        gameState: this.gameState
                    });
                    
                    this.stop();
                    return;
                }
            }
            
            // Track respuesta incorrecta
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengeAnswer(
                    currentQuestion.category,
                    false,
                    this.gameState.timeRemaining,
                    this.gameState.streak
                );
            }
        }

        // Disparar evento de respuesta procesada
        this.dispatchEvent('challengeAnswerProcessed', {
            selectedAnswer,
            correctAnswer: correctAnswerText,
            isCorrect,
            score: this.gameState.score,
            streak: this.gameState.streak,
            gameState: this.gameState
        });

        // Continuar con la siguiente pregunta después de un breve delay
        setTimeout(() => {
            if (this.gameState.isGameRunning && this.gameState.isAlive) {
                this.advanceToNextQuestion();
            }
        }, 3000);
    }

    /**
     * Maneja el timeout del temporizador
     */
    handleTimeout() {
        if (!this.gameState.isGameRunning) return;

        console.log('⏰ Tiempo agotado');
        
        this.gameState.streak = 0;
        this.gameState.questionsAnswered++;
        this.gameState.consecutiveTimeouts++;

        // Track timeout
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeTimeout(
                this.gameState.currentQuestion?.category || 'unknown',
                this.gameState.consecutiveTimeouts
            );
        }

        // En modo supervivencia, el timeout también resta vida
        if (this.config.mode === 'survival' && this.gameState.lives > 0) {
            this.gameState.lives--;
            console.log(`💔 Vida perdida por timeout. Vidas restantes: ${this.gameState.lives}`);
            
            if (this.gameState.lives <= 0) {
                this.gameState.isAlive = false;
                console.log('💀 Sin vidas por timeout. Juego terminado.');
                
                this.dispatchEvent('challengeGameOver', {
                    reason: 'timeout_no_lives',
                    finalScore: this.gameState.score,
                    questionsAnswered: this.gameState.questionsAnswered,
                    correctAnswers: this.gameState.correctAnswers,
                    gameState: this.gameState
                });
                
                this.stop();
                return;
            }
        }

        // Siempre mostrar la respuesta correcta primero
        this.dispatchEvent('challengeTimeout', {
            timeouts: this.gameState.consecutiveTimeouts,
            gameState: this.gameState,
            correctAnswer: this.gameState.currentQuestion ? {
                index: this.gameState.currentQuestion.correct,
                text: this.gameState.currentQuestion.answers[this.gameState.currentQuestion.correct]
            } : null
        });

        // Después de mostrar la respuesta correcta, verificar si hay que pausar por timeouts
        setTimeout(() => {
            if (this.gameState.consecutiveTimeouts >= 3) {
                console.warn('⚠️ 3 timeouts consecutivos - mostrando modal de inactividad');
                
                this.dispatchEvent('challengeInactivityWarning', {
                    reason: 'consecutive_timeouts',
                    count: this.gameState.consecutiveTimeouts,
                    consecutiveTimeouts: this.gameState.consecutiveTimeouts,
                    gameState: this.gameState
                });
                
                // Pausa temporal del juego
                this.gameState.isGameRunning = false;
                return;
            }

            // Si no hay 3 timeouts, continuar normalmente
            if (this.gameState.isGameRunning && this.gameState.isAlive) {
                this.advanceToNextQuestion();
            }
        }, 3000);
    }

    /**
     * Inicia el temporizador de la pregunta actual
     */
    startTimer() {
        // Limpiar timer anterior si existe
        this.stopTimer();

        if (this.config.timer <= 0) return; // Sin temporizador

        this.gameState.timeRemaining = this.config.timer;

        this.timerInterval = setInterval(() => {
            this.gameState.timeRemaining--;

            this.dispatchEvent('challengeTimerUpdate', {
                timeRemaining: this.gameState.timeRemaining,
                totalTime: this.config.timer,
                isUnlimited: this.config.timer <= 0
            });

            if (this.gameState.timeRemaining <= 0) {
                this.stopTimer(); // Detener el timer inmediatamente
                this.handleTimeout();
            }
        }, 1000);
    }

    /**
     * Detiene el temporizador
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Detiene el desafío
     */
    stop() {
        console.log('🛑 Deteniendo Modo Desafío...');
        
        this.isActive = false;
        this.gameState.isGameRunning = false;
        this.stopTimer();

        // Limpiar timeouts pendientes
        this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingTimeouts.clear();

        console.log('✅ Modo Desafío detenido');
    }

    /**
     * Calcula el puntaje basado en la configuración actual
     */
    calculateScore() {
        let baseScore = 100;
        
        // Bonus por dificultad
        switch (this.getEffectiveDifficulty()) {
            case 'easy': baseScore = 50; break;
            case 'medium': baseScore = 100; break;
            case 'hard': baseScore = 150; break;
        }
        
        // Bonus por racha
        const streakBonus = Math.min(this.gameState.streak * 10, 100);
        
        // Bonus por tiempo restante (solo si hay temporizador)
        const timeBonus = this.config.timer > 0 
            ? Math.floor((this.gameState.timeRemaining / this.config.timer) * 50) 
            : 0;
        
        return baseScore + streakBonus + timeBonus;
    }

    /**
     * Dispatcher personalizado para eventos
     */
    dispatchEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        document.dispatchEvent(event);
        //console.log(`📡 Evento disparado: ${eventType}`, data);
    }

    /**
     * Obtiene la dificultad efectiva considerando configuración
     */
    getEffectiveDifficulty() {
        const difficulty = this.config.difficulty || 'medium';
        
        // Si la dificultad es 'random', elegir aleatoriamente una válida
        if (difficulty === 'random') {
            const validDifficulties = ['easy', 'medium', 'hard'];
            return validDifficulties[Math.floor(Math.random() * validDifficulties.length)];
        }
        
        return difficulty;
    }

    /**
     * Obtiene el tipo de pregunta efectivo considerando configuración
     */
    getEffectiveQuestionType() {
        return this.config.questionType || 'multiple';
    }

    /**
     * Crea una pregunta de prueba para casos de emergencia o testing
     */
    createTestQuestion(difficulty = 'medium', category = 'conocimiento-general') {
        const testQuestions = [
            {
                type: 'multiple',
                difficulty: 'easy',
                category: 'conocimiento-general',
                question: '¿Cuál es la capital de Francia?',
                correct_answer: 'París',
                incorrect_answers: ['Londres', 'Madrid', 'Roma']
            },
            {
                type: 'boolean', 
                difficulty: 'easy',
                category: 'conocimiento-general',
                question: '¿Es el Sol una estrella?',
                correct_answer: 'True',
                incorrect_answers: ['False']
            },
            {
                type: 'multiple',
                difficulty: 'medium',
                category: 'ciencia',
                question: '¿Cuál es el símbolo químico del oro?',
                correct_answer: 'Au',
                incorrect_answers: ['Ag', 'Fe', 'Cu']
            },
            {
                type: 'boolean',
                difficulty: 'medium', 
                category: 'historia',
                question: '¿Ocurrió la Segunda Guerra Mundial en el siglo XX?',
                correct_answer: 'True',
                incorrect_answers: ['False']
            },
            {
                type: 'multiple',
                difficulty: 'hard',
                category: 'matematicas',
                question: '¿Cuál es la derivada de x²?',
                correct_answer: '2x',
                incorrect_answers: ['x²', 'x', '2']
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

    /**
     * Pausa el juego
     */
    pauseGame() {
        if (!this.gameState.isGameRunning) return;

        console.log('⏸️ Pausando el juego');
        this.gameState.isGameRunning = false;
        this.stopTimer();

        this.dispatchEvent('challengePaused', {
            reason: 'manual',
            gameState: this.gameState
        });
    }

    /**
     * Reanuda el juego después de una pausa
     */
    resumeGame() {
        if (this.gameState.isGameRunning) return;

        console.log('▶️ Reanudando el juego');
        this.gameState.isGameRunning = true;
        
        // Resetear timeouts consecutivos cuando el usuario reanuda activamente
        this.resetConsecutiveTimeouts();
        
        // Si venimos de un timeout (tiempo restante <= 0), avanzar a siguiente pregunta
        if (this.gameState.currentQuestion && this.gameState.timeRemaining <= 0) {
            console.log('🔄 Reanudando después de timeout - avanzando a siguiente pregunta');
            setTimeout(() => {
                if (this.gameState.isGameRunning && this.gameState.isAlive) {
                    this.advanceToNextQuestion();
                }
            }, 100);
        } else if (this.gameState.currentQuestion) {
            // Si había una pregunta activa con tiempo restante, reiniciar timer
            this.startTimer();
        }

        this.dispatchEvent('challengeResumed', {
            gameState: this.gameState
        });
    }

    /**
     * Resetea el contador de timeouts consecutivos
     */
    resetConsecutiveTimeouts() {
        console.log('🔄 Reseteando contador de timeouts consecutivos');
        this.gameState.consecutiveTimeouts = 0;
    }

    /**
     * Función de test para simular error 429
     * Solo para debugging - no usar en producción
     */
    simulateApiError429() {
        if (typeof window !== 'undefined' && window.console) {
            console.log('🧪 [TEST] Simulando error 429...');
            this.dispatchEvent('challengeError', {
                error: 'Error 429: Demasiadas solicitudes. Esperando disponibilidad de API...'
            });
        }
    }
}

// Exportar para uso global
window.ChallengeEngine = ChallengeEngine;
