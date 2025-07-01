/**
 * Motor del Modo Desafío - Sistema independiente de juego
 * Maneja toda la lógica específica del modo desafío
 */
class ChallengeEngine {
    constructor() {
        this.isActive = false;        this.config = {
            difficulty: 'medium',
            timer: 20,
            mode: 'survival', // Modo supervivencia por defecto
            categories: {
                historia: true,
                ciencia: true,
                deportes: true,
                arte: true,
                geografia: true,
                entretenimiento: true
            }
        };        this.gameState = {
            currentQuestion: null,
            score: 0,
            streak: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            timeRemaining: 0,
            gameStartTime: null,
            isGameRunning: false,
            lives: 1, // Modo supervivencia: una sola vida
            isAlive: true // Estado de supervivencia
        };
        this.timerInterval = null;
        this.apiClient = null;
    }    /**
     * Inicializa el motor de desafío con la configuración especificada
     * @param {Object} config - Configuración del desafío
     */
    async initialize(config) {
        console.log('🚀 Inicializando Modo Desafío...');
        
        // Track configuración del desafío
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeSetup(
                config.mode || 'survival',
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
        
        // Probar conexión con la API
        //const apiWorking = await this.testApiConnection();
        //console.log(`📡 Estado de la API: ${apiWorking ? 'Funcionando' : 'Con problemas'}`);
        
        // Resetear estado del juego
        this.resetGameState();
        
        console.log('✅ Modo Desafío inicializado:', this.config);
        return true;
    }/**
     * Resetea el estado del juego a valores iniciales
     */    resetGameState() {
        this.gameState = {
            currentQuestion: null,
            score: 0,
            streak: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            timeRemaining: this.config.timer || 0, // 0 significa tiempo ilimitado
            gameStartTime: null,
            isGameRunning: false,
            lives: 1, // Modo supervivencia: una sola vida
            isAlive: true // Estado de supervivencia
        };
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
                    this.config.mode || 'survival',
                    this.config.timer || 20
                );
            }

            // Cargar primera pregunta
            await this.loadNextQuestion();
            
            // Iniciar temporizador
            this.startTimer();
            
            // Disparar evento de inicio
            this.dispatchEvent('challengeStarted', {
                config: this.config,
                gameState: this.gameState
            });

