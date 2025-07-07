/**
 * Sistema de Google Analytics optimizado para Trivial Game
 * @author Luis Roselló
 * @description Sistema completo de tracking para el juego de Trivial
 */

// Configurar dataLayer antes de cargar gtag
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Inicializar Google Analytics
gtag('js', new Date());

// Configuración optimizada para el juego Trivial
gtag('config', 'G-RQVNQE35NT', {
    // Configuración básica
    page_title: 'Trivial - Juego de Preguntas',
    page_location: window.location.href,
    send_page_view: true,
    
    // Configuración para GitHub Pages
    site_speed_sample_rate: 100, // Medir velocidad del sitio al 100%
    custom_map: {
        'custom_parameter_1': 'game_type',
        'custom_parameter_2': 'player_count',
        'custom_parameter_3': 'difficulty_level'
    },
    
    // Configuración de eventos mejorada
    allow_google_signals: true,
    allow_ad_personalization_signals: false, // Privacidad
    anonymize_ip: true, // Anonimizar IPs para GDPR
    
    // Configuración específica para juegos
    content_group1: 'Trivia Game',
    content_group2: 'HTML5 Game',
    content_group3: 'Educational'
});

/**
 * Sistema de tracking personalizado para Trivial
 */
class TrivialAnalytics {
    constructor() {
        this.sessionStartTime = Date.now();
        this.gameStartTime = null;
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.currentPlayers = 0;
        this.currentDifficulty = 'medium';
        this.categoriesPlayed = new Set();
        
        // Trackear tiempo en página automáticamente
        this.trackPageEngagement();
    }

    // Eventos de navegación y menú
    trackPageView(pageName, additionalParams = {}) {
        gtag('event', 'page_view', {
            page_title: pageName,
            page_location: window.location.href,
            event_category: 'Navigation',
            ...additionalParams
        });
    }

    trackMenuAction(action) {
        gtag('event', 'menu_interaction', {
            event_category: 'Menu',
            event_label: action,
            value: 1
        });
    }

    // Eventos de configuración del juego
    trackGameSetup(playerCount, difficulty) {
        this.currentPlayers = playerCount;
        this.currentDifficulty = difficulty;
        
        gtag('event', 'game_setup', {
            event_category: 'Game_Setup',
            event_label: `${playerCount}_players_${difficulty}`,
            custom_parameter_1: 'trivial',
            custom_parameter_2: playerCount,
            custom_parameter_3: difficulty,
            value: playerCount
        });
    }

    // Eventos de gameplay
    trackGameStart() {
        this.gameStartTime = Date.now();
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.categoriesPlayed.clear();
        
        gtag('event', 'game_start', {
            event_category: 'Gameplay',
            event_label: `${this.currentPlayers}_players`,
            custom_parameter_1: 'trivial',
            custom_parameter_2: this.currentPlayers,
            custom_parameter_3: this.currentDifficulty
        });
    }

    trackQuestionAnswered(category, difficulty, isCorrect, timeToAnswer) {
        this.questionsAnswered++;
        if (isCorrect) this.correctAnswers++;
        this.categoriesPlayed.add(category);
        
        gtag('event', 'question_answered', {
            event_category: 'Gameplay',
            event_label: `${category}_${difficulty}_${isCorrect ? 'correct' : 'wrong'}`,
            custom_parameter_1: category,
            custom_parameter_2: difficulty,
            custom_parameter_3: isCorrect ? 'correct' : 'wrong',
            value: timeToAnswer // Tiempo en segundos
        });

        // Milestone cada 10 preguntas
        if (this.questionsAnswered % 10 === 0) {
            this.trackMilestone(`${this.questionsAnswered}_questions`);
        }
    }

    trackGameComplete(winner, totalTime, finalScores) {
        const accuracyRate = this.questionsAnswered > 0 ? 
            Math.round((this.correctAnswers / this.questionsAnswered) * 100) : 0;
        
        gtag('event', 'game_complete', {
            event_category: 'Completion',
            event_label: `${this.currentPlayers}_players_${Math.round(totalTime/60)}min`,
            custom_parameter_1: 'trivial',
            custom_parameter_2: this.currentPlayers,
            custom_parameter_3: this.currentDifficulty,
            value: Math.round(totalTime) // Duración total en segundos
        });

        // Evento de precisión
        gtag('event', 'game_accuracy', {
            event_category: 'Performance',
            event_label: `${accuracyRate}%_accuracy`,
            value: accuracyRate
        });
    }

    // Eventos de interacción
    trackDiceRoll(result) {
        gtag('event', 'dice_roll', {
            event_category: 'Interaction',
            event_label: `rolled_${result}`,
            value: result
        });
    }

    trackBoardInteraction(action, position) {
        gtag('event', 'board_interaction', {
            event_category: 'Interaction',
            event_label: action,
            value: position
        });
    }

    // Eventos de categorías
    trackCategorySelection(category) {
        gtag('event', 'category_selected', {
            event_category: 'Categories',
            event_label: category,
            custom_parameter_1: category
        });
    }

