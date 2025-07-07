/**
 * Utilidades específicas para móviles
 * Detecta dispositivos móviles y aplica optimizaciones
 */
class MobileUtils {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTouch = this.detectTouch();
        
        this.init();
    }
    
    /**
     * Detecta si es un dispositivo móvil de forma precisa
     */
    detectMobile() {
        // Combinar múltiples factores para una detección más precisa
        const hasSmallScreen = window.screen.width <= 768 || window.screen.height <= 768;
        const hasMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasMobileAPI = navigator.userAgentData?.mobile === true;
        const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
        const hasTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && 
                        !/Windows NT/i.test(navigator.userAgent);
        
        // Excluir explícitamente sistemas de escritorio
        const isDesktop = /Windows NT|Macintosh|Linux/i.test(navigator.userAgent) && 
                         !hasMobileUserAgent && 
                         !hasMobileAPI;
        
        if (isDesktop && !hasMobileUserAgent) {
            return false;
        }
        
        return hasMobileUserAgent || hasMobileAPI || (hasSmallScreen && hasTouch);
    }
    
    /**
     * Detecta si soporta eventos táctiles (pero no es suficiente para determinar si es móvil)
     */
    detectTouch() {
        return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && 
               !/Windows NT/i.test(navigator.userAgent); // Excluir Windows táctiles de escritorio
    }
    
    /**
     * Inicializa las optimizaciones móviles
     */
    init() {
        // Usar la detección mejorada para aplicar optimizaciones
        if (this.isMobile) {
            console.log('📱 Dispositivo móvil detectado, aplicando optimizaciones...');
            
            // Track detección de dispositivo móvil
            if (window.trivialAnalytics && typeof window.trivialAnalytics.trackTechnicalEvent === 'function') {
                window.trivialAnalytics.trackTechnicalEvent('mobile_detected', {
                    isMobile: this.isMobile,
                    isTouch: this.isTouch,
                    userAgent: navigator.userAgent.substring(0, 100), // Limitar longitud
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height
                });
            }
            
            // Añadir clase CSS para móviles
            document.body.classList.add('mobile-device');
            
            // Aplicar optimizaciones
            this.setupTouchOptimizations();
            this.setupViewportOptimizations();
            this.setupPerformanceOptimizations();
            
            console.log('✅ Optimizaciones móviles aplicadas');
        }
    }
    
    /**
     * Configura optimizaciones táctiles
     */
    setupTouchOptimizations() {
        // Prevenir zoom accidental en inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                document.body.style.transform = 'scale(1)';
            });
        });
        
        // Mejorar rendimiento de scroll
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Desactivar selección de texto en elementos de UI
        const uiElements = document.querySelectorAll('.btn, .menu-option, .challenge-answer-btn, [role="button"]');
        uiElements.forEach(element => {
            element.style.webkitUserSelect = 'none';
            element.style.userSelect = 'none';
        });
    }
    
    /**
     * Configura optimizaciones de viewport
     */
    setupViewportOptimizations() {
        // Ajustar altura de viewport para móviles
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });
    }
    
    /**
     * Configura optimizaciones de rendimiento
     */
    setupPerformanceOptimizations() {
        // Reducir animaciones en dispositivos lentos
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.body.classList.add('reduced-motion');
        }
        
        // Optimizar scroll
        let ticking = false;
        const updateScrollPosition = () => {
            ticking = false;
            // Aquí se pueden añadir optimizaciones adicionales de scroll
        };
        
        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }
    
    /**
     * Fuerza un repaint para resolver problemas visuales en iOS
     */
    forceRepaint() {
        const body = document.body;
        body.style.display = 'none';
        body.offsetHeight; // Trigger reflow
        body.style.display = '';
    }
    
    /**
     * Maneja la orientación del dispositivo
     */
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Track cambio de orientación
            if (window.trivialAnalytics && typeof window.trivialAnalytics.trackAccessibilityFeature === 'function') {
                window.trivialAnalytics.trackAccessibilityFeature('orientation_change', 'device_rotation', {
                    orientation: screen.orientation?.type || 'unknown',
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight
                });
            }
            
            setTimeout(() => {
                this.forceRepaint();
                // Redimensionar elementos si es necesario
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });
    }
}

// Inicializar utilidades móviles cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileUtils = new MobileUtils();
    });
} else {
    window.mobileUtils = new MobileUtils();
}

// Exportar para uso global
window.MobileUtils = MobileUtils;
