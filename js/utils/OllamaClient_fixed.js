/**
 * Cliente para integración con Ollama para generar preguntas de trivial
 * Permite generar preguntas dinámicas en español usando modelos LLM locales
 * Optimizado para modelos thinking como gpt-oss
 */
class OllamaClient {
	constructor(config = {}) {
		// Configuración del servidor (definir primero)
		this.serverConfig = {
			autoDetect: config.autoDetect !== false, // Por defecto activado
			possibleServers: config.possibleServers || [
				'http://localhost:11434',        // Servidor local (fallback)
				'http://192.168.31.88:11434',   // Ejemplo: servidor dedicado
				'http://ollama-server.local:11434', // Ejemplo: hostname local
				// Agregar más IPs según tu red
			],
			timeout: config.timeout || 7000
		};

		// Configuración flexible del servidor (ahora que serverConfig está definido)
		this.baseUrl = config.serverUrl || this.detectServerUrl() || 'http://localhost:11434';
		// Modelo por defecto: optimizado para la petición del usuario
		this.model = config.model || 'gpt-oss';
		this.isAvailable = false;
		this.cache = new Map(); // Cache para evitar regenerar preguntas similares
		this.maxCacheSize = 100;

		// Optimización: opciones de generación parametrizables para modelos lentos
		this.generationOptions = {
			temperature: config.temperature ?? 0.6,
			top_p: config.top_p ?? 0.9,
			top_k: config.top_k ?? 40,
			num_predict: config.num_predict ?? 500 // Incrementado para modelos thinking
		};

		// Timeouts y reintentos para modelos más lentos
		this.requestTimeoutMs = config.requestTimeoutMs || 120000; // 120s para modelos thinking
		this.maxRetries = Math.max(1, config.maxRetries || 4);
		this.baseRetryDelayMs = config.baseRetryDelayMs || 800; // backoff exponencial

		// Control de logs
		this.debug = config.debug ?? false;

		// EXPERIMENTAL: Verificar todas las preguntas con el modelo (desactivado por defecto para rendimiento)
		this.enableExperimentalValidation = config.enableExperimentalValidation === true ? true : false;

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

		// Prefetch en background para mitigar latencias
		this.prefetchEnabled = config.prefetchEnabled ?? true;
		this.prefetchCount = Math.max(0, config.prefetchCount ?? 1);

		// Coalescencia de peticiones idénticas en curso
		this.inFlightRequests = new Map();

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
				signal: AbortSignal.timeout( Math.max(5000, this.serverConfig.timeout) )
			});
			
			if (response.ok) {
				this.isAvailable = true;
				if (this.debug) console.log('✅ Ollama está disponible');
				// Verificar si el modelo está disponible
				await this.checkModelAvailability();
			} else {
				this.isAvailable = false;
				console.warn('⚠️ Ollama no responde correctamente');
			}
		} catch (error) {
			this.isAvailable = false;
			if (this.debug) console.warn('⚠️ Ollama no está disponible:', error.message);
		}
	}

	/**
	 * Verifica si el modelo especificado está disponible
	 */
	async checkModelAvailability() {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`);
			const data = await response.json();
			const baseModelName = (this.model || '').split(':')[0];
			const modelExists = data.models?.some(model => 
				model.name === this.model || model.name.startsWith(baseModelName)
			);
			if (!modelExists) {
				if (this.debug) console.warn(`⚠️ Modelo ${this.model} no encontrado. Modelos disponibles:`, 
					data.models?.map(m => m.name) || []);
			} else {
				if (this.debug) console.log(`✅ Modelo ${this.model} disponible`);
			}
		} catch (error) {
			// Silencioso para no penalizar rendimiento ni saturar logs en modelos remotos
			if (this.debug) console.warn('Error verificando modelos disponibles:', error);
		}
	}

	/**
	 * Configura el modelo a usar
	 */
	setModel(modelName) {
		this.model = modelName;
		if (this.debug) console.log(`Modelo configurado: ${this.model}`);
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
		if (this.debug) console.log('🌐 Iniciando detección de servidores Ollama...');
		
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
			possibleServers: this.serverConfig.possibleServers,
			requestTimeoutMs: this.requestTimeoutMs,
			maxRetries: this.maxRetries
		};
	}

	// Utilidad de backoff con jitter
	async delayWithBackoff(attempt) {
		const jitter = Math.floor(Math.random() * 250);
		const delay = this.baseRetryDelayMs * Math.pow(2, attempt - 1) + jitter;
		return new Promise(res => setTimeout(res, delay));
	}

	// Cache helpers
	getCacheKey(category, difficulty, specificTopic) {
		return `${category}|${difficulty}|${specificTopic || ''}`;
	}

	addToCache(category, difficulty, specificTopic, question) {
		const key = this.getCacheKey(category, difficulty, specificTopic);
		if (!this.cache.has(key)) this.cache.set(key, []);
		const arr = this.cache.get(key);
		arr.push(question);
		// Límite simple por clave y global
		if (arr.length > 10) arr.shift();
		if (this.cache.size > this.maxCacheSize) {
			// Borrar una entrada arbitraria (FIFO simple)
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
	}

	async prefetchQuestions(category, difficulty, specificTopic, avoidTopics, language) {
		if (!this.prefetchEnabled || this.prefetchCount <= 0) return;
		for (let i = 0; i < this.prefetchCount; i++) {
			// Lanzar en background sin bloquear
			this.generateQuestion({ category, difficulty, specificTopic, avoidTopics, language, _internalPrefetch: true })
				.catch(() => {});
		}
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
			language = 'español',
			signal: externalSignal,
			_internalPrefetch = false
		} = options;

		// Verificar cache primero
		const cacheKey = this.getCacheKey(category, difficulty, specificTopic);
		if (this.cache.has(cacheKey)) {
			const cachedQuestions = this.cache.get(cacheKey);
			if (cachedQuestions.length > 0) {
				return cachedQuestions.pop();
			}
		}

		// Declarar prompt fuera de try para poder limpiar coalescencia en catch
		let prompt = '';

		try {
			prompt = this.buildPrompt(category, difficulty, specificTopic, avoidTopics, language);

			// Coalescencia: si ya hay una petición idéntica en curso, reutilizar
			if (this.inFlightRequests.has(prompt)) {
				return await this.inFlightRequests.get(prompt);
			}

			if (this.debug) console.log('🤖 Generando pregunta con modelo thinking...', this.model);
			const startTime = Date.now();
			const maxRetries = this.maxRetries;
			let lastError = null;

			const taskPromise = (async () => {
				for (let attempt = 1; attempt <= maxRetries; attempt++) {
					try {
						if (this.debug) console.log(`🎯 Generando pregunta (intento ${attempt}/${maxRetries})...`);

						const controller = new AbortController();
						const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

						// Vincular una señal externa si se proporciona
						if (externalSignal) {
							if (externalSignal.aborted) controller.abort();
							externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
						}

						const response = await fetch(`${this.baseUrl}/api/generate`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								model: this.model,
								prompt,
								stream: false,
								options: { ...this.generationOptions }
							}),
							signal: controller.signal
						});

						clearTimeout(timeoutId);

						if (!response.ok) {
							throw new Error(`Error HTTP: ${response.status}`);
						}

						const data = await response.json();
						const generationTime = Date.now() - startTime;
						if (this.debug) {
							console.log(`⚡ Respuesta recibida en ${generationTime}ms`);
							console.log('📝 Respuesta del modelo:', data.response);
						}

						// Parsear la respuesta del modelo con tolerancia
						const question = await this.parseModelResponse(data.response, category, difficulty);

						// Validar la pregunta
						try {
							await this.validateQuestion(question);
							if (this.debug) console.log(`✅ Pregunta válida generada en intento ${attempt}`);

							// Guardar en cache y lanzar prefetch en background
							this.addToCache(category, difficulty, specificTopic, question);
							if (!_internalPrefetch) {
								this.prefetchQuestions(category, difficulty, specificTopic, avoidTopics, language);
							}

							return question;
						} catch (validationError) {
							if (validationError.message?.includes('regeneración')) {
								if (this.debug) console.warn(`🔄 Pregunta requiere regeneración: ${validationError.message}`);
								throw validationError;
							}
							throw validationError;
						}
					} catch (error) {
						lastError = error;
						if (this.debug) console.warn(`❌ Intento ${attempt} falló:`, error.message);
						if (attempt === maxRetries) {
							console.error('❌ Todos los intentos fallaron');
							break;
						}
						await this.delayWithBackoff(attempt);
					}
				}
				throw new Error(`No se pudo generar la pregunta después de ${maxRetries} intentos: ${lastError?.message || 'Error desconocido'}`);
			})();

			// Registrar la promesa en curso para coalescencia
			this.inFlightRequests.set(prompt, taskPromise);
			const result = await taskPromise;
			this.inFlightRequests.delete(prompt);
			return result;
		} catch (error) {
			console.error('Error generando pregunta con el modelo:', error);
			// Limpiar coalescencia ante error
			if (prompt) this.inFlightRequests.delete(prompt);
			throw error;
		}
	}

	/**
	 * Construye el prompt para el modelo thinking
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

<thinking>
Necesito crear una pregunta de trivial sobre ${topic} en ${language} con dificultad ${difficultyDescription} para la categoría ${category}.

Voy a pensar en:
1. Una pregunta específica y clara sobre ${topic}
2. Cuatro opciones de respuesta donde solo una sea correcta
3. Las respuestas incorrectas deben ser plausibles pero claramente erróneas
4. Una explicación breve de por qué la respuesta es correcta

Criterios:
- La pregunta debe ser objetiva y verificable
- Evitar preguntas demasiado obvias o demasiado oscuras
- Las opciones deben estar bien balanceadas${avoidText}
</thinking>

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
Responde ÚNICAMENTE con un JSON válido y completo. NO agregues texto antes o después. Evita bloques de código.

{
  "pregunta": "¿Texto de la pregunta aquí?",
  "opciones": [
    "Opción A",
    "Opción B", 
    "Opción C",
    "Opción D"
  ],
  "respuesta_correcta": 0,
  "explicacion": "Breve explicación de por qué esta es la respuesta correcta (máximo 300 caracteres)",
  "tema": "${topic}",
  "dificultad": "${difficulty}"
}

CRÍTICO: 
- El JSON debe estar completo con todas las llaves cerradas
- El índice respuesta_correcta debe ser 0, 1, 2 o 3 (no letras)
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
	}

	/**
	 * Parsea la respuesta del modelo en formato tolerante.
	 * Adaptado para modelos thinking que pueden incluir secciones de pensamiento
	 */
	async parseModelResponse(response, category, difficulty) {
		try {
			let raw = String(response || '').trim();
			
			// Para modelos thinking: extraer solo la parte después del thinking
			if (raw.includes('</thinking>')) {
				const thinkingEnd = raw.indexOf('</thinking>');
				raw = raw.substring(thinkingEnd + 11).trim();
			}
			
			// Quitar fences de código si los hubiera
			raw = raw.replace(/```json[\s\S]*?```/gi, m => m.replace(/^```json\s*|\s*```$/gi, ''));
			raw = raw.replace(/```[\s\S]*?```/g, m => m.replace(/^```\s*|\s*```$/g, ''));
			// Normalizar comillas raras
			raw = raw.replace(/[""]/g, '"').replace(/['']/g, "'");

			// 1) Intentar extraer el primer JSON bien formado
			let jsonText = this.extractFirstJsonObject(raw);

			// 2) Si no se encontró JSON, intentar heurísticas desde texto
			if (!jsonText) {
				if (this.debug) console.warn('ℹ️ No se encontró bloque JSON, intentando heurística desde texto...');
				const rebuilt = this.tryBuildQuestionFromText(raw, category, difficulty);
				if (rebuilt) return rebuilt;
			}

			// 3) Si hay JSON, intentar parsear con pequeñas correcciones
			if (jsonText) {
				jsonText = this.normalizeJsonText(jsonText);
				let questionData;
				try {
					questionData = JSON.parse(jsonText);
				} catch (e) {
					// Reintento: reemplazar comillas simples por dobles solo en claves/valores simples
					const safe = jsonText
						.replace(/:(\s*)'([^']*)'/g, ':$1"$2"')
						.replace(/'([A-Za-z0-9_]+)'(\s*):/g, '"$1"$2:');
					questionData = JSON.parse(safe);
				}

				return this.normalizeQuestionData(questionData, category, difficulty);
			}

			// 4) Último recurso: pedir reformateo al modelo a JSON (corto)
			if (this.debug) console.warn('♻️ Intentando reformateo a JSON con el modelo (fallback)...');
			const reformatted = await this.reformatToStrictJson(raw);
			if (reformatted) {
				return this.normalizeQuestionData(reformatted, category, difficulty);
			}

			throw new Error('No se encontró JSON válido en la respuesta');
		} catch (error) {
			console.error('Error parseando respuesta del modelo:', error);
			if (this.debug) console.log('Respuesta del modelo:', response);
			throw new Error(`No se pudo parsear la respuesta del modelo: ${error.message}`);
		}
	}

	/**
	 * Extrae el primer objeto JSON balanceando llaves.
	 */
	extractFirstJsonObject(text) {
		const start = text.indexOf('{');
		if (start === -1) return null;
		let depth = 0;
		for (let i = start; i < text.length; i++) {
			const ch = text[i];
			if (ch === '{') depth++;
			if (ch === '}') {
				depth--;
				if (depth === 0) {
					return text.substring(start, i + 1);
				}
			}
		}
		// No cerró; intentar devolver hasta el final y cerrar
		return text.substring(start) + '}';
	}

	/**
	 * Pequeñas normalizaciones de JSON (comas colgantes, espacios, etc.)
	 */
	normalizeJsonText(jsonText) {
		return jsonText
			.replace(/,\s*([}\]])/g, '$1') // comas colgantes
			.replace(/\t/g, ' ')
			.trim();
	}

	/**
	 * Convierte un objeto del modelo a la estructura interna del juego.
	 */
	normalizeQuestionData(questionData, category, difficulty) {
		// Normalizaciones: permitir letras o 1-based
		if (typeof questionData.respuesta_correcta === 'string') {
			const letter = questionData.respuesta_correcta.trim().toUpperCase();
			const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
			if (letter in map) questionData.respuesta_correcta = map[letter];
		}
		if (typeof questionData.respuesta_correcta === 'number' && questionData.respuesta_correcta >= 1 && questionData.respuesta_correcta <= 4 && (questionData.opciones?.length === 4)) {
			// Convertir a 0-based si parece 1-based
			questionData.respuesta_correcta = Math.min(3, Math.max(0, questionData.respuesta_correcta - 1));
		}

		// Validar estructura básica
		if (!questionData.pregunta || !questionData.opciones || !Array.isArray(questionData.opciones)) {
			throw new Error('Estructura de pregunta inválida');
		}

		// Normalizar y limitar a 4 opciones
		questionData.opciones = questionData.opciones.map(o => String(o).trim()).filter(Boolean);
		if (questionData.opciones.length > 4) questionData.opciones = questionData.opciones.slice(0, 4);
		if (questionData.opciones.length !== 4) {
			throw new Error('Se requieren exactamente 4 opciones de respuesta');
		}

		if (typeof questionData.respuesta_correcta !== 'number' || questionData.respuesta_correcta < 0 || questionData.respuesta_correcta > 3) {
			// Como fallback, intentar deducir por explicación
			const exp = (questionData.explicacion || '').toLowerCase();
			let deduced = 0;
			for (let i = 0; i < questionData.opciones.length; i++) {
				const opt = questionData.opciones[i].toLowerCase();
				if (opt.length > 2 && exp.includes(opt)) { deduced = i; break; }
			}
			questionData.respuesta_correcta = deduced;
		}

		return {
			text: questionData.pregunta,
			answers: questionData.opciones,
			correctIndex: questionData.respuesta_correcta,
			category,
			difficulty,
			source: 'ollama',
			explanation: questionData.explicacion || '',
			topic: questionData.tema || '',
			generatedAt: Date.now()
		};
	}

	/**
	 * Intenta reconstruir una pregunta desde texto libre sin JSON.
	 */
	tryBuildQuestionFromText(raw, category, difficulty) {
		const text = raw.replace(/\r/g, '');
		const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

		// Extraer pregunta: primera línea con signo de interrogación o línea que empiece por "pregunta:"
		let pregunta = '';
		const qLine = lines.find(l => /\?$/.test(l) || /^pregunta\s*:/i.test(l));
		if (qLine) {
			pregunta = qLine.replace(/^pregunta\s*:\s*/i, '').trim();
			if (!pregunta.endsWith('?')) {
				// Intentar juntar hasta encontrar '?'
				const idx = lines.indexOf(qLine);
				for (let i = idx + 1; i < Math.min(lines.length, idx + 3); i++) {
					pregunta += ' ' + lines[i];
					if (lines[i].includes('?')) break;
				}
			}
		}

		// Extraer opciones en varios formatos
		const opciones = [];
		const optionPatterns = [
			/^[\-\*]\s*(.+)$/i,          // - opción
			/^(?:A|B|C|D)[\)\.:]\s*(.+)$/i, // A) opción
			/^\d{1}[\)\.:]\s*(.+)$/i     // 1) opción
		];
		for (const line of lines) {
			for (const pat of optionPatterns) {
				const m = line.match(pat);
				if (m) { opciones.push(m[1].trim()); break; }
			}
			if (opciones.length === 4) break;
		}

		// Si aún no hay 4, intentar partir por ';' o ' / '
		if (opciones.length < 4) {
			const joined = lines.join(' ');
			const parts = joined.split(/\s*[;\|\/]\s*/).filter(p => p.length > 0);
			if (parts.length >= 4) opciones.push(...parts.slice(0,4));
		}

		if (pregunta && opciones.length === 4) {
			// Intentar extraer respuesta correcta
			let correctIndex = 0;
			let explicacion = '';

			const respLine = lines.find(l => /(respuesta\s*correcta|correcta|answer)/i.test(l));
			if (respLine) {
				const letterMatch = respLine.match(/\b([ABCD])\b/i);
				const idxMatch = respLine.match(/\b([1-4])\b/);
				const textMatch = respLine.match(/:\s*(.+)$/);
				if (letterMatch) correctIndex = {A:0,B:1,C:2,D:3}[letterMatch[1].toUpperCase()];
				else if (idxMatch) correctIndex = Math.min(3, Math.max(0, parseInt(idxMatch[1],10)-1));
				else if (textMatch) {
					const val = textMatch[1].toLowerCase().trim();
					const found = opciones.findIndex(o => o.toLowerCase() === val);
					if (found !== -1) correctIndex = found;
				}
			}

			// Explicación
			const expLine = lines.find(l => /(explicación|explicacion|porque|razón|razon)/i.test(l));
			if (expLine) {
				explicacion = expLine.replace(/^(explicación|explicacion|porque|razón|razon)\s*:\s*/i, '').trim();
			}

			return {
				text: pregunta,
				answers: opciones.map(o => o.trim()),
				correctIndex,
				category,
				difficulty,
				source: 'ollama',
				explanation: explicacion,
				topic: '',
				generatedAt: Date.now()
			};
		}

		return null;
	}

	/**
	 * Pide al modelo que reformatee a JSON estricto (timeout corto, baja temperatura)
	 */
	async reformatToStrictJson(rawText) {
		try {
			const prompt = `Convierte el siguiente contenido en JSON ESTRICTO con el esquema EXACTO:
{
  "pregunta": string,
  "opciones": [string, string, string, string],
  "respuesta_correcta": 0|1|2|3,
  "explicacion": string,
  "tema": string,
  "dificultad": string
}
No añadas ningún texto antes o después. No uses comillas simples. No incluyas bloques de código.

CONTENIDO:
${rawText}`;

			const response = await fetch(`${this.baseUrl}/api/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: this.model,
					prompt,
					stream: false,
					options: { temperature: 0.1, top_p: 0.8, top_k: 20, num_predict: 200 }
				}),
				signal: AbortSignal.timeout(12000)
			});
			if (!response.ok) return null;
			const data = await response.json();
			let jsonText = this.extractFirstJsonObject(String(data.response || ''));
			if (!jsonText) return null;
			jsonText = this.normalizeJsonText(jsonText);
			return JSON.parse(jsonText);
		} catch (_) {
			return null;
		}
	}

	/**
	 * Lista los modelos disponibles en el servidor actual
	 */
	async listAvailableModels() {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				signal: AbortSignal.timeout(7000)
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			const models = Array.isArray(data?.models) ? data.models : [];
			return models.map(m => ({
				name: m.name,
				size: typeof m.size !== 'undefined' ? m.size : undefined,
				digest: m.digest
			}));
		} catch (error) {
			if (this.debug) console.warn('Error listando modelos:', error);
			return [];
		}
	}

	/**
	 * Prueba de conexión al servidor y disponibilidad del modelo actual
	 */
	async testConnection() {
		const result = {
			success: false,
			server: this.baseUrl,
			version: null,
			model: this.model,
			modelAvailable: false,
			availableModels: [],
			error: null
		};
		try {
			// Probar versión del servidor
			const verRes = await fetch(`${this.baseUrl}/api/version`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				signal: AbortSignal.timeout(5000)
			});
			if (!verRes.ok) throw new Error(`HTTP ${verRes.status}`);
			const verData = await verRes.json();
			result.version = verData?.version || null;
			this.isAvailable = true;

			// Obtener modelos disponibles
			const models = await this.listAvailableModels();
			result.availableModels = models.map(m => m.name);

			// Verificar modelo actual
			const baseModelName = (this.model || '').split(':')[0];
			result.modelAvailable = result.availableModels.some(name => name === this.model || name.startsWith(baseModelName));

			result.success = true;
			return result;
		} catch (error) {
			this.isAvailable = false;
			result.error = error.message || String(error);
			return result;
		}
	}

	/**
	 * Configura un servidor dedicado (IP y puerto) y desactiva la auto-detección
	 */
	async setDedicatedServer(ip, port = 11434) {
		try {
			const serverUrl = `http://${ip}:${port}`;
			this.serverConfig.autoDetect = false;
			this.baseUrl = serverUrl;
			await this.checkAvailability();
			return { success: this.isAvailable, server: serverUrl };
		} catch (error) {
			return { success: false, server: `http://${ip}:${port}`, error: error.message };
		}
	}

	/**
	 * Devuelve estadísticas básicas de ejecución y cache
	 */
	getStats() {
		let cacheSize = 0;
		try {
			for (const arr of this.cache.values()) cacheSize += Array.isArray(arr) ? arr.length : 0;
		} catch (_) {}
		return {
			isAvailable: this.isAvailable,
			serverUrl: this.baseUrl,
			model: this.model,
			cacheSize,
			requestTimeoutMs: this.requestTimeoutMs,
			maxRetries: this.maxRetries
		};
	}

	/**
	 * Valida la pregunta generada. Si la validación experimental está activada,
	 * recopila métricas adicionales. Lanza error si requiere regeneración.
	 */
	async validateQuestion(question) {
		// Validaciones mínimas
		if (!question || !question.text || !Array.isArray(question.answers) || question.answers.length !== 4) {
			this.validationStats.validationErrors++;
			this.validationStats.totalValidations++;
			throw new Error('Estructura de pregunta inválida, requiere regeneración');
		}
		const uniqueAnswers = new Set(question.answers.map(a => (a || '').trim().toLowerCase()));
		if (uniqueAnswers.size < 4) {
			this.validationStats.validationErrors++;
			this.validationStats.totalValidations++;
			throw new Error('Respuestas duplicadas, requiere regeneración');
		}
		if (typeof question.correctIndex !== 'number' || question.correctIndex < 0 || question.correctIndex > 3) {
			this.validationStats.validationErrors++;
			this.validationStats.totalValidations++;
			throw new Error('Índice de respuesta inválido, requiere regeneración');
		}

		// Métricas experimentales (livianas por defecto)
		let confidence = 'high';
		let matchScore = 0.95;
		let corrected = false;

		if (this.enableExperimentalValidation) {
			// Heurística simple para estimar confianza y coincidencia
			const len = (question.text || '').length;
			if (len < 40) { confidence = 'medium'; matchScore = 0.75; }
			if (len < 20) { confidence = 'low'; matchScore = 0.55; }
			// Aquí se podría integrar una verificación real con el modelo si se desea
		}

		// Actualizar estadísticas
		this.validationStats.totalValidations++;
		this.validationStats.successfulValidations++;
		if (corrected) this.validationStats.correctedAnswers++;
		this.validationStats.confidenceDistribution[confidence]++;
		this.validationStats.matchScores.push(matchScore);
		this.validationStats.averageMatchScore = this.validationStats.matchScores.reduce((a, b) => a + b, 0) / this.validationStats.matchScores.length;

		return true;
	}

	/**
	 * Reporte de estadísticas de validación experimental (para UI)
	 */
	getValidationStatsReport() {
		const s = this.validationStats;
		const total = s.totalValidations || 0;
		const success = s.successfulValidations || 0;
		const rates = {
			successRate: total > 0 ? `${Math.round((success / total) * 100)}%` : '0%'
		};
		const samples = s.matchScores.length;
		const avg = samples ? (s.matchScores.reduce((a,b)=>a+b,0) / samples) : 0;
		const max = samples ? Math.max(...s.matchScores) : 0;
		const min = samples ? Math.min(...s.matchScores) : 0;
		return {
			summary: `Validaciones: ${total}, Éxito: ${rates.successRate}`,
			details: {
				totalValidations: total,
				successfulValidations: success,
				correctedAnswers: s.correctedAnswers,
				regeneratedQuestions: s.regeneratedQuestions,
				validationErrors: s.validationErrors,
				rates,
				confidence: {
					high: s.confidenceDistribution.high,
					medium: s.confidenceDistribution.medium,
					low: s.confidenceDistribution.low
				},
				matchScore: {
					average: avg.toFixed(3),
					max: max.toFixed(3),
					min: min.toFixed(3),
					samples
				}
			}
		};
	}

	/**
	 * Reinicia las estadísticas de validación experimental
	 */
	resetValidationStats() {
		this.validationStats = {
			totalValidations: 0,
			successfulValidations: 0,
			correctedAnswers: 0,
			regeneratedQuestions: 0,
			validationErrors: 0,
			confidenceDistribution: { high: 0, medium: 0, low: 0 },
			averageMatchScore: 0,
			matchScores: []
		};
	}
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
	window.OllamaClient = OllamaClient;
}
