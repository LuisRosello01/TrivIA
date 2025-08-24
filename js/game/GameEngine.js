/**
 * Motor principal del juego de Trivial
 * Controla toda la lógica del juego, turnos, preguntas y estados
 */
class GameEngine {    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.board = null;
        this.apiClient = new ApiClient();
        this.storage = new Storage();
        this.gameState = 'menu'; // menu, playing, paused, finished
        this.config = this.storage.getConfig() || {};
        this.usedQuestions = new Set();
        this.gameStartTime = null;        this.currentQuestion = null;
        this.questionStartTime = null;
        this.winner = null;
        
        // Datos de pregunta pendiente para el botón de inicio
        this.pendingQuestionData = null;
        
        // Datos de movimiento pendiente para el countdown
        this.pendingMovement = null;
        
        // Eventos del juego
        this.eventHandlers = {};
        
        this.initialize();
    }

    /**
     * Inicializa el motor del juego
     */
    initialize() {
        // Cargar configuración
        this.loadConfig();
        
        // Configurar tablero
        this.setupBoard();
    }

    /**
     * Carga la configuración del juego
     */    loadConfig() {
        const defaultConfig = {
            playerCount: 4,
            difficulty: 'medium',
            timer: 30,
            soundEnabled: true,
            translationEnabled: true
        };
        
        this.config = { ...defaultConfig, ...this.config };
          // Configurar traducción en ApiClient
        if (this.apiClient) {
            this.apiClient.setTranslationEnabled(this.config.translationEnabled);
            
            // Configurar eventos de traducción
            this.setupApiClientEvents();
        }
    }    /**
     * Configura el tablero del juego
     */
    setupBoard() {
        // El tablero ahora se configura automáticamente con dimensiones dinámicas
        this.board = new Board('game-board');
    }

    /**
     * Configura los event listeners del ApiClient
     */
    setupApiClientEvents() {
        if (!this.apiClient) return;

        // Eventos de traducción para mostrar indicador en el tablero
        this.apiClient.on('translationStarted', (data) => {
            this.emit('translationStarted', data);
        });

        this.apiClient.on('translationCompleted', (data) => {
            this.emit('translationCompleted', data);
        });

        this.apiClient.on('translationError', (data) => {
            this.emit('translationError', data);
        });
    }

    /**
     * Inicia un nuevo juego
     * @param {Object} config - Configuración del juego
     */    async startNewGame(config = {}) {
        try {
            // Track configuración del juego
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackGameSetup(
                    config.playerCount || this.config.playerCount,
                    config.difficulty || this.config.difficulty
                );
            }
            
            // Actualizar configuración
            this.config = { ...this.config, ...config };
            this.storage.saveConfig(this.config);
            
            // Configurar traducción en ApiClient
            if (this.apiClient) {
                this.apiClient.setTranslationEnabled(this.config.translationEnabled);
            }
            
            // Resetear estado del juego
            this.resetGameState();
            
            // Crear jugadores
            this.createPlayers();
            
            // Inicializar tablero con jugadores
            this.board.updatePlayers(this.players);
            
            // Configurar primer turno
            this.setCurrentPlayer(0);
            
            // Cambiar estado del juego
            this.gameState = 'playing';
            this.gameStartTime = Date.now();
            
            // Track inicio del juego
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackGameStart();
            }
            
            // Guardar estado inicial
            this.saveGameState();
            
            // Emitir evento de inicio de juego
            this.emit('gameStarted', {
                players: this.players,
                config: this.config
            });
            
            return true;
        } catch (error) {
            console.error('Error al iniciar nuevo juego:', error);
            
            // Track error en analytics
            if (window.trivialAnalytics) {
                window.trivialAnalytics.trackError('GAME_START_ERROR', error.message);
            }
            
            return false;
        }
    }

    /**
     * Continúa un juego guardado
     */
    async continueGame() {
        try {
            const savedState = this.storage.loadGameState();
            if (!savedState) {
                throw new Error('No hay juego guardado');
            }
            
            // Restaurar estado
            this.restoreGameState(savedState);
            
            // Actualizar tablero
            this.board.updatePlayers(this.players);
            
            console.log('Juego continuado desde estado guardado');
            
            this.emit('gameContinued', {
                players: this.players,
                currentPlayer: this.getCurrentPlayer()
            });
            
            return true;
        } catch (error) {
            console.error('Error al continuar juego:', error);
            return false;
        }
    }    /**
     * Resetea el estado del juego
     */
    resetGameState() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameState = 'menu';
        this.usedQuestions.clear();
        this.gameStartTime = null;
        this.currentQuestion = null;
        this.questionStartTime = null;
        this.winner = null;
        this.pendingMovement = null;
    }

    /**
     * Crea los jugadores según la configuración
     */
    createPlayers() {
        this.players = [];
        const playerCount = this.config.playerCount || 4;
        
        for (let i = 1; i <= playerCount; i++) {
            const player = Player.createDefault(i);
            this.players.push(player);
        }
        
        console.log(`${playerCount} jugadores creados`);
    }

    /**
     * Establece el jugador actual
     */
    setCurrentPlayer(index) {
        // Quitar turno del jugador anterior
        if (this.players[this.currentPlayerIndex]) {
            this.players[this.currentPlayerIndex].setTurn(false);
        }
        
        // Establecer nuevo jugador actual
        this.currentPlayerIndex = index;
        if (this.players[this.currentPlayerIndex]) {
            this.players[this.currentPlayerIndex].setTurn(true);
        }
        
        this.emit('playerTurnChanged', {
            currentPlayer: this.getCurrentPlayer(),
            playerIndex: this.currentPlayerIndex
        });
    }

    /**
     * Obtiene el jugador actual
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    /**
     * Pasa al siguiente jugador
     */
    nextPlayer() {
        const nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.setCurrentPlayer(nextIndex);
        
        console.log(`Turno pasado a ${this.getCurrentPlayer().name}`);
        this.saveGameState();
    }    /**
     * Tira el dado y mueve al jugador actual
     */
    async rollDice() {
        if (this.gameState !== 'playing') {
            console.warn('No se puede tirar el dado: juego no en curso');
            return null;
        }

        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer) {
            console.error('No hay jugador actual');
            return null;
        }

        // Generar número aleatorio del 1 al 6
        const diceValue = Math.floor(Math.random() * 6) + 1;
        
        // Track tirada de dado
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackDiceRoll(diceValue);
        }
        
        console.log(`${currentPlayer.name} ha sacado un ${diceValue}`);
        
        // Guardar valores para usar después del countdown
        this.pendingMovement = {
            player: currentPlayer,
            diceValue: diceValue,
            oldPosition: currentPlayer.position
        };
        
        // Emitir evento de dado
        this.emit('diceRolled', {
            player: currentPlayer,
            value: diceValue
        });
        
        return diceValue;
    }

    /**
     * Continúa con el movimiento después del countdown de la UI
     */
    async continueWithMovement() {
        if (!this.pendingMovement) {
            console.warn('No hay movimiento pendiente');
            return;
        }

        const { player, diceValue, oldPosition } = this.pendingMovement;
        
        // Limpiar movimiento pendiente
        this.pendingMovement = null;
        
        // Mover jugador
        const newPosition = player.move(diceValue);
        
        // Animar movimiento en el tablero
        if (this.board) {
            await this.board.animatePlayerMovement(player, oldPosition, newPosition);
            this.board.updatePlayers(this.players);
        }
        
        // Emitir evento de movimiento
        this.emit('playerMoved', {
            player: player,
            oldPosition: oldPosition,
            newPosition: newPosition,
            diceValue: diceValue
        });
        
        // Procesar la casilla donde cayó
        await this.processLanding(player, newPosition);
        
        this.saveGameState();
    }/**
     * Procesa la acción según la casilla donde cayó el jugador
     */
    async processLanding(player, position) {
        const category = this.board.getCategoryAtPosition(position);
        const isWedgeSpace = this.board.isWedgeSpace(position);
        const isCenterSpace = this.board.isCenterSpace(position);
        
        console.log(`${player.name} cayó en ${category} (posición ${position})`);
        
        if (isCenterSpace) {
            // Pregunta final - solo si tiene todas las cuñas
            if (player.hasAllWedges()) {
                // Mostrar botón para pregunta final
                this.pendingQuestionData = {
                    player: player,
                    category: category,
                    isWedgeSpace: false,
                    isFinalQuestion: true
                };
                this.emit('showStartQuestionButton', { 
                    category: 'Final',
                    isFinalQuestion: true 
                });
            } else {
                console.log(`${player.name} necesita todas las cuñas para la pregunta final`);
                this.emit('needsAllWedges', { player });
                this.nextPlayer();
            }
        } else {
            // Pregunta normal - mostrar botón en lugar de hacer la pregunta directamente
            this.pendingQuestionData = {
                player: player,
                category: category,
                isWedgeSpace: isWedgeSpace,
                isFinalQuestion: false
            };
            this.emit('showStartQuestionButton', { 
                category: category,
                isFinalQuestion: false 
            });
        }
    }

    /**
     * Hace una pregunta al jugador
     */
    async askQuestion(player, category, isWedgeSpace = false) {
        try {
            // Obtener pregunta de la API o fallback
            const questions = await this.apiClient.getQuestions(
                category, 
                this.config.difficulty, 
                1
            );
            
            if (!questions || questions.length === 0) {
                throw new Error('No se pudo obtener pregunta');
            }            const questionData = questions[0];
            this.currentQuestion = new Question(
                questionData.question,
                questionData.answers,
                questionData.correct,
                category,
                this.config.difficulty,
                questionData.source || 'fallback',
                questionData.originalQuestion || questionData.question,
                questionData.originalAnswers || questionData.answers
            );
            
            // Marcar pregunta como usada
            this.usedQuestions.add(this.currentQuestion.id);
            this.questionStartTime = Date.now();
            
            console.log(`Pregunta de ${category} para ${player.name}:`, this.currentQuestion.text);
              // Emitir evento de pregunta
            this.emit('questionAsked', {
                player: player,
                question: this.currentQuestion,
                category: category,
                isWedgeSpace: isWedgeSpace,
                timeLimit: this.config.timer !== undefined ? this.config.timer : 30
            });
            
        } catch (error) {
            console.error('Error al obtener pregunta:', error);
            
            // Usar pregunta de ejemplo como fallback
            this.currentQuestion = Question.createExample(category);
              this.emit('questionAsked', {
                player: player,
                question: this.currentQuestion,
                category: category,
                isWedgeSpace: isWedgeSpace,
                timeLimit: this.config.timer !== undefined ? this.config.timer : 30
            });
        }
    }

    /**
     * Hace la pregunta final al jugador
     */
    async askFinalQuestion(player) {
        // Categoría aleatoria para pregunta final
        const categories = ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        console.log(`Pregunta final para ${player.name} en categoría ${randomCategory}`);
        
        await this.askQuestion(player, randomCategory, false);
        
        // Marcar como pregunta final
        this.emit('finalQuestion', {
            player: player,
            question: this.currentQuestion
        });
    }

    /**
     * Procesa la respuesta del jugador
     */
    async processAnswer(answerIndex) {
        if (!this.currentQuestion || this.gameState !== 'playing') {
            console.warn('No hay pregunta activa');
            return false;
        }

        const currentPlayer = this.getCurrentPlayer();
        const isCorrect = this.currentQuestion.checkAnswer(answerIndex);
        const timeSpent = this.questionStartTime ? 
            (Date.now() - this.questionStartTime) / 1000 : 0;
        
        // Track respuesta a pregunta
        if (window.trivialAnalytics) {
            window.trivialAnalytics.trackQuestionAnswered(
                this.currentQuestion.category,
                this.currentQuestion.difficulty,
                isCorrect,
                timeSpent
            );
        }
        
        // Registrar respuesta en estadísticas del jugador
        currentPlayer.recordAnswer(isCorrect, this.currentQuestion.category, timeSpent);
        
        console.log(`${currentPlayer.name} respondió ${isCorrect ? 'correctamente' : 'incorrectamente'}`);
        
        // Procesar resultado según el tipo de pregunta
        const wasFinalQuestion = this.board.isCenterSpace(currentPlayer.position);
        let continuesTurn = false;
        
        if (wasFinalQuestion) {
            // Pregunta final
            if (isCorrect) {
                this.declareWinner(currentPlayer);
                return true;
            }
        } else {
            // Pregunta normal
            if (isCorrect) {
                const isWedgeSpace = this.board.isWedgeSpace(currentPlayer.position);
                
                if (isWedgeSpace) {
                    // Otorgar cuña si está en casilla de cuña
                    const wedgeGranted = currentPlayer.grantWedge(this.currentQuestion.category);
                    if (wedgeGranted) {
                        // Track cuña obtenida
                        if (window.trivialAnalytics) {
                            window.trivialAnalytics.trackMilestone(`wedge_earned_${this.currentQuestion.category}`);
                        }
                        
                        this.emit('wedgeEarned', {
                            player: currentPlayer,
                            category: this.currentQuestion.category
                        });
                    }
                }
                
                // El jugador continúa su turno si acierta
                continuesTurn = true;
            }
        }
        
        // Emitir evento de respuesta procesada
        this.emit('answerProcessed', {
            player: currentPlayer,
            question: this.currentQuestion,
            answerIndex: answerIndex,
            isCorrect: isCorrect,
            timeSpent: timeSpent,
            continuesTurn: continuesTurn
        });
        
        // Limpiar pregunta actual
        this.currentQuestion = null;
        this.questionStartTime = null;
        
        // Pasar turno si no continúa
        if (!continuesTurn && this.gameState === 'playing') {
            setTimeout(() => {
                this.nextPlayer();
            }, 2000); // Esperar 2 segundos antes de pasar turno
        }
        
        // Actualizar tablero
        if (this.board) {
            this.board.updatePlayers(this.players);
        }
          this.saveGameState();
        return isCorrect;
    }

    /**
     * Procede con la pregunta después de que el jugador presiona el botón
     */
    async proceedWithQuestion() {
        if (!this.pendingQuestionData) {
            console.warn('No hay datos de pregunta pendiente');
            return;
        }

        const { player, category, isWedgeSpace, isFinalQuestion } = this.pendingQuestionData;
        
        // Limpiar datos pendientes
        this.pendingQuestionData = null;
        
        if (isFinalQuestion) {
            await this.askFinalQuestion(player);
        } else {
            await this.askQuestion(player, category, isWedgeSpace);
        }
    }

    /**
     * Declara un ganador del juego
     */
    declareWinner(player) {
        this.winner = player;
        player.setAsWinner();
        this.gameState = 'finished';
        
        const gameTime = this.gameStartTime ? 
            (Date.now() - this.gameStartTime) / 1000 : 0;
        
        // Track finalización del juego
        if (window.trivialAnalytics) {
            const finalScores = this.players.map(p => ({
                name: p.name,
                wedges: p.wedges.length,
                correctAnswers: p.stats.correctAnswers,
                totalAnswers: p.stats.totalAnswers
            }));
            
            window.trivialAnalytics.trackGameComplete(player.name, gameTime, finalScores);
            
            // Track milestone de victoria
            window.trivialAnalytics.trackMilestone(`game_won_${this.players.length}_players`);
        }
        
        console.log(`¡${player.name} ha ganado el juego!`);
        
        // Actualizar estadísticas
        this.updateGameStats(player, gameTime);
        
        // Emitir evento de victoria
        this.emit('gameWon', {
            winner: player,
            gameTime: gameTime,
            players: this.players
        });
        
        // Limpiar juego guardado
        this.storage.clearGameState();
    }

    /**
     * Actualiza las estadísticas del juego
     */
    updateGameStats(winner, gameTime) {
        const stats = this.storage.getStats() || {};
        
        stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
        if (winner) {
            stats.gamesWon = (stats.gamesWon || 0) + 1;
        }
        
        // Calcular tiempo promedio
        const totalTime = (stats.averageGameTime || 0) * (stats.gamesPlayed - 1) + gameTime;
        stats.averageGameTime = totalTime / stats.gamesPlayed;
        
        // Estadísticas de preguntas
        this.players.forEach(player => {
            stats.totalQuestions = (stats.totalQuestions || 0) + player.stats.questionsAnswered;
            stats.correctAnswers = (stats.correctAnswers || 0) + player.stats.correctAnswers;
        });
        
        stats.lastPlayed = Date.now();
        
        this.storage.saveStats(stats);
        console.log('Estadísticas actualizadas');
    }

    /**
     * Pausa el juego
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.emit('gamePaused');
            console.log('Juego pausado');
        }
    }

    /**
     * Reanuda el juego
     */
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.emit('gameResumed');
            console.log('Juego reanudado');
        }
    }

    /**
     * Termina el juego prematuramente
     */
    quitGame() {
        this.gameState = 'menu';
        //this.storage.clearGameState();
        this.emit('gameQuit');
    }    /**
     * Guarda el estado actual del juego
     */
    saveGameState() {
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Obtener el historial de preguntas desde GameUI
            let questionsHistory = [];
            if (this.gameUI && this.gameUI.getQuestionsHistory) {
                questionsHistory = this.gameUI.getQuestionsHistory();
            }

            // Obtener estadísticas actuales del juego
            let gameStats = null;
            if (this.gameUI && this.gameUI.getCurrentGameStats) {
                gameStats = this.gameUI.getCurrentGameStats();
            }

            const gameState = {
                players: this.players.map(p => p.serialize()),
                currentPlayerIndex: this.currentPlayerIndex,
                gameState: this.gameState,
                config: this.config,
                usedQuestions: Array.from(this.usedQuestions),
                gameStartTime: this.gameStartTime,
                winner: this.winner ? this.winner.serialize() : null,
                questionsHistory: questionsHistory,
                gameStats: gameStats
            };
            
            this.storage.saveGameState(gameState);
        }
    }    /**
     * Restaura el estado del juego desde datos guardados
     */
    restoreGameState(savedState) {
        // Restaurar jugadores
        this.players = savedState.players.map(playerData => 
            Player.deserialize(playerData)
        );
        
        this.currentPlayerIndex = savedState.currentPlayerIndex;
        //this.gameState = savedState.gameState;
        this.gameState = "playing"; // Forzar estado a 'playing' para evitar problemas de UI
        this.config = { ...this.config, ...savedState.config };
        this.usedQuestions = new Set(savedState.usedQuestions || []);
        this.gameStartTime = savedState.gameStartTime;
        
        if (savedState.winner) {
            this.winner = Player.deserialize(savedState.winner);
        }

        // Restaurar historial de preguntas en GameUI
        if (savedState.questionsHistory && this.gameUI && this.gameUI.setQuestionsHistory) {
            this.gameUI.setQuestionsHistory(savedState.questionsHistory);
        }

        // Restaurar estadísticas del juego
        if (savedState.gameStats && this.gameUI && this.gameUI.updateStatsFromSavedData) {
            this.gameUI.updateStatsFromSavedData(savedState.gameStats);
        }
        
        console.log('Estado del juego restaurado');
    }

    /**
     * Verifica si hay un juego guardado
     */
    hasSavedGame() {
        return this.storage.hasGameState();
    }

    /**
     * Obtiene estadísticas del juego
     */
    getGameStats() {
        return this.storage.getStats();
    }

    /**
     * Obtiene las estadísticas actuales del juego
     */
    getCurrentGameStats() {
        // Calcular estadísticas generales de todos los jugadores
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        this.players.forEach(player => {
            totalQuestions += player.stats.questionsAnswered;
            totalCorrect += player.stats.correctAnswers;
        });
        
        return {
            totalQuestions: totalQuestions,
            totalCorrect: totalCorrect,
            startTime: this.gameStartTime,
            currentTime: Date.now(),
            gameState: this.gameState
        };
    }

    /**
     * Obtiene estadísticas detalladas del juego
     */
    getDetailedGameStats() {
        const baseStats = this.getCurrentGameStats();
        
        // Estadísticas por categoría
        const categoryStats = {};
        this.players.forEach(player => {
            Object.keys(player.stats.categories).forEach(category => {
                if (!categoryStats[category]) {
                    categoryStats[category] = { correct: 0, total: 0 };
                }
                categoryStats[category].correct += player.stats.categories[category].correct;
                categoryStats[category].total += player.stats.categories[category].total;
            });
        });
        
        // Estadísticas por jugador
        const playerStats = this.players.map(player => ({
            name: player.name,
            questionsAnswered: player.stats.questionsAnswered,
            correctAnswers: player.stats.correctAnswers,
            wedges: player.wedges.length,
            hasAllWedges: player.hasAllWedges(),
            averageResponseTime: player.stats.averageResponseTime,
            categories: player.stats.categories
        }));
        
        return {
            ...baseStats,
            categoryStats,
            playerStats,
            averageAccuracy: baseStats.totalQuestions > 0 ? 
                (baseStats.totalCorrect / baseStats.totalQuestions * 100).toFixed(1) : 0
        };
    }

    /**
     * Actualiza la configuración del juego
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.storage.saveConfig(this.config);
        
        this.emit('configUpdated', this.config);
        console.log('Configuración actualizada:', this.config);
    }

    /**
     * Registra un manejador de eventos
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    /**
     * Emite un evento
     */
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error en manejador de evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Obtiene información de debug del juego
     */
    getDebugInfo() {
        return {
            gameState: this.gameState,
            playersCount: this.players.length,
            currentPlayerIndex: this.currentPlayerIndex,
            currentPlayer: this.getCurrentPlayer()?.name,
            usedQuestionsCount: this.usedQuestions.size,
            config: this.config,
            hasSavedGame: this.hasSavedGame(),
            boardInfo: this.board?.getDebugInfo()
        };
    }
}
