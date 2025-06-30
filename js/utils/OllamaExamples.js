/**
 * Ejemplo de uso del OllamaClient
 * Ejecutar en la consola del navegador para probar
 */

// 🧪 EJEMPLO 1: Verificar si Ollama está funcionando
async function pruebaBasica() {
    console.log('🧪 Prueba básica de Ollama...');
    
    const ollama = new OllamaClient();
    
    // Esperar a que verifique disponibilidad
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (ollama.isAvailable) {
        console.log('✅ Ollama está disponible');
        
        // Mostrar estadísticas
        console.log('📊 Estadísticas:', ollama.getStats());
        
        return ollama;
    } else {
        console.log('❌ Ollama no está disponible');
        console.log('💡 Asegúrate de que Ollama esté instalado y ejecutándose:');
        console.log('   1. Instala Ollama desde https://ollama.ai');
        console.log('   2. Ejecuta: ollama pull llama3.1:8b');
        console.log('   3. Ejecuta: ollama serve');
        
        return null;
    }
}

// 🎯 EJEMPLO 2: Generar una pregunta simple
async function generarPreguntaSimple() {
    console.log('🎯 Generando pregunta simple...');
    
    const ollama = new OllamaClient();
    
    try {
        const pregunta = await ollama.generateQuestion({
            category: 'historia',
            difficulty: 'medium'
        });
        
        console.log('✅ Pregunta generada:');
        console.log('📝 Pregunta:', pregunta.text);
        console.log('📋 Respuestas:', pregunta.answers);
        console.log('✔️ Correcta:', pregunta.answers[pregunta.correctIndex]);
        console.log('💡 Explicación:', pregunta.explanation);
        
        return pregunta;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// 🎨 EJEMPLO 3: Generar pregunta con tema específico
async function generarPreguntaEspecifica() {
    console.log('🎨 Generando pregunta específica...');
    
    const ollama = new OllamaClient();
    
    try {
        const pregunta = await ollama.generateQuestion({
            category: 'arte',
            difficulty: 'hard',
            specificTopic: 'pintura renacentista',
            avoidTopics: ['escultura'] // Evitar esculturas
        });
        
        console.log('✅ Pregunta específica generada:');
        console.table({
            'Pregunta': pregunta.text,
            'Categoría': pregunta.category,
            'Dificultad': pregunta.difficulty,
            'Tema': pregunta.topic,
            'Respuesta correcta': pregunta.answers[pregunta.correctIndex]
        });
        
        return pregunta;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// 🚀 EJEMPLO 4: Generar múltiples preguntas
async function generarVariasPreguntas() {
    console.log('🚀 Generando múltiples preguntas...');
    
    const ollama = new OllamaClient();
    
    try {
        const preguntas = await ollama.generateMultipleQuestions({
            category: 'ciencia',
            difficulty: 'easy'
        }, 3); // 3 preguntas
        
        console.log(`✅ ${preguntas.length} preguntas generadas:`);
        
        preguntas.forEach((pregunta, index) => {
            console.log(`\n--- Pregunta ${index + 1} ---`);
            console.log('📝', pregunta.text);
            console.log('✔️', pregunta.answers[pregunta.correctIndex]);
        });
        
        return preguntas;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return [];
    }
}

// 🔧 EJEMPLO 5: Configuración avanzada
async function configuracionAvanzada() {
    console.log('🔧 Configuración avanzada...');
    
    const ollama = new OllamaClient();
    
    // Cambiar modelo (si tienes otros instalados)
    ollama.setModel('llama3.2:3b'); // Modelo más rápido
    
    // Verificar modelos disponibles
    try {
        const modelos = await ollama.listAvailableModels();
        console.log('🤖 Modelos disponibles:');
        modelos.forEach(modelo => {
            console.log(`   - ${modelo.name} (${(modelo.size / 1e9).toFixed(1)}GB)`);
        });
    } catch (error) {
        console.log('⚠️ No se pudieron listar modelos:', error.message);
    }
    
    // Probar conexión completa
    try {
        const test = await ollama.testConnection();
        
        if (test.success) {
            console.log('✅ Prueba de conexión exitosa');
            console.log('🎯 Pregunta de prueba generada:', test.testQuestion?.text);
        } else {
            console.log('❌ Prueba fallida:', test.error);
        }
        
        return test;
        
    } catch (error) {
        console.error('❌ Error en prueba:', error.message);
        return null;
    }
}

// 📊 EJEMPLO 6: Precargar preguntas para mejor rendimiento
async function precargarPreguntas() {
    console.log('📊 Precargando preguntas...');
    
    const ollama = new OllamaClient();
    
    try {
        // Precargar 5 preguntas de geografía fácil
        await ollama.preloadQuestions('geografia', 'easy', 5);
        
        console.log('✅ Preguntas precargadas');
        console.log('📊 Cache actual:', ollama.getStats().cacheSize);
        
        // Ahora generar una pregunta será más rápido (usará cache)
        const preguntaRapida = await ollama.generateQuestion({
            category: 'geografia',
            difficulty: 'easy'
        });
        
        console.log('⚡ Pregunta desde cache:', preguntaRapida.text);
        
        return preguntaRapida;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// 🎮 EJEMPLO 7: Integración completa de demostración
async function demoCompleta() {
    console.log('🎮 Demo completa del OllamaClient...');
    
    const ollama = new OllamaClient();
    const categorias = ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'];
    const dificultades = ['easy', 'medium', 'hard'];
    
    console.log('⏳ Generando preguntas variadas...');
    
    for (let i = 0; i < 3; i++) {
        const categoria = categorias[Math.floor(Math.random() * categorias.length)];
        const dificultad = dificultades[Math.floor(Math.random() * dificultades.length)];
        
        try {
            const startTime = Date.now();
            
            const pregunta = await ollama.generateQuestion({
                category: categoria,
                difficulty: dificultad
            });
            
            const tiempo = Date.now() - startTime;
            
            console.log(`\n🎯 Pregunta ${i + 1}:`);
            console.log(`   📂 ${categoria.toUpperCase()} (${dificultad})`);
            console.log(`   📝 ${pregunta.text}`);
            console.log(`   ✔️ ${pregunta.answers[pregunta.correctIndex]}`);
            console.log(`   ⏱️ Generada en ${tiempo}ms`);
            
            // Pausa entre preguntas
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Error en pregunta ${i + 1}:`, error.message);
        }
    }
    
    console.log('\n📊 Estadísticas finales:', ollama.getStats());
}

// 📚 INSTRUCCIONES DE USO
console.log(`
🤖 OLLAMA CLIENT - EJEMPLOS DE USO

Para probar las funciones, ejecuta en la consola:

📋 FUNCIONES DISPONIBLES:
   pruebaBasica()           - Verificar disponibilidad
   generarPreguntaSimple()  - Generar pregunta básica
   generarPreguntaEspecifica() - Pregunta con tema específico
   generarVariasPreguntas() - Múltiples preguntas
   configuracionAvanzada()  - Configuración y modelos
   precargarPreguntas()     - Cache y rendimiento
   demoCompleta()           - Demostración completa

🚀 INICIO RÁPIDO:
   1. await pruebaBasica()
   2. await generarPreguntaSimple()
   3. await demoCompleta()

💡 REQUISITOS:
   - Ollama instalado y ejecutándose
   - Modelo llama3.1:8b descargado
   - Puerto 11434 disponible
`);

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.pruebaBasica = pruebaBasica;
    window.generarPreguntaSimple = generarPreguntaSimple;
    window.generarPreguntaEspecifica = generarPreguntaEspecifica;
    window.generarVariasPreguntas = generarVariasPreguntas;
    window.configuracionAvanzada = configuracionAvanzada;
    window.precargarPreguntas = precargarPreguntas;
    window.demoCompleta = demoCompleta;
}