    // Eventos específicos del Modo Desafío
    trackChallengeSetup(challengeType, timeLimit, questionCount) {
        gtag('event', 'challenge_setup', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_${timeLimit}s_${questionCount}q`,
            custom_parameter_1: challengeType,
            custom_parameter_2: timeLimit,
            custom_parameter_3: questionCount,
            value: timeLimit
        });
    }

    trackChallengeStart(challengeType, timeLimit) {
        gtag('event', 'challenge_start', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_${timeLimit}s`,
            custom_parameter_1: challengeType,
            custom_parameter_2: timeLimit,
            value: 1
        });
    }

    trackChallengeQuestion(questionNumber, timeRemaining, isCorrect, responseTime) {
        gtag('event', 'challenge_question', {
            event_category: 'Challenge_Mode',
            event_label: `q${questionNumber}_${isCorrect ? 'correct' : 'wrong'}_${Math.round(timeRemaining)}s_left`,
            custom_parameter_1: questionNumber,
            custom_parameter_2: isCorrect ? 'correct' : 'wrong',
            custom_parameter_3: Math.round(timeRemaining),
            value: responseTime // Tiempo que tardó en responder
        });
    }

    trackChallengeComplete(challengeType, finalScore, timeUsed, questionsCorrect, totalQuestions) {
        const accuracyRate = totalQuestions > 0 ? Math.round((questionsCorrect / totalQuestions) * 100) : 0;
        
        gtag('event', 'challenge_complete', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_${finalScore}pts_${accuracyRate}%`,
            custom_parameter_1: challengeType,
            custom_parameter_2: finalScore,
            custom_parameter_3: accuracyRate,
            value: timeUsed // Tiempo total usado
        });

        // Evento separado para puntuación
        gtag('event', 'challenge_score', {
            event_category: 'Challenge_Performance',
            event_label: `${challengeType}_${finalScore}_points`,
            custom_parameter_1: challengeType,
            value: finalScore
        });
    }

    trackChallengeTimeout(challengeType, questionsAnswered, questionsCorrect, timeLimit) {
        const accuracyRate = questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : 0;
        
        gtag('event', 'challenge_timeout', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_timeout_${questionsAnswered}q_${accuracyRate}%`,
            custom_parameter_1: challengeType,
            custom_parameter_2: questionsAnswered,
            custom_parameter_3: accuracyRate,
            value: timeLimit
        });
    }

    trackChallengeAbandoned(challengeType, questionsAnswered, timeElapsed) {
        gtag('event', 'challenge_abandoned', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_abandoned_${questionsAnswered}q_${Math.round(timeElapsed)}s`,
            custom_parameter_1: challengeType,
            custom_parameter_2: questionsAnswered,
            custom_parameter_3: Math.round(timeElapsed),
            value: timeElapsed
        });
    }

    // Alias para compatibilidad
    trackChallengeAbandon(challengeType, questionsAnswered, timeElapsed) {
        return this.trackChallengeAbandoned(challengeType, questionsAnswered, timeElapsed);
    }

    trackChallengeStreak(challengeType, streakLength, streakType) {
        gtag('event', 'challenge_streak', {
            event_category: 'Challenge_Achievement',
            event_label: `${challengeType}_${streakType}_streak_${streakLength}`,
            custom_parameter_1: challengeType,
            custom_parameter_2: streakType, // 'correct', 'wrong', 'fast'
            custom_parameter_3: streakLength,
            value: streakLength
        });
    }

    trackChallengeDifficulty(challengeType, difficulty, performance) {
        gtag('event', 'challenge_difficulty', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_${difficulty}_${performance}%`,
            custom_parameter_1: challengeType,
            custom_parameter_2: difficulty,
            custom_parameter_3: performance,
            value: performance
        });
    }

    trackChallengeSpeedBonus(challengeType, bonusPoints, responseTime) {
        gtag('event', 'challenge_speed_bonus', {
            event_category: 'Challenge_Achievement',
            event_label: `${challengeType}_${bonusPoints}pts_${responseTime}s`,
            custom_parameter_1: challengeType,
            custom_parameter_2: bonusPoints,
            custom_parameter_3: responseTime,
            value: bonusPoints
        });
    }

    trackChallengeRecord(challengeType, recordType, newRecord, previousRecord = null) {
        gtag('event', 'challenge_record', {
            event_category: 'Challenge_Achievement',
            event_label: `${challengeType}_${recordType}_${newRecord}`,
            custom_parameter_1: challengeType,
            custom_parameter_2: recordType, // 'high_score', 'best_time', 'best_accuracy'
            custom_parameter_3: newRecord,
            value: previousRecord ? (newRecord - previousRecord) : newRecord // Mejora
        });
    }

    trackChallengeRetry(challengeType, attemptNumber, reasonForRetry) {
        gtag('event', 'challenge_retry', {
            event_category: 'Challenge_Mode',
            event_label: `${challengeType}_attempt_${attemptNumber}_${reasonForRetry}`,
            custom_parameter_1: challengeType,
            custom_parameter_2: attemptNumber,
            custom_parameter_3: reasonForRetry, // 'improve_score', 'beat_time', 'complete'
            value: attemptNumber
        });
    }

    trackChallengeLeaderboard(challengeType, playerRank, totalPlayers, score) {
        gtag('event', 'challenge_leaderboard', {
            event_category: 'Challenge_Social',
            event_label: `${challengeType}_rank_${playerRank}_of_${totalPlayers}`,
            custom_parameter_1: challengeType,
            custom_parameter_2: playerRank,
            custom_parameter_3: totalPlayers,
            value: score
        });
    }

    // Eventos de experiencia del usuario en desafíos
    trackChallengePause(challengeType, timeElapsed, reason) {
        gtag('event', 'challenge_pause', {
            event_category: 'Challenge_UX',
            event_label: `${challengeType}_paused_${reason}_${Math.round(timeElapsed)}s`,
            custom_parameter_1: challengeType,
            custom_parameter_2: reason, // 'user_action', 'tab_change', 'phone_call'
            custom_parameter_3: Math.round(timeElapsed),
            value: timeElapsed
        });
    }

    trackChallengeResume(challengeType, pauseDuration) {
        gtag('event', 'challenge_resume', {
            event_category: 'Challenge_UX',
            event_label: `${challengeType}_resumed_${Math.round(pauseDuration)}s_pause`,
            custom_parameter_1: challengeType,
            custom_parameter_2: Math.round(pauseDuration),
            value: pauseDuration
        });
    }

    trackChallengeSettings(challengeType, settingChanged, newValue, oldValue) {
        gtag('event', 'challenge_settings', {
            event_category: 'Challenge_Configuration',
            event_label: `${challengeType}_${settingChanged}_${oldValue}_to_${newValue}`,
            custom_parameter_1: challengeType,
            custom_parameter_2: settingChanged, // 'time_limit', 'question_count', 'difficulty'
            custom_parameter_3: newValue,
            value: oldValue
        });
    }

    trackChallengeHint(challengeType, questionNumber, hintType, timeRemaining) {
        gtag('event', 'challenge_hint', {
            event_category: 'Challenge_Help',
            event_label: `${challengeType}_q${questionNumber}_${hintType}_${Math.round(timeRemaining)}s`,
            custom_parameter_1: challengeType,
            custom_parameter_2: hintType, // '50_50', 'skip', 'extra_time'
            custom_parameter_3: questionNumber,
            value: timeRemaining
        });
    }

    trackChallengeEmotion(challengeType, emotion, context) {
        gtag('event', 'challenge_emotion', {
            event_category: 'Challenge_UX',
            event_label: `${challengeType}_${emotion}_${context}`,
            custom_parameter_1: challengeType,
            custom_parameter_2: emotion, // 'frustrated', 'excited', 'confident', 'stressed'
            custom_parameter_3: context, // 'timeout_approaching', 'streak_broken', 'new_record'
            value: 1
        });
    }

    // Eventos de milestones
    trackMilestone(milestone) {
        gtag('event', 'milestone_reached', {
            event_category: 'Achievements',
            event_label: milestone,
            value: 1
        });
    }

    // Eventos de interacción con la interfaz de usuario
    trackButtonClick(buttonName, screenContext, additionalData = {}) {
        gtag('event', 'button_click', {
            event_category: 'UI_Interaction',
            event_label: `${screenContext}_${buttonName}`,
            custom_parameter_1: screenContext,
            custom_parameter_2: buttonName,
            custom_parameter_3: additionalData.action || 'click',
            value: 1
        });
    }

    trackModalInteraction(modalName, action, duration = null) {
        gtag('event', 'modal_interaction', {
            event_category: 'UI_Interaction',
            event_label: `${modalName}_${action}`,
            custom_parameter_1: modalName,
            custom_parameter_2: action, // 'open', 'close', 'confirm', 'cancel'
            custom_parameter_3: duration ? Math.round(duration) : 0,
            value: duration || 1
        });
    }

    trackFormInteraction(formName, fieldName, action, value = null) {
        gtag('event', 'form_interaction', {
            event_category: 'UI_Interaction',
            event_label: `${formName}_${fieldName}_${action}`,
            custom_parameter_1: formName,
            custom_parameter_2: fieldName,
            custom_parameter_3: action, // 'focus', 'blur', 'change', 'submit'
            value: typeof value === 'number' ? value : 1
        });
    }

    trackSliderInteraction(sliderName, oldValue, newValue, context) {
        gtag('event', 'slider_interaction', {
            event_category: 'UI_Interaction',
            event_label: `${sliderName}_${oldValue}_to_${newValue}`,
            custom_parameter_1: sliderName,
            custom_parameter_2: context, // 'volume', 'difficulty', 'players'
            custom_parameter_3: newValue,
            value: Math.abs(newValue - oldValue)
        });
    }

    trackDropdownSelection(dropdownName, selectedValue, previousValue, context) {
        gtag('event', 'dropdown_selection', {
            event_category: 'UI_Interaction',
            event_label: `${dropdownName}_${selectedValue}`,
            custom_parameter_1: dropdownName,
            custom_parameter_2: selectedValue,
            custom_parameter_3: context,
            value: 1
        });
    }

    // Eventos de tutorial y ayuda
    trackTutorialStep(stepNumber, stepName, action, timeSpent = null) {
        gtag('event', 'tutorial_step', {
            event_category: 'Tutorial',
            event_label: `step_${stepNumber}_${stepName}_${action}`,
            custom_parameter_1: stepNumber,
            custom_parameter_2: stepName,
            custom_parameter_3: action, // 'start', 'complete', 'skip', 'repeat'
            value: timeSpent || 1
        });
    }

    trackTutorialComplete(totalTime, stepsCompleted, stepsSkipped) {
        gtag('event', 'tutorial_complete', {
            event_category: 'Tutorial',
            event_label: `${stepsCompleted}_completed_${stepsSkipped}_skipped_${Math.round(totalTime)}s`,
            custom_parameter_1: stepsCompleted,
            custom_parameter_2: stepsSkipped,
            custom_parameter_3: Math.round(totalTime),
            value: totalTime
        });
    }

    trackHelpRequest(helpType, context, resolved = false) {
        gtag('event', 'help_request', {
            event_category: 'Help',
            event_label: `${helpType}_${context}_${resolved ? 'resolved' : 'unresolved'}`,
            custom_parameter_1: helpType, // 'tooltip', 'guide', 'faq', 'support'
            custom_parameter_2: context,
            custom_parameter_3: resolved ? 'resolved' : 'unresolved',
            value: 1
        });
    }

    // Eventos de configuración y personalización
    trackSettingsChange(settingCategory, settingName, oldValue, newValue) {
        gtag('event', 'settings_change', {
            event_category: 'Configuration',
            event_label: `${settingCategory}_${settingName}_${oldValue}_to_${newValue}`,
            custom_parameter_1: settingCategory, // 'audio', 'visual', 'gameplay', 'accessibility'
            custom_parameter_2: settingName,
            custom_parameter_3: newValue,
            value: typeof newValue === 'number' ? newValue : 1
        });
    }

    trackThemeChange(oldTheme, newTheme, context) {
        gtag('event', 'theme_change', {
            event_category: 'Personalization',
            event_label: `${oldTheme}_to_${newTheme}_${context}`,
            custom_parameter_1: oldTheme,
            custom_parameter_2: newTheme,
            custom_parameter_3: context, // 'manual', 'auto', 'system'
            value: 1
        });
    }

    trackLanguageChange(oldLanguage, newLanguage, context) {
        gtag('event', 'language_change', {
            event_category: 'Localization',
            event_label: `${oldLanguage}_to_${newLanguage}_${context}`,
            custom_parameter_1: oldLanguage,
            custom_parameter_2: newLanguage,
            custom_parameter_3: context,
            value: 1
        });
    }

    // Eventos de accesibilidad
    trackAccessibilityFeature(featureName, enabled, context) {
        gtag('event', 'accessibility_feature', {
            event_category: 'Accessibility',
            event_label: `${featureName}_${enabled ? 'enabled' : 'disabled'}_${context}`,
            custom_parameter_1: featureName, // 'high_contrast', 'large_text', 'screen_reader', 'keyboard_nav'
            custom_parameter_2: enabled ? 'enabled' : 'disabled',
            custom_parameter_3: context,
            value: enabled ? 1 : 0
        });
    }

    trackKeyboardNavigation(action, element, shortcut = null) {
        gtag('event', 'keyboard_navigation', {
            event_category: 'Accessibility',
            event_label: `${action}_${element}_${shortcut || 'tab'}`,
            custom_parameter_1: action, // 'focus', 'activate', 'navigate'
            custom_parameter_2: element,
            custom_parameter_3: shortcut || 'tab',
            value: 1
        });
    }

    // Eventos técnicos
    trackError(errorType, errorMessage) {
        gtag('event', 'exception', {
            description: `${errorType}: ${errorMessage}`,
            fatal: false,
            event_category: 'Technical'
        });
    }

    trackAPIUsage(apiType, success) {
        gtag('event', 'api_call', {
            event_category: 'Technical',
            event_label: `${apiType}_${success ? 'success' : 'failure'}`,
            value: success ? 1 : 0
        });
    }

    trackLoadTime(loadType, timeMs) {
        gtag('event', 'timing_complete', {
            name: loadType,
            value: timeMs,
            event_category: 'Performance'
        });
    }

    trackTechnicalEvent(eventName, data = {}) {
        gtag('event', 'technical_event', {
            event_category: 'Technical',
            event_label: eventName,
            custom_parameter_1: eventName,
            custom_parameter_2: data.dataSize || 0,
            custom_parameter_3: data.playerCount || 0,
            value: data.gameProgress || 0
        });
    }

    /**
     * Método genérico para trackear interacciones de UI
     * Acepta dos formas de uso:
     * 1. trackUIInteraction(action, elementId, additionalData) - forma legacy
     * 2. trackUIInteraction(elementType, action, elementId, additionalData) - forma nueva
     */
    trackUIInteraction(actionOrType, elementIdOrAction, additionalDataOrElementId, additionalData = {}) {
        // Detectar si se está usando la forma legacy (2 parámetros) o nueva (3-4 parámetros)
        let elementType, action, elementId, data;
        
        if (arguments.length <= 3 && typeof additionalDataOrElementId !== 'string') {
            // Forma legacy: trackUIInteraction(action, elementId, additionalData)
            action = actionOrType;
            elementId = elementIdOrAction;
            data = additionalDataOrElementId || {};
            elementType = this.inferElementType(action, elementId);
        } else {
            // Forma nueva: trackUIInteraction(elementType, action, elementId, additionalData)
            elementType = actionOrType;
            action = elementIdOrAction;
            elementId = additionalDataOrElementId;
            data = additionalData || {};
        }

        gtag('event', 'ui_interaction', {
            event_category: 'UI_Interaction',
            event_label: `${elementType}_${action}_${elementId}`,
            custom_parameter_1: elementType,
            custom_parameter_2: action,
            custom_parameter_3: elementId,
            value: data.value || 1
        });
    }

    /**
     * Infiere el tipo de elemento basado en la acción y el ID
     */
    inferElementType(action, elementId) {
        if (action.includes('button') || elementId.includes('btn') || elementId.includes('button')) {
            return 'button';
        } else if (action.includes('modal') || elementId.includes('modal')) {
            return 'modal';
        } else if (action.includes('form') || elementId.includes('form')) {
            return 'form';
        } else if (action.includes('answer') || elementId.includes('answer')) {
            return 'answer';
        } else if (action.includes('indicator') || elementId.includes('indicator')) {
            return 'indicator';
        } else {
            return 'element';
        }
    }

    // Engagement automático
    trackPageEngagement() {
        // Trackear tiempo de permanencia cada 30 segundos
        setInterval(() => {
            const timeOnPage = Math.round((Date.now() - this.sessionStartTime) / 1000);
            if (timeOnPage % 30 === 0 && timeOnPage > 0) {
                gtag('event', 'page_engagement', {
                    event_category: 'Engagement',
                    event_label: `${timeOnPage}_seconds`,
                    value: timeOnPage
                });
            }
        }, 30000);

        // Trackear antes de que el usuario abandone la página
        window.addEventListener('beforeunload', () => {
            const totalTime = Math.round((Date.now() - this.sessionStartTime) / 1000);
            gtag('event', 'session_duration', {
                event_category: 'Engagement',
                event_label: `${Math.round(totalTime/60)}_minutes`,
                value: totalTime
            });
        });
    }

    // Eventos de móvil/desktop
    trackDeviceUsage() {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';
        
        gtag('event', 'device_type', {
            event_category: 'Device',
            event_label: deviceType,
            custom_parameter_1: deviceType
        });
    }

    // Trackear información de conexión
    trackConnectionInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                this.trackPageView('Connection_Info', {
                    event_category: 'Technical',
                    event_label: `${connection.effectiveType}_${connection.downlink}mbps`,
                    custom_parameter_1: connection.effectiveType,
                    custom_parameter_2: connection.downlink,
                    custom_parameter_3: connection.rtt
                });
            }
        }
    }

    // =============================================================================
    // EVENTOS DE INTERACCIÓN UI/UX COMPLETOS
    // =============================================================================

    // Eventos de botones
    trackButtonClick(buttonId, buttonText, context) {
        gtag('event', 'button_click', {
            event_category: 'UI_Interaction',
            event_label: `${buttonId}_${context}`,
            custom_parameter_1: buttonId,
            custom_parameter_2: buttonText,
            custom_parameter_3: context,
            value: 1
        });
    }

    trackButtonHover(buttonId, hoverDuration) {
        gtag('event', 'button_hover', {
            event_category: 'UI_Interaction',
            event_label: `${buttonId}_${Math.round(hoverDuration)}ms`,
            custom_parameter_1: buttonId,
            custom_parameter_2: Math.round(hoverDuration),
            value: hoverDuration
        });
    }

    // Eventos de modales
    trackModalOpen(modalId, trigger, context) {
        gtag('event', 'modal_open', {
            event_category: 'UI_Modal',
            event_label: `${modalId}_${trigger}`,
            custom_parameter_1: modalId,
            custom_parameter_2: trigger, // 'button', 'keyboard', 'auto'
            custom_parameter_3: context,
            value: 1
        });
    }

    trackModalClose(modalId, method, timeOpen) {
        gtag('event', 'modal_close', {
            event_category: 'UI_Modal',
            event_label: `${modalId}_${method}_${Math.round(timeOpen)}ms`,
            custom_parameter_1: modalId,
            custom_parameter_2: method, // 'button', 'overlay', 'escape', 'auto'
            custom_parameter_3: Math.round(timeOpen),
            value: timeOpen
        });
    }

    trackModalInteraction(modalId, action, element) {
        gtag('event', 'modal_interaction', {
            event_category: 'UI_Modal',
            event_label: `${modalId}_${action}_${element}`,
            custom_parameter_1: modalId,
            custom_parameter_2: action,
            custom_parameter_3: element,
            value: 1
        });
    }

    // Eventos de formularios
    trackFormStart(formId, formType) {
        gtag('event', 'form_start', {
            event_category: 'UI_Form',
            event_label: `${formId}_${formType}`,
            custom_parameter_1: formId,
            custom_parameter_2: formType, // 'player_setup', 'settings', 'feedback'
            value: 1
        });
    }

    trackFormSubmit(formId, formType, isValid, completionTime) {
        gtag('event', 'form_submit', {
            event_category: 'UI_Form',
            event_label: `${formId}_${formType}_${isValid ? 'valid' : 'invalid'}`,
            custom_parameter_1: formId,
            custom_parameter_2: formType,
            custom_parameter_3: isValid ? 'valid' : 'invalid',
            value: completionTime
        });
    }

    trackFormFieldInteraction(formId, fieldName, action, value = null) {
        gtag('event', 'form_field', {
            event_category: 'UI_Form',
            event_label: `${formId}_${fieldName}_${action}`,
            custom_parameter_1: formId,
            custom_parameter_2: fieldName,
            custom_parameter_3: action, // 'focus', 'blur', 'change', 'error'
            value: value
        });
    }

    trackFormError(formId, fieldName, errorType, errorMessage) {
        gtag('event', 'form_error', {
            event_category: 'UI_Form',
            event_label: `${formId}_${fieldName}_${errorType}`,
            custom_parameter_1: formId,
            custom_parameter_2: fieldName,
            custom_parameter_3: errorType, // 'validation', 'required', 'format'
            description: errorMessage
        });
    }

    trackFormAbandon(formId, fieldName, completionPercentage, timeSpent) {
        gtag('event', 'form_abandon', {
            event_category: 'UI_Form',
            event_label: `${formId}_${fieldName}_${completionPercentage}%`,
            custom_parameter_1: formId,
            custom_parameter_2: fieldName,
            custom_parameter_3: completionPercentage,
            value: timeSpent
        });
    }

    // Eventos de sliders y controles
    trackSliderChange(sliderId, newValue, oldValue, context) {
        gtag('event', 'slider_change', {
            event_category: 'UI_Control',
            event_label: `${sliderId}_${oldValue}_to_${newValue}`,
            custom_parameter_1: sliderId,
            custom_parameter_2: newValue,
            custom_parameter_3: oldValue,
            value: newValue
        });
    }

    trackToggleSwitch(toggleId, newState, context) {
        gtag('event', 'toggle_switch', {
            event_category: 'UI_Control',
            event_label: `${toggleId}_${newState}`,
            custom_parameter_1: toggleId,
            custom_parameter_2: newState ? 'on' : 'off',
            custom_parameter_3: context,
            value: newState ? 1 : 0
        });
    }

    trackDropdownSelect(dropdownId, selectedValue, previousValue, optionCount) {
        gtag('event', 'dropdown_select', {
            event_category: 'UI_Control',
            event_label: `${dropdownId}_${selectedValue}`,
            custom_parameter_1: dropdownId,
            custom_parameter_2: selectedValue,
            custom_parameter_3: previousValue,
            value: optionCount
        });
    }

    trackCheckboxChange(checkboxId, isChecked, groupContext) {
        gtag('event', 'checkbox_change', {
            event_category: 'UI_Control',
            event_label: `${checkboxId}_${isChecked ? 'checked' : 'unchecked'}`,
            custom_parameter_1: checkboxId,
            custom_parameter_2: isChecked ? 'checked' : 'unchecked',
            custom_parameter_3: groupContext,
            value: isChecked ? 1 : 0
        });
    }

    trackRadioSelect(radioGroupId, selectedValue, previousValue) {
        gtag('event', 'radio_select', {
            event_category: 'UI_Control',
            event_label: `${radioGroupId}_${selectedValue}`,
            custom_parameter_1: radioGroupId,
            custom_parameter_2: selectedValue,
            custom_parameter_3: previousValue,
            value: 1
        });
    }

    // Eventos de tutorial y ayuda
    trackTutorialStart(tutorialType, fromWhere) {
        gtag('event', 'tutorial_start', {
            event_category: 'Tutorial',
            event_label: `${tutorialType}_from_${fromWhere}`,
            custom_parameter_1: tutorialType,
            custom_parameter_2: fromWhere, // 'menu', 'first_time', 'help_button'
            value: 1
        });
    }

    trackTutorialStep(tutorialType, stepNumber, stepName, timeSpent) {
        gtag('event', 'tutorial_step', {
            event_category: 'Tutorial',
            event_label: `${tutorialType}_step_${stepNumber}_${stepName}`,
            custom_parameter_1: tutorialType,
            custom_parameter_2: stepNumber,
            custom_parameter_3: stepName,
            value: timeSpent
        });
    }

    trackTutorialComplete(tutorialType, totalTime, stepsCompleted, totalSteps) {
        const completionRate = Math.round((stepsCompleted / totalSteps) * 100);
        gtag('event', 'tutorial_complete', {
            event_category: 'Tutorial',
            event_label: `${tutorialType}_${completionRate}%_${Math.round(totalTime)}s`,
            custom_parameter_1: tutorialType,
            custom_parameter_2: completionRate,
            custom_parameter_3: Math.round(totalTime),
            value: stepsCompleted
        });
    }

    trackTutorialSkip(tutorialType, stepNumber, reason) {
        gtag('event', 'tutorial_skip', {
            event_category: 'Tutorial',
            event_label: `${tutorialType}_step_${stepNumber}_${reason}`,
            custom_parameter_1: tutorialType,
            custom_parameter_2: stepNumber,
            custom_parameter_3: reason, // 'button', 'experienced', 'impatient'
            value: stepNumber
        });
    }

    trackHelpRequest(helpType, fromContext, searchTerm = null) {
        gtag('event', 'help_request', {
            event_category: 'Help',
            event_label: `${helpType}_from_${fromContext}`,
            custom_parameter_1: helpType,
            custom_parameter_2: fromContext,
            custom_parameter_3: searchTerm,
            value: 1
        });
    }

    trackHelpSearch(searchTerm, resultsFound, contextPage) {
        gtag('event', 'help_search', {
            event_category: 'Help',
            event_label: `${searchTerm}_${resultsFound}_results`,
            custom_parameter_1: searchTerm,
            custom_parameter_2: resultsFound,
            custom_parameter_3: contextPage,
            value: resultsFound
        });
    }

    // Eventos de configuración
    trackSettingsOpen(fromWhere) {
        gtag('event', 'settings_open', {
            event_category: 'Settings',
            event_label: fromWhere,
            custom_parameter_1: fromWhere, // 'menu', 'game', 'keyboard'
            value: 1
        });
    }

    trackSettingChange(settingName, newValue, oldValue, category) {
        gtag('event', 'setting_change', {
            event_category: 'Settings',
            event_label: `${settingName}_${oldValue}_to_${newValue}`,
            custom_parameter_1: settingName,
            custom_parameter_2: newValue,
            custom_parameter_3: oldValue,
            value: 1
        });
    }

    trackSettingsReset(category, resetType) {
        gtag('event', 'settings_reset', {
            event_category: 'Settings',
            event_label: `${category}_${resetType}`,
            custom_parameter_1: category, // 'all', 'audio', 'display', 'controls'
            custom_parameter_2: resetType, // 'button', 'confirmation', 'auto'
            value: 1
        });
    }

    trackSettingsSave(changedSettings, saveMethod) {
        gtag('event', 'settings_save', {
            event_category: 'Settings',
            event_label: `${changedSettings.length}_changes_${saveMethod}`,
            custom_parameter_1: changedSettings.length,
            custom_parameter_2: saveMethod, // 'auto', 'button', 'exit'
            custom_parameter_3: changedSettings.join(','),
            value: changedSettings.length
        });
    }

    // Eventos de tema y personalización
    trackThemeChange(newTheme, oldTheme, method) {
        gtag('event', 'theme_change', {
            event_category: 'Personalization',
            event_label: `${oldTheme}_to_${newTheme}`,
            custom_parameter_1: newTheme,
            custom_parameter_2: oldTheme,
            custom_parameter_3: method, // 'selector', 'auto', 'system'
            value: 1
        });
    }

    trackLanguageChange(newLanguage, oldLanguage, method) {
        gtag('event', 'language_change', {
            event_category: 'Personalization',
            event_label: `${oldLanguage}_to_${newLanguage}`,
            custom_parameter_1: newLanguage,
            custom_parameter_2: oldLanguage,
            custom_parameter_3: method, // 'selector', 'auto', 'browser'
            value: 1
        });
    }

    trackColorSchemeChange(newScheme, trigger) {
        gtag('event', 'color_scheme_change', {
            event_category: 'Personalization',
            event_label: `${newScheme}_${trigger}`,
            custom_parameter_1: newScheme, // 'light', 'dark', 'auto'
            custom_parameter_2: trigger, // 'user', 'system', 'time'
            value: 1
        });
    }

    // Eventos de accesibilidad
    trackAccessibilityFeature(featureName, enabled, method) {
        gtag('event', 'accessibility_feature', {
            event_category: 'Accessibility',
            event_label: `${featureName}_${enabled ? 'enabled' : 'disabled'}`,
            custom_parameter_1: featureName,
            custom_parameter_2: enabled ? 'enabled' : 'disabled',
            custom_parameter_3: method, // 'settings', 'keyboard', 'auto'
            value: enabled ? 1 : 0
        });
    }

    trackKeyboardNavigation(action, element, method) {
        gtag('event', 'keyboard_navigation', {
            event_category: 'Accessibility',
            event_label: `${action}_${element}`,
            custom_parameter_1: action, // 'focus', 'activate', 'skip'
            custom_parameter_2: element,
            custom_parameter_3: method, // 'tab', 'arrow', 'shortcut'
            value: 1
        });
    }

    trackScreenReaderAction(action, element, content) {
        gtag('event', 'screen_reader', {
            event_category: 'Accessibility',
            event_label: `${action}_${element}`,
            custom_parameter_1: action, // 'read', 'skip', 'navigate'
            custom_parameter_2: element,
            custom_parameter_3: content ? content.substring(0, 100) : '',
            value: 1
        });
    }

    trackHighContrastMode(enabled, method) {
        gtag('event', 'high_contrast', {
            event_category: 'Accessibility',
            event_label: enabled ? 'enabled' : 'disabled',
            custom_parameter_1: enabled ? 'enabled' : 'disabled',
            custom_parameter_2: method, // 'settings', 'system', 'keyboard'
            value: enabled ? 1 : 0
        });
    }

    trackTextSizeChange(newSize, oldSize, method) {
        gtag('event', 'text_size_change', {
            event_category: 'Accessibility',
            event_label: `${oldSize}_to_${newSize}`,
            custom_parameter_1: newSize,
            custom_parameter_2: oldSize,
            custom_parameter_3: method, // 'buttons', 'slider', 'browser'
            value: newSize
        });
    }

    // Eventos de audio
    trackAudioPlay(audioType, fileName, context) {
        gtag('event', 'audio_play', {
            event_category: 'Audio',
            event_label: `${audioType}_${fileName}`,
            custom_parameter_1: audioType, // 'sfx', 'music', 'voice'
            custom_parameter_2: fileName,
            custom_parameter_3: context,
            value: 1
        });
    }

    trackAudioVolumeChange(audioType, newVolume, oldVolume) {
        gtag('event', 'audio_volume', {
            event_category: 'Audio',
            event_label: `${audioType}_${oldVolume}_to_${newVolume}`,
            custom_parameter_1: audioType,
            custom_parameter_2: newVolume,
            custom_parameter_3: oldVolume,
            value: newVolume
        });
    }

    trackAudioMute(audioType, isMuted, method) {
        gtag('event', 'audio_mute', {
            event_category: 'Audio',
            event_label: `${audioType}_${isMuted ? 'muted' : 'unmuted'}`,
            custom_parameter_1: audioType,
            custom_parameter_2: isMuted ? 'muted' : 'unmuted',
            custom_parameter_3: method, // 'button', 'keyboard', 'auto'
            value: isMuted ? 1 : 0
        });
    }

    trackAudioError(audioType, fileName, errorType, errorMessage) {
        gtag('event', 'audio_error', {
            event_category: 'Audio',
            event_label: `${audioType}_${fileName}_${errorType}`,
            custom_parameter_1: audioType,
            custom_parameter_2: fileName,
            custom_parameter_3: errorType, // 'load_failed', 'play_failed', 'decode_error'
            description: errorMessage
        });
    }

    // Eventos de navegación y menú
    trackMenuNavigation(fromMenu, toMenu, method) {
        gtag('event', 'menu_navigation', {
            event_category: 'Navigation',
            event_label: `${fromMenu}_to_${toMenu}`,
            custom_parameter_1: fromMenu,
            custom_parameter_2: toMenu,
            custom_parameter_3: method, // 'button', 'keyboard', 'breadcrumb'
            value: 1
        });
    }

    trackBreadcrumbClick(level, pageName, totalLevels) {
        gtag('event', 'breadcrumb_click', {
            event_category: 'Navigation',
            event_label: `level_${level}_${pageName}`,
            custom_parameter_1: level,
            custom_parameter_2: pageName,
            custom_parameter_3: totalLevels,
            value: level
        });
    }

    trackBackButton(fromWhere, method) {
        gtag('event', 'back_button', {
            event_category: 'Navigation',
            event_label: `from_${fromWhere}`,
            custom_parameter_1: fromWhere,
            custom_parameter_2: method, // 'button', 'browser', 'gesture'
            value: 1
        });
    }

    trackSearchUsage(searchTerm, resultsCount, context, filterUsed = null) {
        gtag('event', 'search_usage', {
            event_category: 'Search',
            event_label: `${searchTerm}_${resultsCount}_results`,
            custom_parameter_1: searchTerm,
            custom_parameter_2: resultsCount,
            custom_parameter_3: context,
            value: resultsCount
        });
    }

    // Eventos de gestión de datos
    trackDataExport(dataType, format, size) {
        gtag('event', 'data_export', {
            event_category: 'Data_Management',
            event_label: `${dataType}_${format}_${size}kb`,
            custom_parameter_1: dataType, // 'scores', 'settings', 'progress'
            custom_parameter_2: format, // 'json', 'csv', 'txt'
            custom_parameter_3: size,
            value: size
        });
    }

    trackDataImport(dataType, format, success, recordsCount) {
        gtag('event', 'data_import', {
            event_category: 'Data_Management',
            event_label: `${dataType}_${format}_${success ? 'success' : 'failed'}`,
            custom_parameter_1: dataType,
            custom_parameter_2: format,
            custom_parameter_3: success ? 'success' : 'failed',
            value: recordsCount
        });
    }

    trackDataClear(dataType, method, confirmed) {
        gtag('event', 'data_clear', {
            event_category: 'Data_Management',
            event_label: `${dataType}_${method}_${confirmed ? 'confirmed' : 'cancelled'}`,
            custom_parameter_1: dataType,
            custom_parameter_2: method, // 'button', 'menu', 'auto'
            custom_parameter_3: confirmed ? 'confirmed' : 'cancelled',
            value: confirmed ? 1 : 0
        });
    }

    trackDataSync(action, dataType, success, syncTime) {
        gtag('event', 'data_sync', {
            event_category: 'Data_Management',
            event_label: `${action}_${dataType}_${success ? 'success' : 'failed'}`,
            custom_parameter_1: action, // 'upload', 'download', 'sync'
            custom_parameter_2: dataType,
            custom_parameter_3: success ? 'success' : 'failed',
            value: syncTime
        });
    }

    // Eventos de rendimiento
    trackPerformanceMetric(metricName, value, context) {
        gtag('event', 'performance_metric', {
            event_category: 'Performance',
            event_label: `${metricName}_${Math.round(value)}`,
            custom_parameter_1: metricName,
            custom_parameter_2: Math.round(value),
            custom_parameter_3: context,
            value: Math.round(value)
        });
    }

    trackMemoryUsage(usedMB, totalMB, context) {
        gtag('event', 'memory_usage', {
            event_category: 'Performance',
            event_label: `${Math.round(usedMB)}MB_of_${Math.round(totalMB)}MB`,
            custom_parameter_1: Math.round(usedMB),
            custom_parameter_2: Math.round(totalMB),
            custom_parameter_3: context,
            value: Math.round((usedMB / totalMB) * 100)
        });
    }

    trackFPSMetric(currentFPS, averageFPS, context) {
        gtag('event', 'fps_metric', {
            event_category: 'Performance',
            event_label: `${Math.round(currentFPS)}fps_avg_${Math.round(averageFPS)}`,
            custom_parameter_1: Math.round(currentFPS),
            custom_parameter_2: Math.round(averageFPS),
            custom_parameter_3: context,
            value: Math.round(currentFPS)
        });
    }

    // Eventos de gestos móviles
    trackGesture(gestureType, element, direction = null, distance = null) {
        gtag('event', 'mobile_gesture', {
            event_category: 'Mobile_Interaction',
            event_label: `${gestureType}_${element}`,
            custom_parameter_1: gestureType, // 'swipe', 'pinch', 'tap', 'long_press'
            custom_parameter_2: element,
            custom_parameter_3: direction, // 'left', 'right', 'up', 'down', 'in', 'out'
            value: distance || 1
        });
    }

    trackTouchInteraction(action, element, touchCount, duration) {
        gtag('event', 'touch_interaction', {
            event_category: 'Mobile_Interaction',
            event_label: `${action}_${element}_${touchCount}finger`,
            custom_parameter_1: action, // 'start', 'move', 'end', 'cancel'
            custom_parameter_2: element,
            custom_parameter_3: touchCount,
            value: duration
        });
    }

    trackOrientationChange(newOrientation, oldOrientation, context) {
        gtag('event', 'orientation_change', {
            event_category: 'Mobile_Interaction',
            event_label: `${oldOrientation}_to_${newOrientation}`,
            custom_parameter_1: newOrientation, // 'portrait', 'landscape'
            custom_parameter_2: oldOrientation,
            custom_parameter_3: context,
            value: 1
        });
    }

    // Eventos multijugador y sociales
    trackMultiplayerAction(action, playerCount, gameMode) {
        gtag('event', 'multiplayer_action', {
            event_category: 'Multiplayer',
            event_label: `${action}_${playerCount}p_${gameMode}`,
            custom_parameter_1: action, // 'create', 'join', 'leave', 'invite'
            custom_parameter_2: playerCount,
            custom_parameter_3: gameMode,
            value: playerCount
        });
    }

    trackPlayerInteraction(action, targetPlayer, context) {
        gtag('event', 'player_interaction', {
            event_category: 'Multiplayer',
            event_label: `${action}_player_${targetPlayer}`,
            custom_parameter_1: action, // 'chat', 'challenge', 'help', 'report'
            custom_parameter_2: targetPlayer,
            custom_parameter_3: context,
            value: 1
        });
    }

    trackSocialShare(platform, content, success) {
        gtag('event', 'social_share', {
            event_category: 'Social',
            event_label: `${platform}_${content}_${success ? 'success' : 'failed'}`,
            custom_parameter_1: platform, // 'twitter', 'facebook', 'whatsapp', 'copy'
            custom_parameter_2: content, // 'score', 'achievement', 'challenge'
            custom_parameter_3: success ? 'success' : 'failed',
            value: success ? 1 : 0
        });
    }

    // Trackear información de conexión
    trackConnectionInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                this.trackPageView('Connection_Info', {
                    event_category: 'Technical',
                    event_label: `${connection.effectiveType}_${connection.downlink}mbps`,
                    custom_parameter_1: connection.effectiveType,
                    custom_parameter_2: connection.downlink,
                    custom_parameter_3: connection.rtt
                });
            }
        }
    }

    // Trackear Core Web Vitals
    trackWebVitals() {
        if (typeof getCLS !== 'undefined') {
            // Si web-vitals está disponible
            try {
                import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                    getCLS((metric) => {
                        this.trackLoadTime('CLS', metric.value * 1000);
                    });
                    getFID((metric) => {
                        this.trackLoadTime('FID', metric.value);
                    });
                    getFCP((metric) => {
                        this.trackLoadTime('FCP', metric.value);
                    });
                    getLCP((metric) => {
                        this.trackLoadTime('LCP', metric.value);
                    });
                    getTTFB((metric) => {
                        this.trackLoadTime('TTFB', metric.value);
                    });
                }).catch(() => {
                    // Web Vitals no disponible, continuar sin error
                    console.log('📊 Web Vitals no disponible');
                });
            } catch (error) {
                console.log('📊 Error cargando Web Vitals:', error);
            }
        }
    }
}

