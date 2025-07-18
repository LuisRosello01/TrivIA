/**
 * Cliente para la API de Open Trivia Database
 * Maneja la obtención de preguntas desde la API externa con fallback local
 * Incluye traducción automática del inglés al español
 */
class ApiClient {
    constructor() {
        this.baseUrl = 'https://opentdb.com/api.php';
        this.sessionToken = null;
        this.fallbackQuestions = null;
        this.translationCache = new Map(); // Cache para traducciones
        this.translationUrl = 'https://api.mymemory.translated.net/get'; // API de traducción
        this.translationEnabled = true; // Por defecto está activada la traducción
        // Mapeo completo de categorías Open Trivia DB (inglés -> español)
        this.categoryMap = {
            // Categorías principales del juego original
            'historia': 23,                    // History
            'ciencia': 17,                     // Science & Nature
            'deportes': 21,                    // Sports
            'arte': 25,                        // Art
            'geografia': 22,                   // Geography
            'entretenimiento': 11,             // Entertainment: Film
            
            // Categorías adicionales disponibles
            'conocimiento-general': 9,         // General Knowledge
            'libros': 10,                      // Entertainment: Books
            'peliculas': 11,                   // Entertainment: Film (alias)
            'musica': 12,                      // Entertainment: Music
            'musicales-teatro': 13,            // Entertainment: Musicals & Theatres
            'television': 14,                  // Entertainment: Television
            'videojuegos': 15,                 // Entertainment: Video Games
            'juegos-mesa': 16,                 // Entertainment: Board Games
            'informatica': 18,                 // Science: Computers
            'matematicas': 19,                 // Science: Mathematics
            'mitologia': 20,                   // Mythology
            'politica': 24,                    // Politics
            'celebridades': 26,                // Celebrities
            'animales': 27,                    // Animals
            'vehiculos': 28,                   // Vehicles
            'comics': 29,                      // Entertainment: Comics
            'gadgets': 30,                     // Science: Gadgets
            'anime-manga': 31,                 // Entertainment: Japanese Anime & Manga
            'animacion': 32                    // Entertainment: Cartoon & Animations
        };
        
        // Mapeo inverso para obtener nombre español desde ID
        this.categoryIdToName = {
            9: 'conocimiento-general',
            10: 'libros',
            11: 'entretenimiento',
            12: 'musica',
            13: 'musicales-teatro',
            14: 'television',
            15: 'videojuegos',
            16: 'juegos-mesa',
            17: 'ciencia',
            18: 'informatica',
            19: 'matematicas',
            20: 'mitologia',
            21: 'deportes',
            22: 'geografia',
            23: 'historia',
            24: 'politica',
            25: 'arte',
            26: 'celebridades',
            27: 'animales',
            28: 'vehiculos',
            29: 'comics',
            30: 'gadgets',
            31: 'anime-manga',
            32: 'animacion'
        };
        
        // Nombres en español para mostrar en la UI
        this.categoryDisplayNames = {
            'conocimiento-general': 'Conocimiento General',
            'historia': 'Historia',
            'ciencia': 'Ciencia y Naturaleza',
            'deportes': 'Deportes',
            'arte': 'Arte',
            'geografia': 'Geografía',
            'entretenimiento': 'Entretenimiento',
            'libros': 'Libros',
            'peliculas': 'Películas',
            'musica': 'Música',
            'musicales-teatro': 'Musicales y Teatro',
            'television': 'Televisión',
            'videojuegos': 'Videojuegos',
            'juegos-mesa': 'Juegos de Mesa',
            'informatica': 'Informática',
            'matematicas': 'Matemáticas',
            'mitologia': 'Mitología',
            'politica': 'Política',
            'celebridades': 'Celebridades',
            'animales': 'Animales',
            'vehiculos': 'Vehículos',
            'comics': 'Cómics',
            'gadgets': 'Gadgets y Tecnología',
            'anime-manga': 'Anime y Manga',
            'animacion': 'Animación'
        };
        this.difficultyMap = {
            'easy': 'easy',
            'medium': 'medium',
            'hard': 'hard'        };
        
        // Sistema de eventos para comunicación con UI
        this.eventHandlers = {};
        
        this.initSession();
        this.loadFallbackQuestions();
    }

