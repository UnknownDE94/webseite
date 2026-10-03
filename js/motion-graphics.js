/* ==========================================================================
   Werringloer Komponentenmanagement – Motion Graphics & SaaS Integration v2
   ========================================================================== */

(function() {
  'use strict';

  // ========================================================================
  // 1. Intersection Observer für Scroll-Animationen
  // ========================================================================

  const ScrollAnimationObserver = {
    init() {
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver nicht unterstützt');
        return;
      }

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        document.querySelectorAll('.anim-on-scroll').forEach(el => {
          el.classList.add('is-visible');
        });
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
      });

      document.querySelectorAll('.anim-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }
  };

  // ========================================================================
  // 2. Counter Animation für Statistiken
  // ========================================================================

  const CounterAnimation = {
    animateValue(element, start, end, duration) {
      if (typeof element.textContent === 'undefined') return;

      const range = end - start;
      const increment = range / (duration / 16);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
          element.textContent = Math.round(end).toLocaleString('de-DE');
          clearInterval(timer);
        } else {
          element.textContent = Math.round(current).toLocaleString('de-DE');
        }
      }, 16);
    },

    initCounters() {
      document.querySelectorAll('[data-counter]').forEach(element => {
        const target = parseInt(element.getAttribute('data-counter'), 10);
        const duration = parseInt(element.getAttribute('data-duration') || '2000', 10);

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateValue(element, 0, target, duration);
              observer.unobserve(element);
            }
          });
        }, { threshold: 0.5 });

        observer.observe(element);
      });
    }
  };

  // ========================================================================
  // 3. SVG Line Drawing Animation
  // ========================================================================

  const SVGLineAnimation = {
    initLineDrawing() {
      document.querySelectorAll('[data-draw-line]').forEach(svg => {
        const lines = svg.querySelectorAll('path, line');
        lines.forEach(line => {
          const length = line.getTotalLength();
          line.setAttribute('stroke-dasharray', length);
          line.setAttribute('stroke-dashoffset', length);
          line.style.animation = `drawStroke ${line.getAttribute('data-duration') || '2s'} ease-out forwards`;
          line.style.animationDelay = line.getAttribute('data-delay') || '0s';
        });
      });
    }
  };

  // ========================================================================
  // 4. Parallax & Background Effects
  // ========================================================================

  const ParallaxEffect = {
    init() {
      const parallaxElements = document.querySelectorAll('[data-parallax]');
      if (parallaxElements.length === 0) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;

      window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;

        parallaxElements.forEach(element => {
          const speed = parseFloat(element.getAttribute('data-parallax') || '0.5');
          const offset = scrollPosition * speed;
          element.style.transform = `translateY(${offset}px)`;
        });
      }, { passive: true });
    }
  };

  // ========================================================================
  // 5. Tooltip & Hover Effects
  // ========================================================================

  const HoverEffects = {
    init() {
      document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', (e) => {
          const tooltip = document.createElement('div');
          tooltip.className = 'tooltip';
          tooltip.textContent = element.getAttribute('data-tooltip');
          tooltip.style.cssText = `
            position: absolute;
            background: #0c3a24;
            color: #d4ec5f;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            animation: fadeInUp 0.3s ease-out;
          `;

          document.body.appendChild(tooltip);

          const rect = element.getBoundingClientRect();
          tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
          tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';

          element.addEventListener('mouseleave', () => {
            tooltip.remove();
          });
        });
      });
    }
  };

  // ========================================================================
  // 6. SaaS Integration Module
  // ========================================================================

  const SaaSIntegration = {
    config: {
      apiEndpoint: 'https://api.werringloer.de',
      version: '2.0.0',
      features: []
    },

    async init(config = {}) {
      this.config = { ...this.config, ...config };
      await this.loadFeatures();
      this.setupServiceWorkers();
      this.initializeDataSync();
    },

    async loadFeatures() {
      try {
        const response = await fetch(`${this.config.apiEndpoint}/features`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        this.config.features = data.features || [];
        console.log('SaaS Features geladen:', this.config.features);
      } catch (error) {
        console.warn('SaaS Features konnten nicht geladen werden:', error);
      }
    },

    setupServiceWorkers() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('Service Worker Registration fehlgeschlagen:', err);
        });
      }
    },

    initializeDataSync() {
      // Sync-Mechanismus für Offline-First-Funktionalität
      if ('SyncManager' in window) {
        navigator.serviceWorker.ready.then(reg => {
          reg.sync.register('sync-data');
        });
      }
    },

    // Modul für externe Datensynchronisation
    async syncExternalData(source) {
      try {
        const response = await fetch(`${this.config.apiEndpoint}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source })
        });
        return await response.json();
      } catch (error) {
        console.error('Sync-Fehler:', error);
        return null;
      }
    },

    // Modul für Analytics & Tracking
    trackEvent(eventName, eventData = {}) {
      const event = {
        name: eventName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...eventData
      };

      // Senden an Analytics-Endpoint
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${this.config.apiEndpoint}/events`, JSON.stringify(event));
      }

      // Auch lokal speichern
      this.storeEvent(event);
    },

    storeEvent(event) {
      try {
        const events = JSON.parse(localStorage.getItem('_wk_events') || '[]');
        events.push(event);
        if (events.length > 100) events.shift();
        localStorage.setItem('_wk_events', JSON.stringify(events));
      } catch (e) {
        // localStorage nicht verfügbar
      }
    },

    // Modul für A/B Testing
    getTestVariant(testName) {
      const variants = {
        'cta-color': Math.random() > 0.5 ? 'lime' : 'green',
        'form-position': Math.random() > 0.5 ? 'top' : 'bottom',
        'hero-style': Math.random() > 0.5 ? 'dark' : 'light'
      };
      return variants[testName] || null;
    },

    // Modul für Personalisierung
    personalize(userId) {
      const preferences = {
        theme: localStorage.getItem(`user_${userId}_theme`) || 'light',
        language: navigator.language.split('-')[0],
        customizations: {}
      };

      // CSS-Variablen basierend auf Präferenzen anwenden
      if (preferences.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      return preferences;
    }
  };

  // ========================================================================
  // 7. Performance Monitoring
  // ========================================================================

  const PerformanceMonitor = {
    init() {
      if (!('PerformanceObserver' in window)) return;

      // Core Web Vitals tracken
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.value.toFixed(2)}ms`);
        }
      }).observe({ entryTypes: ['navigation', 'resource'] });

      // Longest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }
  };

  // ========================================================================
  // 8. Staggered Animation Manager
  // ========================================================================

  const StaggeredAnimationManager = {
    init() {
      document.querySelectorAll('[data-stagger]').forEach(container => {
        const delay = parseInt(container.getAttribute('data-stagger-delay') || '100');
        const children = container.querySelectorAll('[data-stagger-item]');

        children.forEach((child, index) => {
          child.style.animationDelay = `${index * delay}ms`;
          child.classList.add('anim-stagger-item');
        });
      });
    }
  };

  // ========================================================================
  // 9. Custom Event System
  // ========================================================================

  const EventBus = {
    listeners: {},

    on(eventName, callback) {
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }
      this.listeners[eventName].push(callback);
    },

    emit(eventName, data) {
      if (!this.listeners[eventName]) return;
      this.listeners[eventName].forEach(callback => callback(data));
    },

    off(eventName, callback) {
      if (!this.listeners[eventName]) return;
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }
  };

  // ========================================================================
  // 10. Initialization
  // ========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    ScrollAnimationObserver.init();
    CounterAnimation.initCounters();
    SVGLineAnimation.initLineDrawing();
    ParallaxEffect.init();
    HoverEffects.init();
    StaggeredAnimationManager.init();
    PerformanceMonitor.init();

    // Initialize SaaS Integration
    SaaSIntegration.init({
      apiEndpoint: document.documentElement.getAttribute('data-api-endpoint') || 'https://api.werringloer.de'
    });

    // Track page load event
    SaaSIntegration.trackEvent('page_load', {
      page: window.location.pathname,
      referrer: document.referrer
    });

    // Emit ready event
    EventBus.emit('motion-graphics:ready', { timestamp: Date.now() });
  });

  // ========================================================================
  // 11. Public API
  // ========================================================================

  window.WerringloerMotionGraphics = {
    SaaSIntegration,
    EventBus,
    CounterAnimation,
    SVGLineAnimation,
    ParallaxEffect,
    version: '2.0.0'
  };

  console.log('Werringloer Motion Graphics v2.0 - Geladen');
})();