// Inicializar sistema de analytics
window.trivialAnalytics = new TrivialAnalytics();

// Crear un Proxy para capturar métodos faltantes y evitar errores
window.trivialAnalytics = new Proxy(window.trivialAnalytics, {
    get(target, prop, receiver) {
        // Si el método existe, devolverlo normalmente
        if (prop in target) {
            return Reflect.get(target, prop, receiver);
        }
        
        // Si es un método track* que no existe, crear uno genérico
        if (typeof prop === 'string' && prop.startsWith('track')) {
            console.warn(`⚠️ Método de analytics no encontrado: ${prop}. Usando trackear genérico.`);
            
            return function(...args) {
                // Crear un evento genérico basado en el nombre del método
                const eventName = prop.replace('track', '').toLowerCase();
                
                gtag('event', 'generic_analytics', {
                    event_category: 'Generic_Tracking',
                    event_label: `${eventName}_${args[0] || 'unknown'}`,
                    custom_parameter_1: eventName,
                    custom_parameter_2: args[0] || 'unknown',
                    custom_parameter_3: args[1] || '',
                    value: 1
                });
                
                // Log para debugging
                if (window.gaDebug) {
                    console.log(`📊 Generic Analytics: ${prop}(${args.join(', ')})`);
                }
            };
        }
        
        // Para cualquier otra propiedad, devolver undefined
        return Reflect.get(target, prop, receiver);
    }
});

