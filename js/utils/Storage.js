/**
 * Clase para manejar el almacenamiento local del juego
 * Gestiona la persistencia de partidas, configuración y estadísticas
 */
class Storage {
    constructor() {
        this.storagePrefix = 'trivial_';
        this.keys = {
            GAME_STATE: 'game_state',
            CONFIG: 'config',
            STATS: 'stats',
            QUESTION_CACHE: 'question_cache',
            LAST_PLAYED: 'last_played'
        };
        
        this.initDefaultConfig();
    }

    /**
     * Inicializa la configuración por defecto si no existe
     */
    initDefaultConfig() {
        const defaultConfig = {
            playerCount: 4,
            difficulty: 'medium',
            timer: 30,
            soundEnabled: true,
            lastUpdated: Date.now()
        };

        if (!this.getConfig()) {
            this.saveConfig(defaultConfig);
        }
    }

    /**
     * Guarda el estado completo del juego
     * @param {Object} gameState - Estado del juego a guardar
     */
    saveGameState(gameState) {
        try {
            const stateToSave = {
                ...gameState,
                savedAt: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem(
                this.storagePrefix + this.keys.GAME_STATE,
                JSON.stringify(stateToSave)
            );
            
            // Track guardado de partida
            if (window.trivialAnalytics && typeof window.trivialAnalytics.trackTechnicalEvent === 'function') {
                window.trivialAnalytics.trackTechnicalEvent('game_saved', {
                    dataSize: JSON.stringify(stateToSave).length,
                    playerCount: gameState.players?.length || 0,
                    gameProgress: gameState.currentTurn || 0
                });
            }
            
            this.updateLastPlayed();
            console.log('Estado del juego guardado correctamente');
            return true;
        } catch (error) {
            console.error('Error al guardar el estado del juego:', error);
            
            // Track error de guardado
            if (window.trivialAnalytics && typeof window.trivialAnalytics.trackError === 'function') {
                window.trivialAnalytics.trackError('SAVE_ERROR', error.message);
            }
            
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * Carga el estado guardado del juego
     * @returns {Object|null} Estado del juego o null si no existe
     */
    loadGameState() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + this.keys.GAME_STATE);
            if (!saved) return null;

            const gameState = JSON.parse(saved);
            
            // Verificar que el estado guardado no sea demasiado antiguo (7 días)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
            if (Date.now() - gameState.savedAt > maxAge) {
                this.clearGameState();
                return null;
            }

            // Track carga de partida
            if (window.trivialAnalytics && typeof window.trivialAnalytics.trackTechnicalEvent === 'function') {
                window.trivialAnalytics.trackTechnicalEvent('game_loaded', {
                    dataSize: saved.length,
                    playerCount: gameState.players?.length || 0,
                    gameAge: Math.round((Date.now() - gameState.savedAt) / (1000 * 60)), // Age in minutes
                    gameProgress: gameState.currentTurn || 0
                });
            }

            console.log('Estado del juego cargado correctamente');
            return gameState;
        } catch (error) {
            console.error('Error al cargar el estado del juego:', error);
            
            // Track error de carga
            if (window.trivialAnalytics && typeof window.trivialAnalytics.trackError === 'function') {
                window.trivialAnalytics.trackError('LOAD_ERROR', error.message);
            }
            
            this.clearGameState(); // Limpiar estado corrupto
            return null;
        }
    }

    /**
     * Elimina el estado guardado del juego
     */
    clearGameState() {
        try {
            localStorage.removeItem(this.storagePrefix + this.keys.GAME_STATE);
            console.log('Estado del juego eliminado');
        } catch (error) {
            console.error('Error al eliminar el estado del juego:', error);
        }
    }

    /**
     * Verifica si existe un juego guardado
     * @returns {boolean} True si existe un juego guardado
     */
    hasGameState() {
        return !!localStorage.getItem(this.storagePrefix + this.keys.GAME_STATE);
    }

