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
     * Detecta si es un dispositivo móvil
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }
    
    /**
     * Detecta si soporta eventos táctiles
     */
    detectTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Inicializa las optimizaciones móviles
     */
    init() {
        if (this.isMobile || this.isTouch) {
            console.log('📱 Dispositivo móvil detectado, aplicando optimizaciones...');
            
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
