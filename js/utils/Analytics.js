/**
 * Sistema de Google Analytics simplificado para Modo Desafío
 * @author Luis Roselló
 * @description Sistema básico de tracking solo para el modo desafío
 */

// Configurar dataLayer antes de cargar gtag
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Inicializar Google Analytics
gtag('js', new Date());

// Configuración básica
gtag('config', 'G-RQVNQE35NT', {
    page_title: 'Trivial - Modo Desafío',
    page_location: window.location.href,
    send_page_view: true,
    anonymize_ip: true
});

/**
 * Sistema de tracking simple solo para el Modo Desafío
 */
class TrivialAnalytics {
    constructor() {
        this.sessionStartTime = Date.now();
    }

    // Eventos básicos del Modo Desafío
    trackChallengeStart(challengeType, timer, difficulty, questionType, categories) {
        // Evento principal del desafío
        gtag('event', 'challenge_start', {
            event_category: 'Challenge',
            event_label: challengeType,
            value: 1,
            challenge_difficulty: difficulty || 'medium',
            challenge_timer: timer || 'unlimited',
            challenge_question_type: questionType || 'multiple'
        });

        // Eventos separados para cada categoría activa
        if (categories) {
            Object.keys(categories).forEach(category => {
                if (categories[category]) {
                    gtag('event', 'challenge_categories', {
                        event_category: 'Challenge',
                        event_label: category,
                        value: 1
                    });
                }
            });
        }
    }

    trackChallengeComplete(challengeType, finalScore, questionsCorrect, totalQuestions) {
        const accuracyRate = totalQuestions > 0 ? Math.round((questionsCorrect / totalQuestions) * 100) : 0;
        
        gtag('event', 'challenge_complete', {
            event_category: 'Challenge',
            event_label: `${challengeType}_${finalScore}pts_${accuracyRate}%`,
            value: finalScore
        });
    }

    trackChallengeAbandoned(challengeType, questionsAnswered) {
        gtag('event', 'challenge_abandoned', {
            event_category: 'Challenge',
            event_label: `${challengeType}_${questionsAnswered}q`,
            value: questionsAnswered
        });
    }

    // Tracking de respuestas individuales
    trackQuestionAnswered(isCorrectOrCategory, responseTimeOrDifficulty = null, isCorrect = null, responseTime = null) {
        // Detectar si es la llamada del GameEngine (4 parámetros) o ChallengeEngine (2 parámetros)
        if (arguments.length >= 3) {
            // GameEngine format: (category, difficulty, isCorrect, responseTime)
            const category = isCorrectOrCategory;
            const difficulty = responseTimeOrDifficulty;
            const correct = isCorrect;
            const time = responseTime || 0;
            
            gtag('event', 'question_answered', {
                event_category: 'Game',
                event_label: `${category}_${difficulty}_${correct ? 'correct' : 'incorrect'}`,
                value: time
            });
        } else {
            // ChallengeEngine format: (isCorrect, responseTime)
            const correct = isCorrectOrCategory;
            const time = responseTimeOrDifficulty || 0;
            
            gtag('event', 'question_answered', {
                event_category: 'Challenge',
                event_label: correct ? 'correct' : 'incorrect',
                value: time
            });
        }
    }

    trackCorrectAnswer(responseTime = null) {
        gtag('event', 'correct_answer', {
            event_category: 'Challenge',
            event_label: 'correct',
            value: responseTime || 1
        });
    }

    trackIncorrectAnswer(responseTime = null) {
        gtag('event', 'incorrect_answer', {
            event_category: 'Challenge',
            event_label: 'incorrect',
            value: responseTime || 1
        });
    }

    // Tracking específico para timeout
    trackTimeout(timeLimit = null, questionNumber = null) {
        gtag('event', 'question_timeout', {
            event_category: 'Challenge',
            event_label: 'timeout',
            value: timeLimit || 20
        });
    }

    trackChallengeTimeout(challengeMode, category, timeLimit) {
        gtag('event', 'challenge_timeout', {
            event_category: 'Challenge',
            event_label: `${challengeMode}_${category}_timeout`,
            value: timeLimit || 20
        });
    }

