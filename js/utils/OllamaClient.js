/**
 * Cliente para integración con Ollama para generar preguntas de trivial
 * Permite generar preguntas dinámicas en español usando modelos LLM locales
 */
class OllamaClient {    constructor(config = {}) {
        // Configuración del servidor (definir primero)
        this.serverConfig = {
            autoDetect: config.autoDetect !== false, // Por defecto activado
            possibleServers: config.possibleServers || [
                'http://localhost:11434',        // Servidor local (fallback)
                'http://192.168.31.88:11434',   // Ejemplo: servidor dedicado
                'http://ollama-server.local:11434', // Ejemplo: hostname local
                // Agregar más IPs según tu red
            ],
            timeout: config.timeout || 5000
        };
        
        // Configuración flexible del servidor (ahora que serverConfig está definido)
        this.baseUrl = config.serverUrl || this.detectServerUrl() || 'http://localhost:11434';
        this.model = config.model || 'llama3.1:8b'; // Modelo por defecto, configurable
        this.isAvailable = false;
        this.cache = new Map(); // Cache para evitar regenerar preguntas similares
        this.maxCacheSize = 100;
          // EXPERIMENTAL: Verificar todas las preguntas con el modelo
        this.enableExperimentalValidation = true;
        
        // Estadísticas de validación experimental
        this.validationStats = {
            totalValidations: 0,
            successfulValidations: 0,
            correctedAnswers: 0,
            regeneratedQuestions: 0,
            validationErrors: 0,
            confidenceDistribution: {
                high: 0,
                medium: 0,
                low: 0
            },
            averageMatchScore: 0,
            matchScores: []
        };
        
        // Mapeo de categorías a temas más específicos
        this.categoryTopics = {
            historia: [
                'historia mundial', 'historia de España', 'historia antigua', 
                'historia medieval', 'historia moderna', 'historia contemporánea',
                'guerras mundiales', 'civilizaciones antiguas', 'descubrimientos'
            ],
            ciencia: [
                'física', 'química', 'biología', 'astronomía', 'matemáticas',
                'medicina', 'geología', 'ecología', 'genética', 'neurociencia'
            ],
            deportes: [
                'fútbol', 'baloncesto', 'tenis', 'atletismo', 'natación',
                'ciclismo', 'motor', 'deportes olímpicos', 'deportes de invierno'
            ],
            arte: [
                'pintura', 'escultura', 'arquitectura', 'música clásica',
                'literatura', 'cine', 'teatro', 'arte moderno', 'arte contemporáneo'
            ],
            geografia: [
                'geografía física', 'geografía política', 'capitales del mundo',
                'ríos y montañas', 'países y continentes', 'clima y ecosistemas'
            ],
            entretenimiento: [
                'cine y televisión', 'música popular', 'videojuegos',
                'celebridades', 'series de TV', 'música moderna', 'cultura pop'
            ]
        };
        
        this.checkAvailability();
    }

