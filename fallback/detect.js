// ==============================================
// Vue3 兼容性检测器 - 降级版（ES5语法）
// 版本：v1.1 - 增强浏览器信息解析
// ==============================================

;(function() {
  'use strict';

  // Vue3 官方兼容标准
  var VUE3_REQUIREMENTS = {
    // 最低浏览器版本要求
    browsers: {
      chrome: 64,
      firefox: 59,
      safari: 11,
      edge: 79,
      opera: 51,
      ie: null, // IE 不支持 Vue3
      samsung: 9, // Samsung Internet
      uc: 12 // UC Browser
    },

    // 必需的 ES6+ 特性
    requiredFeatures: ['Proxy', 'Reflect', 'Promise', 'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet']
  };

  // 全局对象
  var Vue3Detector = {
    // 检测结果存储
    results: {
      detectionTime: '',
      compatibility: {
        level: '', // 'compatible', 'partial', 'incompatible'
        description: '',
        issues: []
      },
      browser: {},
      os: {},
      hardware: {},
      features: {}
    },

    // ================ 主入口 ================
    runDetection: function() {
      console.log('开始 Vue3 兼容性检测...');

      // 记录检测时间
      this.results.detectionTime = new Date().toLocaleString();

      // 显示加载中
      this.showLoading(true);

      // 执行检测
      var self = this;
      setTimeout(function() {
        try {
          self.collectAllInfo();
          self.analyzeCompatibility();
          self.displayResults();
        } catch (error) {
          self.showError(error.message);
        } finally {
          self.showLoading(false);
        }
      }, 800); // 稍长的延迟，让检测更真实
    },

    // ================ 信息收集 ================
    collectAllInfo: function() {
      console.log('收集环境信息...');

      // 1. 浏览器信息
      this.results.browser = this.detectBrowserInfo();

      // 2. 操作系统信息
      this.results.os = this.detectOSInfo();

      // 3. 硬件信息（基础）
      this.results.hardware = this.detectHardwareInfo();

      // 4. 特性支持检测
      this.results.features = this.detectFeatureSupport();
    },

    // ================ 浏览器信息检测 ================
    detectBrowserInfo: function() {
      var ua = navigator.userAgent;
      var appVersion = navigator.appVersion;
      var vendor = navigator.vendor || '';

      var browser = {
        userAgent: ua,
        appVersion: appVersion,
        vendor: vendor,
        name: 'Unknown',
        version: 0,
        fullVersion: 'Unknown',
        engine: 'Unknown',
        engineVersion: 'Unknown',
        isIE: false,
        isEdgeLegacy: false
      };

      // ===== 1. 检测浏览器类型和版本 =====

      // Edge (Chromium)
      if (ua.indexOf('Edg/') > -1) {
        browser.name = 'Edge (Chromium)';
        var match = ua.match(/Edg\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // Edge (Legacy)
      else if (ua.indexOf('Edge') > -1) {
        browser.name = 'Edge (Legacy)';
        browser.isEdgeLegacy = true;
        var match = ua.match(/Edge\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // Chrome
      else if (ua.indexOf('Chrome') > -1 && ua.indexOf('OPR') === -1 && ua.indexOf('Edge') === -1) {
        browser.name = 'Chrome';
        var match = ua.match(/Chrome\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // Firefox
      else if (ua.indexOf('Firefox') > -1) {
        browser.name = 'Firefox';
        var match = ua.match(/Firefox\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // Safari
      else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        browser.name = 'Safari';
        var match = ua.match(/Version\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // Opera
      else if (ua.indexOf('OPR') > -1) {
        browser.name = 'Opera';
        var match = ua.match(/OPR\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // IE 11
      else if (ua.indexOf('Trident') > -1) {
        browser.name = 'Internet Explorer';
        browser.isIE = true;
        browser.version = 11;
      }
      // IE 6-10
      else if (ua.indexOf('MSIE') > -1) {
        browser.name = 'Internet Explorer';
        browser.isIE = true;
        var match = ua.match(/MSIE (\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // UC Browser
      else if (ua.indexOf('UCBrowser') > -1) {
        browser.name = 'UC Browser';
        var match = ua.match(/UCBrowser\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }
      // Samsung Internet
      else if (ua.indexOf('SamsungBrowser') > -1) {
        browser.name = 'Samsung Internet';
        var match = ua.match(/SamsungBrowser\/(\d+\.?\d*)/);
        if (match) browser.version = parseFloat(match[1]);
      }

      // ===== 2. 检测渲染引擎 =====
      if (ua.indexOf('AppleWebKit') > -1) {
        browser.engine = 'WebKit';
        var match = ua.match(/AppleWebKit\/(\d+\.?\d*)/);
        if (match) browser.engineVersion = match[1];
      } else if (ua.indexOf('Gecko') > -1 && ua.indexOf('like Gecko') === -1) {
        browser.engine = 'Gecko';
      } else if (ua.indexOf('Trident') > -1) {
        browser.engine = 'Trident';
        var match = ua.match(/Trident\/(\d+\.?\d*)/);
        if (match) browser.engineVersion = match[1];
      } else if (ua.indexOf('EdgeHTML') > -1) {
        browser.engine = 'EdgeHTML';
        var match = ua.match(/EdgeHTML\/(\d+\.?\d*)/);
        if (match) browser.engineVersion = match[1];
      } else if (ua.indexOf('Blink') > -1) {
        browser.engine = 'Blink';
      }

      // ===== 3. 检测JS引擎信息 =====
      // 通过特性检测推断JS引擎能力
      browser.jsEngine = {
        supportsES6: this.testES6Support(),
        supportsES2016: this.testES2016Support(),
        supportsES2017: this.testES2017Support()
      };

      browser.fullVersion = browser.version.toString();
      return browser;
    },

    // ================ 操作系统检测 ================
    detectOSInfo: function() {
      var ua = navigator.userAgent;
      var platform = navigator.platform || '';
      var os = {
        name: 'Unknown',
        version: 'Unknown',
        architecture: 'Unknown',
        platform: platform
      };

      // Windows
      if (platform.indexOf('Win') > -1 || ua.indexOf('Windows') > -1) {
        os.name = 'Windows';

        // Windows 版本检测
        if (ua.indexOf('Windows NT 10.0') > -1) os.version = '10';
        else if (ua.indexOf('Windows NT 6.3') > -1) os.version = '8.1';
        else if (ua.indexOf('Windows NT 6.2') > -1) os.version = '8';
        else if (ua.indexOf('Windows NT 6.1') > -1) os.version = '7';
        else if (ua.indexOf('Windows NT 6.0') > -1) os.version = 'Vista';
        else if (ua.indexOf('Windows NT 5.1') > -1) os.version = 'XP';
        else if (ua.indexOf('Windows NT 5.0') > -1) os.version = '2000';
        else os.version = 'Unknown';
      }
      // macOS
      else if (platform.indexOf('Mac') > -1 || ua.indexOf('Mac OS') > -1) {
        os.name = 'macOS';
        var match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
        if (match) os.version = match[1].replace(/_/g, '.');
      }
      // Linux
      else if (platform.indexOf('Linux') > -1 || ua.indexOf('Linux') > -1) {
        os.name = 'Linux';
        // 尝试检测具体发行版
        if (ua.indexOf('Ubuntu') > -1) os.version = 'Ubuntu';
        else if (ua.indexOf('Fedora') > -1) os.version = 'Fedora';
        else if (ua.indexOf('CentOS') > -1) os.version = 'CentOS';
        else if (ua.indexOf('Debian') > -1) os.version = 'Debian';
        else os.version = 'Unknown';
      }
      // Android
      else if (ua.indexOf('Android') > -1) {
        os.name = 'Android';
        var match = ua.match(/Android (\d+\.?\d*)/);
        if (match) os.version = match[1];
      }
      // iOS
      else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
        os.name = 'iOS';
        var match = ua.match(/OS (\d+[._]\d+)/);
        if (match) os.version = match[1].replace(/_/g, '.');
      }

      // 检测系统架构（有限支持）
      if (ua.indexOf('Win64') > -1 || ua.indexOf('x64') > -1) {
        os.architecture = '64-bit';
      } else if (ua.indexOf('WOW64') > -1) {
        os.architecture = '32-bit on 64-bit';
      } else if (platform.indexOf('Win32') > -1) {
        os.architecture = '32-bit';
      }

      return os;
    },

    // ================ 硬件信息检测 ================
    detectHardwareInfo: function() {
      var hardware = {
        cpuCores: 'Unknown',
        memory: 'Unknown',
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio || 1
        }
      };

      // CPU核心数
      if (navigator.hardwareConcurrency) {
        hardware.cpuCores = navigator.hardwareConcurrency;
      }

      // 内存大小（只有部分浏览器支持）
      if (navigator.deviceMemory) {
        hardware.memory = navigator.deviceMemory + ' GB';
      }

      return hardware;
    },

    // ================ 特性支持检测 ================
    detectFeatureSupport: function() {
      var features = {
        // Vue3 核心依赖
        es6: {},
        es2016: {},
        es2017: {},

        // CSS 特性
        css: {},

        // Web APIs
        webgl: this.testWebGLSupport(),
        serviceWorker: 'serviceWorker' in navigator,
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        indexDB: 'indexedDB' in window
      };

      // ES6 特性
      features.es6 = {
        proxy: typeof Proxy !== 'undefined',
        reflect: typeof Reflect !== 'undefined',
        promise: typeof Promise !== 'undefined',
        symbol: typeof Symbol !== 'undefined',
        map: typeof Map !== 'undefined',
        set: typeof Set !== 'undefined',
        weakMap: typeof WeakMap !== 'undefined',
        weakSet: typeof WeakSet !== 'undefined',
        arrowFunctions: this.testArrowFunctions(),
        templateLiterals: this.testTemplateLiterals(),
        letConst: this.testLetConst(),
        classes: this.testClassSupport(),
        defaultParams: this.testDefaultParameters(),
        restParams: this.testRestParameters(),
        spread: this.testSpreadOperator(),
        destructuring: this.testDestructuring()
      };

      // CSS 特性（基础检测）
      features.css = {
        flexbox: this.testCSSFeature('display', 'flex'),
        grid: this.testCSSFeature('display', 'grid'),
        cssVariables: this.testCSSVariables(),
        transform: this.testCSSFeature('transform', 'translate(10px)'),
        transition: this.testCSSFeature('transition', 'all 0.3s')
      };

      return features;
    },

    // ================ 测试辅助函数 ================
    testES6Support: function() {
      try {
        // 测试几个关键的 ES6 特性
        eval('let x = 1; const y = 2; class Test {};');
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2016Support: function() {
      try {
        eval('2 ** 3;'); // 指数运算符
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2017Support: function() {
      try {
        eval('async function test() {}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testArrowFunctions: function() {
      try {
        eval('var fn = () => {}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testTemplateLiterals: function() {
      try {
        eval('var str = `template`');
        return true;
      } catch (e) {
        return false;
      }
    },

    testLetConst: function() {
      try {
        eval('let testLet = 1; const testConst = 2;');
        return true;
      } catch (e) {
        return false;
      }
    },

    testClassSupport: function() {
      try {
        eval('class TestClass { constructor() {} }');
        return true;
      } catch (e) {
        return false;
      }
    },

    testDefaultParameters: function() {
      try {
        eval('function test(a = 1) { return a; }');
        return true;
      } catch (e) {
        return false;
      }
    },

    testRestParameters: function() {
      try {
        eval('function test(...args) { return args; }');
        return true;
      } catch (e) {
        return false;
      }
    },

    testSpreadOperator: function() {
      try {
        eval('var arr = [...[1,2,3]]');
        return true;
      } catch (e) {
        return false;
      }
    },

    testDestructuring: function() {
      try {
        eval('var {a, b} = {a: 1, b: 2}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testWebGLSupport: function() {
      try {
        var canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    },

    testCSSFeature: function(property, value) {
      try {
        var el = document.createElement('div');
        el.style[property] = value;
        return el.style[property] !== '';
      } catch (e) {
        return false;
      }
    },

    testCSSVariables: function() {
      try {
        var el = document.createElement('div');
        el.style.setProperty('--test-var', 'red');
        return el.style.getPropertyValue('--test-var') === 'red';
      } catch (e) {
        return false;
      }
    },

    // ================ 兼容性分析 ================
    analyzeCompatibility: function() {
      var browser = this.results.browser;
      var features = this.results.features.es6;
      var issues = [];

      // 1. 检查浏览器类型
      if (browser.isIE) {
        issues.push('Internet Explorer 不支持 Vue3');
      }

      if (browser.isEdgeLegacy) {
        issues.push('Edge (Legacy) 不支持 Vue3，请升级到 Edge (Chromium)');
      }

      // 2. 检查浏览器版本
      if (browser.name !== 'Unknown' && browser.version) {
        var browserKey = browser.name.toLowerCase();
        if (browserKey.indexOf('chrome') > -1) browserKey = 'chrome';
        if (browserKey.indexOf('firefox') > -1) browserKey = 'firefox';
        if (browserKey.indexOf('safari') > -1) browserKey = 'safari';
        if (browserKey.indexOf('edge') > -1) browserKey = 'edge';
        if (browserKey.indexOf('opera') > -1) browserKey = 'opera';

        var minVersion = VUE3_REQUIREMENTS.browsers[browserKey];
        if (minVersion && browser.version < minVersion) {
          issues.push(browser.name + ' 版本过低 (当前: ' + browser.version + ', 要求: ≥' + minVersion + ')');
        }
      }

      // 3. 检查必需特性
      for (var i = 0; i < VUE3_REQUIREMENTS.requiredFeatures.length; i++) {
        var feature = VUE3_REQUIREMENTS.requiredFeatures[i].toLowerCase();
        if (!features[feature]) {
          issues.push('不支持 ' + VUE3_REQUIREMENTS.requiredFeatures[i] + ' API');
        }
      }

      // 4. 确定兼容性等级
      if (issues.length === 0) {
        this.results.compatibility.level = 'compatible';
        this.results.compatibility.description = '完全兼容';
      } else {
        // 判断是否为核心问题
        var criticalIssues = issues.filter(function(issue) {
          return issue.indexOf('不支持') > -1 ||
            issue.indexOf('Internet Explorer') > -1 ||
            issue.indexOf('Edge (Legacy)') > -1;
        });

        if (criticalIssues.length > 0) {
          this.results.compatibility.level = 'incompatible';
          this.results.compatibility.description = '不兼容';
        } else {
          this.results.compatibility.level = 'partial';
          this.results.compatibility.description = '部分兼容';
        }
      }

      this.results.compatibility.issues = issues;
    },

    // ================ 显示相关 ================
    showLoading: function(show) {
      var loadingEl = document.getElementById('loading');
      var resultEl = document.getElementById('result');

      if (loadingEl && resultEl) {
        loadingEl.style.display = show ? 'block' : 'none';
        resultEl.style.display = show ? 'none' : 'block';
      }
    },

    showError: function(message) {
      var html = '<div class="error">';
      html += '<h3 style="color: red;">检测失败</h3>';
      html += '<p>' + (message || '未知错误') + '</p>';
      html += '<button onclick="location.reload()">刷新重试</button>';
      html += '</div>';

      document.getElementById('result').innerHTML = html;
      this.showLoading(false);
    },

    // 显示结果（下一部分实现）
    displayResults: function() {
      // 这个函数我们稍后实现
      var html = '<h2>检测完成！</h2>';
      html += '<p>浏览器: ' + this.results.browser.name + ' ' + this.results.browser.version + '</p>';
      html += '<p>系统: ' + this.results.os.name + ' ' + this.results.os.version + '</p>';
      html += '<p>兼容性: <strong>' + this.results.compatibility.description + '</strong></p>';

      if (this.results.compatibility.issues.length > 0) {
        html += '<p>问题：</p><ul>';
        for (var i = 0; i < this.results.compatibility.issues.length; i++) {
          html += '<li>' + this.results.compatibility.issues[i] + '</li>';
        }
        html += '</ul>';
      }

      document.getElementById('result').innerHTML = html;
      this.bindEvents();
    },

    bindEvents: function() {
      var self = this;
      var recheckBtn = document.getElementById('recheck-btn');

      if (recheckBtn) {
        recheckBtn.onclick = function() {
          self.runDetection();
        };
      }
    }
  };

  // 暴露到全局
  window.Vue3Detector = Vue3Detector;

})();