    // Tracking avanzado de timeout
    trackConsecutiveTimeouts(count, challengeMode = 'continuous') {
        gtag('event', 'consecutive_timeouts', {
            event_category: 'Challenge',
            event_label: `${challengeMode}_${count}_consecutive`,
            value: count
        });
    }

    trackInactivityTimeout(idleTime, questionsAnswered = 0) {
        gtag('event', 'inactivity_timeout', {
            event_category: 'Challenge',
            event_label: `inactive_${idleTime}s_${questionsAnswered}q`,
            value: idleTime
        });
    }

    trackTimeoutPattern(pattern, sessionTimeouts = 0) {
        gtag('event', 'timeout_pattern', {
            event_category: 'Challenge',
            event_label: `${pattern}_${sessionTimeouts}_total`,
            value: sessionTimeouts
        });
    }

    // Tracking de eventos de inactividad
    trackChallengeInactivity(challengeMode, questionsAnswered, score) {
        gtag('event', 'challenge_inactivity', {
            event_category: 'Challenge',
            event_label: `${challengeMode}_inactive_${questionsAnswered}q`,
            value: score || 0
        });
    }

    trackChallengeActivityConfirmed(challengeMode, questionsAnswered) {
        gtag('event', 'activity_confirmed', {
            event_category: 'Challenge',
            event_label: `${challengeMode}_resumed_${questionsAnswered}q`,
            value: questionsAnswered
        });
    }

    trackChallengeAbandonedInactivity(challengeMode, questionsAnswered, score) {
        gtag('event', 'abandoned_inactivity', {
            event_category: 'Challenge',
            event_label: `${challengeMode}_abandoned_${questionsAnswered}q`,
            value: score || 0
        });
    }

    // Alias para compatibilidad
    trackChallengeAbandon(challengeType, questionsAnswered) {
        return this.trackChallengeAbandoned(challengeType, questionsAnswered);
    }

    // Evento genérico para compatibilidad
    trackPageView(pageName) {
        gtag('event', 'page_view', {
            event_category: 'Navigation',
            event_label: pageName
        });
    }

    // Método para errores críticos
    trackError(errorType, errorMessage) {
        gtag('event', 'exception', {
            description: `${errorType}: ${errorMessage}`,
            fatal: false
        });
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
        
        // Si es un método track* que no existe, simplemente no hacer nada
        if (typeof prop === 'string' && prop.startsWith('track')) {
            return function(...args) {
                // Solo trackear si está relacionado con desafíos
                if (prop.toLowerCase().includes('challenge')) {
                    const eventName = prop.replace('track', '').toLowerCase();
                    gtag('event', 'challenge_generic', {
                        event_category: 'Challenge',
                        event_label: `${eventName}_${args[0] || 'unknown'}`,
                        value: 1
                    });
                }
                // Otros eventos se ignoran silenciosamente
            };
        }
        
        return Reflect.get(target, prop, receiver);
    }
});

// Funciones globales simplificadas
window.trackGameEvent = (action, category = 'Game', label = '', value = null) => {
    // Solo trackear eventos de desafío
    if (category === 'Challenge' || action.toLowerCase().includes('challenge')) {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
};

// Función de utilidad para realizar tracking seguro
window.safeTrack = (methodName, ...args) => {
    try {
        if (window.trivialAnalytics && typeof window.trivialAnalytics[methodName] === 'function') {
            return window.trivialAnalytics[methodName](...args);
        }
        return false;
    } catch (error) {
        console.error(`❌ Error in analytics tracking for '${methodName}':`, error);
        return false;
    }
};

// Eventos automáticos mínimos
document.addEventListener('DOMContentLoaded', () => {
    window.trivialAnalytics.trackPageView('App_Loaded');
});

// Trackear errores globales críticos
window.addEventListener('error', (event) => {
    window.trivialAnalytics.trackError('JAVASCRIPT_ERROR', `${event.message}`);
});

// Configuración simplificada para Modo Desafío
