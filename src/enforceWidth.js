(function() {
  'use strict';

  const TARGET_WIDTH = 800;

  function enforceWidth() {
    const elements = [document.documentElement, document.body, document.getElementById('root')];
    elements.forEach(el => {
      if (el) {
        el.style.setProperty('width', TARGET_WIDTH + 'px', 'important');
        el.style.setProperty('min-width', TARGET_WIDTH + 'px', 'important');
        el.style.setProperty('max-width', TARGET_WIDTH + 'px', 'important');
        el.style.setProperty('resize', 'none', 'important');
      }
    });
  }

  enforceWidth();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceWidth);
  }

  setInterval(enforceWidth, 50);

  window.addEventListener('resize', function(e) {
    e.preventDefault();
    e.stopPropagation();
    enforceWidth();
    return false;
  }, true);

  Object.defineProperty(window, 'innerWidth', {
    value: TARGET_WIDTH,
    writable: false,
    configurable: false
  });

  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
    if (property === 'width' && 
       (this.parentElement === document.documentElement || this.parentElement === document.body)) {
      return originalSetProperty.call(this, property, TARGET_WIDTH + 'px', 'important');
    }
    return originalSetProperty.call(this, property, value, priority);
  };

})();