    /**
     * Inicializa una sesión con la API para evitar preguntas repetidas
     */
    async initSession() {
        try {
            const response = await fetch('https://opentdb.com/api_token.php?command=request');
            const data = await response.json();
            if (data.response_code === 0) {
                this.sessionToken = data.token;
                console.log('Sesión de API inicializada correctamente');
            }
        } catch (error) {
            console.warn('No se pudo inicializar la sesión de API:', error);
        }
    }

    /**
     * Carga las preguntas de fallback desde el archivo local
     */
    async loadFallbackQuestions() {
        try {
            const response = await fetch('data/fallback-questions.json');
            this.fallbackQuestions = await response.json();
            console.log('Preguntas de fallback cargadas correctamente');
        } catch (error) {
            console.warn('No se pudieron cargar las preguntas de fallback:', error);
            this.generateBasicFallback();
        }
    }

    /**
     * Genera preguntas básicas de fallback si no se puede cargar el archivo
     */
    generateBasicFallback() {
        this.fallbackQuestions = {
            'conocimiento-general': [
                {
                    question: "¿Cuál es el océano más grande del mundo?",
                    answers: ["Pacífico", "Atlántico", "Índico", "Ártico"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿En qué continente se encuentra Egipto?",
                    answers: ["África", "Asia", "Europa", "América"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            historia: [
                {
                    question: "¿En qué año terminó la Segunda Guerra Mundial?",
                    answers: ["1945", "1944", "1946", "1943"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    question: "¿Quién fue el primer presidente de Estados Unidos?",
                    answers: ["George Washington", "Thomas Jefferson", "John Adams", "Benjamin Franklin"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            ciencia: [
                {
                    question: "¿Cuál es el elemento químico más abundante en el universo?",
                    answers: ["Hidrógeno", "Helio", "Oxígeno", "Carbono"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    question: "¿Cuántos huesos tiene el cuerpo humano adulto?",
                    answers: ["206", "195", "215", "187"],
                    correct: 0,
                    difficulty: "hard"
                }
            ],
            deportes: [
                {
                    question: "¿Cada cuántos años se celebran los Juegos Olímpicos?",
                    answers: ["4 años", "2 años", "6 años", "3 años"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿En qué deporte se usa el término 'slam dunk'?",
                    answers: ["Baloncesto", "Voleibol", "Tenis", "Béisbol"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            arte: [
                {
                    question: "¿Quién pintó 'La Mona Lisa'?",
                    answers: ["Leonardo da Vinci", "Miguel Ángel", "Rafael", "Donatello"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿En qué museo se encuentra 'La Guernica' de Picasso?",
                    answers: ["Museo Reina Sofía", "Museo del Prado", "Louvre", "MoMA"],
                    correct: 0,
                    difficulty: "medium"
                }
            ],
            geografia: [
                {
                    question: "¿Cuál es la capital de Australia?",
                    answers: ["Canberra", "Sídney", "Melbourne", "Perth"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    question: "¿Cuál es el río más largo del mundo?",
                    answers: ["Nilo", "Amazonas", "Yangtsé", "Mississippi"],
                    correct: 0,
                    difficulty: "hard"
                }
            ],
            entretenimiento: [
                {
                    question: "¿Quién dirigió la película 'El Padrino'?",
                    answers: ["Francis Ford Coppola", "Martin Scorsese", "Steven Spielberg", "Woody Allen"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    question: "¿Cómo se llama el protagonista de la saga 'Harry Potter'?",
                    answers: ["Harry Potter", "Ron Weasley", "Hermione Granger", "Draco Malfoy"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            informatica: [
                {
                    question: "¿Qué significa 'HTML'?",
                    answers: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyper Transfer Markup Language"],
                    correct: 0,
                    difficulty: "medium"
                },
                {
                    question: "¿Cuál es la extensión de archivo para JavaScript?",
                    answers: [".js", ".java", ".jsx", ".script"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            matematicas: [
                {
                    question: "¿Cuál es el valor de π (pi) aproximadamente?",
                    answers: ["3.14159", "3.15926", "3.12345", "3.16789"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿Cuántos grados tiene un círculo completo?",
                    answers: ["360°", "180°", "90°", "270°"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            musica: [
                {
                    question: "¿Cuántas cuerdas tiene una guitarra estándar?",
                    answers: ["6", "4", "8", "12"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿Quién compuso 'La Novena Sinfonía'?",
                    answers: ["Beethoven", "Mozart", "Bach", "Chopin"],
                    correct: 0,
                    difficulty: "medium"
                }
            ],
            animales: [
                {
                    question: "¿Cuál es el animal terrestre más grande?",
                    answers: ["Elefante africano", "Rinoceronte", "Hipopótamo", "Jirafa"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿Cuántas patas tiene una araña?",
                    answers: ["8", "6", "10", "4"],
                    correct: 0,
                    difficulty: "easy"
                }
            ],
            videojuegos: [
                {
                    question: "¿Cuál es el personaje principal de la saga 'Mario'?",
                    answers: ["Mario", "Luigi", "Peach", "Bowser"],
                    correct: 0,
                    difficulty: "easy"
                },
                {
                    question: "¿En qué año se lanzó el primer 'Tetris'?",
                    answers: ["1984", "1985", "1986", "1987"],
                    correct: 0,
                    difficulty: "medium"
                }
            ]
        };
    }

    /**
     * Configura si la traducción automática está activada
     * @param {boolean} enabled - True para activar traducción, false para desactivar
     */
    setTranslationEnabled(enabled) {
        this.translationEnabled = enabled;
        const status = enabled ? 'activada' : 'desactivada';
        console.log(`🌐 Traducción automática ${status}`);
        
        if (enabled) {
            console.log('Las preguntas de la API se traducirán automáticamente del inglés al español');
        } else {
            console.log('Las preguntas de la API se mostrarán en su idioma original (inglés)');
        }
    }

    /**
     * Obtiene preguntas de la API o del fallback
     * @param {string} category - Categoría de la pregunta
     * @param {string} difficulty - Dificultad de la pregunta
     * @param {number} amount - Número de preguntas a obtener
     * @returns {Promise<Object[]>} Array de preguntas
     */
    async getQuestions(category, difficulty = 'medium', amount = 1) {
        // Intentar obtener de la API primero
        try {
            const apiQuestions = await this.getQuestionsFromAPI(category, difficulty, amount);
            if (apiQuestions && apiQuestions.length > 0) {
                return apiQuestions;
            }
        } catch (error) {
            console.warn('Error al obtener preguntas de la API:', error);
        }

        // Usar fallback si la API falla
        return this.getQuestionsFromFallback(category, difficulty, amount);
    }

    /**
     * Traduce texto del inglés al español usando MyMemory API
     * @param {string} text - Texto a traducir
     * @returns {Promise<string>} Texto traducido
     */
    async translateText(text) {
        // Verificar si ya está en caché
        if (this.translationCache.has(text)) {
            return this.translationCache.get(text);
        }

        try {
            const url = `${this.translationUrl}?q=${encodeURIComponent(text)}&langpair=en|es`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData.translatedText) {
                const translatedText = data.responseData.translatedText;
                // Guardar en caché
                this.translationCache.set(text, translatedText);
                return translatedText;
            } else {
                console.warn('No se pudo traducir el texto:', text);
                return text; // Devolver texto original si falla la traducción
            }
        } catch (error) {
            console.warn('Error al traducir texto:', error);
            return text; // Devolver texto original si hay error
        }
    }

    /**
     * Traduce una pregunta completa (pregunta y respuestas)
     * @param {Object} question - Objeto pregunta con question y answers
     * @returns {Promise<Object>} Pregunta traducida
     */
    async translateQuestion(question) {
        try {
            const translatedQuestion = await this.translateText(question.question);
            const translatedAnswers = await Promise.all(
                question.answers.map(answer => this.translateText(answer))
            );

            return {
                ...question,
                question: translatedQuestion,
                answers: translatedAnswers
            };
        } catch (error) {
            console.warn('Error al traducir pregunta:', error);
            return question; // Devolver pregunta original si hay error
        }
    }

    /**
     * Obtiene preguntas desde la API de Open Trivia Database con traducción automática opcional
     */
    async getQuestionsFromAPI(category, difficulty, amount) {
        const categoryId = this.categoryMap[category.toLowerCase()];
        if (!categoryId) {
            throw new Error(`Categoría no válida: ${category}`);
        }

        let url = `${this.baseUrl}?amount=${amount}&category=${categoryId}&difficulty=${difficulty}&type=multiple`;
        
        if (this.sessionToken) {
            url += `&token=${this.sessionToken}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.response_code !== 0) {
            throw new Error(`Error de API: ${data.response_code}`);
        }        // Procesar preguntas (con o sin traducción)
        const processedQuestions = await Promise.all(
            data.results.map(async (q) => {
                const question = this.decodeHtml(q.question);
                const correctAnswer = this.decodeHtml(q.correct_answer);
                const incorrectAnswers = q.incorrect_answers.map(a => this.decodeHtml(a));
                
                let translatedQuestion = question;
                let translatedCorrectAnswer = correctAnswer;
                let translatedIncorrectAnswers = incorrectAnswers;

                // Traducir solo si está habilitado
                if (this.translationEnabled) {
                    try {
                        // Emitir evento de inicio de traducción
                        this.emit('translationStarted', {
                            question: question,
                            category: category
                        });

                        translatedQuestion = await this.translateText(question);
                        translatedCorrectAnswer = await this.translateText(correctAnswer);
                        translatedIncorrectAnswers = await Promise.all(
                            incorrectAnswers.map(answer => this.translateText(answer))
                        );

                        // Emitir evento de fin de traducción
                        this.emit('translationCompleted', {
                            originalQuestion: question,
                            translatedQuestion: translatedQuestion,
                            category: category
                        });
                    } catch (error) {
                        console.warn('Error en traducción, usando texto original:', error);
                        // Emitir evento de error en traducción
                        this.emit('translationError', {
                            error: error,
                            question: question,
                            category: category
                        });
                        // Mantener texto original si hay error
                    }
                }// Crear arrays con índices para mantener correspondencia
                const allAnswers = [
                    { text: translatedCorrectAnswer, original: correctAnswer, isCorrect: true },
                    ...translatedIncorrectAnswers.map((answer, i) => ({
                        text: answer,
                        original: incorrectAnswers[i],
                        isCorrect: false
                    }))
                ];
                
                // Mezclar manteniendo correspondencia
                const shuffledAnswers = this.shuffleArray(allAnswers);
                const correctIndex = shuffledAnswers.findIndex(answer => answer.isCorrect);

                return {
                    question: translatedQuestion,
                    answers: shuffledAnswers.map(answer => answer.text),
                    correct: correctIndex,
                    difficulty: q.difficulty,
                    category: category,
                    source: 'api',
                    originalQuestion: question,
                    originalAnswers: shuffledAnswers.map(answer => answer.original)
                };
            })
        );

        return processedQuestions;
    }

    /**
     * Obtiene preguntas desde el fallback local
     */
    getQuestionsFromFallback(category, difficulty, amount) {
        if (!this.fallbackQuestions || !this.fallbackQuestions[category.toLowerCase()]) {
            throw new Error(`No hay preguntas de fallback para la categoría: ${category}`);
        }

        const categoryQuestions = this.fallbackQuestions[category.toLowerCase()];
        const filteredQuestions = categoryQuestions.filter(q => 
            !difficulty || q.difficulty === difficulty
        );        if (filteredQuestions.length === 0) {
            // Si no hay preguntas de la dificultad específica, usar cualquiera de la categoría
            return this.shuffleArray(categoryQuestions).slice(0, amount).map(q => ({
                ...q,
                source: 'fallback'
            }));
        }

        return this.shuffleArray(filteredQuestions).slice(0, amount).map(q => ({
            ...q,
            source: 'fallback'
        }));
    }

    /**
     * Decodifica entidades HTML
     */
    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    /**
     * Mezcla un array aleatoriamente
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Resetea el token de sesión para evitar preguntas repetidas
     */
    async resetSession() {
        if (this.sessionToken) {
            try {
                await fetch(`https://opentdb.com/api_token.php?command=reset&token=${this.sessionToken}`);
                console.log('Token de sesión reseteado');
            } catch (error) {
                console.warn('Error al resetear token:', error);
            }
        }
    }

    /**
     * Verifica si la API está disponible
     */
    async checkApiAvailability() {
        try {
            const response = await fetch('https://opentdb.com/api_category.php');
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtiene estadísticas de la base de datos de preguntas
     */
    async getDatabaseStats() {
        try {
            const response = await fetch('https://opentdb.com/api_count_global.php');
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('No se pudieron obtener estadísticas de la base de datos:', error);            return null;
        }
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
     * Obtiene todas las categorías disponibles
     * @returns {Object} Objeto con todas las categorías disponibles
     */
    getAvailableCategories() {
        return {
            // Categorías principales (originales del juego)
            main: ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'],
            
            // Todas las categorías disponibles
            all: Object.keys(this.categoryMap),
            
            // Categorías por grupos temáticos
            entertainment: ['entretenimiento', 'peliculas', 'musica', 'television', 'videojuegos', 'libros', 'comics', 'anime-manga', 'animacion'],
            science: ['ciencia', 'informatica', 'matematicas', 'gadgets'],
            culture: ['historia', 'arte', 'geografia', 'mitologia', 'politica'],
            leisure: ['deportes', 'celebridades', 'animales', 'vehiculos', 'juegos-mesa']
        };
    }

    /**
     * Obtiene el nombre para mostrar de una categoría
     * @param {string} categoryKey - Clave de la categoría
     * @returns {string} Nombre para mostrar
     */
    getCategoryDisplayName(categoryKey) {
        return this.categoryDisplayNames[categoryKey] || categoryKey;
    }

    /**
     * Obtiene la clave de categoría desde un ID de Open Trivia DB
     * @param {number} categoryId - ID de la categoría en Open Trivia DB
     * @returns {string} Clave de la categoría
     */
    getCategoryFromId(categoryId) {
        return this.categoryIdToName[categoryId] || 'conocimiento-general';
    }

    /**
     * Valida si una categoría existe
     * @param {string} category - Nombre de la categoría a validar
     * @returns {boolean} True si la categoría existe
     */
    isValidCategory(category) {
        return this.categoryMap.hasOwnProperty(category.toLowerCase());
    }

    /**
     * Obtiene categorías relacionadas por tema
     * @param {string} category - Categoría base
     * @returns {string[]} Array de categorías relacionadas
     */
    getRelatedCategories(category) {
        const categories = this.getAvailableCategories();
        
        // Buscar en qué grupo temático está la categoría
        for (const [groupName, groupCategories] of Object.entries(categories)) {
            if (groupName !== 'main' && groupName !== 'all' && groupCategories.includes(category)) {
                return groupCategories.filter(cat => cat !== category);
            }
        }
        
        return [];
    }

    /**
     * Obtiene estadísticas de categorías disponibles
     * @returns {Object} Estadísticas de categorías
     */
    getCategoryStats() {
        const allCategories = Object.keys(this.categoryMap);
        const mainCategories = this.getAvailableCategories().main;
        
        return {
            total: allCategories.length,
            main: mainCategories.length,
            additional: allCategories.length - mainCategories.length,
            byTheme: {
                entertainment: this.getAvailableCategories().entertainment.length,
                science: this.getAvailableCategories().science.length,
                culture: this.getAvailableCategories().culture.length,
                leisure: this.getAvailableCategories().leisure.length
            }
        };
    }

    /**
     * Busca categorías por nombre o término
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Object[]} Array de categorías que coinciden con la búsqueda
     */
    searchCategories(searchTerm) {
        const term = searchTerm.toLowerCase();
        const results = [];
        
        for (const [key, displayName] of Object.entries(this.categoryDisplayNames)) {
            if (key.includes(term) || displayName.toLowerCase().includes(term)) {
                results.push({
                    key: key,
                    displayName: displayName,
                    id: this.categoryMap[key]
                });
            }
        }
        
        return results;
    }
}
