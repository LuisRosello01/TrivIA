/**
 * Clase para manejar el tablero del juego de trivial
 */
class Board {
    constructor(canvasId, width = null, height = null) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Dimensiones dinámicas basadas en el contenedor
        this.calculateDynamicDimensions(width, height);
        
        // Factor de escala para elementos adaptativos
        this.calculateScaleFactor();
        
        // Configuración del tablero
        this.totalSpaces = 48; // Total de casillas en el tablero
        this.spaceSize = Math.max(8, 15 * this.scaleFactor); // Tamaño adaptativo de casillas reducido
        this.colors = this.initializeColors();
        this.spaces = this.initializeSpaces();
        this.players = [];
        
        // Configuración visual
        this.isInitialized = false;
        this.animationFrame = null;
        
        this.initialize();
    }

    /**
     * Inicializa los colores de las categorías
     */
    initializeColors() {
        return {
            historia: '#FF6B6B',
            ciencia: '#4ECDC4',
            deportes: '#45B7D1',
            arte: '#96CEB4',
            geografia: '#FECA57',
            entretenimiento: '#FF9FF3',
            centro: '#667eea',
            especial: '#764ba2'
        };
    }

    /**
     * Inicializa las casillas del tablero
     */
    initializeSpaces() {
        const spaces = [];
        const categories = ['historia', 'ciencia', 'deportes', 'arte', 'geografia', 'entretenimiento'];
        
        // Validar que los valores necesarios estén disponibles
        if (!isFinite(this.centerX) || !isFinite(this.centerY) || !isFinite(this.radius)) {
            console.error('Valores no finitos en initializeSpaces:', {
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius
            });
            return spaces; // Retornar array vacío en caso de error
        }
        
        // Crear las 48 casillas del anillo exterior
        for (let i = 0; i < this.totalSpaces; i++) {
            const angle = (i / this.totalSpaces) * 2 * Math.PI - Math.PI / 2;
            const x = this.centerX + Math.cos(angle) * this.radius;
            const y = this.centerY + Math.sin(angle) * this.radius;
            
            // Determinar el tipo de casilla
            let type, category;
            if (i % 8 === 0) {
                // Casillas de cuña (cada 8 posiciones)
                type = 'wedge';
                category = categories[Math.floor(i / 8) % 6];
            } else if (i % 16 === 4 || i % 16 === 12) {
                // Casillas especiales
                type = 'special';
                category = 'especial';
            } else {
                // Casillas normales
                type = 'normal';
                // La categoría depende del sector del tablero
                category = categories[Math.floor((i / 8)) % 6];
            }
            
            // Validar coordenadas antes de crear el espacio
            if (!isFinite(x) || !isFinite(y)) {
                console.warn(`Coordenadas no finitas para espacio ${i}:`, { x, y });
                continue; // Saltar este espacio
            }
            
            spaces.push({
                id: i,
                x: x,
                y: y,
                angle: angle,
                type: type,
                category: category,
                color: this.colors[category],
                players: []
            });
        }

        // Agregar casilla central
        spaces.push({
            id: 'center',
            x: this.centerX,
            y: this.centerY,
            type: 'center',
            category: 'centro',
            color: this.colors.centro,
            players: []
        });

        return spaces;
    }

    /**
     * Inicializa el canvas y dibuja el tablero
     */
    initialize() {
        if (!this.canvas) {
            console.error('Canvas no encontrado');
            return;
        }

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Configurar contexto
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Configurar redimensionamiento automático
        this.setupAutoResize();
        
        this.isInitialized = true;
        this.draw();
        
        console.log(`Tablero inicializado - Dimensiones: ${this.width}x${this.height}, Factor de escala: ${this.scaleFactor.toFixed(2)}`);
    }

    /**
     * Dibuja todo el tablero
     */
    draw() {
        if (!this.isInitialized) return;

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Dibujar fondo
        this.drawBackground();
        
        // Dibujar casillas
        this.drawSpaces();
        
        // Dibujar centro
        this.drawCenter();
        
        // Dibujar rayos/sectores
        this.drawSectors();
        
        // Dibujar jugadores
        this.drawPlayers();
        
        // Dibujar etiquetas de categorías
        this.drawCategoryLabels();
    }

    /**
     * Dibuja el fondo del tablero
     */
    drawBackground() {
        // Validar que los valores sean finitos antes de crear el gradiente
        if (!isFinite(this.centerX) || !isFinite(this.centerY) || !isFinite(this.radius)) {
            console.warn('Valores no finitos detectados en drawBackground:', {
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius
            });
            return;
        }        // Fondo con gradiente - reducido para que no se salga
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.radius + 20
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius + 15, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Dibuja todas las casillas del tablero
     */
    drawSpaces() {
        this.spaces.forEach((space, index) => {
            if (space.id === 'center') return; // El centro se dibuja por separado
            
            this.drawSpace(space);
        });
    }

    /**
     * Dibuja una casilla individual
     */
    drawSpace(space) {
        const { x, y, color, type } = space;
        
        // Validar coordenadas
        if (!isFinite(x) || !isFinite(y) || !isFinite(this.spaceSize)) {
            console.warn('Valores no finitos detectados en drawSpace:', { x, y, spaceSize: this.spaceSize });
            return;
        }
        
        // Sombra
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Casilla
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        
        if (type === 'wedge') {
            // Casillas de cuña más grandes
            this.ctx.arc(x, y, this.spaceSize + 2, 0, 2 * Math.PI);
        } else if (type === 'special') {
            // Casillas especiales con forma de diamante
            this.drawDiamond(x, y, this.spaceSize * 0.8); // Ligeramente más pequeño que las circulares
        } else {
            // Casillas normales
            this.ctx.arc(x, y, this.spaceSize, 0, 2 * Math.PI);
        }
        
        this.ctx.fill();
        
        // Borde
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Indicador de tipo de casilla
        if (type === 'wedge') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${Math.max(10, 12 * this.scaleFactor)}px Arial`;
            this.ctx.fillText('★', x, y);
        } else if (type === 'special') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${Math.max(12, 14 * this.scaleFactor)}px Arial`;
            this.ctx.fillText('?', x, y);
        }
    }

    /**
     * Dibuja una forma de diamante
     */
    drawDiamond(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x + size, y);
        this.ctx.lineTo(x, y + size);
        this.ctx.lineTo(x - size, y);
        this.ctx.closePath();
    }

    /**
     * Dibuja el centro del tablero
     */
    drawCenter() {
        const centerSpace = this.spaces.find(s => s.id === 'center');
        if (!centerSpace) return;

        // Sombra
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Círculo principal
        this.ctx.fillStyle = centerSpace.color;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, Math.max(30, 40 * this.scaleFactor), 0, 2 * Math.PI);
        this.ctx.fill();

        // Borde dorado
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = Math.max(2, 4 * this.scaleFactor);
        this.ctx.stroke();

        // Texto central
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${Math.max(12, 16 * this.scaleFactor)}px Arial`;
        this.ctx.fillText('TRIVIAL', this.centerX, this.centerY);
    }

    /**
     * Dibuja los sectores/rayos que dividen las categorías
     */
    drawSectors() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = Math.max(1, 1 * this.scaleFactor);        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
            const innerRadius = Math.max(45, 60 * this.scaleFactor);
            const outerRadius = this.radius + Math.max(15, 20 * this.scaleFactor);
            const startX = this.centerX + Math.cos(angle) * innerRadius;
            const startY = this.centerY + Math.sin(angle) * innerRadius;
            const endX = this.centerX + Math.cos(angle) * outerRadius;
            const endY = this.centerY + Math.sin(angle) * outerRadius;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    /**
     * Dibuja las etiquetas de las categorías
     */
    drawCategoryLabels() {
        const categories = [
            { name: 'Historia', color: this.colors.historia },
            { name: 'Ciencia', color: this.colors.ciencia },
            { name: 'Deportes', color: this.colors.deportes },
            { name: 'Arte', color: this.colors.arte },
            { name: 'Geografía', color: this.colors.geografia },
            { name: 'Entretenimiento', color: this.colors.entretenimiento }
        ];        categories.forEach((category, index) => {
            const angle = (index / 6) * 2 * Math.PI - Math.PI / 2 + Math.PI / 6;
            const labelRadius = this.radius + Math.max(50, 65 * this.scaleFactor);
            const x = this.centerX + Math.cos(angle) * labelRadius;
            const y = this.centerY + Math.sin(angle) * labelRadius;

            // Calcular dimensiones de la etiqueta basadas en el factor de escala - reducidas
            const labelWidth = Math.max(75, 95 * this.scaleFactor);
            const labelHeight = Math.max(18, 25 * this.scaleFactor);
            const borderRadius = Math.max(8, 12 * this.scaleFactor);

            // Fondo de la etiqueta
            this.ctx.fillStyle = category.color;
            this.ctx.beginPath();
            this.ctx.roundRect(x - labelWidth/2, y - labelHeight/2, labelWidth, labelHeight, borderRadius);
            this.ctx.fill();            // Texto de la etiqueta
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${Math.max(8, 12 * this.scaleFactor)}px Arial`;
            this.ctx.fillText(category.name, x, y);
        });
    }

    /**
     * Dibuja todos los jugadores en sus posiciones
     */
    drawPlayers() {
        this.players.forEach(player => {
            this.drawPlayer(player);
        });
    }

    /**
     * Dibuja un jugador específico
     */
    drawPlayer(player) {
        const space = this.getSpaceById(player.position);
        if (!space) return;

        // Calcular posición considerando otros jugadores en la misma casilla
        const playersInSpace = this.players.filter(p => p.position === player.position);
        const playerIndex = playersInSpace.indexOf(player);
        const totalPlayers = playersInSpace.length;
        
        let offsetX = 0, offsetY = 0;
        if (totalPlayers > 1) {
            const angleOffset = (playerIndex / totalPlayers) * 2 * Math.PI;
            const offsetRadius = Math.max(10, 15 * this.scaleFactor);
            offsetX = Math.cos(angleOffset) * offsetRadius;
            offsetY = Math.sin(angleOffset) * offsetRadius;
        }

        const x = space.x + offsetX;
        const y = space.y + offsetY;

        // Tamaño del jugador escalable
        const playerRadius = Math.max(8, 12 * this.scaleFactor);

        // Sombra del jugador
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = Math.max(3, 5 * this.scaleFactor);
        this.ctx.shadowOffsetX = Math.max(1, 2 * this.scaleFactor);
        this.ctx.shadowOffsetY = Math.max(1, 2 * this.scaleFactor);

        // Ficha del jugador
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, playerRadius, 0, 2 * Math.PI);
        this.ctx.fill();

        // Borde de la ficha
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = player.currentTurn ? '#FFD700' : 'white';
        this.ctx.lineWidth = player.currentTurn ? Math.max(2, 3 * this.scaleFactor) : Math.max(1, 2 * this.scaleFactor);
        this.ctx.stroke();

        // Número del jugador
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${Math.max(6, 10 * this.scaleFactor)}px Arial`;
        this.ctx.fillText(player.id.toString(), x, y);

        // Indicador de cuñas
        if (player.getWedgeCount() > 0) {
            this.drawPlayerWedges(player, x, y);
        }
    }

    /**
     * Dibuja las cuñas del jugador
     */
    drawPlayerWedges(player, x, y) {
        const wedges = Object.keys(player.wedges).filter(cat => player.wedges[cat]);
        const wedgeOffset = Math.max(15, 20 * this.scaleFactor);
        const wedgeRadius = Math.max(3, 4 * this.scaleFactor);
        
        wedges.forEach((category, index) => {
            const angle = (index / 6) * 2 * Math.PI;
            const wedgeX = x + Math.cos(angle) * wedgeOffset;
            const wedgeY = y + Math.sin(angle) * wedgeOffset;
            
            this.ctx.fillStyle = this.colors[category];
            this.ctx.beginPath();
            this.ctx.arc(wedgeX, wedgeY, wedgeRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = Math.max(0.5, 1 * this.scaleFactor);
            this.ctx.stroke();
        });
    }

    /**
     * Actualiza la lista de jugadores
     */
    updatePlayers(players) {
        this.players = players;
        this.draw();
    }

    /**
     * Anima el movimiento de un jugador
     */
    animatePlayerMovement(player, fromPosition, toPosition, duration = 1000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const fromSpace = this.getSpaceById(fromPosition);
            const toSpace = this.getSpaceById(toPosition);
            
            if (!fromSpace || !toSpace) {
                resolve();
                return;
            }

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Función de easing
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                // Interpolar posición
                const currentX = fromSpace.x + (toSpace.x - fromSpace.x) * easeProgress;
                const currentY = fromSpace.y + (toSpace.y - fromSpace.y) * easeProgress;
                
                // Redibujar tablero
                this.draw();
                
                // Dibujar jugador en posición animada con tamaño escalado
                const playerRadius = Math.max(8, 12 * this.scaleFactor);
                this.ctx.fillStyle = player.color;
                this.ctx.beginPath();
                this.ctx.arc(currentX, currentY, playerRadius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = Math.max(2, 3 * this.scaleFactor);
                this.ctx.stroke();
                
                if (progress < 1) {
                    this.animationFrame = requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    /**
     * Obtiene una casilla por su ID
     */
    getSpaceById(id) {
        return this.spaces.find(space => space.id === id);
    }

    /**
     * Obtiene la categoría de una posición
     */
    getCategoryAtPosition(position) {
        const space = this.getSpaceById(position);
        return space ? space.category : null;
    }

    /**
     * Verifica si una posición es una casilla de cuña
     */
    isWedgeSpace(position) {
        const space = this.getSpaceById(position);
        return space ? space.type === 'wedge' : false;
    }

    /**
     * Verifica si una posición es el centro
     */
    isCenterSpace(position) {
        return position === 'center' || position === 48;
    }

    /**
     * Resalta una casilla específica
     */
    highlightSpace(position, color = '#FFD700') {
        const space = this.getSpaceById(position);
        if (!space) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = Math.max(2, 4 * this.scaleFactor);
        this.ctx.beginPath();
        this.ctx.arc(space.x, space.y, this.spaceSize + Math.max(2, 4 * this.scaleFactor), 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * Redimensiona el tablero automáticamente
     */
    resize(width = null, height = null) {
        // Mostrar indicador de redimensionamiento para cambios significativos
        const deviceInfo = this.getDeviceInfo();
        const oldWidth = this.width;
        const oldHeight = this.height;
        
        // Recalcular dimensiones dinámicas
        this.calculateDynamicDimensions(width, height);
        this.calculateScaleFactor();
        
        // Mostrar indicador si hay cambio significativo
        const sizeChange = Math.abs(this.width - oldWidth) + Math.abs(this.height - oldHeight);
        if (sizeChange > 50) {
            this.showResizeIndicator();
        }
          // Actualizar tamaño de casillas según dispositivo - reducido para tablero más pequeño
        const baseSpaceSize = deviceInfo.isMobile ? 10 : 12;
        this.spaceSize = Math.max(6, baseSpaceSize * this.scaleFactor);// Calcular radio mínimo necesario para evitar superposición de casillas
        const minSpacePerPosition = this.spaceSize * 2.5; // Espacio mínimo entre centros de casillas
        const minRadius = (this.totalSpaces * minSpacePerPosition) / (2 * Math.PI);
        const maxRadius = (Math.min(this.width, this.height) / 2 - 145) * 0.8; // Margen para etiquetas + reducción
        
        this.radius = Math.max(minRadius, maxRadius * 0.75); // Usar un porcentaje menor del radio máximo
        
        // Actualizar posiciones del centro
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Actualizar canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Aplicar escala de alta DPI si es necesario
        if (deviceInfo.devicePixelRatio > 1) {
            const ratio = deviceInfo.devicePixelRatio;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
            this.canvas.width = this.width * ratio;
            this.canvas.height = this.height * ratio;
            this.ctx.scale(ratio, ratio);
        }
        
        // Reconfigurar contexto después del redimensionamiento
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Recalcular posiciones de casillas
        this.spaces = this.initializeSpaces();
        this.draw();
        
        //console.log(`Tablero redimensionado a ${this.width}x${this.height}, factor de escala: ${this.scaleFactor.toFixed(2)}, dispositivo: ${deviceInfo.isMobile ? 'móvil' : deviceInfo.isTablet ? 'tablet' : 'desktop'}`);
    }    /**
     * Configura el observador de redimensionamiento automático
     */
    setupAutoResize() {
        // Inicializar variables de control
        this.resizeObserverPaused = false;
        this.resizeThreshold = 10; // Threshold para cambios significativos
        this.lastObservedWidth = null;
        this.lastObservedHeight = null;
        
        // Observer para cambios de tamaño del contenedor
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                // Si el observer está pausado, no redimensionar
                if (this.resizeObserverPaused) {
                    // console.log('🔍 DEBUG BOARD: ResizeObserver: redimensionamiento ignorado (pausado durante animaciones)');
                    return;
                }
                
                // Obtener dimensiones actuales del contenedor
                const container = this.canvas.parentElement;
                const rect = container.getBoundingClientRect();
                const currentWidth = rect.width;
                const currentHeight = rect.height;
                
                //console.log('🔍 DEBUG BOARD: ResizeObserver detectó cambio:', {
                //    currentWidth,
                //    currentHeight,
                //    lastWidth: this.lastObservedWidth,
                //    lastHeight: this.lastObservedHeight
                //});
                
                // Comparar con las últimas dimensiones observadas
                if (this.lastObservedWidth !== null && this.lastObservedHeight !== null) {
                    const widthChange = Math.abs(currentWidth - this.lastObservedWidth);
                    const heightChange = Math.abs(currentHeight - this.lastObservedHeight);
                    
                    //console.log('🔍 DEBUG BOARD: Cambios detectados:', {
                    //    widthChange,
                    //    heightChange,
                    //    threshold: this.resizeThreshold
                    //});
                    
                    // Solo redimensionar si el cambio es significativo
                    if (widthChange < this.resizeThreshold && heightChange < this.resizeThreshold) {
                        //console.log('🔍 DEBUG BOARD: Cambio insignificante, ignorando redimensionamiento');
                        return;
                    }
                }
                
                // Actualizar últimas dimensiones observadas
                this.lastObservedWidth = currentWidth;
                this.lastObservedHeight = currentHeight;
                
                //console.log('🔍 DEBUG BOARD: Iniciando redimensionamiento con debounce');
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    //console.log('🔍 DEBUG BOARD: Ejecutando resize después del debounce');
                    this.resize();
                }, 150); // Debounce aumentado a 150ms para mejor rendimiento
            });
            
            this.resizeObserver.observe(this.canvas.parentElement);
            //console.log('🔍 DEBUG BOARD: ResizeObserver configurado y observando contenedor');
        }
        
        // Fallback para navegadores sin ResizeObserver
        window.addEventListener('resize', () => {
            // Si el observer está pausado, no redimensionar
            if (this.resizeObserverPaused) {
                //console.log('🔍 DEBUG BOARD: Window resize ignorado (ResizeObserver pausado)');
                return;
            }
            
            //console.log('🔍 DEBUG BOARD: Window resize detectado, iniciando redimensionamiento');
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                //console.log('🔍 DEBUG BOARD: Ejecutando resize desde window resize');
                this.resize();
            }, 150);
        });
    }

    /**
     * Pausa el ResizeObserver para evitar redimensionamientos durante animaciones
     */
    pauseResizeObserver() {
        this.resizeObserverPaused = true;
        //console.log('🔍 DEBUG BOARD: ResizeObserver pausado durante animaciones');
    }

    /**
     * Reanuda el ResizeObserver después de las animaciones
     */
    resumeResizeObserver() {
        this.resizeObserverPaused = false;
        //console.log('🔍 DEBUG BOARD: ResizeObserver reanudado');
    }

    /**
     * Limpia los observadores cuando se destruye el tablero
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * Obtiene información del tablero para debug
     */
    getDebugInfo() {
        return {
            totalSpaces: this.totalSpaces,
            dimensions: { width: this.width, height: this.height },
            center: { x: this.centerX, y: this.centerY },
            radius: this.radius,
            playersCount: this.players.length,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Detecta la orientación y características del dispositivo
     */
    getDeviceInfo() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;
        const isMobile = width <= 768;
        const isTablet = width > 768 && width <= 1024;
        const isDesktop = width > 1024;
        
        return {
            width,
            height,
            isLandscape,
            isPortrait: !isLandscape,
            isMobile,
            isTablet,
            isDesktop,
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    /**
     * Calcula las dimensiones dinámicas basadas en el contenedor
     */
    calculateDynamicDimensions(width = null, height = null) {
        const container = this.canvas.parentElement;
        
        if (width && height) {
            this.width = width;
            this.height = height;
        } else {
            // Obtener dimensiones del contenedor
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            
            // Validar que las dimensiones del contenedor sean válidas
            if (!isFinite(containerWidth) || !isFinite(containerHeight) || containerWidth <= 0 || containerHeight <= 0) {
                console.warn('Dimensiones inválidas del contenedor:', { containerWidth, containerHeight });
                // Usar dimensiones por defecto
                this.width = 400;
                this.height = 400;
            } else {
                // Detectar si estamos en móvil o tablet
                const isMobile = window.innerWidth <= 768;
                const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
                
                // Calcular dimensiones óptimas manteniendo aspect ratio
                const aspectRatio = isMobile ? 1 : 4 / 3; // Cuadrado en móvil, 4:3 en desktop
                let targetWidth = containerWidth - (isMobile ? 20 : 40); // Menos margen en móvil
                let targetHeight = containerHeight - (isMobile ? 20 : 40);
                
                // Ajustar para mantener aspect ratio
                if (targetWidth / targetHeight > aspectRatio) {
                    targetWidth = targetHeight * aspectRatio;
                } else {
                    targetHeight = targetWidth / aspectRatio;
                }
                
                // Establecer límites adaptativos según dispositivo
                const minSize = isMobile ? 250 : isTablet ? 300 : 350;
                const maxSize = isMobile ? 400 : isTablet ? 600 : 800;
                
                this.width = Math.max(minSize, Math.min(maxSize, targetWidth));
                this.height = Math.max(minSize * (1/aspectRatio), Math.min(maxSize * (1/aspectRatio), targetHeight));
            }
        }        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Calcular radio básico con margen suficiente para etiquetas de categorías
        // Etiquetas necesitan ~80px + gradiente ~25px + margen seguridad ~40px = 145px
        // Reducir el tamaño del tablero usando un porcentaje menor
        this.radius = (Math.min(this.width, this.height) / 2 - 145) * 0.8;
        
        // Validar que todos los valores sean finitos
        if (!isFinite(this.width) || !isFinite(this.height) || !isFinite(this.centerX) || !isFinite(this.centerY) || !isFinite(this.radius)) {
            console.error('Valores no finitos detectados en calculateDynamicDimensions:', {
                width: this.width,
                height: this.height,
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius
            });
            // Establecer valores por defecto
            this.width = 400;
            this.height = 400;
            this.centerX = 200;
            this.centerY = 200;
            this.radius = 120;
        } else {
            //console.log('Dimensiones calculadas correctamente:', {
            //    width: this.width,
            //    height: this.height,
            //    centerX: this.centerX,
            //    centerY: this.centerY,
            //    radius: this.radius
            //});
        }
    }

    /**
     * Calcula el factor de escala basado en las dimensiones actuales
     */
    calculateScaleFactor() {
        const baseSize = 600; // Tamaño base de referencia
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Calcular factor base
        this.scaleFactor = Math.min(this.width, this.height) / baseSize;
        
        // Ajustar para dispositivos de alta densidad
        this.scaleFactor *= Math.min(devicePixelRatio, 2);
        
        // Detectar dispositivo y ajustar límites
        const isMobile = window.innerWidth <= 768;
        const minScale = isMobile ? 0.4 : 0.5;
        const maxScale = isMobile ? 1.2 : 1.5;
        
        // Limitar el factor de escala
        this.scaleFactor = Math.max(minScale, Math.min(maxScale, this.scaleFactor));
    }
    
    /**
     * Muestra un indicador de redimensionamiento
     */
    showResizeIndicator() {
        if (this.resizeIndicator) return;
        
        this.resizeIndicator = document.createElement('div');
        this.resizeIndicator.className = 'resize-indicator';
        this.resizeIndicator.innerHTML = `
            <div class="resize-indicator-content">
                <div class="spinner"></div>
                <span>Ajustando tablero...</span>
            </div>
        `;
        
        document.body.appendChild(this.resizeIndicator);
        
        // Auto-hide después de 2 segundos
        setTimeout(() => {
            this.hideResizeIndicator();
        }, 2000);
    }

    /**
     * Oculta el indicador de redimensionamiento
     */
    hideResizeIndicator() {
        if (this.resizeIndicator) {
            this.resizeIndicator.remove();
            this.resizeIndicator = null;
        }
    }
}

// Polyfill para roundRect si no está disponible
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}