            console.log('✅ Desafío iniciado correctamente');
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
    }    /**
     * Carga la siguiente pregunta del desafío
     */
    async loadNextQuestion() {
        try {
            // Obtener categorías habilitadas
            const enabledCategories = Object.keys(this.config.categories)
                .filter(cat => this.config.categories[cat]);

            if (enabledCategories.length === 0) {
                throw new Error('No hay categorías seleccionadas');
            }            // Seleccionar categoría aleatoria
            const randomCategory = enabledCategories[Math.floor(Math.random() * enabledCategories.length)];
            
            // Obtener dificultad efectiva (puede ser aleatoria)
            const effectiveDifficulty = this.getEffectiveDifficulty();
            console.log(`🎲 Categoría seleccionada: ${randomCategory}, dificultad: ${effectiveDifficulty}`);
            
            let question = null;

            try {
                // Intentar cargar pregunta de la API
                console.log('🔄 Solicitando pregunta a la API...');
                const questions = await this.apiClient.getQuestions(randomCategory, effectiveDifficulty, 1);
                console.log('📦 Respuesta de la API:', questions);
                  if (questions && questions.length > 0) {
                    const apiQuestion = questions[0];
                    console.log('🔧 Pregunta antes de conversión:', apiQuestion);
                    question = this.convertApiQuestionToChallengeFormat(apiQuestion, effectiveDifficulty);
                    console.log('✅ Pregunta después de conversión:', question);
                }
            } catch (apiError) {
                console.warn('⚠️ Error de API, intentando con pregunta de prueba:', apiError);
            }            // Si no se pudo obtener de la API, usar pregunta de prueba
            if (!question) {
                console.log('🧪 Usando pregunta de prueba...');
                question = this.createTestQuestion(effectiveDifficulty);
            }this.gameState.currentQuestion = question;
            this.gameState.timeRemaining = this.config.timer || 0; // 0 para tiempo ilimitado

            // Disparar evento de nueva pregunta
            this.dispatchEvent('newChallengeQuestion', {
                question: question,
                gameState: this.gameState
            });

            console.log('📝 Nueva pregunta cargada exitosamente:', question.pregunta);

        } catch (error) {
            console.error('❌ Error crítico al cargar pregunta:', error);
            console.error('Stack trace:', error.stack);
              // Como último recurso, usar una pregunta de emergencia
            const emergencyQuestion = {
                pregunta: "¿Funciona el modo desafío?",
                opciones: ["Sí", "No", "Tal vez", "Error"],
                respuesta_correcta: "Sí",
                categoria: "test",
                dificultad: effectiveDifficulty || "easy",
                fuente: "emergency"
            };this.gameState.currentQuestion = emergencyQuestion;
            this.gameState.timeRemaining = this.config.timer || 0; // 0 para tiempo ilimitado

            this.dispatchEvent('newChallengeQuestion', {
                question: emergencyQuestion,
                gameState: this.gameState
            });

            console.log('🚨 Pregunta de emergencia cargada');
        }
    }    /**
     * Convierte una pregunta del formato API al formato esperado por el desafío
     * @param {Object} apiQuestion - Pregunta en formato API
     * @returns {Object} Pregunta en formato del desafío
     */    convertApiQuestionToChallengeFormat(apiQuestion, effectiveDifficulty = null) {
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
                // PRESERVAR LA INFORMACIÓN ORIGINAL DE LA API
                originalQuestion: apiQuestion.originalQuestion || apiQuestion.question,
                originalAnswers: apiQuestion.originalAnswers || apiQuestion.answers,
                // Si hay una versión traducida, incluirla
                translatedQuestion: apiQuestion.translatedQuestion || apiQuestion.question,
                translatedAnswers: apiQuestion.translatedAnswers || apiQuestion.answers            };
            
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
                // PRESERVAR LA INFORMACIÓN ORIGINAL
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
                    this.config.mode || 'survival',
                    this.gameState.streak,
                    'correct'
                );
            }
            
            // Track bonus por velocidad si respondió rápido
            if (responseTime <= 5 && window.trivialAnalytics) {
                const bonusPoints = Math.floor((5 - responseTime) * 10);
                window.trivialAnalytics.trackChallengeSpeedBonus(
                    this.config.mode || 'survival',
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

        // Determinar si continuar o terminar
        await this.handleQuestionResult(isCorrect);
    }    /**
     * Maneja el resultado de una pregunta y decide el siguiente paso
     * @param {boolean} isCorrect - Si la respuesta fue correcta
     */
    async handleQuestionResult(isCorrect) {
        console.log(`🎯 Procesando resultado: ${isCorrect ? 'Correcto' : 'Incorrecto'}`);
        
        if (this.config.mode === 'survival') {
            await this.handleSurvivalResult(isCorrect);
        } else {
            // Modo por defecto: continuar siempre
            await this.handleDefaultResult(isCorrect);
        }
    }

    /**
     * Maneja el resultado en modo supervivencia
     * @param {boolean} isCorrect - Si la respuesta fue correcta
     */
    async handleSurvivalResult(isCorrect) {
        if (isCorrect) {
            console.log(`✅ ¡Supervivencia! Racha: ${this.gameState.streak}, Puntuación: ${this.gameState.score}`);
            
            // Continuar con la siguiente pregunta después de una pausa
            setTimeout(async () => {
                if (this.gameState.isGameRunning && this.gameState.isAlive) {
                    await this.loadNextQuestion();
                    this.startTimer();
                }
            }, 2000);
            
        } else {
            console.log('💀 ¡Game Over! Has fallado en modo supervivencia');
            
            // En modo supervivencia, un error termina el juego
            this.gameState.isAlive = false;
            this.gameState.lives = 0;
            
            // Disparar evento específico de muerte en supervivencia
            this.dispatchEvent('survivalGameOver', {
                finalScore: this.gameState.score,
                questionsAnswered: this.gameState.questionsAnswered,
                correctAnswers: this.gameState.correctAnswers,
                maxStreak: this.gameState.streak,
                causeOfDeath: 'wrong_answer'
            });
            
            // Terminar el juego después de mostrar el resultado
            setTimeout(() => {
                this.endChallenge();
            }, 3000);
        }
    }

    /**
     * Maneja el resultado en modo por defecto (continúa siempre)
     * @param {boolean} isCorrect - Si la respuesta fue correcta
     */
    async handleDefaultResult(isCorrect) {
        // Lógica original: continuar independientemente del resultado
        setTimeout(async () => {
            if (this.gameState.isGameRunning) {
                await this.loadNextQuestion();
                this.startTimer();
            }
        }, 2000);
    }    /**
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
    }    /**
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
    }/**
     * Inicia el temporizador de la pregunta current
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
     * Maneja cuando se acaba el tiempo para responder
     */
    handleTimeOut() {
        console.log('⏰ Tiempo agotado!');
        this.stopTimer();
        
        // Procesar como respuesta incorrecta
        this.processTimeOut();
    }    /**
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

        // Track timeout en analytics
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackChallengeTimeout(
                this.config.mode || 'survival',
                this.gameState.currentQuestion.categoria || 'unknown',
                this.config.timer || 20
            );
        }

        // Disparar evento de timeout
        this.dispatchEvent('challengeTimeOut', {
            correctAnswer: this.gameState.currentQuestion.respuesta_correcta,
            gameState: this.gameState
        });

        // En modo supervivencia, timeout también termina el juego
        if (this.config.mode === 'survival') {
            console.log('💀 ¡Game Over! Tiempo agotado en modo supervivencia');
            
            this.gameState.isAlive = false;
            this.gameState.lives = 0;
            
            // Disparar evento específico de muerte por timeout
            this.dispatchEvent('survivalGameOver', {
                finalScore: this.gameState.score,
                questionsAnswered: this.gameState.questionsAnswered,
                correctAnswers: this.gameState.correctAnswers,
                maxStreak: this.gameState.streak,
                causeOfDeath: 'timeout'
            });
            
            // Terminar el juego
            setTimeout(() => {
                this.endChallenge();
            }, 3000);
        } else {
            // Continuar con la siguiente pregunta en otros modos
            await this.handleQuestionResult(false);
        }
    }

    /**
     * Termina el desafío actual
     */
    endChallenge() {
        console.log('🏁 Finalizando desafío...');
        
        this.stopTimer();
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
                this.config.mode || 'survival',
                gameResults.score,
                timeUsed,
                gameResults.correctAnswers,
                gameResults.questionsAnswered
            );
            
            // Track milestone si es un score alto
            if (gameResults.score >= 1000) {
                window.trivialAnalytics.trackMilestone(`challenge_high_score_${Math.floor(gameResults.score / 1000)}k`);
            }
            
            // Track dificultad vs rendimiento
            window.trivialAnalytics.trackChallengeDifficulty(
                this.config.mode || 'survival',
                this.config.difficulty,
                gameResults.accuracy
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
                    this.config.mode || 'survival',
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
            this.startTimer();
            
            // Track reanudación en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengeResume(
                    this.config.mode || 'survival',
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
        this.resetGameState();
        this.isActive = false;
        console.log('🧹 Motor de desafío limpiado');
    }

    /**
     * Prueba la conexión con la API
     */
    async testApiConnection() {
        try {
            console.log('🔍 Probando conexión con la API...');
            console.log('ApiClient instance:', this.apiClient);
            
            // Probar una categoría simple
            const testQuestions = await this.apiClient.getQuestions('historia', 'easy', 1);
            console.log('✅ Prueba de API exitosa:', testQuestions);
            return true;
        } catch (error) {
            console.error('❌ Prueba de API falló:', error);
            return false;
        }
    }    /**
     * Crea una pregunta de prueba para testing
     */    createTestQuestion(effectiveDifficulty = 'medium') {
        const testQuestions = [
            {
                pregunta: "¿Cuál es la capital de Francia?",
                opciones: ["París", "Londres", "Madrid", "Roma"],
                respuesta_correcta: "París",
                categoria: "geografia",
                dificultad: effectiveDifficulty,
                fuente: "test",
                // Incluir versión original en inglés para testing
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
                // Incluir versión original en inglés para testing
                originalQuestion: "In what year did World War II end?",
                originalAnswers: ["1945", "1944", "1946", "1943"]
            },
            {
                pregunta: "¿Cuál es el planeta más grande del sistema solar?",
                opciones: ["Júpiter", "Saturno", "Tierra", "Marte"],
                respuesta_correcta: "Júpiter",                categoria: "ciencia",
                dificultad: effectiveDifficulty,
                fuente: "test",
                // Incluir versión original en inglés para testing
                originalQuestion: "What is the largest planet in the solar system?",
                originalAnswers: ["Jupiter", "Saturn", "Earth", "Mars"]
            }
        ];
        
        const selectedQuestion = testQuestions[Math.floor(Math.random() * testQuestions.length)];
        console.log('🧪 Pregunta de prueba creada con versiones original y traducida:', selectedQuestion);
        return selectedQuestion;
    }

    /**
     * Diagnóstico completo del sistema
     */
    async runDiagnostic() {
        console.log('🔍 === DIAGNÓSTICO DEL MODO DESAFÍO ===');
        
        // 1. Verificar configuración
        console.log('📋 Configuración actual:', this.config);
        
        // 2. Verificar ApiClient
        console.log('🔌 ApiClient:', {
            exists: !!this.apiClient,
            type: typeof this.apiClient,
            hasGetQuestions: this.apiClient && typeof this.apiClient.getQuestions === 'function'
        });
        
        // 3. Probar carga de pregunta
        try {
            console.log('🧪 Probando carga de pregunta...');
            await this.loadNextQuestion();
            console.log('✅ Carga de pregunta exitosa');
            console.log('📝 Pregunta actual:', this.gameState.currentQuestion);
        } catch (error) {
            console.error('❌ Error en carga de pregunta:', error);
        }
        
        // 4. Verificar estado del juego
        console.log('🎮 Estado del juego:', this.gameState);
        
        console.log('🏁 === FIN DEL DIAGNÓSTICO ===');
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
     * Abandona el desafío actual
     */
    abandonChallenge() {
        if (this.gameState.isGameRunning) {
            console.log('🚪 Abandonando desafío...');
            
            // Track abandono en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackChallengeAbandon(
                    this.config.mode || 'survival',
                    this.gameState.questionsAnswered,
                    this.gameState.score,
                    Math.round((Date.now() - this.gameState.gameStartTime) / 1000)
                );
            }
            
            this.stopTimer();
            this.gameState.isGameRunning = false;
            this.isActive = false;
            
            this.dispatchEvent('challengeAbandoned', { 
                gameState: this.gameState,
                finalScore: this.gameState.score
            });
        }
    }
}

// Exportar para uso global
window.ChallengeEngine = ChallengeEngine;
