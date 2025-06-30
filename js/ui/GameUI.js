/**
 * Clase para manejar la interfaz de usuario del juego
 */
class GameUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentQuestion = null;
        this.questionTimer = null;
        this.timeRemaining = 0;
        this.continuesTurnAfterAnswer = false; // Flag para saber si debe continuar el turno
        this.pendingQuestion = null; // Pregunta pendiente de responder
        this.hasAnswered = false; // Flag para saber si se respondió la pregunta actual
        this.isMinimizing = false; // Flag para saber si se está minimizando intencionalmente
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupGameEventListeners();
        
        // Configurar redimensionamiento del tablero
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize(); // Ajuste inicial
    }

    /**
     * Inicializa las referencias a elementos del DOM
     */
    initializeElements() {        // Elementos del header del juego
        this.gameHeader = {
            currentPlayerInfo: document.getElementById('current-player-info'),
            currentPlayerName: document.getElementById('current-player-name'),
            translationToggleBtn: document.getElementById('translation-toggle-btn'),
            reopenQuestionBtn: document.getElementById('reopen-question-btn'),
            pauseMenuBtn: document.getElementById('pause-menu-btn')
        };// Elementos del dado
        this.diceElements = {
            dice: document.getElementById('dice'),
            rollBtn: document.getElementById('roll-dice-btn'),
            boardTranslationIndicator: document.getElementById('board-translation-indicator')
        };        // Panel de jugadores
        this.playersPanel = document.getElementById('players-list');
        console.log('🔍 DEBUG: Panel de jugadores inicializado:', this.playersPanel ? 'ENCONTRADO' : 'NO ENCONTRADO');
        if (this.playersPanel) {
            console.log('🔍 DEBUG: Elemento del panel:', this.playersPanel.tagName, 'ID:', this.playersPanel.id);
        }// Panel de historial de preguntas
        this.questionsHistoryPanel = document.getElementById('questions-history-list');
        this.questionsHistory = []; // Array para almacenar el historial        // Indicador de pregunta pendiente en el tablero
        this.boardPendingIndicator = document.getElementById('board-pending-question');

        // Botón de iniciar pregunta en el tablero
        this.boardStartQuestion = document.getElementById('board-start-question');
        this.startQuestionBtn = document.getElementById('start-question-btn');

        // Modales
        this.modals = {
            question: document.getElementById('question-modal'),
            result: document.getElementById('result-modal'),
            pause: document.getElementById('pause-modal')
        };        // Elementos del modal de pregunta
        this.questionElements = {
            category: document.getElementById('question-category'),
            translationIndicator: document.getElementById('translation-indicator'),
            timer: document.getElementById('question-timer'),
            text: document.getElementById('question-text'),
            answers: document.getElementById('question-answers'),
            showOriginalBtn: document.getElementById('show-original-question-btn'),
            minimizeBtn: document.getElementById('minimize-question-btn'),
            skipBtn: document.getElementById('skip-question-btn')
        };

        // Elementos del modal de resultado
        this.resultElements = {
            icon: document.getElementById('result-icon'),
            title: document.getElementById('result-title'),
            message: document.getElementById('result-message'),
            correctAnswer: document.getElementById('correct-answer'),
            continueBtn: document.getElementById('continue-btn')
        };        // Elementos del modal de pausa
        this.pauseElements = {
            resumeBtn: document.getElementById('resume-btn'),
            saveBtn: document.getElementById('save-game-btn'),
            quitBtn: document.getElementById('quit-game-btn')
        };

        // Elementos del panel de estadísticas
        this.statsElements = {
            totalQuestions: document.getElementById('total-questions'),
            totalCorrect: document.getElementById('total-correct'),
            gameTime: document.getElementById('game-time')
        };

        // Inicializar estadísticas
        this.gameStats = {
            totalQuestions: 0,
            totalCorrect: 0,
            startTime: null,
            gameTimeInterval: null
        };
    }

    /**
     * Configura los event listeners de la UI
     */
    setupEventListeners() {        // Controles del header
        this.gameHeader.translationToggleBtn.addEventListener('click', () => this.toggleTranslation());
        this.gameHeader.reopenQuestionBtn.addEventListener('click', () => this.reopenPendingQuestion());
        this.gameHeader.pauseMenuBtn.addEventListener('click', () => this.pauseGame());
        
        // Indicador de pregunta pendiente en el tablero
        if (this.boardPendingIndicator) {
            this.boardPendingIndicator.addEventListener('click', () => this.reopenPendingQuestion());
            this.boardPendingIndicator.style.cursor = 'pointer';
        }

        // Botón de iniciar pregunta en el tablero
        if (this.startQuestionBtn) {
            this.startQuestionBtn.addEventListener('click', () => this.startBoardQuestion());
        }

        // Dado
        this.diceElements.rollBtn.addEventListener('click', () => this.rollDice());        // Modal de pregunta
        this.questionElements.showOriginalBtn.addEventListener('click', () => this.toggleOriginalQuestion());
        this.questionElements.minimizeBtn.addEventListener('click', () => this.minimizeQuestion());
        this.questionElements.skipBtn.addEventListener('click', () => this.skipQuestion());

        // Modal de resultado
        this.resultElements.continueBtn.addEventListener('click', () => this.closeResultModal());

        // Modal de pausa
        this.pauseElements.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.pauseElements.saveBtn.addEventListener('click', () => this.saveGame());
        this.pauseElements.quitBtn.addEventListener('click', () => this.quitGame());

        // Cerrar modales con Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeActiveModal();
            }
        });
    }

    /**
     * Configura los event listeners del motor del juego
     */
    setupGameEventListeners() {
        this.gameEngine.on('gameStarted', (data) => this.onGameStarted(data));
        this.gameEngine.on('gameContinued', (data) => this.onGameContinued(data));
        this.gameEngine.on('playerTurnChanged', (data) => this.onPlayerTurnChanged(data));
        this.gameEngine.on('diceRolled', (data) => this.onDiceRolled(data));
        this.gameEngine.on('playerMoved', (data) => this.onPlayerMoved(data));
        this.gameEngine.on('questionAsked', (data) => this.onQuestionAsked(data));
        this.gameEngine.on('answerProcessed', (data) => this.onAnswerProcessed(data));
        this.gameEngine.on('wedgeEarned', (data) => this.onWedgeEarned(data));        this.gameEngine.on('gameWon', (data) => this.onGameWon(data));
        this.gameEngine.on('gamePaused', () => this.onGamePaused());
        this.gameEngine.on('gameResumed', () => this.onGameResumed());
          // Event listeners para traducción
        this.gameEngine.on('translationStarted', (data) => this.onTranslationStarted(data));
        this.gameEngine.on('translationCompleted', (data) => this.onTranslationCompleted(data));
        this.gameEngine.on('translationError', (data) => this.onTranslationError(data));
        
        // Event listener para el botón de iniciar pregunta
        this.gameEngine.on('showStartQuestionButton', (data) => this.onShowStartQuestionButton(data));
    }    /**
     * Maneja el evento de juego iniciado
     */
    onGameStarted(data) {
        this.updatePlayersPanel(data.players);
        this.updateCurrentPlayer(data.players[0]);
        
        // Solo habilitar el dado si no hay preguntas pendientes
        if (!this.pendingQuestion && !this.currentQuestion) {
            this.enableDiceRoll();
        }
        
        // Limpiar historial de preguntas para nuevo juego
        this.questionsHistory = [];
        this.updateQuestionsHistoryPanel();
        
        // Inicializar estado del botón de traducción
        this.updateTranslationButtonState(this.gameEngine.config.translationEnabled);
        
        // Inicializar estadísticas del juego
        this.resetGameStats();
        this.startGameTimer();
        
        console.log('UI: Juego iniciado');
    }    /**
     * Maneja el evento de juego continuado
     */
    onGameContinued(data) {
        this.updatePlayersPanel(data.players);
        this.updateCurrentPlayer(data.currentPlayer);
        
        // Solo habilitar el dado si no hay preguntas pendientes
        if (!this.pendingQuestion && !this.currentQuestion) {
            this.enableDiceRoll();
        }
        
        // Mantener historial existente para juego continuado
        this.updateQuestionsHistoryPanel();
        
        // Inicializar estado del botón de traducción
        this.updateTranslationButtonState(this.gameEngine.config.translationEnabled);
        
        // Restaurar estadísticas del juego guardado
        const savedStats = this.gameEngine.getCurrentGameStats();
        if (savedStats) {
            this.updateStatsFromSavedData(savedStats);
        } else {
            this.startGameTimer();
        }
        
        console.log('UI: Juego continuado');
    }/**
     * Maneja el cambio de turno
     */
    onPlayerTurnChanged(data) {
        console.log('🔍 DEBUG: onPlayerTurnChanged ejecutado');
        console.log('🔍 DEBUG: Nuevo jugador:', data.currentPlayer.name);
        console.log('🔍 DEBUG: Estado de preguntas:', {
            pendingQuestion: !!this.pendingQuestion,
            currentQuestion: !!this.currentQuestion,
            gameEngineQuestion: !!this.gameEngine.currentQuestion
        });
        
        this.updateCurrentPlayer(data.currentPlayer);
        this.updatePlayersPanel(this.gameEngine.players);
        
        // Al cambiar de turno, limpiar cualquier estado residual
        this.continuesTurnAfterAnswer = false;
        this.currentQuestion = null;
        
        // Verificar estado completo antes de habilitar el dado
        const hasAnyQuestion = !!(this.pendingQuestion || this.gameEngine.currentQuestion);
        
        if (!hasAnyQuestion) {
            console.log('🔍 DEBUG: No hay preguntas activas, habilitando dado para nuevo turno');
            this.enableDiceRoll();
        } else {
            console.log('🔍 DEBUG: Hay preguntas activas, manteniendo dado deshabilitado');
            this.disableDiceRoll();
        }
    }

    /**
     * Maneja el evento de dado tirado
     */
    onDiceRolled(data) {
        this.animateDice(data.value);
        this.disableDiceRoll();
    }    /**
     * Maneja el movimiento del jugador
     */
    onPlayerMoved(data) {
        console.log('🔍 DEBUG: onPlayerMoved ejecutado');
        console.log('🔍 DEBUG: Datos del movimiento:', {
            player: data.player.name,
            diceValue: data.diceValue,
            oldPosition: data.oldPosition,
            newPosition: data.newPosition
        });
        
        // Verificar el estado del ResizeObserver después del movimiento
        if (this.gameEngine.board) {
            console.log('🔍 DEBUG: Estado del ResizeObserver después del movimiento:', {
                paused: this.gameEngine.board.resizeObserverPaused
            });
        }
        
        // Verificar si hay clases de animación activas en elementos del DOM
        const diceElement = this.diceElements.dice;
        const diceContainer = diceElement.closest('.dice-container');
        console.log('🔍 DEBUG: Clases activas en elementos del dado después del movimiento:', {
            dice: Array.from(diceElement.classList),
            container: diceContainer ? Array.from(diceContainer.classList) : 'No encontrado'
        });
        
        // Verificar si hay animaciones CSS activas
        const computedStyle = window.getComputedStyle(diceElement);
        console.log('🔍 DEBUG: Animaciones CSS activas:', {
            animation: computedStyle.animation,
            transform: computedStyle.transform,
            filter: computedStyle.filter
        });
        
        // La animación del tablero se maneja en el GameEngine
        console.log(`UI: ${data.player.name} se movió ${data.diceValue} espacios`);
    }

    /**
     * Maneja cuando se hace una pregunta
     */
    onQuestionAsked(data) {
        this.showQuestionModal(data);
    }    /**
     * Maneja la respuesta procesada
     */
    onAnswerProcessed(data) {
        this.showResultModal(data);
        
        // Guardar si el jugador continúa su turno para usar después del modal
        this.continuesTurnAfterAnswer = data.continuesTurn;

        // Actualizar estadísticas
        this.incrementTotalQuestions();
        if (data.isCorrect) {
            this.incrementCorrectAnswers();
        }

        // Añadir la pregunta al historial
        const result = data.isCorrect ? 'correct' : 'incorrect';
        const selectedAnswer = data.answerIndex >= 0 ? data.question.answers[data.answerIndex] : null;
        this.addQuestionToHistory(
            data.question, 
            data.player, 
            result, 
            selectedAnswer
        );
    }

    /**
     * Maneja cuando se gana una cuña
     */
    onWedgeEarned(data) {
        this.animateWedgeEarned(data.player, data.category);
        this.updatePlayersPanel(this.gameEngine.players);
    }    /**
     * Maneja cuando se gana el juego
     */
    onGameWon(data) {
        // Detener el temporizador de estadísticas
        this.stopGameTimer();
        
        this.showVictoryModal(data);
        this.createVictoryEffect();
    }

    /**
     * Maneja el juego pausado
     */
    onGamePaused() {
        this.showPauseModal();
    }    /**
     * Maneja el juego reanudado
     */
    onGameResumed() {
        this.closePauseModal();
    }    /**
     * Maneja el inicio de traducción
     */
    onTranslationStarted(data) {
        console.log('Traducción iniciada para pregunta:', data.question);
        
        // Mostrar indicador en el tablero con mensaje personalizado
        const message = data.category ? 
            `Traduciendo pregunta de ${data.category}...` : 
            'Traduciendo pregunta...';
        this.showBoardTranslationIndicator(message);
        
        // Mostrar indicador en el modal de pregunta si está activo
        if (this.modals.question && this.modals.question.classList.contains('active')) {
            const modalIndicator = document.getElementById('translation-indicator');
            if (modalIndicator) {
                modalIndicator.style.display = 'flex';
                const modalText = modalIndicator.querySelector('.translation-text');
                if (modalText) {
                    modalText.textContent = 'Traduciendo...';
                }
            }
        }
    }

    /**
     * Maneja la finalización de traducción
     */
    onTranslationCompleted(data) {
        console.log('Traducción completada:', data.translatedQuestion);
        
        // Mostrar brevemente mensaje de éxito antes de ocultar
        this.updateBoardTranslationIndicator('¡Traducción completada!', false);
        this.hideBoardTranslationIndicator(1000);
        
        // Ocultar indicador del modal si está activo
        if (this.modals.question && this.modals.question.classList.contains('active')) {
            const modalIndicator = document.getElementById('translation-indicator');
            if (modalIndicator) {
                const modalText = modalIndicator.querySelector('.translation-text');
                if (modalText) {
                    modalText.textContent = 'Traducido ✓';
                }
                
                // Mostrar brevemente "Traducido" antes de ocultar
                setTimeout(() => {
                    modalIndicator.style.display = 'none';
                }, 1500);
            }
        }
    }    /**
     * Maneja errores en la traducción
     */
    onTranslationError(data) {
        console.warn('Error en traducción:', data.error);
        
        // Mostrar mensaje de error temporalmente
        this.updateBoardTranslationIndicator('Error de traducción', false);
        this.hideBoardTranslationIndicator(2000);
        
        // Ocultar indicador del modal si está activo
        if (this.modals.question && this.modals.question.classList.contains('active')) {
            const modalIndicator = document.getElementById('translation-indicator');
            if (modalIndicator) {
                const modalText = modalIndicator.querySelector('.translation-text');
                if (modalText) {
                    modalText.textContent = 'Error de traducción ⚠️';
                }
                
                // Cambiar el color a error temporalmente
                modalIndicator.style.borderColor = 'var(--error-color)';
                modalIndicator.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
                
                // Mostrar brevemente el error antes de ocultar
                setTimeout(() => {
                    modalIndicator.style.display = 'none';
                    // Restaurar estilos originales
                    modalIndicator.style.borderColor = '';
                    modalIndicator.style.backgroundColor = '';
                }, 2500);
            }
        }
        
        // Mostrar notificación de error
        this.showNotification('Error al traducir la pregunta. Se mostrará en idioma original.', 'warning');
    }

    /**
     * Maneja cuando se debe mostrar el botón de iniciar pregunta
     */
    onShowStartQuestionButton(data) {
        console.log('Mostrando botón de iniciar pregunta para categoría:', data.category);
        this.showBoardStartQuestionButton(data.category);
    }    /**
     * Actualiza el panel de jugadores
     */
    updatePlayersPanel(players) {
        console.log('🔍 DEBUG: Actualizando panel de jugadores con', players.length, 'jugadores');
        this.playersPanel.innerHTML = '';

        players.forEach(player => {
            console.log('🔍 DEBUG: Creando elemento para jugador:', player.name);
            const playerElement = this.createPlayerElement(player);
            this.playersPanel.appendChild(playerElement);
        });
        
        console.log('🔍 DEBUG: Panel de jugadores actualizado');
    }/**
     * Añade una pregunta al historial
     */
    addQuestionToHistory(question, player, result, selectedAnswer = null) {
        const historyItem = {
            question: question.text,
            category: question.category,
            player: player.name,
            result: result,
            selectedAnswer: selectedAnswer,
            correctAnswer: question.correctAnswer,
            timestamp: new Date().toISOString()
        };
        
        // Añadir al array
        this.questionsHistory.unshift(historyItem);
        
        // Mantener máximo de 50 elementos
        if (this.questionsHistory.length > 50) {
            this.questionsHistory = this.questionsHistory.slice(0, 50);
        }
        
        // Actualizar solo añadiendo el nuevo elemento con animación
        this.addNewHistoryElement(historyItem);
    }/**
     * Añade un nuevo elemento al historial con animación
     */
    addNewHistoryElement(item) {
        if (!this.questionsHistoryPanel) {
            console.error('Panel de historial no encontrado');
            return;
        }
        
        // Si es el primer elemento, limpiar el mensaje de vacío
        if (this.questionsHistory.length === 1) {
            this.questionsHistoryPanel.innerHTML = '';
        }

        // Crear y añadir el nuevo elemento
        const historyElement = this.createHistoryElement(item, true);
        this.questionsHistoryPanel.insertBefore(historyElement, this.questionsHistoryPanel.firstChild);

        // Remover elementos antiguos si hay más de 20
        while (this.questionsHistoryPanel.children.length > 20) {
            this.questionsHistoryPanel.removeChild(this.questionsHistoryPanel.lastChild);
        }
    }

    /**
     * Actualiza el panel de historial de preguntas
     */
    updateQuestionsHistoryPanel() {
        this.questionsHistoryPanel.innerHTML = '';

        if (this.questionsHistory.length === 0) {
            this.questionsHistoryPanel.innerHTML = `
                <div class="history-empty">
                    <p>Aún no se han hecho preguntas...</p>
                </div>
            `;
            return;
        }

        this.questionsHistory.forEach(item => {
            const historyElement = this.createHistoryElement(item);
            this.questionsHistoryPanel.appendChild(historyElement);
        });
    }    /**
     * Crea el elemento HTML para una entrada del historial
     */
    createHistoryElement(item, isNew = false) {
        const div = document.createElement('div');
        div.className = `history-question ${item.result}${isNew ? ' new' : ''}`;
        
        const categoryColors = {
            historia: '#FF6B6B',
            ciencia: '#4ECDC4', 
            deportes: '#45B7D1',
            arte: '#96CEB4',
            geografia: '#FECA57',
            entretenimiento: '#FF9FF3'
        };

        const resultIcons = {
            correct: '✅',
            incorrect: '❌',
            skipped: '⏭️'
        };

        const resultTexts = {
            correct: 'Correcta',
            incorrect: 'Incorrecta',
            skipped: 'Saltada'
        };

        div.innerHTML = `
            <div class="question-category" style="background-color: ${categoryColors[item.category] || '#667eea'}">
                ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </div>
            <div class="question-text">${item.question}</div>
            <div class="question-result">
                <span class="question-player">${item.player}</span>
                <span>${resultIcons[item.result]} ${resultTexts[item.result]}</span>
            </div>
            ${item.selectedAnswer && item.result === 'incorrect' ? 
                `<div class="question-answer">Respuesta: ${item.selectedAnswer}</div>` : 
                ''
            }
            <div class="question-answer">Correcta: ${item.correctAnswer}</div>
        `;

        // Remover la clase 'new' después de la animación
        if (isNew) {
            setTimeout(() => {
                div.classList.remove('new');
            }, 1300);
        }

        return div;
    }    /**
     * Crea el elemento HTML para un jugador
     */    createPlayerElement(player) {
        console.log('🔍 DEBUG: Creando elemento HTML para jugador:', player.name, 'ID:', player.id);
        
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-info ${player.currentTurn ? 'active' : ''}`;
          const playerHTML = `
            <div class="player-header">
                <div class="player-token" style="background-color: ${player.color}"></div>
                <span class="player-name" 
                      contenteditable="false" 
                      data-player-id="${player.id}"
                      title="Click para editar el nombre">${player.name}</span>
            </div>
            <div class="player-wedges">
                ${this.createWedgesHTML(player)}
            </div>
            <div class="player-stats">
                <small>Aciertos: ${player.stats.correctAnswers}/${player.stats.questionsAnswered} (${player.getAccuracyPercentage()}%)</small>
            </div>
        `;
        
        playerDiv.innerHTML = playerHTML;

        // Configurar eventos para la edición del nombre
        this.setupPlayerNameEditing(playerDiv, player);

        console.log('🔍 DEBUG: Elemento del jugador creado exitosamente');
        return playerDiv;
    }

    /**
     * Crea el HTML para las cuñas del jugador
     */
    createWedgesHTML(player) {
        const categories = ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'];
        const colors = {
            historia: '#FF6B6B',
            ciencia: '#4ECDC4',
            deportes: '#45B7D1',
            arte: '#96CEB4',
            geografia: '#FECA57',
            entretenimiento: '#FF9FF3'
        };

        return categories.map(category => {
            const hasWedge = player.wedges[category];
            return `<div class="wedge ${hasWedge ? 'collected' : ''}" 
                         style="background-color: ${colors[category]}"></div>`;
        }).join('');
    }

    /**
     * Actualiza la información del jugador currente
     */
    updateCurrentPlayer(player) {
        if (!player) return;

        const tokenElement = this.gameHeader.currentPlayerInfo.querySelector('.player-token');
        tokenElement.style.backgroundColor = player.color;
        
        this.gameHeader.currentPlayerName.textContent = player.name;
    }    /**
     * Habilita el botón de tirar dado
     */
    enableDiceRoll() {
        console.log('🔍 DEBUG: enableDiceRoll llamado');
        console.log('🔍 DEBUG: Estado antes de habilitar:', {
            buttonDisabled: this.diceElements.rollBtn.disabled,
            buttonText: this.diceElements.rollBtn.textContent,
            gameEngineQuestion: !!this.gameEngine.currentQuestion,
            pendingQuestion: !!this.pendingQuestion,
            currentQuestion: !!this.currentQuestion
        });
        
        this.diceElements.rollBtn.disabled = false;
        this.diceElements.rollBtn.textContent = 'Tirar Dado';
        this.diceElements.dice.classList.remove('rolling');
        
        console.log('🔍 DEBUG: Dado habilitado exitosamente');
    }

    /**
     * Deshabilita el botón de tirar dado
     */
    disableDiceRoll() {
        console.log('🔍 DEBUG: disableDiceRoll llamado');
        console.log('🔍 DEBUG: Estado antes de deshabilitar:', {
            buttonDisabled: this.diceElements.rollBtn.disabled,
            buttonText: this.diceElements.rollBtn.textContent,
            gameEngineQuestion: !!this.gameEngine.currentQuestion,
            pendingQuestion: !!this.pendingQuestion,
            currentQuestion: !!this.currentQuestion
        });
        
        this.diceElements.rollBtn.disabled = true;
        this.diceElements.rollBtn.textContent = 'Esperando...';
        
        console.log('🔍 DEBUG: Dado deshabilitado exitosamente');
    }

    /**
     * Tira el dado
     */    /**
     * Tira el dado con animación mejorada de suspense
     */
    async rollDice() {
        if (this.diceElements.rollBtn.disabled) return;
        
        this.disableDiceRoll();
        
        // PAUSAR ResizeObserver al inicio del lanzamiento del dado
        if (this.gameEngine.board) {
            this.gameEngine.board.pauseResizeObserver();
        }
        
        // Efecto de preparación inicial
        await this.showDicePreparation();
        
        // Iniciar animación de suspense
        await this.startDiceRollAnimation();
        
        // Ejecutar la lógica del juego
        await this.gameEngine.rollDice();
    }

    /**
     * Efecto visual de preparación antes del lanzamiento
     */
    async showDicePreparation() {
        const diceElement = this.diceElements.dice;
        const rollBtn = this.diceElements.rollBtn;
        
        // Cambiar texto del botón
        rollBtn.textContent = '🎯 Preparando...';
        
        // Efecto de "carga" del dado
        diceElement.style.transform = 'scale(0.9)';
        diceElement.style.filter = 'brightness(1.2)';
        
        return new Promise(resolve => {
            setTimeout(() => {
                diceElement.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    diceElement.style.transform = '';
                    diceElement.style.filter = '';
                    resolve();
                }, 200);
            }, 300);
        });
    }    /**
     * Animación completa de lanzamiento del dado con suspense
     */
    async startDiceRollAnimation() {
        const diceElement = this.diceElements.dice;
        const diceContainer = this.diceElements.dice.closest('.dice-container');
        const diceFace = diceElement.querySelector('.dice-face');
        const rollBtn = this.diceElements.rollBtn;
          // Cambiar texto del botón y agregar efectos sonoros visuales
        rollBtn.textContent = '🎲 Lanzando...';
        rollBtn.disabled = true;
        
        // Efecto de "build-up" en el botón
        this.animateButtonBuildUp(rollBtn);
        
        // Crear efectos de sonido visual
        this.createSoundEffects(diceContainer);
        
        // Mostrar mensajes de suspense
        this.showSuspenseMessages(diceContainer);
        
        // Comenzar animaciones
        diceElement.classList.add('rolling');
        diceContainer.classList.add('rolling');
        
        // Simulación de números cambiando rápidamente
        const numberInterval = this.startNumberSpinning(diceFace);
        
        // Esperar duración completa de la animación (2.5 segundos)
        return new Promise(resolve => {
            setTimeout(() => {
                // Detener cambio de números
                clearInterval(numberInterval);
                
                // Limpiar clases de animación
                diceElement.classList.remove('rolling');
                diceContainer.classList.remove('rolling');
                
                resolve();
            }, 2500);
        });
    }

    /**
     * Anima el botón del dado durante el build-up
     */
    animateButtonBuildUp(button) {
        const messages = ['🎲 Lanzando...', '🎯 Girando...', '⚡ Volando...', '🔥 ¡Momento!'];
        let messageIndex = 0;
        
        const buttonInterval = setInterval(() => {
            if (messageIndex < messages.length) {
                button.textContent = messages[messageIndex];
                messageIndex++;
            }
        }, 600);
        
        // Limpiar después de 2.5 segundos
        setTimeout(() => {
            clearInterval(buttonInterval);
        }, 2500);
    }

    /**
     * Crea efectos de sonido visual durante el lanzamiento
     */
    createSoundEffects(container) {
        const soundEffects = ['💫', '⚡', '🌪️', '💥'];
        let effectIndex = 0;
        
        const effectInterval = setInterval(() => {
            const effect = document.createElement('div');
            effect.textContent = soundEffects[effectIndex % soundEffects.length];
            effect.style.cssText = `
                position: absolute;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 20;
                top: -10px;
                right: -10px;
                animation: soundEffectFloat 0.8s ease-out forwards;
                opacity: 0.8;
            `;
            
            container.appendChild(effect);
            
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 800);
            
            effectIndex++;
        }, 400);
        
        // Detener efectos después de 2.5 segundos
        setTimeout(() => {
            clearInterval(effectInterval);
        }, 2500);
    }    /**
     * Efecto de números girando rápidamente
     */
    startNumberSpinning(diceFace) {
        const numbers = ['1', '2', '3', '4', '5', '6'];
        let currentIndex = 0;
        
        const interval = setInterval(() => {
            diceFace.textContent = numbers[currentIndex];
            currentIndex = (currentIndex + 1) % numbers.length;
        }, 80); // Velocidad constante más rápida para mejor efecto
        
        return interval;
    }

    /**
     * Muestra mensajes de suspense durante el lanzamiento
     */
    showSuspenseMessages(container) {
        const messages = ['🎯 Calculando...', '🔥 Girando...', '⭐ Casi listo...', '🎪 ¡Último giro!'];
        let messageIndex = 0;
        
        const messageInterval = setInterval(() => {
            if (messageIndex < messages.length) {
                this.createFloatingMessage(container, messages[messageIndex]);
                messageIndex++;
            }
        }, 600);
        
        // Limpiar después de 2.5 segundos
        setTimeout(() => {
            clearInterval(messageInterval);
        }, 2500);
    }

    /**
     * Crea un mensaje flotante temporal
     */
    createFloatingMessage(container, text) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            pointer-events: none;
            z-index: 25;
            animation: messageFloat 1.2s ease-out forwards;
            white-space: nowrap;
        `;
        
        container.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 1200);
    }    /**
     * Anima el resultado final del dado
     */
    animateDice(value) {
        console.log('🔍 DEBUG: Iniciando animateDice con valor:', value);
        
        const diceElement = this.diceElements.dice;
        const diceContainer = this.diceElements.dice.closest('.dice-container');
        const diceFace = diceElement.querySelector('.dice-face');
        const rollBtn = this.diceElements.rollBtn;
        
        // PAUSAR ResizeObserver al inicio de las animaciones del dado
        if (this.gameEngine.board) {
            console.log('🔍 DEBUG: Pausando ResizeObserver durante animateDice');
            this.gameEngine.board.pauseResizeObserver();
        }
        
        // Mostrar el valor final
        diceFace.textContent = value;
        
        // Animación de aterrizaje
        console.log('🔍 DEBUG: Agregando animación de aterrizaje');
        diceElement.classList.add('landed');
        
        // Efecto de sonido visual
        this.createDiceImpactEffect(diceElement);
        
        setTimeout(() => {
            console.log('🔍 DEBUG: Removiendo animación de aterrizaje, agregando brillo');
            
            // Quitar animación de aterrizaje
            diceElement.classList.remove('landed');
            
            // Agregar efecto de brillo
            diceElement.classList.add('glowing');
            
            // Mostrar countdown para el movimiento
            this.showMovementCountdown(rollBtn, value);
            
            setTimeout(() => {
                console.log('🔍 DEBUG: Removiendo efecto de brillo');
                
                // Quitar efecto de brillo
                diceElement.classList.remove('glowing');
                
                // Crear efecto de celebración si es un 6
                if (value === 6) {
                    console.log('🔍 DEBUG: Creando efecto de celebración para el 6');
                    this.createCelebrationEffect(diceContainer);
                }
                
            }, 800);
        }, 1000);
    }

    /**
     * Crea efecto visual de impacto cuando el dado aterriza
     */
    createDiceImpactEffect(diceElement) {
        // Crear ondas de impacto
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.style.cssText = `
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--primary-color);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 5;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0.8;
                    animation: rippleExpand 0.6s ease-out forwards;
                `;
                
                diceElement.appendChild(ripple);
                
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 600);
            }, i * 150);
        }
    }

    /**
     * Crea efecto de celebración para el número 6
     */
    createCelebrationEffect(container) {
        // Crear partículas de celebración
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.textContent = ['🎉', '✨', '⭐', '🌟'][Math.floor(Math.random() * 4)];
                particle.style.cssText = `
                    position: absolute;
                    font-size: 1.2rem;
                    pointer-events: none;
                    z-index: 15;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation: celebrationFloat 1.5s ease-out forwards;
                `;
                
                // Dirección aleatoria
                const angle = (360 / 8) * i;
                particle.style.setProperty('--angle', `${angle}deg`);
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 1500);
            }, i * 50);
        }
    }/**
     * Muestra el modal de pregunta
     */    showQuestionModal(data) {
        this.currentQuestion = data.question;
        this.pendingQuestion = data; // Almacenar pregunta como pendiente
        this.hasAnswered = false; // Resetear estado de respuesta
        
        // Asegurar que el dado esté deshabilitado durante la pregunta
        this.disableDiceRoll();
        
        // Configurar categoría
        this.questionElements.category.textContent = data.question.getCategoryLabel();
        this.questionElements.category.style.backgroundColor = data.question.getCategoryColor();
          // Mostrar indicador de traducción si está habilitada
        const isTranslationEnabled = this.gameEngine.config.translationEnabled;
        const isFromAPI = data.question.source === 'api';
        
        if (isTranslationEnabled && isFromAPI) {
            this.questionElements.translationIndicator.style.display = 'flex';
        } else {
            this.questionElements.translationIndicator.style.display = 'none';
        }
        
        // Mostrar/ocultar botón de pregunta original
        if (data.question.isTranslated()) {
            this.questionElements.showOriginalBtn.style.display = 'inline-block';
            this.questionElements.showOriginalBtn.innerHTML = '🔄 Ver original';
            this.questionElements.showOriginalBtn.classList.remove('active');
        } else {
            this.questionElements.showOriginalBtn.style.display = 'none';
        }
        
        // Resetear estado de la pregunta a traducida
        if (data.question.showingOriginal) {
            data.question.showingOriginal = false;
        }
        
        // Configurar texto de pregunta
        this.questionElements.text.textContent = data.question.text;
        
        // Crear botones de respuesta
        this.createAnswerButtons(data.question);
        
        // Configurar temporizador si está habilitado
        if (data.timeLimit > 0) {
            this.startQuestionTimer(data.timeLimit);
        } else {
            this.questionElements.timer.style.display = 'none';
        }
        
        // Mostrar modal
        this.showModal('question');
    }

    /**
     * Crea los botones de respuesta
     */
    createAnswerButtons(question) {
        const shuffledAnswers = question.getShuffledAnswers();
        this.questionElements.answers.innerHTML = '';
        
        shuffledAnswers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer.text;
            button.addEventListener('click', () => this.answerQuestion(answer.index));
            this.questionElements.answers.appendChild(button);
        });
    }    /**
     * Inicia el temporizador de pregunta
     */
    startQuestionTimer(timeLimit) {
        // Asegurar que no hay un temporizador previo ejecutándose
        this.stopQuestionTimer();
        
        this.timeRemaining = timeLimit;
        this.questionElements.timer.style.display = 'flex';
        
        const timerText = this.questionElements.timer.querySelector('.timer-text');
        const timerBar = this.questionElements.timer.querySelector('.timer-bar');
        
        // Configurar animación de la barra
        timerBar.style.setProperty('--duration', `${timeLimit}s`);
        
        this.questionTimer = setInterval(() => {
            this.timeRemaining--;
            timerText.textContent = this.timeRemaining;
            
            if (this.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    /**
     * Maneja cuando se acaba el tiempo
     */
    timeUp() {
        this.stopQuestionTimer();
        this.answerQuestion(-1); // Respuesta incorrecta por tiempo agotado
    }

    /**
     * Detiene el temporizador de pregunta
     */
    stopQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
    }    /**
     * Responde una pregunta
     */
    answerQuestion(answerIndex) {
        this.stopQuestionTimer();
        this.hasAnswered = true; // Marcar que se ha respondido
        
        // Deshabilitar botones de respuesta
        const answerButtons = this.questionElements.answers.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => btn.disabled = true);
        
        // Limpiar pregunta pendiente
        this.clearPendingQuestion();
        
        // Procesar respuesta
        this.gameEngine.processAnswer(answerIndex);
    }    /**
     * Salta una pregunta
     */
    skipQuestion() {
        if (this.currentQuestion) {
            // Añadir la pregunta saltada al historial
            this.addQuestionToHistory(
                this.currentQuestion, 
                this.gameEngine.getCurrentPlayer(), 
                'skipped'
            );
            
            // Actualizar estadísticas (pregunta saltada cuenta como respondida)
            this.incrementTotalQuestions();
        }
        
        this.answerQuestion(-1); // Tratar como respuesta incorrecta
    }

    /**
     * Muestra el modal de resultado
     */
    showResultModal(data) {
        const { isCorrect, question, timeSpent } = data;
        
        // Configurar icono y título
        if (isCorrect) {
            this.resultElements.icon.className = 'result-icon success';
            this.resultElements.title.textContent = '¡Correcto!';
            this.resultElements.message.textContent = `Respuesta correcta en ${Math.round(timeSpent)} segundos.`;
        } else {
            this.resultElements.icon.className = 'result-icon error';
            this.resultElements.title.textContent = 'Incorrecto';
            this.resultElements.message.textContent = 'Respuesta incorrecta.';
            
            // Mostrar respuesta correcta
            this.resultElements.correctAnswer.textContent = `La respuesta correcta era: ${question.correctAnswer}`;
            this.resultElements.correctAnswer.style.display = 'block';
        }
        
        // Ocultar modal de pregunta y mostrar resultado
        this.hideModal('question');
        this.showModal('result');
    }    /**
     * Cierra el modal de resultado
     */
    closeResultModal() {
        console.log('🔍 DEBUG: Cerrando modal de resultado');
        
        // Limpiar estado local del UI
        this.hideModal('result');
        this.currentQuestion = null;
        
        // Limpiar pregunta pendiente ya que se ha resuelto
        this.clearPendingQuestion();
        
        // Limpiar respuesta correcta
        this.resultElements.correctAnswer.style.display = 'none';
        
        // Verificar estado después de la limpieza local
        const hasGameEngineQuestion = this.gameEngine.currentQuestion !== null;
        const hasPendingQuestion = !!this.pendingQuestion;
        
        console.log('🔍 DEBUG: Estado después de limpieza:', {
            continuesTurnAfterAnswer: this.continuesTurnAfterAnswer,
            pendingQuestion: hasPendingQuestion,
            currentQuestionUI: !!this.currentQuestion,
            currentQuestionEngine: hasGameEngineQuestion
        });
          // Habilitar el dado si no hay preguntas activas
        // Si el jugador continúa su turno, puede tirar inmediatamente
        // Si no continúa, el GameEngine cambiará de jugador automáticamente
        if (!hasPendingQuestion && !hasGameEngineQuestion) {
            if (this.continuesTurnAfterAnswer) {
                console.log('🔍 DEBUG: Jugador continúa turno, habilitando dado');
            } else {
                console.log('🔍 DEBUG: No hay preguntas activas, habilitando dado (cambio de turno pendiente)');
            }
            this.enableDiceRoll();
        } else {
            console.log('🔍 DEBUG: Manteniendo dado deshabilitado, hay preguntas activas:', {
                hayPendiente: hasPendingQuestion,
                hayPreguntaEngine: hasGameEngineQuestion
            });
            this.disableDiceRoll();
        }
        
        // Limpiar el flag después de procesar
        this.continuesTurnAfterAnswer = false;
    }

    /**
     * Muestra el modal de victoria
     */
    showVictoryModal(data) {
        const modal = document.createElement('div');
        modal.className = 'modal victory-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="victory-content">
                    <h2>🎉 ¡${data.winner.name} ha ganado! 🎉</h2>
                    <p>Tiempo de juego: ${Math.round(data.gameTime / 60)} minutos</p>
                    <div class="final-stats">
                        <h3>Estadísticas finales:</h3>
                        ${data.players.map(player => `
                            <div class="player-final-stats">
                                <div class="player-token" style="background-color: ${player.color}"></div>
                                <span>${player.name}: ${player.stats.correctAnswers}/${player.stats.questionsAnswered} (${player.getAccuracyPercentage()}%)</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="victory-actions">
                        <button id="new-game-btn" class="btn btn-primary">Nuevo Juego</button>
                        <button id="back-to-menu-btn" class="btn btn-secondary">Volver al Menú</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners para botones
        modal.querySelector('#new-game-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.startNewGame();
        });
        
        modal.querySelector('#back-to-menu-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.backToMenu();
        });
    }

    /**
     * Crea efectos de victoria
     */
    createVictoryEffect() {
        // Crear confeti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][Math.floor(Math.random() * 6)];
            document.body.appendChild(confetti);
            
            // Remover después de la animación
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 3000);
        }
    }

    /**
     * Anima cuando se gana una cuña
     */
    animateWedgeEarned(player, category) {
        // Encontrar el elemento del jugador y animar la cuña
        const playerElements = this.playersPanel.querySelectorAll('.player-info');
        playerElements.forEach(element => {
            const playerName = element.querySelector('.player-name').textContent;
            if (playerName === player.name) {
                const wedges = element.querySelectorAll('.wedge');
                const categoryIndex = ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'].indexOf(category);
                if (wedges[categoryIndex]) {
                    wedges[categoryIndex].classList.add('new-collected');
                    setTimeout(() => {
                        wedges[categoryIndex].classList.remove('new-collected');
                    }, 2000);
                }
            }
        });
    }

    /**
     * Pausa el juego
     */
    pauseGame() {
        this.gameEngine.pauseGame();
    }

    /**
     * Reanuda el juego
     */
    resumeGame() {
        this.gameEngine.resumeGame();
    }

    /**
     * Guarda el juego
     */
    saveGame() {
        this.gameEngine.saveGameState();
        this.showNotification('Juego guardado correctamente', 'success');
    }

    /**
     * Sale del juego
     */
    quitGame() {
        if (confirm('¿Estás seguro de que quieres salir del juego?')) {
            this.gameEngine.quitGame();
            this.hideModal('pause');
            this.backToMenu();
        }
    }

    /**
     * Inicia un nuevo juego
     */
    async startNewGame() {
        const config = this.gameEngine.config;
        await this.gameEngine.startNewGame(config);
    }    /**
     * Vuelve al menú principal
     */
    backToMenu() {
        // Disparar evento personalizado para que MenuUI maneje la transición
        const event = new CustomEvent('backToMenu');
        document.dispatchEvent(event);
    }

    /**
     * Muestra un modal
     */
    showModal(modalName) {
        if (this.modals[modalName]) {
            this.modals[modalName].classList.add('active');
        }
    }    /**
     * Oculta un modal
     */
    hideModal(modalName) {
        if (this.modals[modalName]) {
            this.modals[modalName].classList.remove('active');
            
            // Manejo especial para el modal de pregunta
            // No mostrar indicador si se está minimizando intencionalmente
            if (modalName === 'question' && this.pendingQuestion && !this.hasAnswered && !this.isMinimizing) {
                // Solo mostrar indicador si hay pregunta pendiente y no se ha respondido
                this.showPendingQuestionIndicator();
                this.showNotification('💡 Puedes reabrir la pregunta con el botón naranja', 'info');
            }
            
            // Resetear flag de minimización
            this.isMinimizing = false;
        }
    }

    /**
     * Muestra el modal de pausa
     */
    showPauseModal() {
        this.showModal('pause');
    }

    /**
     * Cierra el modal de pausa
     */
    closePauseModal() {
        this.hideModal('pause');
    }    /**
     * Cierra el modal activo
     */
    closeActiveModal() {
        Object.keys(this.modals).forEach(modalName => {
            if (this.modals[modalName].classList.contains('active')) {
                // Manejo especial para el modal de pregunta
                if (modalName === 'question' && this.pendingQuestion) {
                    // Mostrar animación shake en lugar de cerrar
                    const modalContent = this.modals[modalName].querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.add('shake');
                        setTimeout(() => {
                            modalContent.classList.remove('shake');
                        }, 500);
                    }
                    // Mostrar notificación informativa
                    this.showNotification('⚠️ Responde la pregunta actual para continuar', 'warning');
                    return;
                }
                
                this.hideModal(modalName);
            }
        });
    }

    /**
     * Muestra una notificación
     */
    showNotification(message, type = 'info') {
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
            this.closeNotification(notification);
        }, 3000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
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
    }    /**
     * Maneja el redimensionamiento del canvas
     */
    handleResize() {
        if (this.gameEngine.board) {
            // Throttle el redimensionamiento para mejor rendimiento
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                // El tablero ahora se redimensiona automáticamente
                // Solo necesitamos llamar a resize sin parámetros para que use dimensiones dinámicas
                this.gameEngine.board.resize();
            }, 100); // 100ms de throttle
        }
    }    /**
     * Alterna el estado de la traducción automática
     */
    toggleTranslation() {
        try {
            const currentState = this.gameEngine.config.translationEnabled;
            const newState = !currentState;
            
            // Actualizar configuración
            this.gameEngine.config.translationEnabled = newState;
            this.gameEngine.storage.saveConfig(this.gameEngine.config);
            
            // Actualizar estado en ApiClient
            if (this.gameEngine.apiClient) {
                this.gameEngine.apiClient.setTranslationEnabled(newState);
            }
            
            // Actualizar apariencia del botón
            this.updateTranslationButtonState(newState);
            
            // Mostrar notificación
            const message = newState 
                ? '✅ Traducción automática activada' 
                : '❌ Traducción automática desactivada';
            this.showNotification(message, 'info');
            
            console.log(`Traducción automática ${newState ? 'activada' : 'desactivada'}`);
        } catch (error) {
            console.error('Error al alternar traducción:', error);
            this.showNotification('Error al cambiar configuración de traducción', 'error');
        }
    }    /**
     * Actualiza el estado visual del botón de traducción
     */
    updateTranslationButtonState(isEnabled) {
        if (!this.gameHeader.translationToggleBtn) {
            console.warn('Botón de traducción no encontrado');
            return;
        }

        if (isEnabled) {
            this.gameHeader.translationToggleBtn.classList.add('active');
            this.gameHeader.translationToggleBtn.classList.remove('inactive');
            this.gameHeader.translationToggleBtn.innerHTML = '🌐 Traducción ON';
        } else {
            this.gameHeader.translationToggleBtn.classList.add('inactive');
            this.gameHeader.translationToggleBtn.classList.remove('active');
            this.gameHeader.translationToggleBtn.innerHTML = '🌐 Traducción OFF';
        }    }    /**
     * Actualiza el contenido del indicador de traducción del tablero
     */
    updateBoardTranslationIndicator(message, showSpinner = true) {
        if (this.diceElements.boardTranslationIndicator) {
            const textElement = this.diceElements.boardTranslationIndicator.querySelector('.board-translation-text');
            if (textElement) {
                textElement.textContent = message;
            }
            
            const spinner = this.diceElements.boardTranslationIndicator.querySelector('.board-translation-spinner');
            if (spinner) {
                spinner.style.display = showSpinner ? 'block' : 'none';
                if (showSpinner) {
                    spinner.style.animation = 'boardTranslationSpin 1s linear infinite';
                } else {
                    spinner.style.animation = '';
                }
            }
            
            const dots = this.diceElements.boardTranslationIndicator.querySelector('.board-translation-dots');
            if (dots) {
                dots.style.display = showSpinner ? 'flex' : 'none';
            }
        }
    }    /**
     * Muestra el indicador de traducción en el centro del tablero
     */
    showBoardTranslationIndicator(message = 'Traduciendo pregunta...') {
        if (this.diceElements.boardTranslationIndicator) {
            // Actualizar contenido
            this.updateBoardTranslationIndicator(message, true);
            
            // Remover el estilo display inline y usar la clase CSS
            this.diceElements.boardTranslationIndicator.style.display = '';
            this.diceElements.boardTranslationIndicator.classList.add('active');
            
            console.log('Mostrando indicador de traducción en el tablero:', message);
        }
    }

    /**
     * Oculta el indicador de traducción en el centro del tablero
     */
    hideBoardTranslationIndicator(delay = 0) {
        if (this.diceElements.boardTranslationIndicator) {
            const hideIndicator = () => {
                this.diceElements.boardTranslationIndicator.classList.remove('active');
                
                // Limpiar animaciones después de la transición
                setTimeout(() => {
                    if (!this.diceElements.boardTranslationIndicator.classList.contains('active')) {
                        this.updateBoardTranslationIndicator('', false);
                    }
                }, 300); // Coincide con la duración de la transición CSS
                
                console.log('Ocultando indicador de traducción en el tablero');
            };
            
            if (delay > 0) {
                setTimeout(hideIndicator, delay);
            } else {
                hideIndicator();
            }
        }
    }/**
     * Destruye la instancia y limpia recursos
     */
    destroy() {
        this.stopQuestionTimer();
        this.stopGameTimer();
        
        // Limpiar notificaciones
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.closeNotification(notification);
        });
        
        // Limpiar confeti si existe
        const confetti = document.querySelectorAll('.confetti');
        confetti.forEach(piece => {
            if (piece.parentNode) {
                piece.parentNode.removeChild(piece);
            }
        });
    }
    
    /**
     * Alterna entre mostrar la pregunta original y la traducida
     */
    toggleOriginalQuestion() {
        if (!this.currentQuestion || !this.currentQuestion.isTranslated()) {
            return; // No hacer nada si no hay pregunta o no fue traducida
        }

        const isShowingOriginal = this.currentQuestion.toggleOriginalText();
        
        // Actualizar el texto de la pregunta
        this.questionElements.text.textContent = this.currentQuestion.getCurrentText();
        
        // Actualizar las respuestas
        this.updateAnswerButtons(this.currentQuestion);
        
        // Actualizar el botón
        if (isShowingOriginal) {
            this.questionElements.showOriginalBtn.innerHTML = '🔄 Ver traducción';
            this.questionElements.showOriginalBtn.classList.add('active');
        } else {
            this.questionElements.showOriginalBtn.innerHTML = '🔄 Ver original';
            this.questionElements.showOriginalBtn.classList.remove('active');
        }
        
        console.log(`Mostrando pregunta ${isShowingOriginal ? 'original' : 'traducida'}`);
    }    /**
     * Actualiza los botones de respuesta manteniendo el orden mezclado
     */
    updateAnswerButtons(question) {
        const shuffledAnswers = question.getShuffledAnswers();
        const answerButtons = this.questionElements.answers.querySelectorAll('.answer-btn');
        
        answerButtons.forEach((button, index) => {
            if (shuffledAnswers[index]) {
                button.textContent = shuffledAnswers[index].text;
                // El event listener ya está configurado con el índice correcto
            }
        });
    }    /**
     * Reabre una pregunta pendiente
     */
    reopenPendingQuestion() {
        if (!this.pendingQuestion) {
            console.warn('No hay pregunta pendiente para reabrir');
            return;
        }

        console.log('Reabriendo pregunta pendiente');
        
        // Reabrir modal con los datos almacenados
        this.showQuestionModal(this.pendingQuestion);
        
        // Reanudar temporizador si había tiempo restante
        if (this.pendingQuestion.timeRemaining && this.pendingQuestion.timeRemaining > 0) {
            this.timeRemaining = this.pendingQuestion.timeRemaining;
            this.resumeQuestionTimer();
        }
        
        this.hidePendingQuestionIndicator();
    }    /**
     * Muestra el indicador de pregunta pendiente
     */
    showPendingQuestionIndicator() {
        if (this.gameHeader.reopenQuestionBtn && this.pendingQuestion) {
            const category = this.pendingQuestion.question.category.charAt(0).toUpperCase() + 
                           this.pendingQuestion.question.category.slice(1);
            
            // Mostrar botón en el header
            this.gameHeader.reopenQuestionBtn.style.display = 'inline-block';
            this.gameHeader.reopenQuestionBtn.classList.add('btn-warning');
            this.gameHeader.reopenQuestionBtn.innerHTML = `❓ Pregunta de ${category}`;
            this.gameHeader.reopenQuestionBtn.title = 'Hay una pregunta pendiente de responder. Click para reabrirla.';
            
            // Mostrar indicador en el tablero
            if (this.boardPendingIndicator) {
                this.boardPendingIndicator.style.display = 'block';
                this.boardPendingIndicator.innerHTML = `
                    <div class="pending-icon">❓</div>
                    <div class="pending-text">Pregunta de<br>${category}</div>
                `;
            }
            
            console.log('Indicador de pregunta pendiente mostrado');
        }
    }    /**
     * Oculta el indicador de pregunta pendiente
     */
    hidePendingQuestionIndicator() {
        if (this.gameHeader.reopenQuestionBtn) {
            this.gameHeader.reopenQuestionBtn.style.display = 'none';
            this.gameHeader.reopenQuestionBtn.classList.remove('btn-warning');
        }
        
        if (this.boardPendingIndicator) {
            this.boardPendingIndicator.style.display = 'none';
        }
    }

    /**
     * Limpia la pregunta pendiente cuando se responde
     */
    clearPendingQuestion() {
        this.pendingQuestion = null;
        this.hidePendingQuestionIndicator();
        console.log('Pregunta pendiente limpiada');
    }    /**
     * Minimiza el modal de pregunta temporalmente
     */
    minimizeQuestion() {
        if (!this.pendingQuestion) {
            console.warn('No hay pregunta para minimizar');
            return;
        }

        // Marcar que se está minimizando intencionalmente
        this.isMinimizing = true;

        // Pausar temporizador si está activo
        if (this.questionTimer) {
            this.stopQuestionTimer();
            this.pendingQuestion.timeRemaining = this.timeRemaining;
        }

        // Ocultar modal
        this.hideModal('question');
        
        // Mostrar indicador de pregunta pendiente
        this.showPendingQuestionIndicator();
        
        // Mostrar notificación informativa
        this.showNotification('🔽 Pregunta minimizada. Usa el botón naranja para reabrirla', 'info');
        
        console.log('Pregunta minimizada');
    }    /**
     * Reanuda el temporizador de pregunta desde donde se pausó
     */
    resumeQuestionTimer() {
        if (this.timeRemaining <= 0) return;
        
        // Asegurar que no hay un temporizador previo ejecutándose
        this.stopQuestionTimer();
        
        this.questionElements.timer.style.display = 'flex';
        
        const timerText = this.questionElements.timer.querySelector('.timer-text');
        const timerBar = this.questionElements.timer.querySelector('.timer-bar');
        
        // Actualizar texto inmediatamente
        timerText.textContent = this.timeRemaining;
        
        // Configurar animación de la barra para el tiempo restante
        timerBar.style.setProperty('--duration', `${this.timeRemaining}s`);
        
        this.questionTimer = setInterval(() => {
            this.timeRemaining--;
            timerText.textContent = this.timeRemaining;
            
            if (this.timeRemaining <= 0) {
                this.timeUp();
            }
        }, 1000);
        
        console.log(`Temporizador reanudado con ${this.timeRemaining} segundos restantes`);
    }

    /**
     * Función de debug para verificar el estado del temporizador
     */
    debugTimerState() {
        console.log('=== DEBUG TIMER STATE ===');
        console.log('questionTimer:', this.questionTimer);
        console.log('timeRemaining:', this.timeRemaining);
        console.log('pendingQuestion:', this.pendingQuestion ? 'Existe' : 'null');
        console.log('hasAnswered:', this.hasAnswered);
        console.log('isMinimizing:', this.isMinimizing);
        console.log('========================');
    }

    /**
     * Obtiene el historial de preguntas actual
     * @returns {Array} Array con el historial de preguntas
     */
    getQuestionsHistory() {
        return this.questionsHistory;
    }    /**
     * Establece el historial de preguntas (usado al restaurar un juego guardado)
     * @param {Array} history - Array con el historial de preguntas
     */
    setQuestionsHistory(history) {
        this.questionsHistory = history || [];
        this.updateQuestionsHistoryPanel();
        console.log('Historial de preguntas restaurado:', this.questionsHistory.length, 'elementos');
    }    /**
     * Muestra countdown para el movimiento del jugador
     */
    showMovementCountdown(rollBtn, diceValue) {
        console.log('🔍 DEBUG: showMovementCountdown iniciado con valor:', diceValue);
        
        let countdown = 2;
        rollBtn.textContent = `Moviendo en ${countdown}...`;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                rollBtn.textContent = `Moviendo en ${countdown}...`;
                console.log('🔍 DEBUG: Countdown:', countdown);
            } else {
                console.log('🔍 DEBUG: Countdown terminado, iniciando movimiento');
                clearInterval(countdownInterval);
                
                // Mantener el botón deshabilitado con mensaje de espera de pregunta
                rollBtn.textContent = 'Esperando pregunta...';
                rollBtn.disabled = true;
                console.log('🔍 DEBUG: Botón configurado para esperar pregunta');
                
                // REANUDAR ResizeObserver ANTES de iniciar el movimiento
                if (this.gameEngine.board) {
                    console.log('🔍 DEBUG: Reanudando ResizeObserver antes del movimiento');
                    this.gameEngine.board.resumeResizeObserver();
                }
                  // Iniciar el movimiento del jugador
                this.gameEngine.continueWithMovement();
            }
        }, 1000);
    }
    
    /**
     * Muestra el botón de iniciar pregunta en el centro del tablero
     */
    showBoardStartQuestionButton(category = null) {
        if (!this.boardStartQuestion) return;

        // Personalizar el mensaje según la categoría si se proporciona
        const categoryText = category ? 
            `¡Pregunta de ${category.charAt(0).toUpperCase() + category.slice(1)}!` : 
            '¡Listo para la pregunta!';
        
        const textElement = this.boardStartQuestion.querySelector('.board-start-text');
        if (textElement) {
            textElement.textContent = categoryText;
        }

        // Mostrar el botón con animación
        this.boardStartQuestion.style.display = 'block';
        
        // Agregar clase para animación de entrada
        setTimeout(() => {
            this.boardStartQuestion.classList.add('show');
        }, 50);

        console.log('Botón de iniciar pregunta mostrado en el tablero');
    }

    /**
     * Oculta el botón de iniciar pregunta del tablero
     */
    hideBoardStartQuestionButton() {
        if (!this.boardStartQuestion) return;

        // Animación de salida
        this.boardStartQuestion.classList.remove('show');
        
        setTimeout(() => {
            this.boardStartQuestion.style.display = 'none';
        }, 300);

        console.log('Botón de iniciar pregunta ocultado del tablero');
    }

    /**
     * Maneja el clic en el botón de iniciar pregunta del tablero
     */    /**
     * Maneja el clic en el botón de iniciar pregunta del tablero
     */
    startBoardQuestion() {
        console.log('Iniciando pregunta desde el botón del tablero');
        
        // Ocultar el botón
        this.hideBoardStartQuestionButton();
        
        // Mostrar notificación de confirmación
        this.showNotification('🎯 ¡Iniciando pregunta!', 'success');
        
        // Notificar al GameEngine que el jugador está listo para la pregunta
        if (this.gameEngine && typeof this.gameEngine.proceedWithQuestion === 'function') {
            this.gameEngine.proceedWithQuestion();
        } else {
            console.warn('GameEngine no tiene método proceedWithQuestion');
        }
    }

    /**
     * Configura los eventos para la edición del nombre del jugador
     */    setupPlayerNameEditing(playerDiv, player) {
        console.log('🔍 DEBUG: Configurando edición de nombres para jugador:', player.name);
        
        const nameElement = playerDiv.querySelector('.player-name');
        
        console.log('🔍 DEBUG: Elemento encontrado:', {
            nameElement: nameElement ? 'ENCONTRADO' : 'NO ENCONTRADO'
        });
        
        if (!nameElement) {
            console.error('❌ ERROR: No se encontró el elemento del nombre para la edición');
            console.error('nameElement:', nameElement);
            console.error('playerDiv.innerHTML:', playerDiv.innerHTML);
            return;
        }
        
        let originalName = player.name;
        let isEditing = false;

        // Función para iniciar la edición
        const startEditing = () => {
            if (isEditing) return;
            
            console.log('Iniciando edición del nombre del jugador:', player.name);
            
            isEditing = true;
            originalName = player.name;
            
            // Habilitar contenteditable y agregar clase de edición
            nameElement.contentEditable = 'true';
            nameElement.classList.add('editing');
            nameElement.focus();
            
            // Seleccionar todo el texto
            const range = document.createRange();
            range.selectNodeContents(nameElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        };

        // Función para guardar los cambios
        const saveChanges = () => {
            if (!isEditing) return;

            const newName = nameElement.textContent.trim();
            
            console.log('Guardando cambios:', { oldName: originalName, newName });
            
            // Validar el nombre
            if (!newName || newName.length < 2) {
                this.showNotification('El nombre debe tener al menos 2 caracteres', 'error');
                nameElement.textContent = originalName;
                cancelEditing();
                return;
            }

            if (newName.length > 20) {
                this.showNotification('El nombre no puede tener más de 20 caracteres', 'error');
                nameElement.textContent = originalName;
                cancelEditing();
                return;
            }

            // Verificar que no haya nombres duplicados
            const otherPlayers = this.gameEngine.players.filter(p => p.id !== player.id);
            if (otherPlayers.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
                this.showNotification('Ya existe un jugador con ese nombre', 'error');
                nameElement.textContent = originalName;
                cancelEditing();
                return;
            }

            // Actualizar el nombre del jugador
            const oldName = player.name;
            player.name = newName;
            
            // Actualizar en el header si es el jugador currente
            if (player.currentTurn) {
                this.updateCurrentPlayer(player);
            }

            // Guardar el estado del juego si está en progreso
            if (this.gameEngine && this.gameEngine.gameState === 'playing') {
                this.gameEngine.saveGameState();
            }

            // Mostrar confirmación
            this.showNotification(`Nombre actualizado: ${oldName} → ${newName}`, 'success');
            
            console.log(`Nombre del jugador ${player.id} cambiado de "${oldName}" a "${newName}"`);
            
            cancelEditing();
        };

        // Función para cancelar la edición
        const cancelEditing = () => {
            if (!isEditing) return;
            
            console.log('Cancelando edición');
            
            isEditing = false;
            nameElement.contentEditable = 'false';
            nameElement.classList.remove('editing');
            nameElement.blur();
            nameElement.textContent = player.name;
        };

        // Event listeners
        // Click en el nombre para editar
        nameElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Click en nombre del jugador, isEditing:', isEditing);
            
            if (!isEditing) {
                startEditing();
            }
        });

        // Guardar con Enter, cancelar con Escape
        nameElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditing();
            }
        });

        // Cancelar edición al perder el foco
        nameElement.addEventListener('blur', () => {
            // Pequeño delay para que funcione correctamente
            setTimeout(() => {
                if (isEditing) {
                    cancelEditing();
                }
            }, 100);
        });

        // Prevenir saltos de línea en el contenteditable
        nameElement.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            const cleanText = text.replace(/[\r\n\t]/g, ' ').substring(0, 20);
            document.execCommand('insertText', false, cleanText);
        });
        
        console.log('Eventos de edición configurados para jugador:', player.name);
    }

    /**
     * Inicia el temporizador de tiempo de juego
     */
    startGameTimer() {
        this.gameStats.startTime = Date.now();
        this.gameStats.gameTimeInterval = setInterval(() => {
            this.updateGameTimeDisplay();
        }, 1000);
        
        console.log('Temporizador de juego iniciado');
    }

    /**
     * Detiene el temporizador de tiempo de juego
     */
    stopGameTimer() {
        if (this.gameStats.gameTimeInterval) {
            clearInterval(this.gameStats.gameTimeInterval);
            this.gameStats.gameTimeInterval = null;
        }
        
        console.log('Temporizador de juego detenido');
    }

    /**
     * Actualiza la visualización del tiempo de juego
     */
    updateGameTimeDisplay() {
        if (!this.gameStats.startTime || !this.statsElements.gameTime) return;
        
        const currentTime = Date.now();
        const elapsedTime = Math.floor((currentTime - this.gameStats.startTime) / 1000);
        
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.statsElements.gameTime.textContent = timeString;
    }

    /**
     * Incrementa el contador de preguntas respondidas
     */
    incrementTotalQuestions() {
        this.gameStats.totalQuestions++;
        if (this.statsElements.totalQuestions) {
            this.statsElements.totalQuestions.textContent = this.gameStats.totalQuestions;
        }
        
        console.log(`Total de preguntas: ${this.gameStats.totalQuestions}`);
    }

    /**
     * Incrementa el contador de respuestas correctas
     */
    incrementCorrectAnswers() {
        this.gameStats.totalCorrect++;
        if (this.statsElements.totalCorrect) {
            this.statsElements.totalCorrect.textContent = this.gameStats.totalCorrect;
        }
        
        console.log(`Total de respuestas correctas: ${this.gameStats.totalCorrect}`);
    }

    /**
     * Resetea las estadísticas del juego
     */
    resetGameStats() {
        this.gameStats.totalQuestions = 0;
        this.gameStats.totalCorrect = 0;
        this.gameStats.startTime = null;
        
        if (this.statsElements.totalQuestions) {
            this.statsElements.totalQuestions.textContent = '0';
        }
        if (this.statsElements.totalCorrect) {
            this.statsElements.totalCorrect.textContent = '0';
        }
        if (this.statsElements.gameTime) {
            this.statsElements.gameTime.textContent = '00:00';
        }
        
        this.stopGameTimer();
        
        console.log('Estadísticas del juego reseteadas');
    }

    /**
     * Actualiza las estadísticas desde datos guardados
     */
    updateStatsFromSavedData(savedStats) {
        if (!savedStats) return;
        
        this.gameStats.totalQuestions = savedStats.totalQuestions || 0;
        this.gameStats.totalCorrect = savedStats.totalCorrect || 0;
        this.gameStats.startTime = savedStats.startTime || Date.now();
        
        // Actualizar visualización
        if (this.statsElements.totalQuestions) {
            this.statsElements.totalQuestions.textContent = this.gameStats.totalQuestions;
        }
        if (this.statsElements.totalCorrect) {
            this.statsElements.totalCorrect.textContent = this.gameStats.totalCorrect;
        }
        
        // Reanudar temporizador
        this.startGameTimer();
        
        console.log('Estadísticas actualizadas desde datos guardados:', savedStats);
    }

    /**
     * Obtiene las estadísticas actuales del juego
     */
    getCurrentGameStats() {
        return {
            totalQuestions: this.gameStats.totalQuestions,
            totalCorrect: this.gameStats.totalCorrect,
            startTime: this.gameStats.startTime,
            currentTime: Date.now()
        };
    }
}