    /**
     * Guarda la configuración del juego
     * @param {Object} config - Configuración a guardar
     */
    saveConfig(config) {
        try {
            const configToSave = {
                ...config,
                lastUpdated: Date.now()
            };
            
            localStorage.setItem(
                this.storagePrefix + this.keys.CONFIG,
                JSON.stringify(configToSave)
            );
            
            console.log('Configuración guardada correctamente');
            return true;
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * Carga la configuración del juego
     * @returns {Object} Configuración del juego
     */
    getConfig() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + this.keys.CONFIG);
            if (!saved) return null;

            return JSON.parse(saved);
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
            return null;
        }
    }

    /**
     * Guarda estadísticas del juego
     * @param {Object} stats - Estadísticas a guardar o actualizar
     */
    saveStats(stats) {
        try {
            const currentStats = this.getStats() || {
                gamesPlayed: 0,
                gamesWon: 0,
                totalQuestions: 0,
                correctAnswers: 0,
                categoriesStats: {},
                averageGameTime: 0,
                lastPlayed: null
            };

            const updatedStats = {
                ...currentStats,
                ...stats,
                lastUpdated: Date.now()
            };

            localStorage.setItem(
                this.storagePrefix + this.keys.STATS,
                JSON.stringify(updatedStats)
            );

            console.log('Estadísticas guardadas correctamente');
            return true;
        } catch (error) {
            console.error('Error al guardar las estadísticas:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * Carga las estadísticas del juego
     * @returns {Object} Estadísticas del juego
     */
    getStats() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + this.keys.STATS);
            if (!saved) return null;

            return JSON.parse(saved);
        } catch (error) {
            console.error('Error al cargar las estadísticas:', error);
            return null;
        }
    }

    /**
     * Incrementa una estadística específica
     * @param {string} statName - Nombre de la estadística
     * @param {number} increment - Cantidad a incrementar (por defecto 1)
     */
    incrementStat(statName, increment = 1) {
        const stats = this.getStats() || {};
        stats[statName] = (stats[statName] || 0) + increment;
        this.saveStats(stats);
    }

    /**
     * Actualiza estadísticas de una categoría específica
     * @param {string} category - Categoría
     * @param {boolean} correct - Si la respuesta fue correcta
     */
    updateCategoryStats(category, correct) {
        const stats = this.getStats() || {};
        if (!stats.categoriesStats) {
            stats.categoriesStats = {};
        }
        
        if (!stats.categoriesStats[category]) {
            stats.categoriesStats[category] = {
                total: 0,
                correct: 0
            };
        }

        stats.categoriesStats[category].total++;
        if (correct) {
            stats.categoriesStats[category].correct++;
        }

        this.saveStats(stats);
    }

    /**
     * Guarda cache de preguntas para evitar repeticiones
     * @param {string} category - Categoría
     * @param {Array} questions - Array de preguntas ya usadas
     */
    saveQuestionCache(category, questions) {
        try {
            const cache = this.getQuestionCache() || {};
            cache[category] = {
                questions: questions,
                lastUpdated: Date.now()
            };

            localStorage.setItem(
                this.storagePrefix + this.keys.QUESTION_CACHE,
                JSON.stringify(cache)
            );
        } catch (error) {
            console.error('Error al guardar cache de preguntas:', error);
        }
    }

    /**
     * Obtiene el cache de preguntas
     * @returns {Object} Cache de preguntas por categoría
     */
    getQuestionCache() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + this.keys.QUESTION_CACHE);
            if (!saved) return null;

            const cache = JSON.parse(saved);
            
            // Limpiar cache antiguo (más de 1 día)
            const maxAge = 24 * 60 * 60 * 1000; // 1 día
            Object.keys(cache).forEach(category => {
                if (Date.now() - cache[category].lastUpdated > maxAge) {
                    delete cache[category];
                }
            });

            return cache;
        } catch (error) {
            console.error('Error al cargar cache de preguntas:', error);
            return null;
        }
    }

    /**
     * Limpia el cache de preguntas
     */
    clearQuestionCache() {
        try {
            localStorage.removeItem(this.storagePrefix + this.keys.QUESTION_CACHE);
            console.log('Cache de preguntas eliminado');
        } catch (error) {
            console.error('Error al eliminar cache de preguntas:', error);
        }
    }

    /**
     * Actualiza la marca de tiempo de última partida jugada
     */
    updateLastPlayed() {
        try {
            localStorage.setItem(
                this.storagePrefix + this.keys.LAST_PLAYED,
                Date.now().toString()
            );
        } catch (error) {
            console.error('Error al actualizar última partida:', error);
        }
    }

    /**
     * Obtiene la fecha de la última partida jugada
     * @returns {Date|null} Fecha de la última partida o null
     */
    getLastPlayed() {
        try {
            const timestamp = localStorage.getItem(this.storagePrefix + this.keys.LAST_PLAYED);
            return timestamp ? new Date(parseInt(timestamp)) : null;
        } catch (error) {
            console.error('Error al obtener última partida:', error);
            return null;
        }
    }

    /**
     * Obtiene el espacio usado por el almacenamiento del juego
     * @returns {Object} Información del espacio usado
     */
    getStorageInfo() {
        const info = {
            totalSize: 0,
            itemCount: 0,
            items: {}
        };

        try {
            Object.values(this.keys).forEach(key => {
                const fullKey = this.storagePrefix + key;
                const item = localStorage.getItem(fullKey);
                if (item) {
                    const size = new Blob([item]).size;
                    info.items[key] = {
                        size: size,
                        lastModified: this.getItemLastModified(key)
                    };
                    info.totalSize += size;
                    info.itemCount++;
                }
            });
        } catch (error) {
            console.error('Error al obtener información de almacenamiento:', error);
        }

        return info;
    }

    /**
     * Obtiene la fecha de última modificación de un elemento
     */
    getItemLastModified(key) {
        try {
            const item = localStorage.getItem(this.storagePrefix + key);
            if (!item) return null;
            
            const data = JSON.parse(item);
            return data.lastUpdated || data.savedAt || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Limpia todo el almacenamiento del juego
     */
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(this.storagePrefix + key);
            });
            console.log('Todo el almacenamiento del juego ha sido eliminado');
            this.initDefaultConfig(); // Restaurar configuración por defecto
        } catch (error) {
            console.error('Error al limpiar el almacenamiento:', error);
        }
    }

    /**
     * Maneja errores de almacenamiento (como falta de espacio)
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('Espacio de almacenamiento agotado, limpiando datos antiguos...');
            this.clearQuestionCache();
            
            // Si aún hay problemas, ofrecer limpiar estadísticas
            const stats = this.getStats();
            if (stats && Date.now() - stats.lastUpdated > 30 * 24 * 60 * 60 * 1000) {
                // Estadísticas más antiguas de 30 días
                localStorage.removeItem(this.storagePrefix + this.keys.STATS);
                console.log('Estadísticas antiguas eliminadas por falta de espacio');
            }
        }
    }

    /**
     * Exporta todos los datos del juego
     * @returns {Object} Datos exportados
     */
    exportData() {
        const exportData = {
            config: this.getConfig(),
            stats: this.getStats(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return exportData;
    }

    /**
     * Importa datos del juego
     * @param {Object} data - Datos a importar
     * @returns {boolean} True si la importación fue exitosa
     */
    importData(data) {
        try {
            if (!data || !data.version) {
                throw new Error('Datos de importación no válidos');
            }

            if (data.config) {
                this.saveConfig(data.config);
            }

            if (data.stats) {
                this.saveStats(data.stats);
            }            console.log('Datos importados correctamente');
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    }

    /**
     * Método genérico para obtener datos del localStorage
     * @param {string} key - Clave de los datos a obtener
     * @returns {any} - Datos almacenados o null si no existen
     */
    get(key) {
        try {
            const item = localStorage.getItem(this.storagePrefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error al obtener datos para la clave '${key}':`, error);
            return null;
        }
    }

    /**
     * Método genérico para guardar datos en localStorage
     * @param {string} key - Clave para almacenar los datos
     * @param {any} value - Valor a almacenar
     * @returns {boolean} - true si se guardó correctamente, false en caso contrario
     */
    set(key, value) {
        try {
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error al guardar datos para la clave '${key}':`, error);
            return false;
        }
    }

    /**
     * Método genérico para eliminar datos del localStorage
     * @param {string} key - Clave de los datos a eliminar
     * @returns {boolean} - true si se eliminó correctamente, false en caso contrario
     */
    remove(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            console.error(`Error al eliminar datos para la clave '${key}':`, error);
            return false;
        }
    }

    /**
     * Verifica si existe una clave en el localStorage
     * @param {string} key - Clave a verificar
     * @returns {boolean} - true si existe, false en caso contrario
     */
    has(key) {
        return localStorage.getItem(this.storagePrefix + key) !== null;
    }
}