// Funciones globales para fácil acceso desde otros scripts
window.trackGameEvent = (action, category = 'Game', label = '', value = null) => {
    gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
    });
};

// Función de utilidad para verificar si Analytics está disponible
window.isAnalyticsReady = () => {
    return !!(window.trivialAnalytics && typeof window.trivialAnalytics.trackPageView === 'function');
};

// Función de utilidad para realizar tracking seguro
window.safeTrack = (methodName, ...args) => {
    try {
        if (window.trivialAnalytics && typeof window.trivialAnalytics[methodName] === 'function') {
            return window.trivialAnalytics[methodName](...args);
        } else {
            console.warn(`🔍 Analytics method '${methodName}' not available`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error in analytics tracking for '${methodName}':`, error);
        return false;
    }
};

// Debug mode para desarrollo (solo en localhost)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.gaDebug = true;
    console.log('🔍 Google Analytics Debug Mode activado');
    
    // Override para logging en desarrollo
    const originalGtag = gtag;
    window.gtag = function(...args) {
        //console.log('📊 GA Event:', args);
        return originalGtag.apply(this, args);
    };
}

// Eventos automáticos cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    // Trackear tiempo de carga inicial
    const domLoadTime = performance.now();
    window.trivialAnalytics.trackLoadTime('dom_ready', domLoadTime);
    
    // Detectar tipo de dispositivo
    window.trivialAnalytics.trackDeviceUsage();
    window.trivialAnalytics.trackPageView('Game_Load');
});

// Trackear cuando todos los módulos están cargados
document.addEventListener('modulesReady', () => {
    const modulesLoadTime = performance.now();
    window.trivialAnalytics.trackLoadTime('modules_ready', modulesLoadTime);
    window.trivialAnalytics.trackPageView('Modules_Loaded');
});

// Trackear performance de la página completamente cargada
window.addEventListener('load', () => {
    const fullLoadTime = performance.now();
    window.trivialAnalytics.trackLoadTime('page_fully_loaded', fullLoadTime);
    
    // Trackear información de conexión
    window.trivialAnalytics.trackConnectionInfo();
    
    // Trackear Core Web Vitals
    window.trivialAnalytics.trackWebVitals();
});

// Trackear eventos de conectividad
window.addEventListener('online', () => {
    window.trivialAnalytics.trackPageView('Connection_Online');
});

window.addEventListener('offline', () => {
    window.trivialAnalytics.trackPageView('Connection_Offline');
});

// Trackear cambios de visibilidad (usuario cambia de pestaña)
document.addEventListener('visibilitychange', () => {
    const isVisible = !document.hidden;
    window.trivialAnalytics.trackPageView(isVisible ? 'Tab_Visible' : 'Tab_Hidden');
});

// Trackear errores globales de JavaScript
window.addEventListener('error', (event) => {
    window.trivialAnalytics.trackError('JAVASCRIPT_ERROR', `${event.message} at ${event.filename}:${event.lineno}`);
});

// Trackear promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
    window.trivialAnalytics.trackError('UNHANDLED_PROMISE_REJECTION', event.reason?.message || 'Unknown promise rejection');
});

console.log('📊 Google Analytics para Trivial Game cargado correctamente');
