/**
 * Clase que representa un jugador en el juego de trivial
 */
class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.position = 0; // Posición en el tablero (0-47)
        this.wedges = {
            historia: false,
            ciencia: false,
            deportes: false,
            arte: false,
            geografia: false,
            entretenimiento: false
        };        this.stats = {
            questionsAnswered: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            categoriesCorrect: {
                historia: 0,
                ciencia: 0,
                deportes: 0,
                arte: 0,
                geografia: 0,
                entretenimiento: 0
            },
            totalTime: 0,
            averageTime: 0
        };
        this.isWinner = false;
        this.currentTurn = false;
        this.categorySelectUses = 3; // Número de veces que puede usar el selector de categoría
    }

    /**
     * Mueve al jugador una cantidad específica de casillas
     * @param {number} spaces - Número de casillas a mover
     * @returns {number} Nueva posición del jugador
     */
    move(spaces) {
        const oldPosition = this.position;
        this.position = (this.position + spaces) % 48; // 48 casillas en total
        
        console.log(`${this.name} se mueve de la posición ${oldPosition} a la ${this.position}`);
        return this.position;
    }

    /**
     * Otorga una cuña al jugador
     * @param {string} category - Categoría de la cuña a otorgar
     * @returns {boolean} True si se otorgó la cuña (no la tenía antes)
     */
    grantWedge(category) {
        const categoryLower = category.toLowerCase();
        if (!this.wedges.hasOwnProperty(categoryLower)) {
            console.warn(`Categoría no válida: ${category}`);
            return false;
        }

        if (this.wedges[categoryLower]) {
            console.log(`${this.name} ya tiene la cuña de ${category}`);
            return false;
        }

        this.wedges[categoryLower] = true;
        console.log(`${this.name} ha obtenido la cuña de ${category}!`);
        return true;
    }

    /**
     * Verifica si el jugador tiene todas las cuñas
     * @returns {boolean} True si tiene todas las cuñas
     */
    hasAllWedges() {
        return Object.values(this.wedges).every(wedge => wedge === true);
    }

    /**
     * Obtiene el número de cuñas que tiene el jugador
     * @returns {number} Número de cuñas obtenidas
     */
    getWedgeCount() {
        return Object.values(this.wedges).filter(wedge => wedge === true).length;
    }

    /**
     * Obtiene las categorías de cuñas que aún no tiene
     * @returns {string[]} Array de categorías faltantes
     */
    getMissingWedges() {
        return Object.keys(this.wedges).filter(category => !this.wedges[category]);
    }

    /**
     * Registra una respuesta del jugador
     * @param {boolean} correct - Si la respuesta fue correcta
     * @param {string} category - Categoría de la pregunta
     * @param {number} timeSpent - Tiempo empleado en responder (en segundos)
     */
    recordAnswer(correct, category, timeSpent = 0) {
        this.stats.questionsAnswered++;
        this.stats.totalTime += timeSpent;
        this.stats.averageTime = this.stats.totalTime / this.stats.questionsAnswered;

        const categoryLower = category.toLowerCase();
        
        if (correct) {
            this.stats.correctAnswers++;
            if (this.stats.categoriesCorrect.hasOwnProperty(categoryLower)) {
                this.stats.categoriesCorrect[categoryLower]++;
            }
        } else {
            this.stats.wrongAnswers++;
        }

        console.log(`${this.name} - Respuesta ${correct ? 'correcta' : 'incorrecta'} en ${category}. Tiempo: ${timeSpent}s`);
    }

    /**
     * Calcula el porcentaje de aciertos del jugador
     * @returns {number} Porcentaje de aciertos (0-100)
     */
    getAccuracyPercentage() {
        if (this.stats.questionsAnswered === 0) return 0;
        return Math.round((this.stats.correctAnswers / this.stats.questionsAnswered) * 100);
    }

    /**
     * Obtiene la categoría en la que mejor lo hace el jugador
     * @returns {string} Nombre de la categoría con más aciertos
     */
    getBestCategory() {
        const categories = this.stats.categoriesCorrect;
        let bestCategory = 'historia';
        let maxCorrect = categories.historia;

        Object.keys(categories).forEach(category => {
            if (categories[category] > maxCorrect) {
                maxCorrect = categories[category];
                bestCategory = category;
            }
        });

        return bestCategory;
    }

    /**
     * Obtiene la categoría más débil del jugador
     * @returns {string} Nombre de la categoría con menos aciertos
     */
    getWeakestCategory() {
        const categories = this.stats.categoriesCorrect;
        let weakestCategory = 'historia';
        let minCorrect = categories.historia;

        Object.keys(categories).forEach(category => {
            if (categories[category] < minCorrect) {
                minCorrect = categories[category];
                weakestCategory = category;
            }
        });

        return weakestCategory;
    }

    /**
     * Reinicia las estadísticas del jugador
     */
    resetStats() {
        this.stats = {
            questionsAnswered: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            categoriesCorrect: {
                historia: 0,
                ciencia: 0,
                deportes: 0,
                arte: 0,
                geografia: 0,
                entretenimiento: 0
            },
            totalTime: 0,
            averageTime: 0
        };
        console.log(`Estadísticas de ${this.name} reiniciadas`);
    }

    /**
     * Reinicia el progreso del jugador (posición y cuñas)
     */
    resetProgress() {
        this.position = 0;
        this.wedges = {
            historia: false,
            ciencia: false,
            deportes: false,
            arte: false,
            geografia: false,
            entretenimiento: false
        };
        this.isWinner = false;
        this.currentTurn = false;
        console.log(`Progreso de ${this.name} reiniciado`);
    }

    /**
     * Establece al jugador como ganador
     */
    setAsWinner() {
        this.isWinner = true;
        console.log(`¡${this.name} ha ganado el juego!`);
    }

    /**
     * Establece el turno del jugador
     * @param {boolean} isTurn - Si es el turno de este jugador
     */
    setTurn(isTurn) {
        this.currentTurn = isTurn;
    }

    /**
     * Obtiene un resumen del estado del jugador
     * @returns {Object} Objeto con el resumen del jugador
     */
    getSummary() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            position: this.position,
            wedgeCount: this.getWedgeCount(),
            hasAllWedges: this.hasAllWedges(),
            accuracyPercentage: this.getAccuracyPercentage(),
            questionsAnswered: this.stats.questionsAnswered,
            isWinner: this.isWinner,
            currentTurn: this.currentTurn
        };
    }

    /**
     * Serializa el jugador para guardar el estado
     * @returns {Object} Datos del jugador serializados
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            position: this.position,
            wedges: { ...this.wedges },
            stats: { 
                ...this.stats,
                categoriesCorrect: { ...this.stats.categoriesCorrect }
            },
            isWinner: this.isWinner,
            currentTurn: this.currentTurn
        };
    }

    /**
     * Restaura un jugador desde datos serializados
     * @param {Object} data - Datos serializados del jugador
     * @returns {Player} Nueva instancia del jugador
     */
    static deserialize(data) {
        const player = new Player(data.id, data.name, data.color);
        player.position = data.position || 0;
        player.wedges = { ...player.wedges, ...data.wedges };
        player.stats = { 
            ...player.stats, 
            ...data.stats,
            categoriesCorrect: { ...player.stats.categoriesCorrect, ...data.stats.categoriesCorrect }
        };
        player.isWinner = data.isWinner || false;
        player.currentTurn = data.currentTurn || false;
        return player;
    }

    /**
     * Crea un jugador con configuración predeterminada
     * @param {number} id - ID del jugador
     * @returns {Player} Nueva instancia del jugador
     */
    static createDefault(id) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
        const names = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6'];
        
        return new Player(id, names[id - 1] || `Jugador ${id}`, colors[(id - 1) % colors.length]);
    }

    /**
     * Valida los datos de un jugador
     * @param {Object} data - Datos a validar
     * @returns {boolean} True si los datos son válidos
     */
    static validate(data) {
        return (
            data &&
            typeof data.id === 'number' &&
            typeof data.name === 'string' &&
            typeof data.color === 'string' &&
            typeof data.position === 'number' &&
            data.wedges &&
            data.stats
        );
    }
}
