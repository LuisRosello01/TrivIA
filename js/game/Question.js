/**
 * Clase para manejar las preguntas del juego
 */
class Question {    constructor(text, answers, correctIndex, category, difficulty = 'medium', source = 'fallback', originalText = null, originalAnswers = null) {
        this.text = text;
        this.originalText = originalText || text; // Texto original sin traducir
        this.answers = [...answers]; // Crear copia del array
        this.originalAnswers = originalAnswers ? [...originalAnswers] : [...answers]; // Respuestas originales
        this.correctIndex = correctIndex;
        this.correctAnswer = answers[correctIndex];
        this.originalCorrectAnswer = this.originalAnswers[correctIndex];
        this.category = category.toLowerCase();
        this.difficulty = difficulty.toLowerCase();
        this.source = source; // 'api' o 'fallback'
        this.id = this.generateId();
        this.timeLimit = this.getTimeLimit();
        this.points = this.getPoints();
        this.used = false; // Para evitar repetir preguntas
        this.showingOriginal = false; // Estado para alternar entre original y traducido
        this.shuffledOrder = null; // Para mantener el orden mezclado consistente
    }

    /**
     * Genera un ID único para la pregunta
     * @returns {string} ID único basado en el texto de la pregunta
     */
    generateId() {
        return btoa(this.text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }

    /**
     * Obtiene el tiempo límite según la dificultad
     * @returns {number} Tiempo límite en segundos
     */
    getTimeLimit() {
        const timeLimits = {
            easy: 45,
            medium: 30,
            hard: 20
        };
        return timeLimits[this.difficulty] || 30;
    }

    /**
     * Obtiene los puntos según la dificultad
     * @returns {number} Puntos que otorga la pregunta
     */
    getPoints() {
        const pointsMap = {
            easy: 10,
            medium: 20,
            hard: 30
        };
        return pointsMap[this.difficulty] || 20;
    }

    /**
     * Verifica si una respuesta es correcta
     * @param {number|string} answer - Índice de la respuesta o texto de la respuesta
     * @returns {boolean} True si la respuesta es correcta
     */
    checkAnswer(answer) {
        if (typeof answer === 'number') {
            return answer === this.correctIndex;
        } else if (typeof answer === 'string') {
            return this.normalizeText(answer) === this.normalizeText(this.correctAnswer);
        }
        return false;
    }

    /**
     * Normaliza texto para comparación (sin acentos, minúsculas, sin espacios extra)
     * @param {string} text - Texto a normalizar
     * @returns {string} Texto normalizado
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^\w\s]/g, '') // Quitar puntuación
            .replace(/\s+/g, ' ') // Espacios múltiples a uno
            .trim();
    }    /**
     * Obtiene las opciones de respuesta mezcladas
     * @returns {Array} Array de objetos con las opciones mezcladas
     */
    getShuffledAnswers() {
        // Si ya tenemos un orden mezclado almacenado, usarlo
        if (this.shuffledOrder) {
            const currentAnswers = this.getCurrentAnswers();
            return this.shuffledOrder.map(originalIndex => ({
                text: currentAnswers[originalIndex],
                index: originalIndex,
                isCorrect: originalIndex === this.correctIndex
            }));
        }

        // Primera vez: crear y almacenar el orden mezclado
        const shuffledAnswers = this.answers.map((answer, index) => ({
            text: answer,
            index: index,
            isCorrect: index === this.correctIndex
        }));

        // Mezclar array usando Fisher-Yates
        for (let i = shuffledAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
        }

        // Almacenar el orden para uso futuro
        this.shuffledOrder = shuffledAnswers.map(answer => answer.index);

        return shuffledAnswers;
    }

    /**
     * Marca la pregunta como usada
     */
    markAsUsed() {
        this.used = true;
    }

    /**
     * Verifica si la pregunta ya fue usada
     * @returns {boolean} True si la pregunta ya fue usada
     */
    isUsed() {
        return this.used;
    }

    /**
     * Obtiene el color asociado a la categoría
     * @returns {string} Color hexadecimal de la categoría
     */
    getCategoryColor() {
        const colors = {
            historia: '#FF6B6B',
            ciencia: '#4ECDC4',
            deportes: '#45B7D1',
            arte: '#96CEB4',
            geografia: '#FECA57',
            entretenimiento: '#FF9FF3'
        };
        return colors[this.category] || '#667eea';
    }

    /**
     * Obtiene el icono asociado a la categoría
     * @returns {string} Emoji del icono de la categoría
     */
    getCategoryIcon() {
        const icons = {
            historia: '📚',
            ciencia: '🔬',
            deportes: '⚽',
            arte: '🎨',
            geografia: '🌍',
            entretenimiento: '🎬'
        };
        return icons[this.category] || '❓';
    }

    /**
     * Obtiene la etiqueta de dificultad en español
     * @returns {string} Etiqueta de dificultad
     */
    getDifficultyLabel() {
        const labels = {
            easy: 'Fácil',
            medium: 'Medio',
            hard: 'Difícil'
        };
        return labels[this.difficulty] || 'Medio';
    }

    /**
     * Obtiene la etiqueta de categoría en español
     * @returns {string} Etiqueta de categoría
     */
    getCategoryLabel() {
        const labels = {
            historia: 'Historia',
            ciencia: 'Ciencia',
            deportes: 'Deportes',
            arte: 'Arte',
            geografia: 'Geografía',
            entretenimiento: 'Entretenimiento'
        };
        return labels[this.category] || 'General';
    }

    /**
     * Serializa la pregunta para almacenamiento
     * @returns {Object} Datos serializados de la pregunta
     */
    serialize() {
        return {
            text: this.text,
            answers: [...this.answers],
            correctIndex: this.correctIndex,
            category: this.category,
            difficulty: this.difficulty,
            id: this.id,
            used: this.used
        };
    }

    /**
     * Crea una pregunta desde datos serializados
     * @param {Object} data - Datos serializados
     * @returns {Question} Nueva instancia de pregunta
     */
    static deserialize(data) {
        const question = new Question(
            data.text,
            data.answers,
            data.correctIndex,
            data.category,
            data.difficulty
        );
        question.id = data.id;
        question.used = data.used || false;
        return question;
    }

    /**
     * Valida los datos de una pregunta
     * @param {Object} data - Datos a validar
     * @returns {boolean} True si los datos son válidos
     */
    static validate(data) {
        return (
            data &&
            typeof data.text === 'string' &&
            Array.isArray(data.answers) &&
            data.answers.length >= 2 &&
            typeof data.correctIndex === 'number' &&
            data.correctIndex >= 0 &&
            data.correctIndex < data.answers.length &&
            typeof data.category === 'string'
        );
    }

    /**
     * Crea una pregunta de ejemplo
     * @param {string} category - Categoría de la pregunta
     * @returns {Question} Pregunta de ejemplo
     */
    static createExample(category = 'historia') {
        const examples = {
            historia: {
                text: "¿En qué año terminó la Segunda Guerra Mundial?",
                answers: ["1945", "1944", "1946", "1943"],
                correctIndex: 0
            },
            ciencia: {
                text: "¿Cuál es el elemento químico más abundante en el universo?",
                answers: ["Hidrógeno", "Helio", "Oxígeno", "Carbono"],
                correctIndex: 0
            },
            deportes: {
                text: "¿Cada cuántos años se celebran los Juegos Olímpicos?",
                answers: ["4 años", "2 años", "6 años", "3 años"],
                correctIndex: 0
            },
            arte: {
                text: "¿Quién pintó 'La Mona Lisa'?",
                answers: ["Leonardo da Vinci", "Miguel Ángel", "Rafael", "Donatello"],
                correctIndex: 0
            },
            geografia: {
                text: "¿Cuál es la capital de Australia?",
                answers: ["Canberra", "Sídney", "Melbourne", "Perth"],
                correctIndex: 0
            },
            entretenimiento: {
                text: "¿Quién dirigió la película 'El Padrino'?",
                answers: ["Francis Ford Coppola", "Martin Scorsese", "Steven Spielberg", "Woody Allen"],
                correctIndex: 0
            }
        };

        const example = examples[category.toLowerCase()] || examples.historia;
        return new Question(
            example.text,
            example.answers,
            example.correctIndex,
            category,
            'medium'
        );
    }

    /**
     * Obtiene pista para la pregunta (primera letra de la respuesta correcta)
     * @returns {string} Pista de la pregunta
     */
    getHint() {
        const correctAnswer = this.correctAnswer;
        if (typeof correctAnswer === 'string' && correctAnswer.length > 0) {
            return `La respuesta empieza por: ${correctAnswer.charAt(0).toUpperCase()}`;
        }
        return 'No hay pista disponible';
    }

    /**
     * Obtiene estadísticas de la pregunta
     * @returns {Object} Estadísticas de la pregunta
     */
    getStats() {
        return {
            id: this.id,
            category: this.category,
            difficulty: this.difficulty,
            points: this.points,
            timeLimit: this.timeLimit,
            used: this.used,
            length: this.text.length,
            answerCount: this.answers.length
        };
    }

    /**
     * Alterna entre mostrar el texto original y el traducido
     */
    toggleOriginalText() {
        this.showingOriginal = !this.showingOriginal;
        return this.showingOriginal;
    }

    /**
     * Obtiene el texto actual (original o traducido) según el estado
     */
    getCurrentText() {
        return this.showingOriginal ? this.originalText : this.text;
    }

    /**
     * Obtiene las respuestas actuales (originales o traducidas) según el estado
     */
    getCurrentAnswers() {
        return this.showingOriginal ? this.originalAnswers : this.answers;
    }

    /**
     * Verifica si la pregunta fue traducida
     */
    isTranslated() {
        return this.source === 'api' && this.originalText !== this.text;
    }
}
