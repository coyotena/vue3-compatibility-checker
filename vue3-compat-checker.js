;(function(global) {
  // ==============================================
  // 1. 配置项
  // ==============================================
  var CONFIG = {
    apiUrl: '/api/vue3-compatibility',  // 上报接口地址
    method: 'POST',                      // 请求方法
    enabled: true,                       // 是否启用上报
    timeout: 5000,                       // 超时时间(ms)
    debug: false,                        // 是否开启调试日志
    autoReport: true,                    // 是否自动上报
  };

  // 允许外部配置
  if (global.Vue3CompatConfig) {
    for (var key in global.Vue3CompatConfig) {
      if (global.Vue3CompatConfig.hasOwnProperty(key) && CONFIG.hasOwnProperty(key)) {
        CONFIG[key] = global.Vue3CompatConfig[key];
      }
    }
  }

  // ==============================================
  // 2. 安全日志函数
  // ==============================================
  function log(msg, isError) {
    if (!CONFIG.debug) return;
    try {
      if (isError && console.error) console.error('[Vue3检测]', msg);
      else if (console.log) console.log('[Vue3检测]', msg);
    } catch(e) {}
  }

  // ==============================================
  // 3. 安全检测工具函数
  // ==============================================
  function safeExec(fn, fallback) {
    try {
      return fn();
    } catch(e) {
      return fallback !== undefined ? fallback : false;
    }
  }

  function hasProp(obj, prop) {
    if (!obj) return false;
    try {
      return typeof obj[prop] !== 'undefined';
    } catch(e) {
      return false;
    }
  }

  // ==============================================
  // 4. 特性检测模块
  // ==============================================
  var FeatureDetector = {
    // ES6特性检测
    es6: function() {
      return {
        proxy: safeExec(function() { return typeof Proxy !== 'undefined'; }),
        reflect: safeExec(function() { return typeof Reflect !== 'undefined'; }),
        promise: safeExec(function() { return typeof Promise !== 'undefined'; }),
        symbol: safeExec(function() { return typeof Symbol !== 'undefined'; }),
        map: safeExec(function() { return typeof Map !== 'undefined'; }),
        set: safeExec(function() { return typeof Set !== 'undefined'; }),
        weakMap: safeExec(function() { return typeof WeakMap !== 'undefined'; }),
        weakSet: safeExec(function() { return typeof WeakSet !== 'undefined'; }),
        objectAssign: safeExec(function() { return typeof Object.assign === 'function'; }),
        arrayIncludes: safeExec(function() { return 'includes' in Array.prototype; }),
        stringIncludes: safeExec(function() { return 'includes' in String.prototype; }),
        arrayFrom: safeExec(function() { return typeof Array.from === 'function'; }),
        asyncAwait: safeExec(function() { return typeof Promise !== 'undefined'; }),
        objectKeys: safeExec(function() { return typeof Object.keys === 'function'; }),
        objectEntries: safeExec(function() { return typeof Object.entries === 'function'; }),
        objectValues: safeExec(function() { return typeof Object.values === 'function'; }),
        objectFromEntries: safeExec(function() { return typeof Object.fromEntries === 'function'; }),
        arrowFunctions: safeExec(function() { return true; }),
        templateLiterals: safeExec(function() { return true; }),
        letConst: safeExec(function() { return true; }),
        classes: safeExec(function() { return true; }),
        defaultParams: safeExec(function() { return true; }),
        restParams: safeExec(function() { return true; }),
        spread: safeExec(function() { return true; }),
        destructuring: safeExec(function() { return true; }),
        forOf: safeExec(function() { return true; })
      };
    },

    // ES2016特性
    es2016: function() {
      return {
        arrayPrototypeIncludes: safeExec(function() { return 'includes' in Array.prototype; }),
        exponentiationOperator: safeExec(function() { return true; })
      };
    },

    // ES2017特性
    es2017: function() {
      return {
        objectEntries: safeExec(function() { return typeof Object.entries === 'function'; }),
        objectValues: safeExec(function() { return typeof Object.values === 'function'; }),
        stringPadding: safeExec(function() { return 'padStart' in String.prototype && 'padEnd' in String.prototype; }),
        asyncAwait: safeExec(function() { return typeof Promise !== 'undefined'; })
      };
    },

    // ES2018特性
    es2018: function() {
      return {
        objectSpread: safeExec(function() { return true; }),
        promiseFinally: safeExec(function() { return 'finally' in (Promise.prototype || {}); }),
        asyncIteration: safeExec(function() { return false; })
      };
    },

    // CSS特性检测
    css: function() {
      var el = null;
      try { el = document.createElement('div'); } catch(e) { return {}; }

      return {
        flexbox: safeExec(function() { el.style.display = 'flex'; return el.style.display === 'flex'; }),
        grid: safeExec(function() { el.style.display = 'grid'; return el.style.display === 'grid'; }),
        cssVariables: safeExec(function() { el.style.setProperty('--test', 'red'); return el.style.getPropertyValue('--test') === 'red'; }),
        transform: safeExec(function() { el.style.transform = 'translate(10px)'; return el.style.transform !== ''; }),
        transition: safeExec(function() { el.style.transition = 'all 0.3s'; return el.style.transition !== ''; }),
        animation: safeExec(function() { el.style.animation = 'fadeIn 1s'; return el.style.animation !== ''; }),
        calc: safeExec(function() { el.style.width = 'calc(100% - 20px)'; return el.style.width !== ''; }),
        filter: safeExec(function() { el.style.filter = 'blur(5px)'; return el.style.filter !== ''; })
      };
    },

    // Web APIs检测
    webAPIs: function() {
      var webglInfo = this.webGL();

      return {
        webgl: webglInfo.supported,
        webglVersion: webglInfo.version,
        serviceWorker: safeExec(function() { return 'serviceWorker' in navigator; }),
        localStorage: safeExec(function() { return 'localStorage' in window; }),
        sessionStorage: safeExec(function() { return 'sessionStorage' in window; }),
        indexDB: safeExec(function() { return 'indexedDB' in window; }),
        fetch: safeExec(function() { return 'fetch' in window; }),
        geolocation: safeExec(function() { return 'geolocation' in navigator; }),
        webWorkers: safeExec(function() { return 'Worker' in window; }),
        webSockets: safeExec(function() { return 'WebSocket' in window; }),
        intersectionObserver: safeExec(function() { return 'IntersectionObserver' in window; }),
        mutationObserver: safeExec(function() { return 'MutationObserver' in window; }),
        performance: safeExec(function() { return 'performance' in window; }),
        performanceObserver: safeExec(function() { return 'PerformanceObserver' in window; }),
        navigatorShare: safeExec(function() { return 'share' in navigator; }),
        clipboard: safeExec(function() { return 'clipboard' in navigator; }),
        es6Modules: safeExec(function() { return 'noModule' in (HTMLScriptElement.prototype || {}); }),
        dynamicImport: safeExec(function() { return false; })
      };
    },

    webGL: function() {
      try {
        var canvas = document.createElement('canvas');
        if (canvas.getContext('webgl2')) {
          return { supported: true, version: 'WebGL 2.0' };
        }
        if (canvas.getContext('webgl')) {
          return { supported: true, version: 'WebGL 1.0' };
        }
        return { supported: false, version: '不支持' };
      } catch(e) {
        return { supported: false, version: '检测失败' };
      }
    }
  };

  // ==============================================
  // 5. 浏览器检测模块
  // ==============================================
  var BrowserDetector = {
    detect: function() {
      var ua = navigator.userAgent || '';
      var result = {
        name: 'Unknown',
        version: 0,
        isIE: false,
        fullVersion: 'Unknown',
        userAgent: ua
      };

      // IE检测
      if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
        result.isIE = true;
        result.name = 'Internet Explorer';
        var msie = ua.indexOf('MSIE ');
        if (msie > -1) {
          result.version = parseFloat(ua.substring(msie + 5, ua.indexOf('.', msie)));
        } else {
          result.version = 11;
        }
      }
      // Chrome
      else if (ua.indexOf('Chrome') > -1 && ua.indexOf('OPR') === -1) {
        result.name = 'Chrome';
        var match = ua.match(/Chrome\/(\d+\.?\d*)/);
        if (match) result.version = parseFloat(match[1]);
      }
      // Firefox
      else if (ua.indexOf('Firefox') > -1) {
        result.name = 'Firefox';
        var match = ua.match(/Firefox\/(\d+\.?\d*)/);
        if (match) result.version = parseFloat(match[1]);
      }
      // Safari
      else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        result.name = 'Safari';
        var match = ua.match(/Version\/(\d+\.?\d*)/);
        if (match) result.version = parseFloat(match[1]);
      }
      // Edge
      else if (ua.indexOf('Edg') > -1) {
        result.name = 'Edge (Chromium)';
        var match = ua.match(/Edg\/(\d+\.?\d*)/);
        if (match) result.version = parseFloat(match[1]);
      }
      // Opera
      else if (ua.indexOf('OPR') > -1) {
        result.name = 'Opera';
        var match = ua.match(/OPR\/(\d+\.?\d*)/);
        if (match) result.version = parseFloat(match[1]);
      }

      result.fullVersion = result.version.toString();
      return result;
    }
  };

  // ==============================================
  // 6. 操作系统检测模块
  // ==============================================
  var OSDetector = {
    detect: function() {
      var ua = (navigator.userAgent || '').toLowerCase();
      var result = { name: 'Unknown', version: 'Unknown' };

      if (ua.indexOf('windows') > -1) {
        result.name = 'Windows';
        if (ua.indexOf('windows nt 10.0') > -1) result.version = '10';
        else if (ua.indexOf('windows nt 6.3') > -1) result.version = '8.1';
        else if (ua.indexOf('windows nt 6.2') > -1) result.version = '8';
        else if (ua.indexOf('windows nt 6.1') > -1) result.version = '7';
        else if (ua.indexOf('windows nt 6.0') > -1) result.version = 'Vista';
        else if (ua.indexOf('windows nt 5.1') > -1) result.version = 'XP';
        else if (ua.indexOf('windows nt 5.0') > -1) result.version = '2000';
      }
      else if (ua.indexOf('mac os') > -1) {
        result.name = 'macOS';
        var match = ua.match(/mac os x (\d+[._]\d+[._]?\d*)/);
        if (match) result.version = match[1].replace(/_/g, '.');
      }
      else if (ua.indexOf('android') > -1) {
        result.name = 'Android';
        var match = ua.match(/android (\d+\.?\d*)/);
        if (match) result.version = match[1];
      }
      else if (ua.indexOf('linux') > -1) {
        result.name = 'Linux';
      }
      else if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) {
        result.name = 'iOS';
        var match = ua.match(/os (\d+[._]\d+)/);
        if (match) result.version = match[1].replace(/_/g, '.');
      }

      return result;
    }
  };

  // ==============================================
  // 7. 硬件信息检测模块
  // ==============================================
  var HardwareDetector = {
    detect: function() {
      return {
        cpuCores: safeExec(function() { return navigator.hardwareConcurrency || 'Unknown'; }),
        memory: safeExec(function() { return navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown'; }),
        screenWidth: safeExec(function() { return window.screen.width || 0; }),
        screenHeight: safeExec(function() { return window.screen.height || 0; }),
        colorDepth: safeExec(function() { return window.screen.colorDepth || 0; }),
        pixelRatio: safeExec(function() { return window.devicePixelRatio || 1; }),
        gpu: {
          webgl: safeExec(function() { return FeatureDetector.webGL().supported; }),
          webglVersion: safeExec(function() { return FeatureDetector.webGL().version; }),
          vendor: safeExec(function() { return 'Unknown'; }),
          renderer: safeExec(function() { return 'Unknown'; })
        }
      };
    }
  };

  // ==============================================
  // 8. 兼容性分析模块
  // ==============================================
  var CompatibilityAnalyzer = {
    analyze: function(browser, features) {
      var issues = [];
      var coreFeatures = ['proxy', 'reflect', 'promise', 'symbol', 'map', 'set'];
      var missingCount = 0;

      // 检查IE
      if (browser.isIE) {
        issues.push('Internet Explorer 不支持 Vue3');
        missingCount = coreFeatures.length;
      }

      // 检查核心特性
      for (var i = 0; i < coreFeatures.length; i++) {
        if (!features[coreFeatures[i]]) {
          missingCount++;
          issues.push('不支持 ' + coreFeatures[i].toUpperCase() + ' API');
        }
      }

      // 判断兼容性等级
      var level, description;
      if (missingCount === 0 && !browser.isIE) {
        level = 'compatible';
        description = '完全兼容';
      } else if (missingCount <= 3) {
        level = 'partial';
        description = '部分兼容';
      } else {
        level = 'incompatible';
        description = '不兼容';
      }

      return { level: level, description: description, issues: issues };
    }
  };

  // ==============================================
  // 9. 构建完整JSON报告（保持原有格式）
  // ==============================================
  function buildReport() {
    // 收集所有数据
    var browser = BrowserDetector.detect();
    var os = OSDetector.detect();
    var hardware = HardwareDetector.detect();
    var es6Features = FeatureDetector.es6();
    var es2016Features = FeatureDetector.es2016();
    var es2017Features = FeatureDetector.es2017();
    var es2018Features = FeatureDetector.es2018();
    var cssFeatures = FeatureDetector.css();
    var webAPIs = FeatureDetector.webAPIs();
    var compatibility = CompatibilityAnalyzer.analyze(browser, es6Features);

    // 构建完整报告（与原有JSON格式完全一致）
    var report = {
      meta: {
        tool: 'Vue3 Compatibility Detector',
        version: '3.0',
        generatedAt: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent || ''
      },
      detection: {
        time: new Date().toISOString(),
        compatibility: {
          level: compatibility.level,
          description: compatibility.description
        },
        browser: {
          name: browser.name,
          version: browser.version,
          isIE: browser.isIE
        },
        os: {
          name: os.name,
          version: os.version
        },
        hardware: hardware,
        features: {
          es6: es6Features,
          es2016: es2016Features,
          es2017: es2017Features,
          es2018: es2018Features,
          css: cssFeatures,
          webAPIs: webAPIs
        }
      },
      vue3Requirements: {
        browsers: {
          chrome: 64,
          firefox: 59,
          safari: 11,
          edge: 79,
          opera: 51,
          ie: null,
          samsung: 9,
          uc: 12
        },
        coreFeatures: ['Proxy', 'Reflect', 'Promise', 'Symbol', 'Map', 'Set']
      },
      issues: compatibility.issues
    };

    return report;
  }

  // ==============================================
  // 10. 数据上报模块
  // ==============================================
  function reportData(data) {
    if (!CONFIG.enabled) return;
    if (!CONFIG.apiUrl) return;

    try {
      var xhr = null;
      if (typeof XMLHttpRequest !== 'undefined') {
        xhr = new XMLHttpRequest();
      } else if (typeof ActiveXObject !== 'undefined') {
        try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
        try { if (!xhr) xhr = new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
      }

      if (!xhr) {
        log('无法创建XHR对象', true);
        return;
      }

      xhr.open(CONFIG.method, CONFIG.apiUrl, true);
      xhr.timeout = CONFIG.timeout;

      if (CONFIG.method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          log('上报成功');
        } else {
          log('上报失败: HTTP ' + xhr.status, true);
        }
      };

      xhr.onerror = function() {
        log('上报失败: 网络错误', true);
      };

      xhr.ontimeout = function() {
        log('上报失败: 超时', true);
      };

      xhr.send(JSON.stringify(data));

    } catch(e) {
      log('上报失败: ' + e.message, true);
    }
  }

  // ==============================================
  // 11. 主检测函数
  // ==============================================
  function runDetection() {
    try {
      log('开始检测...');
      var report = buildReport();
      log('检测完成 - 兼容性: ' + report.detection.compatibility.level);
      reportData(report);
      return report;
    } catch(e) {
      log('检测失败: ' + e.message, true);
      return null;
    }
  }

  // ==============================================
  // 12. 暴露API
  // ==============================================
  global.Vue3CompatChecker = {
    check: function() { return runDetection(); },
    config: function(options) {
      if (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key) && CONFIG.hasOwnProperty(key)) {
            CONFIG[key] = options[key];
          }
        }
      }
      return this;
    }
  };

  // ==============================================
  // 13. 自动执行
  // ==============================================
  if (CONFIG.autoReport) {
    var scheduleDetection = function() {
      setTimeout(runDetection, 100);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      scheduleDetection();
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', scheduleDetection);
    } else if (document.attachEvent) {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
          scheduleDetection();
        }
      });
    } else {
      scheduleDetection();
    }
  }

})(this);