    /**
     * Verifica si Ollama está disponible
     */
    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/api/version`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
            });
            
            if (response.ok) {
                this.isAvailable = true;
                console.log('✅ Ollama está disponible');
                
                // Verificar si el modelo está disponible
                await this.checkModelAvailability();
            } else {
                this.isAvailable = false;
                console.warn('⚠️ Ollama no responde correctamente');
            }
        } catch (error) {
            this.isAvailable = false;
            console.warn('⚠️ Ollama no está disponible:', error.message);
        }
    }

    /**
     * Verifica si el modelo especificado está disponible
     */
    async checkModelAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            
            const modelExists = data.models?.some(model => 
                model.name === this.model || model.name.startsWith(this.model.split(':')[0])
            );
            
            if (!modelExists) {
                console.warn(`⚠️ Modelo ${this.model} no encontrado. Modelos disponibles:`, 
                    data.models?.map(m => m.name) || []);
            } else {
                console.log(`✅ Modelo ${this.model} disponible`);
            }
        } catch (error) {
            console.warn('Error verificando modelos disponibles:', error);
        }
    }

    /**
     * Configura el modelo a usar
     */
    setModel(modelName) {
        this.model = modelName;
        console.log(`Modelo configurado: ${this.model}`);
    }

    /**
     * Configura la URL base de Ollama
     */
    setBaseUrl(url) {
        this.baseUrl = url;
        this.checkAvailability();
    }

    /**
     * Detecta automáticamente servidores Ollama disponibles en la red
     */
    detectServerUrl() {
        console.log('🔍 Detectando servidores Ollama en la red...');
        
        // Si la auto-detección está deshabilitada, usar localhost
        if (!this.serverConfig.autoDetect) {
            console.log('⚙️ Auto-detección deshabilitada, usando localhost');
            return 'http://localhost:11434';
        }
        
        // Comenzar detección asíncrona en background
        this.detectAvailableServers();
        
        // Devolver localhost como fallback mientras se detecta
        return 'http://localhost:11434';
    }

    /**
     * Detecta servidores Ollama disponibles de forma asíncrona
     */
    async detectAvailableServers() {
        console.log('🌐 Iniciando detección de servidores Ollama...');
        
        const serverPromises = this.serverConfig.possibleServers.map(async (serverUrl) => {
            try {
                console.log(`🔍 Probando servidor: ${serverUrl}`);
                
                const response = await fetch(`${serverUrl}/api/version`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(this.serverConfig.timeout)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Servidor Ollama encontrado: ${serverUrl} (versión: ${data.version || 'desconocida'})`);
                    
                    return {
                        url: serverUrl,
                        available: true,
                        version: data.version,
                        responseTime: Date.now()
                    };
                } else {
                    console.log(`❌ Servidor no responde correctamente: ${serverUrl} (${response.status})`);
                    return { url: serverUrl, available: false };
                }
            } catch (error) {
                console.log(`❌ Error conectando a ${serverUrl}: ${error.message}`);
                return { url: serverUrl, available: false, error: error.message };
            }
        });

        try {
            const results = await Promise.allSettled(serverPromises);
            const availableServers = results
                .filter(result => result.status === 'fulfilled' && result.value.available)
                .map(result => result.value)
                .sort((a, b) => a.responseTime - b.responseTime); // Ordenar por tiempo de respuesta

            console.log(`📊 Detección completada: ${availableServers.length} servidor(es) disponible(s)`);

            if (availableServers.length > 0) {
                const bestServer = availableServers[0];
                console.log(`🎯 Mejor servidor encontrado: ${bestServer.url} (${bestServer.responseTime}ms)`);
                
                // Cambiar automáticamente al mejor servidor si es diferente al actual
                if (this.baseUrl !== bestServer.url) {
                    console.log(`🔄 Cambiando de ${this.baseUrl} a ${bestServer.url}`);
                    this.baseUrl = bestServer.url;
                    await this.checkAvailability();
                }
            } else {
                console.warn('⚠️ No se encontraron servidores Ollama disponibles en la red');
            }
        } catch (error) {
            console.error('❌ Error durante la detección de servidores:', error);
        }
    }

    /**
     * Configura el servidor Ollama manualmente
     */
    setServer(serverUrl) {
        console.log(`🔧 Configurando servidor Ollama: ${serverUrl}`);
        this.baseUrl = serverUrl;
        this.checkAvailability();
    }

    /**
     * Lista todos los servidores disponibles
     */
    async listAvailableServers() {
        console.log('📋 Listando servidores Ollama disponibles...');
        
        const serverPromises = this.serverConfig.possibleServers.map(async (serverUrl) => {
            try {
                const response = await fetch(`${serverUrl}/api/version`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return {
                        url: serverUrl,
                        available: true,
                        version: data.version || 'desconocida',
                        status: 'online'
                    };
                }
            } catch (error) {
                // Servidor no disponible
            }
            
            return {
                url: serverUrl,
                available: false,
                status: 'offline'
            };
        });

        const results = await Promise.allSettled(serverPromises);
        return results.map(result => 
            result.status === 'fulfilled' ? result.value : { available: false }
        );
    }

    /**
     * Obtiene información del servidor actual
     */
    getServerInfo() {
        return {
            currentServer: this.baseUrl,
            isAvailable: this.isAvailable,
            model: this.model,
            autoDetectEnabled: this.serverConfig.autoDetect,
            possibleServers: this.serverConfig.possibleServers
        };
    }

    /**
     * Genera una pregunta usando Ollama
     */
    async generateQuestion(options = {}) {
        if (!this.isAvailable) {
            throw new Error('Ollama no está disponible');
        }

        const {
            category = 'historia',
            difficulty = 'medium',
            specificTopic = null,
            avoidTopics = [],
            language = 'español'
        } = options;

        // Verificar cache primero
        const cacheKey = this.getCacheKey(category, difficulty, specificTopic);
        if (this.cache.has(cacheKey)) {
            const cachedQuestions = this.cache.get(cacheKey);
            if (cachedQuestions.length > 0) {
                return cachedQuestions.pop(); // Devolver y remover una pregunta del cache
            }
        }

        try {
            const prompt = this.buildPrompt(category, difficulty, specificTopic, avoidTopics, language);
            
            console.log('🤖 Generando pregunta con Ollama...');
            const startTime = Date.now();
              // Intentar generar pregunta con reintentos
            const maxRetries = 3;
            let lastError = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🎯 Generando pregunta (intento ${attempt}/${maxRetries})...`);
                    
                    const response = await fetch(`${this.baseUrl}/api/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: this.model,
                            prompt: prompt,
                            stream: false,
                            options: {
                                temperature: 0.7, // Creatividad moderada
                                top_p: 0.9,
                                top_k: 40,
                                num_predict: 500 // Limitar la respuesta
                            }
                        }),
                        signal: AbortSignal.timeout(30000) // Timeout de 30 segundos
                    });

                    if (!response.ok) {
                        throw new Error(`Error HTTP: ${response.status}`);
                    }

                    const data = await response.json();
                    const generationTime = Date.now() - startTime;
                    
                    console.log(`⚡ Respuesta recibida en ${generationTime}ms`);
                    console.log('📝 Respuesta del modelo:', data.response);                    // Parsear la respuesta del modelo
                    const question = this.parseModelResponse(data.response, category, difficulty);
                    
                    // Validar la pregunta
                    try {
                        await this.validateQuestion(question);
                        console.log(`✅ Pregunta válida generada en intento ${attempt}`);
                        return question;
                    } catch (validationError) {
                        if (validationError.message.includes('regeneración')) {
                            console.warn(`🔄 Pregunta requiere regeneración: ${validationError.message}`);
                            throw validationError; // Esto hará que se reintente la generación
                        }
                        // Si es otro tipo de error de validación, relanzar
                        throw validationError;
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`❌ Intento ${attempt} falló:`, error.message);
                    
                    if (attempt === maxRetries) {
                        console.error('❌ Todos los intentos fallaron');
                        break;
                    }
                    
                    // Pausa antes del siguiente intento
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Si llegamos aquí, todos los intentos fallaron
            throw new Error(`No se pudo generar la pregunta después de ${maxRetries} intentos: ${lastError?.message || 'Error desconocido'}`);
            
        } catch (error) {
            console.error('Error generando pregunta con Ollama:', error);
            throw error; // Re-lanzar el error para mantener la compatibilidad
        }
    }

    /**
     * Construye el prompt para el modelo
     */
    buildPrompt(category, difficulty, specificTopic, avoidTopics, language) {
        // Seleccionar un tema específico si no se proporciona
        const topic = specificTopic || this.getRandomTopic(category);
        
        // Configurar nivel de dificultad
        const difficultyDescriptions = {
            easy: 'básica y accesible para principiantes',
            medium: 'intermedia con conocimientos generales',
            hard: 'avanzada para expertos en el tema'
        };

        const difficultyDescription = difficultyDescriptions[difficulty] || difficultyDescriptions.medium;

        // Construir lista de temas a evitar
        const avoidText = avoidTopics.length > 0 
            ? `\n- NO hagas preguntas sobre: ${avoidTopics.join(', ')}` : '';
        const prompt = `Eres un experto en crear preguntas de trivial educativas y entretenidas.

INSTRUCCIONES:
- Crea una pregunta de trivial sobre ${topic} en ${language}
- Dificultad: ${difficultyDescription}
- Categoría: ${category}
- La pregunta debe ser clara, precisa y tener una respuesta objetiva
- Proporciona exactamente 4 opciones de respuesta (A, B, C, D)
- Solo UNA respuesta debe ser correcta
- Las respuestas incorrectas deben ser plausibles pero claramente erróneas
- Evita preguntas demasiado obvias o demasiado oscuras${avoidText}

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un JSON válido y completo. NO agregues texto antes o después.

{
  "pregunta": "¿Texto de la pregunta aquí?",
  "opciones": [
    "Opción A",
    "Opción B", 
    "Opción C",
    "Opción D"
  ],
  "respuesta_correcta": 0,
  "explicacion": "Breve explicación de por qué esta es la respuesta correcta",
  "tema": "${topic}",
  "dificultad": "${difficulty}"
}

CRÍTICO: 
- El JSON debe estar completo con todas las llaves cerradas
- El índice respuesta_correcta debe ser 0, 1, 2 o 3
- Todas las comillas deben estar balanceadas
- No olvides la llave de cierre final }`;

        return prompt;
    }

    /**
     * Obtiene un tema aleatorio de una categoría
     */
    getRandomTopic(category) {
        const topics = this.categoryTopics[category] || this.categoryTopics.historia;
        return topics[Math.floor(Math.random() * topics.length)];
    }    /**
     * Parsea la respuesta del modelo
     */
    parseModelResponse(response, category, difficulty) {
        try {
            // Limpiar la respuesta: buscar el JSON en el texto
            let jsonText = response.trim();
            
            // Buscar el inicio del JSON
            const jsonStart = jsonText.indexOf('{');
            if (jsonStart === -1) {
                throw new Error('No se encontró JSON válido en la respuesta');
            }
            
            // Extraer desde el inicio del JSON
            jsonText = jsonText.substring(jsonStart);
            
            // Buscar el final del JSON o intentar completarlo
            let jsonEnd = jsonText.lastIndexOf('}') + 1;
            
            if (jsonEnd <= 1) {
                // Si no hay llave de cierre, intentar completar el JSON
                console.warn('JSON incompleto detectado, intentando reparar...');
                
                // Contar llaves abiertas vs cerradas
                let openBraces = 0;
                let closeBraces = 0;
                for (let char of jsonText) {
                    if (char === '{') openBraces++;
                    if (char === '}') closeBraces++;
                }
                
                // Agregar llaves de cierre faltantes
                const missingBraces = openBraces - closeBraces;
                if (missingBraces > 0) {
                    jsonText += '}'.repeat(missingBraces);
                }
            } else {
                jsonText = jsonText.substring(0, jsonEnd);
            }
            
            // Intentar parsear el JSON (posiblemente reparado)
            let questionData;
            try {
                questionData = JSON.parse(jsonText);
            } catch (parseError) {
                // Si falla, intentar limpiar y reparar más agresivamente
                console.warn('Primera tentativa de parseo falló, limpiando JSON...');
                
                // Remover posibles caracteres problemáticos al final
                jsonText = jsonText.replace(/,\s*([}\]])/, '$1'); // Remover comas finales
                jsonText = jsonText.replace(/(["\w])\s*$/, '$1}'); // Agregar } si termina abruptamente
                
                questionData = JSON.parse(jsonText);
            }
            
            // Validar estructura básica
            if (!questionData.pregunta || !questionData.opciones || !Array.isArray(questionData.opciones)) {
                throw new Error('Estructura de pregunta inválida');
            }
            
            if (questionData.opciones.length !== 4) {
                throw new Error('Se requieren exactamente 4 opciones de respuesta');
            }
            
            if (typeof questionData.respuesta_correcta !== 'number' || 
                questionData.respuesta_correcta < 0 || 
                questionData.respuesta_correcta > 3) {
                throw new Error('Índice de respuesta correcta inválido');
            }
            
            // Crear objeto Question compatible
            const question = {
                text: questionData.pregunta,
                answers: questionData.opciones,
                correctIndex: questionData.respuesta_correcta,
                category: category,
                difficulty: difficulty,
                source: 'ollama',
                explanation: questionData.explicacion || '',
                topic: questionData.tema || '',
                generatedAt: Date.now()
            };
            
            return question;
            
        } catch (error) {
            console.error('Error parseando respuesta del modelo:', error);
            console.log('Respuesta del modelo:', response);
            throw new Error(`No se pudo parsear la respuesta del modelo: ${error.message}`);
        }
    }    /**
     * Valida que la pregunta generada sea correcta
     */
    async validateQuestion(question) {
        // Verificar que el texto de la pregunta no esté vacío
        if (!question.text || question.text.trim().length < 10) {
            throw new Error('La pregunta es demasiado corta');
        }
        
        // Verificar que todas las respuestas sean diferentes
        const uniqueAnswers = new Set(question.answers.map(a => a.toLowerCase().trim()));
        if (uniqueAnswers.size !== 4) {
            throw new Error('Las respuestas deben ser todas diferentes');
        }
        
        // Verificar que las respuestas no estén vacías
        if (question.answers.some(answer => !answer || answer.trim().length < 1)) {
            throw new Error('Todas las respuestas deben tener contenido');
        }
          // Verificar que la respuesta correcta no sea obvia
        const questionLower = question.text.toLowerCase();
        const correctAnswer = question.answers[question.correctIndex].toLowerCase();
        
        if (questionLower.includes(correctAnswer) && correctAnswer.length > 3) {
            console.warn('⚠️ La respuesta correcta puede estar contenida en la pregunta');
        }
        
        // Validar coherencia entre pregunta, respuesta y explicación
        await this.validateQuestionCoherence(question);
        
        console.log('✅ Pregunta validada correctamente');
    }    /**
     * Valida la coherencia entre pregunta, respuesta correcta y explicación
     */
    async validateQuestionCoherence(question) {
        console.log('🔍 DEBUG: === INICIANDO VALIDACIÓN DE COHERENCIA ===');
        
        const questionText = question.text.toLowerCase();
        const correctAnswer = question.answers[question.correctIndex];
        const explanation = question.explanation?.toLowerCase() || '';
        
        console.log('❓ DEBUG: Pregunta:', question.text);
        console.log('✔️ DEBUG: Respuesta correcta seleccionada:', correctAnswer, `(índice ${question.correctIndex})`);
        console.log('💬 DEBUG: Explicación:', question.explanation);        // EXPERIMENTAL: Verificar SIEMPRE con el modelo si está habilitado
        if (this.enableExperimentalValidation) {
            console.log('🧪 DEBUG: VALIDACIÓN EXPERIMENTAL ACTIVADA - Verificando con modelo (máxima precisión)...');
            
            try {
                // Incrementar contador de validaciones totales
                this.validationStats.totalValidations++;
                
                const fullValidation = await this.verifyQuestionWithModel(question);
                
                // Registrar estadísticas de confianza y coincidencia
                this.updateValidationStats(fullValidation);
                
                if (fullValidation.suggestedIndex !== null && fullValidation.suggestedIndex !== question.correctIndex) {
                    console.warn('⚠️ EXPERIMENTAL: El modelo sugiere una respuesta diferente');
                    console.warn(`   Respuesta actual: ${question.correctIndex} (${fullValidation.originalAnswer})`);
                    console.warn(`   Respuesta del modelo: "${fullValidation.modelAnswer}"`);
                    console.warn(`   Mejor coincidencia: ${fullValidation.suggestedIndex} (${question.answers[fullValidation.suggestedIndex]})`);
                    console.warn(`   Confianza del modelo: ${fullValidation.confidence}`);
                    console.warn(`   Puntuación de coincidencia: ${fullValidation.matchScore}`);
                    console.warn(`   Razón: ${fullValidation.reason}`);
                    
                    // Solo aplicar corrección si la confianza es alta o media Y la coincidencia es buena
                    if ((fullValidation.confidence === 'high' || fullValidation.confidence === 'medium') && 
                        fullValidation.matchScore >= 0.7) {
                        console.log('🔧 EXPERIMENTAL: Aplicando corrección del modelo (confianza y coincidencia suficientes)');
                        
                        // Incrementar contador de respuestas corregidas
                        this.validationStats.correctedAnswers++;
                        
                        // Aplicar corrección experimental
                        const correction = {
                            oldIndex: question.correctIndex,
                            newIndex: fullValidation.suggestedIndex,
                            explanation: question.explanation + ` (EXPERIMENTAL: Corregido por verificación pura del modelo - ${fullValidation.reason}. Confianza: ${fullValidation.confidence}, Coincidencia: ${fullValidation.matchScore.toFixed(2)})`
                        };
                        
                        question.correctIndex = correction.newIndex;
                        question.explanation = correction.explanation;
                        
                        // Marcar como validación exitosa después de corrección
                        this.validationStats.successfulValidations++;
                    } else {
                        console.warn('⚠️ EXPERIMENTAL: Confianza baja o coincidencia insuficiente, no se aplica corrección automática');
                        console.warn(`   Se requiere revisión manual de la pregunta`);
                        
                        // Contar como validación exitosa pero sin corrección
                        this.validationStats.successfulValidations++;
                    }
                    
                    return; // Salir temprano, ya se validó experimentalmente
                } else {
                    console.log('✅ EXPERIMENTAL: Modelo confirma que la respuesta es correcta');
                    console.log(`   Confianza: ${fullValidation.confidence}`);
                    console.log(`   Puntuación de coincidencia: ${fullValidation.matchScore}`);
                    
                    // Marcar como validación exitosa
                    this.validationStats.successfulValidations++;
                }
            } catch (error) {
                if (error.message.includes('REGENERATE_QUESTION')) {
                    console.error('🔄 REGENERACIÓN REQUERIDA: La respuesta del modelo no coincide con las opciones');
                    
                    // Incrementar contador de regeneraciones
                    this.validationStats.regeneratedQuestions++;
                    
                    throw new Error('La pregunta requiere regeneración: respuesta del modelo no coincide con opciones disponibles');
                }
                console.error('❌ Error en validación experimental:', error.message);
                
                // Incrementar contador de errores de validación
                this.validationStats.validationErrors++;
                
                // Continuar con validación tradicional si falla la experimental
            }
        }
          // Continuar con validaciones específicas de patrones (como backup)
        const problematicPatterns = [
            // Fechas incorrectas
            {
                pattern: /¿en qué año.*?(tratado|guerra|revolución|independencia|golpe|muerte)/,
                validator: (q, answer, exp) => this.validateHistoricalDate(q, answer, exp),
                description: 'Fecha histórica'
            },
            // Geografía incorrecta
            {
                pattern: /¿(cuál|dónde).*?(capital|país|continente|río|montaña)/,
                validator: (q, answer, exp) => this.validateGeographicalFact(q, answer, exp),
                description: 'Dato geográfico'
            },
            // Datos científicos
            {
                pattern: /¿(cuál|qué).*?(elemento|fórmula|teoría|ley)/,
                validator: (q, answer, exp) => this.validateScientificFact(q, answer, exp),
                description: 'Dato científico'
            },
            // Música y entretenimiento
            {
                pattern: /¿(quién|cuál).*?(cantó|interpretó|canción|álbum|artista|banda)/,
                validator: (q, answer, exp) => this.validateMusicEntertainmentFact(q, answer, exp),
                description: 'Música/Entretenimiento'
            }
        ];

        let patternMatched = false;
        
        for (const pattern of problematicPatterns) {
            console.log(`🔍 DEBUG: Evaluando patrón: ${pattern.description}`);
            console.log(`📝 DEBUG: Regex: ${pattern.pattern}`);
            
            if (pattern.pattern.test(questionText)) {
                console.log(`✅ DEBUG: PATRÓN COINCIDE - ${pattern.description}`);
                patternMatched = true;
                
                const isValid = await pattern.validator(questionText, correctAnswer, explanation);
                console.log(`📊 DEBUG: Resultado de validación: ${isValid}`);
                
                if (!isValid) {
                    console.warn(`⚠️ INCOHERENCIA CONFIRMADA en ${pattern.description}`);
                    console.warn(`   Pregunta: ${question.text}`);
                    console.warn(`   Respuesta seleccionada: ${correctAnswer}`);
                    console.warn(`   Explicación: ${question.explanation}`);
                    
                    // Intentar corregir automáticamente
                    console.log('🔧 DEBUG: Intentando corrección automática...');
                    const correction = await this.attemptAutoCorrection(question);
                    
                    if (correction) {
                        console.log(`🔧 Corrección automática aplicada: índice ${correction.oldIndex} → ${correction.newIndex}`);
                        console.log(`📝 Nueva explicación: ${correction.explanation}`);
                        question.correctIndex = correction.newIndex;
                        question.explanation = correction.explanation;
                    } else {
                        console.error('❌ No se pudo corregir automáticamente');
                        throw new Error(`Incoherencia detectada: La respuesta "${correctAnswer}" no coincide con la explicación proporcionada`);
                    }
                } else {
                    console.log(`✅ DEBUG: Validación OK para ${pattern.description}`);
                }
                break;
            } else {
                console.log(`❌ DEBUG: Patrón no coincide - ${pattern.description}`);
            }
        }
        
        if (!patternMatched && !this.enableExperimentalValidation) {
            console.log('ℹ️ DEBUG: Ningún patrón problemático detectado, pregunta considerada válida');
        }
        
        console.log('🔍 DEBUG: === VALIDACIÓN DE COHERENCIA COMPLETADA ===');
    }/**
     * Valida fechas históricas
     */
    async validateHistoricalDate(questionText, answer, explanation) {
        console.log('📅 DEBUG: Validando fecha histórica...');
        console.log('❓ DEBUG: Pregunta:', questionText);
        console.log('✔️ DEBUG: Respuesta:', answer);
        console.log('💬 DEBUG: Explicación:', explanation);
        
        // Buscar años mencionados en la explicación
        const yearMatches = explanation.match(/\b(19|20)\d{2}\b/g) || [];
        const answerYear = answer.match(/\b(19|20)\d{2}\b/);
        
        console.log('🔍 DEBUG: Años encontrados en explicación:', yearMatches);
        console.log('🎯 DEBUG: Año en respuesta:', answerYear);
        
        if (yearMatches.length > 0 && answerYear) {
            const explainedYear = yearMatches[0];
            const selectedYear = answerYear[0];
            
            console.log(`📊 DEBUG: Comparando años - Explicación: ${explainedYear}, Respuesta: ${selectedYear}`);
            
            // Si los años no coinciden, es probable que haya un error
            if (explainedYear !== selectedYear) {
                console.warn(`⚠️ INCOHERENCIA DETECTADA: explicación menciona ${explainedYear}, pero respuesta es ${selectedYear}`);
                
                // Usar el modelo para verificar cuál es la fecha correcta
                console.log('🤖 DEBUG: Iniciando verificación con modelo...');
                const verification = await this.verifyFactWithModel(questionText, answer, explanation);
                
                console.log('📋 DEBUG: Resultado de verificación:', verification);
                
                if (!verification.isCorrect) {
                    console.warn(`🤖 Verificación del modelo CONFIRMÓ error: ${verification.explanation}`);
                    return false;
                } else {
                    console.log('🤖 DEBUG: Modelo validó que la respuesta es correcta a pesar de la diferencia');
                }
            } else {
                console.log('✅ DEBUG: Años coinciden, fecha válida');
            }
        } else {
            console.log('ℹ️ DEBUG: No se encontraron años para comparar o formato no válido');
        }
        
        return true;
    }/**
     * Valida datos geográficos
     */
    async validateGeographicalFact(questionText, answer, explanation) {
        // Verificar si la respuesta está mencionada en la explicación
        const answerInExplanation = explanation.includes(answer.toLowerCase());
        
        if (!answerInExplanation && explanation.length > 10) {
            console.warn(`⚠️ Respuesta geográfica "${answer}" no se menciona en la explicación`);
            
            // Usar el modelo para verificar el dato geográfico
            const verification = await this.verifyFactWithModel(questionText, answer, explanation);
            if (!verification.isCorrect) {
                console.warn(`🤖 Verificación del modelo: ${verification.explanation}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Valida datos científicos
     */
    async validateScientificFact(questionText, answer, explanation) {
        // Verificar coherencia básica entre respuesta y explicación
        const answerWords = answer.toLowerCase().split(/\s+/);
        const explanationContainsAnswer = answerWords.some(word => 
            word.length > 2 && explanation.includes(word)
        );
        
        if (!explanationContainsAnswer && explanation.length > 10) {
            console.warn(`⚠️ Respuesta científica "${answer}" no se refleja en la explicación`);
            
            // Usar el modelo para verificar el dato científico
            const verification = await this.verifyFactWithModel(questionText, answer, explanation);
            if (!verification.isCorrect) {
                console.warn(`🤖 Verificación del modelo: ${verification.explanation}`);
                return false;
            }
        }
          return true;
    }

    /**
     * Valida datos de música y entretenimiento
     */
    async validateMusicEntertainmentFact(questionText, answer, explanation) {
        console.log('🎵 DEBUG: Validando dato de música/entretenimiento...');
        console.log('❓ DEBUG: Pregunta:', questionText);
        console.log('✔️ DEBUG: Respuesta:', answer);
        console.log('💬 DEBUG: Explicación:', explanation);
        
        // Verificar si la respuesta está mencionada en la explicación
        const answerLower = answer.toLowerCase();
        const explanationLower = explanation.toLowerCase();
        
        // Para artistas, bandas, canciones, etc.
        const answerWords = answerLower.split(/\s+/).filter(word => word.length > 2);
        const explanationContainsAnswer = answerWords.some(word => 
            explanationLower.includes(word)
        );
        
        console.log(`🔍 DEBUG: Palabras de la respuesta: ${answerWords}`);
        console.log(`📊 DEBUG: ¿Explicación contiene respuesta?: ${explanationContainsAnswer}`);
        
        if (!explanationContainsAnswer && explanation.length > 10) {
            console.warn(`⚠️ Respuesta de entretenimiento "${answer}" no se menciona en la explicación`);
            
            // Usar el modelo para verificar el dato de entretenimiento
            console.log('🤖 DEBUG: Iniciando verificación con modelo para entretenimiento...');
            const verification = await this.verifyFactWithModel(questionText, answer, explanation);
            
            console.log('📋 DEBUG: Resultado de verificación de entretenimiento:', verification);
            
            if (!verification.isCorrect) {
                console.warn(`🤖 Verificación del modelo CONFIRMÓ error: ${verification.explanation}`);
                return false;
            } else {
                console.log('🤖 DEBUG: Modelo validó que la respuesta de entretenimiento es correcta');
            }
        } else {
            console.log('✅ DEBUG: Respuesta de entretenimiento válida');
        }
        
        return true;
    }    /**
     * Intenta corregir automáticamente errores detectados
     */
    async attemptAutoCorrection(question) {
        console.log('🔧 DEBUG: Iniciando corrección automática...');
        console.log('📋 DEBUG: Pregunta a corregir:', question);
        
        const explanation = question.explanation?.toLowerCase() || '';
        
        // Buscar en la explicación pistas sobre cuál debería ser la respuesta correcta
        for (let i = 0; i < question.answers.length; i++) {
            const answer = question.answers[i].toLowerCase();
            console.log(`🔍 DEBUG: Evaluando opción ${i}: "${question.answers[i]}"`);
            
            // Para fechas: verificar si el año está en la explicación
            const yearMatch = answer.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                const year = yearMatch[0];
                console.log(`📅 DEBUG: Encontrado año en opción ${i}: ${year}`);
                
                if (explanation.includes(year)) {
                    console.log(`✅ DEBUG: Año ${year} encontrado en explicación - CORRECCIÓN APLICADA`);
                    const correction = {
                        oldIndex: question.correctIndex,
                        newIndex: i,
                        explanation: question.explanation + ` (Corregido automáticamente: el año correcto es ${question.answers[i]})`
                    };
                    console.log('🎯 DEBUG: Corrección generada:', correction);
                    return correction;
                }
            }
            
            // Para otros casos: verificar si la respuesta está mencionada explícitamente
            if (explanation.includes(answer) && answer.length > 3) {
                console.log(`🔍 DEBUG: Respuesta "${answer}" encontrada en explicación`);
                
                // Verificar que no sea una coincidencia casual
                const context = explanation.substring(
                    Math.max(0, explanation.indexOf(answer) - 20),
                    explanation.indexOf(answer) + answer.length + 20
                );
                
                console.log(`📝 DEBUG: Contexto de "${answer}": "${context}"`);
                
                // Si aparece en un contexto que sugiere que es la respuesta correcta
                if (context.includes('es') || context.includes('fue') || context.includes('se')) {
                    console.log(`✅ DEBUG: Contexto válido para "${answer}" - CORRECCIÓN APLICADA`);
                    const correction = {
                        oldIndex: question.correctIndex,
                        newIndex: i,
                        explanation: question.explanation + ` (Corregido automáticamente: la respuesta correcta es ${question.answers[i]})`
                    };
                    console.log('🎯 DEBUG: Corrección generada:', correction);
                    return correction;
                }
            }
        }
        
        // Si no se puede corregir automáticamente, usar el modelo para verificar
        console.log('🤖 DEBUG: Corrección automática falló, usando verificación del modelo...');
        const modelVerification = await this.verifyQuestionWithModel(question);
        
        if (modelVerification.suggestedIndex !== null) {
            console.log(`✅ DEBUG: Modelo sugiere corrección a índice ${modelVerification.suggestedIndex}`);
            const correction = {
                oldIndex: question.correctIndex,
                newIndex: modelVerification.suggestedIndex,
                explanation: question.explanation + ` (Corregido por verificación del modelo: ${modelVerification.reason})`
            };
            console.log('🎯 DEBUG: Corrección del modelo generada:', correction);
            return correction;
        }
        
        console.log('❌ DEBUG: No se pudo generar corrección automática');
        return null;
    }/**
     * Verifica un dato específico usando el modelo
     */
    async verifyFactWithModel(questionText, answer, explanation) {
        try {
            const verificationPrompt = `Eres un experto verificador de datos. Analiza la siguiente información y determina si es correcta:

PREGUNTA: ${questionText}
RESPUESTA PROPUESTA: ${answer}
EXPLICACIÓN: ${explanation}

Verifica si la respuesta propuesta es correcta según la explicación dada. Responde ÚNICAMENTE con un JSON:

{
  "is_correct": true/false,
  "explanation": "Breve explicación de por qué es correcta o incorrecta",
  "correct_answer": "La respuesta correcta si la propuesta es incorrecta"
}`;

            console.log('🔍 DEBUG: Verificando dato específico con modelo...');
            console.log('📋 Prompt enviado:', verificationPrompt);

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: verificationPrompt,
                    stream: false,
                    options: {
                        temperature: 0.1, // Muy baja para respuestas precisas
                        top_p: 0.8,
                        top_k: 20
                    }
                }),
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                console.warn('❌ DEBUG: Error HTTP en verificación del modelo:', response.status);
                return { isCorrect: true }; // Asumir correcto si no se puede verificar
            }

            const data = await response.json();
            console.log('📝 DEBUG: Respuesta cruda del modelo:', data.response);
            
            const verification = this.parseVerificationResponse(data.response);
            console.log('🔧 DEBUG: Respuesta parseada:', verification);
            
            const result = {
                isCorrect: verification.is_correct,
                explanation: verification.explanation,
                correctAnswer: verification.correct_answer
            };
            
            console.log('✅ DEBUG: Resultado final de verificación:', result);
            return result;

        } catch (error) {
            console.error('❌ DEBUG: Error verificando con modelo:', error.message);
            console.error('🔍 DEBUG: Stack trace:', error.stack);
            return { isCorrect: true }; // Asumir correcto si hay error
        }
    }    /**
     * Verifica toda la pregunta usando el modelo
     */
    async verifyQuestionWithModel(question) {
        try {
            const verificationPrompt = `Eres un experto en trivial. Responde únicamente basándote en tu conocimiento:

PREGUNTA: ${question.text}

Proporciona la respuesta correcta a esta pregunta. Responde ÚNICAMENTE con un JSON:

{
  "answer": "La respuesta correcta exacta",
  "confidence": "high/medium/low",
  "reason": "Breve explicación de por qué esta es la respuesta correcta"
}

IMPORTANTE: Proporciona solo la respuesta factual correcta sin ver las opciones múltiples.`;

            console.log('🔍 DEBUG: Verificando pregunta sin mostrar opciones (máxima precisión)...');
            console.log('📋 Prompt de verificación pura:', verificationPrompt);

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: verificationPrompt,
                    stream: false,
                    options: {
                        temperature: 0.1,
                        top_p: 0.8,
                        top_k: 20
                    }
                }),
                signal: AbortSignal.timeout(20000)
            });

            if (!response.ok) {
                console.warn('❌ DEBUG: Error HTTP en verificación completa:', response.status);
                return { suggestedIndex: null, reason: 'Error en verificación' };
            }            const data = await response.json();
            console.log('📝 DEBUG: Respuesta cruda de verificación pura:', data.response);
            
            const verification = this.parseVerificationResponse(data.response);
            console.log('🔧 DEBUG: Verificación pura parseada:', verification);
            
            // Buscar qué opción coincide mejor con la respuesta del modelo
            const modelAnswer = verification.answer?.toLowerCase().trim() || '';
            console.log(`🎯 DEBUG: Respuesta del modelo: "${modelAnswer}"`);
            
            let bestMatchIndex = -1;
            let bestMatchScore = 0;
            
            // Comparar cada opción con la respuesta del modelo
            for (let i = 0; i < question.answers.length; i++) {
                const option = question.answers[i].toLowerCase().trim();
                console.log(`🔍 DEBUG: Comparando opción ${i}: "${option}"`);
                
                // Calcular similitud
                const score = this.calculateAnswerSimilarity(modelAnswer, option);
                console.log(`📊 DEBUG: Puntuación de similitud: ${score}`);
                
                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatchIndex = i;
                }
            }
            
            console.log(`🎯 DEBUG: Mejor coincidencia: opción ${bestMatchIndex} con puntuación ${bestMatchScore}`);
            
            // Si no hay una coincidencia suficientemente buena, regenerar pregunta
            if (bestMatchScore < 0.6) {
                console.error(`❌ REGENERACIÓN REQUERIDA: La respuesta del modelo "${modelAnswer}" no coincide suficientemente con ninguna opción (mejor puntuación: ${bestMatchScore})`);
                throw new Error('REGENERATE_QUESTION: Model answer does not match any option sufficiently');
            }
            
            const originalIndex = question.correctIndex;
            const modelSuggestedIndex = bestMatchIndex;
            
            console.log(`🎯 DEBUG: Comparación final:`);
            console.log(`   Respuesta original: ${originalIndex} (${question.answers[originalIndex]})`);
            console.log(`   Respuesta del modelo: ${modelSuggestedIndex} (${question.answers[modelSuggestedIndex]})`);
            console.log(`   Confianza del modelo: ${verification.confidence || 'no especificada'}`);
            console.log(`   Puntuación de coincidencia: ${bestMatchScore}`);
            
            const result = {
                suggestedIndex: modelSuggestedIndex !== originalIndex ? modelSuggestedIndex : null,
                reason: verification.reason,
                confidence: verification.confidence || 'medium',
                modelAnswer: verification.answer,
                originalAnswer: question.answers[originalIndex],
                matchScore: bestMatchScore,
                regenerateRequired: false
            };
            
            if (result.suggestedIndex !== null) {
                console.warn(`⚠️ DISCREPANCIA: Modelo sugiere respuesta diferente`);
                console.warn(`   Original: ${originalIndex} → Modelo: ${modelSuggestedIndex}`);
                console.warn(`   Confianza: ${result.confidence}`);
                console.warn(`   Coincidencia: ${bestMatchScore}`);
            } else {
                console.log(`✅ CONCORDANCIA: Modelo confirma respuesta original`);
                console.log(`   Coincidencia: ${bestMatchScore}`);
            }
            
            console.log('✅ DEBUG: Resultado de verificación pura:', result);
            return result;        } catch (error) {
            console.error('❌ DEBUG: Error verificando pregunta completa:', error.message);
            console.error('🔍 DEBUG: Stack trace completo:', error.stack);
            
            // Si es un error de regeneración, propagarlo
            if (error.message.includes('REGENERATE_QUESTION')) {
                throw error;
            }
            
            return { suggestedIndex: null, reason: 'Error en verificación' };
        }
    }

    /**
     * Calcula la similitud entre la respuesta del modelo y una opción
     */
    calculateAnswerSimilarity(modelAnswer, option) {
        if (!modelAnswer || !option) return 0;
        
        const model = modelAnswer.toLowerCase().trim();
        const opt = option.toLowerCase().trim();
        
        // Coincidencia exacta
        if (model === opt) return 1.0;
        
        // Calcular similitud por palabras clave
        const modelWords = model.split(/\s+/).filter(word => word.length > 2);
        const optionWords = opt.split(/\s+/).filter(word => word.length > 2);
        
        if (modelWords.length === 0 || optionWords.length === 0) {
            return 0;
        }
        
        // Contar palabras en común
        let commonWords = 0;
        for (const word of modelWords) {
            if (optionWords.some(optWord => 
                optWord.includes(word) || word.includes(optWord) || 
                this.levenshteinDistance(word, optWord) <= 1
            )) {
                commonWords++;
            }
        }
        
        // Calcular puntuación basada en palabras comunes
        const score = commonWords / Math.max(modelWords.length, optionWords.length);
        
        // Bonificación si la opción contiene la respuesta del modelo o viceversa
        if (opt.includes(model) || model.includes(opt)) {
            return Math.max(score, 0.8);
        }
        
        // Para años y números, verificar coincidencia numérica
        const modelNumbers = model.match(/\d+/g) || [];
        const optionNumbers = opt.match(/\d+/g) || [];
        
        if (modelNumbers.length > 0 && optionNumbers.length > 0) {
            const numberMatch = modelNumbers.some(num => optionNumbers.includes(num));
            if (numberMatch) {
                return Math.max(score, 0.9);
            }
        }
        
        return score;
    }

    /**
     * Calcula la distancia de Levenshtein entre dos strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
          return matrix[str2.length][str1.length];
    }

    /**
     * Actualiza las estadísticas de validación experimental
     */
    updateValidationStats(validationResult) {
        if (!validationResult) return;
        
        // Actualizar distribución de confianza
        const confidence = validationResult.confidence || 'medium';
        if (this.validationStats.confidenceDistribution[confidence] !== undefined) {
            this.validationStats.confidenceDistribution[confidence]++;
        }
        
        // Actualizar puntuaciones de coincidencia
        const matchScore = validationResult.matchScore || 0;
        this.validationStats.matchScores.push(matchScore);
        
        // Recalcular promedio de puntuación de coincidencia
        this.validationStats.averageMatchScore = 
            this.validationStats.matchScores.reduce((sum, score) => sum + score, 0) / 
            this.validationStats.matchScores.length;
        
        console.log(`📊 DEBUG: Estadísticas actualizadas - Confianza: ${confidence}, Coincidencia: ${matchScore.toFixed(2)}`);
    }

    /**
     * Reinicia las estadísticas de validación
     */
    resetValidationStats() {
        this.validationStats = {
            totalValidations: 0,
            successfulValidations: 0,
            correctedAnswers: 0,
            regeneratedQuestions: 0,
            validationErrors: 0,
            confidenceDistribution: {
                high: 0,
                medium: 0,
                low: 0
            },
            averageMatchScore: 0,
            matchScores: []
        };
        console.log('📊 Estadísticas de validación reiniciadas');
    }

    /**
     * Obtiene un resumen detallado de las estadísticas de validación
     */
    getValidationStatsReport() {
        const stats = this.validationStats;
        const total = stats.totalValidations;
        
        if (total === 0) {
            return {
                summary: 'No se han realizado validaciones experimentales aún',
                details: stats
            };
        }
        
        const successRate = ((stats.successfulValidations / total) * 100).toFixed(1);
        const correctionRate = ((stats.correctedAnswers / total) * 100).toFixed(1);
        const regenerationRate = ((stats.regeneratedQuestions / total) * 100).toFixed(1);
        const errorRate = ((stats.validationErrors / total) * 100).toFixed(1);
        
        const report = {
            summary: `Validaciones: ${total} | Éxito: ${successRate}% | Correcciones: ${correctionRate}% | Regeneraciones: ${regenerationRate}%`,
            details: {
                totalValidations: total,
                successfulValidations: stats.successfulValidations,
                correctedAnswers: stats.correctedAnswers,
                regeneratedQuestions: stats.regeneratedQuestions,
                validationErrors: stats.validationErrors,
                rates: {
                    successRate: `${successRate}%`,
                    correctionRate: `${correctionRate}%`,
                    regenerationRate: `${regenerationRate}%`,
                    errorRate: `${errorRate}%`
                },
                confidence: {
                    high: stats.confidenceDistribution.high,
                    medium: stats.confidenceDistribution.medium,
                    low: stats.confidenceDistribution.low,
                    highPercentage: total > 0 ? `${((stats.confidenceDistribution.high / total) * 100).toFixed(1)}%` : '0%',
                    mediumPercentage: total > 0 ? `${((stats.confidenceDistribution.medium / total) * 100).toFixed(1)}%` : '0%',
                    lowPercentage: total > 0 ? `${((stats.confidenceDistribution.low / total) * 100).toFixed(1)}%` : '0%'
                },
                matchScore: {
                    average: stats.averageMatchScore.toFixed(3),
                    samples: stats.matchScores.length,
                    min: stats.matchScores.length > 0 ? Math.min(...stats.matchScores).toFixed(3) : '0',
                    max: stats.matchScores.length > 0 ? Math.max(...stats.matchScores).toFixed(3) : '0'
                }
            }
        };
          return report;
    }

    /**
     * Muestra las estadísticas de validación en la consola de forma visual
     */
    logValidationStats() {
        const report = this.getValidationStatsReport();
        
        console.log('\n📊 ═══ ESTADÍSTICAS DE VALIDACIÓN EXPERIMENTAL ═══');
        console.log(`📈 ${report.summary}`);
        
        if (report.details.totalValidations > 0) {
            console.log('\n📋 DETALLES:');
            console.log(`   ✅ Validaciones exitosas: ${report.details.successfulValidations}/${report.details.totalValidations} (${report.details.rates.successRate})`);
            console.log(`   🔧 Respuestas corregidas: ${report.details.correctedAnswers} (${report.details.rates.correctionRate})`);
            console.log(`   🔄 Preguntas regeneradas: ${report.details.regeneratedQuestions} (${report.details.rates.regenerationRate})`);
            console.log(`   ❌ Errores de validación: ${report.details.validationErrors} (${report.details.rates.errorRate})`);
            
            console.log('\n🎯 DISTRIBUCIÓN DE CONFIANZA:');
            console.log(`   🔥 Alta: ${report.details.confidence.high} (${report.details.confidence.highPercentage})`);
            console.log(`   ⚡ Media: ${report.details.confidence.medium} (${report.details.confidence.mediumPercentage})`);
            console.log(`   💧 Baja: ${report.details.confidence.low} (${report.details.confidence.lowPercentage})`);
            
            console.log('\n🎲 PUNTUACIONES DE COINCIDENCIA:');
            console.log(`   📊 Promedio: ${report.details.matchScore.average}`);
            console.log(`   📈 Máxima: ${report.details.matchScore.max}`);
            console.log(`   📉 Mínima: ${report.details.matchScore.min}`);
            console.log(`   🔢 Muestras: ${report.details.matchScore.samples}`);
        }
        
        console.log('═══════════════════════════════════════════════════\n');
    }    /**
     * Lista modelos disponibles en el servidor
     */
    async listAvailableModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.warn('Error obteniendo modelos disponibles:', error);
            return [];
        }
    }

    /**
     * Obtiene estadísticas del sistema
     */
    getStats() {
        return {
            serverUrl: this.baseUrl,
            model: this.model,
            isAvailable: this.isAvailable,
            cacheSize: this.cache.size,
            validationStats: this.validationStats
        };
    }

    /**
     * Obtiene clave para cache
     */
    getCacheKey(category, difficulty, specificTopic) {
        return `${category}-${difficulty}-${specificTopic || 'general'}`;
    }

    /**
     * Parsea la respuesta de verificación del modelo
     */
    parseVerificationResponse(response) {
        try {
            // Limpiar la respuesta: buscar el JSON en el texto
            let jsonText = response.trim();
            
            // Buscar el inicio del JSON
            const jsonStart = jsonText.indexOf('{');
            if (jsonStart === -1) {
                // Si no hay JSON, crear uno básico
                return {
                    is_correct: true,
                    answer: response.trim(),
                    confidence: 'medium',
                    explanation: 'Respuesta sin formato JSON válido'
                };
            }
            
            // Extraer desde el inicio del JSON
            jsonText = jsonText.substring(jsonStart);
            
            // Buscar el final del JSON
            let jsonEnd = jsonText.lastIndexOf('}') + 1;
            if (jsonEnd <= 1) {
                // Intentar completar el JSON
                jsonText += '}';
            } else {
                jsonText = jsonText.substring(0, jsonEnd);
            }
            
            const parsed = JSON.parse(jsonText);
            return {
                is_correct: parsed.is_correct !== false,
                answer: parsed.answer || parsed.correct_answer || 'Sin respuesta',
                confidence: parsed.confidence || 'medium',
                explanation: parsed.explanation || 'Sin explicación',
                reason: parsed.reason || parsed.explanation || 'Sin razón especificada'
            };
            
        } catch (error) {
            console.warn('Error parseando respuesta de verificación:', error);
            return {
                is_correct: true,
                answer: response.trim(),
                confidence: 'low',
                explanation: 'Error parseando respuesta',
                reason: 'Error en formato de respuesta'
            };
        }
    }

    /**
     * Prueba la conexión con el servidor Ollama
     */
    async testConnection() {
        try {
            const servers = await this.listAvailableServers();
            const currentServer = servers.find(s => s.url === this.baseUrl);
            
            if (currentServer && currentServer.available) {
                const models = await this.listAvailableModels();
                const modelExists = models.some(m => m.name === this.model);
                
                return {
                    success: true,
                    server: this.baseUrl,
                    version: currentServer.version,
                    model: this.model,
                    modelAvailable: modelExists,
                    availableModels: models.map(m => m.name)
                };
            } else {
                return {
                    success: false,
                    error: 'Servidor no disponible',
                    server: this.baseUrl
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                server: this.baseUrl
            };
        }
    }

    /**
     * Configura un servidor dedicado manualmente
     */
    setDedicatedServer(serverIp, port = 11434) {
        const serverUrl = `http://${serverIp}:${port}`;
        console.log(`🖥️ Configurando servidor dedicado: ${serverUrl}`);
        
        this.baseUrl = serverUrl;
        this.serverConfig.autoDetect = false; // Desactivar auto-detección
        
        return this.checkAvailability();
    }

    /**
     * Habilita detección automática de servidores
     */
    enableAutoDetection() {
        console.log('🔍 Habilitando detección automática de servidores');
        this.serverConfig.autoDetect = true;
        this.detectAvailableServers();
    }

    /**
     * Deshabilita detección automática (usar localhost únicamente)
     */
    disableAutoDetection() {
        console.log('🔒 Deshabilitando detección automática - usando localhost');
        this.serverConfig.autoDetect = false;
        this.baseUrl = 'http://localhost:11434';
        this.checkAvailability();
    }

    // ...existing code...
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.OllamaClient = OllamaClient;
}
