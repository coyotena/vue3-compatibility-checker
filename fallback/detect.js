// ==============================================
// Vue3 兼容性检测器 - 降级版（ES5语法）
// 版本：v1.1 - 增强浏览器信息解析
// ==============================================

;(function () {
  'use strict';

  // Vue3 官方兼容标准
  var VUE3_REQUIREMENTS = {
    // 最低浏览器版本要求
    browsers: {
      chrome: 64, firefox: 59, safari: 11, edge: 79, opera: 51, ie: null, // IE 不支持 Vue3
      samsung: 9, // Samsung Internet
      uc: 12, // UC Browser
    },

    // 必需的 ES6+ 特性
    requiredFeatures: ['Proxy', 'Reflect', 'Promise', 'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet'],
  };

  // 全局对象
  var Vue3Detector = {
    // 检测结果存储
    results: {
      detectionTime: '', compatibility: {
        level: '', // 'compatible', 'partial', 'incompatible'
        description: '', issues: [],
      }, browser: {}, os: {}, hardware: {}, features: {},
    },

    // ================ 主入口 ================
    runDetection: function () {
      console.log('开始 Vue3 兼容性检测...');

      // 记录检测时间
      this.results.detectionTime = new Date().toLocaleString();

      // 显示加载中
      this.showLoading(true);

      // 执行检测
      var self = this;
      setTimeout(function () {
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
    collectAllInfo: function () {
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
    detectBrowserInfo: function () {
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
        isEdgeLegacy: false,
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
        supportsES2017: this.testES2017Support(),
      };

      browser.fullVersion = browser.version.toString();
      return browser;
    },

    // ================ 操作系统检测 ================
    detectOSInfo: function () {
      var ua = navigator.userAgent;
      var platform = navigator.platform || '';
      var os = {
        name: 'Unknown', version: 'Unknown', architecture: 'Unknown', platform: platform,
      };

      // Windows
      if (platform.indexOf('Win') > -1 || ua.indexOf('Windows') > -1) {
        os.name = 'Windows';

        // Windows 版本检测
        if (ua.indexOf('Windows NT 10.0') > -1) os.version = '10'; else if (ua.indexOf('Windows NT 6.3') > -1) os.version = '8.1'; else if (ua.indexOf('Windows NT 6.2') > -1) os.version = '8'; else if (ua.indexOf('Windows NT 6.1') > -1) os.version = '7'; else if (ua.indexOf('Windows NT 6.0') > -1) os.version = 'Vista'; else if (ua.indexOf('Windows NT 5.1') > -1) os.version = 'XP'; else if (ua.indexOf('Windows NT 5.0') > -1) os.version = '2000'; else os.version = 'Unknown';
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
        if (ua.indexOf('Ubuntu') > -1) os.version = 'Ubuntu'; else if (ua.indexOf('Fedora') > -1) os.version = 'Fedora'; else if (ua.indexOf('CentOS') > -1) os.version = 'CentOS'; else if (ua.indexOf('Debian') > -1) os.version = 'Debian'; else os.version = 'Unknown';
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
    detectHardwareInfo: function () {
      var hardware = {
        cpuCores: 'Unknown', memory: 'Unknown', screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio || 1,
        },
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
    detectFeatureSupport: function () {
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
        indexDB: 'indexedDB' in window,
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
        destructuring: this.testDestructuring(),
      };

      // CSS 特性（基础检测）
      features.css = {
        flexbox: this.testCSSFeature('display', 'flex'),
        grid: this.testCSSFeature('display', 'grid'),
        cssVariables: this.testCSSVariables(),
        transform: this.testCSSFeature('transform', 'translate(10px)'),
        transition: this.testCSSFeature('transition', 'all 0.3s'),
      };

      return features;
    },

    // ================ 测试辅助函数 ================
    testES6Support: function () {
      try {
        // 测试几个关键的 ES6 特性
        eval('let x = 1; const y = 2; class Test {};');
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2016Support: function () {
      try {
        eval('2 ** 3;'); // 指数运算符
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2017Support: function () {
      try {
        eval('async function test() {}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testArrowFunctions: function () {
      try {
        eval('var fn = () => {}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testTemplateLiterals: function () {
      try {
        eval('var str = `template`');
        return true;
      } catch (e) {
        return false;
      }
    },

    testLetConst: function () {
      try {
        eval('let testLet = 1; const testConst = 2;');
        return true;
      } catch (e) {
        return false;
      }
    },

    testClassSupport: function () {
      try {
        eval('class TestClass { constructor() {} }');
        return true;
      } catch (e) {
        return false;
      }
    },

    testDefaultParameters: function () {
      try {
        eval('function test(a = 1) { return a; }');
        return true;
      } catch (e) {
        return false;
      }
    },

    testRestParameters: function () {
      try {
        eval('function test(...args) { return args; }');
        return true;
      } catch (e) {
        return false;
      }
    },

    testSpreadOperator: function () {
      try {
        eval('var arr = [...[1,2,3]]');
        return true;
      } catch (e) {
        return false;
      }
    },

    testDestructuring: function () {
      try {
        eval('var {a, b} = {a: 1, b: 2}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testWebGLSupport: function () {
      try {
        var canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    },

    testCSSFeature: function (property, value) {
      try {
        var el = document.createElement('div');
        el.style[property] = value;
        return el.style[property] !== '';
      } catch (e) {
        return false;
      }
    },

    testCSSVariables: function () {
      try {
        var el = document.createElement('div');
        el.style.setProperty('--test-var', 'red');
        return el.style.getPropertyValue('--test-var') === 'red';
      } catch (e) {
        return false;
      }
    },

    // ================ 兼容性分析 ================
    // ================ 兼容性分析（修正版） ================
    analyzeCompatibility: function() {
      var browser = this.results.browser;
      var features = this.results.features.es6;
      var os = this.results.os;
      var issues = [];
      var criticalIssues = [];
      var warningIssues = [];
      var infoIssues = [];

      // ===== 1. 定义核心特性 =====
      var CORE_FEATURES = ['proxy', 'reflect', 'promise', 'symbol'];
      var IMPORTANT_FEATURES = ['map', 'set']; // 重要但不是绝对必需
      var ENHANCEMENT_FEATURES = ['weakMap', 'weakSet', 'arrowFunctions',
        'templateLiterals', 'letConst', 'classes',
        'defaultParams', 'restParams', 'spread', 'destructuring'];

      // ===== 2. 检查浏览器类型（核心问题） =====

      // 2.1 Internet Explorer (完全不支持)
      if (browser.isIE) {
        criticalIssues.push({
          type: 'critical',
          message: 'Internet Explorer 不支持 Vue3',
          description: 'Vue3 需要 ES6+ 特性，IE 完全不支持',
          suggestion: '请更换为 Chrome、Firefox 或 Edge (Chromium) 等现代浏览器'
        });
      }

      // 2.2 Edge Legacy (已停止支持)
      else if (browser.isEdgeLegacy) {
        criticalIssues.push({
          type: 'critical',
          message: 'Edge (Legacy) 已停止支持',
          description: '请升级到基于 Chromium 的新版 Edge',
          suggestion: '下载 Edge (Chromium): https://www.microsoft.com/edge'
        });
      }

      // 2.3 浏览器版本过低
      else if (browser.name !== 'Unknown' && browser.version) {
        var browserKey = this.getBrowserKey(browser.name);
        var minVersion = VUE3_REQUIREMENTS.browsers[browserKey];

        if (minVersion && browser.version < minVersion) {
          var severity = browser.version < (minVersion - 20) ? 'critical' : 'warning';
          var issuesArray = severity === 'critical' ? criticalIssues : warningIssues;

          issuesArray.push({
            type: severity,
            message: browser.name + ' 版本过低',
            description: '当前版本: v' + browser.version + '，要求: ≥v' + minVersion,
            suggestion: '请升级到 ' + browser.name + ' v' + minVersion + ' 或更高版本'
          });
        }
      }

      // ===== 3. 检查核心特性支持 =====

      // 3.1 必需的核心特性
      for (var i = 0; i < CORE_FEATURES.length; i++) {
        var feature = CORE_FEATURES[i];
        if (!features[feature]) {
          criticalIssues.push({
            type: 'critical',
            message: '不支持 ' + feature.charAt(0).toUpperCase() + feature.slice(1) + ' API',
            description: '这是 Vue3 响应式系统的必需特性',
            suggestion: '请使用支持 ES6 Proxy 和 Reflect 的现代浏览器'
          });
        }
      }

      // 3.2 重要特性（影响部分功能）
      for (var j = 0; j < IMPORTANT_FEATURES.length; j++) {
        var importantFeature = IMPORTANT_FEATURES[j];
        if (!features[importantFeature]) {
          warningIssues.push({
            type: 'warning',
            message: '不支持 ' + importantFeature.charAt(0).toUpperCase() + importantFeature.slice(1),
            description: '可能影响某些 Vue3 生态库的功能',
            suggestion: '建议升级浏览器以获得完整支持'
          });
        }
      }

      // 3.3 增强特性（非必需）
      for (var k = 0; k < ENHANCEMENT_FEATURES.length; k++) {
        var enhancementFeature = ENHANCEMENT_FEATURES[k];
        if (!features[enhancementFeature]) {
          infoIssues.push({
            type: 'info',
            message: '不支持 ' + enhancementFeature,
            description: '不影响 Vue3 核心功能，但可能影响某些高级用法',
            suggestion: '可继续使用，如需完整 ES6 支持请升级浏览器'
          });
        }
      }

      // ===== 4. 操作系统特殊处理 =====

      // Windows 7 限制
      if (os.name === 'Windows' && os.version === '7') {
        // 检查是否使用太新的浏览器（Win7 不支持）
        var isTooNewBrowser = (browser.name === 'Chrome' && browser.version > 109) ||
          (browser.name === 'Firefox' && browser.version > 115);

        if (isTooNewBrowser) {
          warningIssues.push({
            type: 'warning',
            message: 'Windows 7 对新版浏览器支持有限',
            description: browser.name + ' v' + browser.version + ' 可能无法在 Windows 7 上正常运行',
            suggestion: '使用 Chrome 109 及以下版本或考虑升级操作系统'
          });
        }
      }

      // Windows XP/2000 (完全不推荐)
      if (os.name === 'Windows' && (os.version === 'XP' || os.version === '2000')) {
        criticalIssues.push({
          type: 'critical',
          message: '操作系统已停止支持',
          description: os.version + ' 已停止安全更新和技术支持',
          suggestion: '强烈建议升级到 Windows 10 或 Windows 11'
        });
      }

      // ===== 5. CSS 特性支持 =====
      var cssFeatures = this.results.features.css;
      var missingCSS = [];

      for (var cssKey in cssFeatures) {
        if (cssFeatures.hasOwnProperty(cssKey) && !cssFeatures[cssKey]) {
          missingCSS.push(cssKey);
        }
      }

      if (missingCSS.length > 0) {
        infoIssues.push({
          type: 'info',
          message: '部分 CSS 特性不支持',
          description: '不支持: ' + missingCSS.join(', '),
          suggestion: '可能导致样式显示问题，但不影响 Vue3 功能'
        });
      }

      // ===== 6. WebGL 支持 =====
      if (!this.results.features.webgl) {
        infoIssues.push({
          type: 'info',
          message: '不支持 WebGL',
          description: '影响 3D 和 Canvas 相关功能',
          suggestion: '普通网页功能不受影响'
        });
      }

      // ===== 7. 合并所有问题并确定兼容性等级 =====

      // 所有问题（用于显示）
      var allIssues = criticalIssues.concat(warningIssues).concat(infoIssues);

      // 转换为简单消息数组（向后兼容）
      var issueMessages = [];
      for (var m = 0; m < allIssues.length; m++) {
        issueMessages.push(allIssues[m].message);
      }

      // 确定兼容性等级
      if (criticalIssues.length > 0) {
        this.results.compatibility.level = 'incompatible';
        this.results.compatibility.description = '不兼容';
      } else if (warningIssues.length > 0) {
        this.results.compatibility.level = 'partial';
        this.results.compatibility.description = '部分兼容';
      } else if (infoIssues.length > 0) {
        this.results.compatibility.level = 'partial';
        this.results.compatibility.description = '部分兼容';
      } else {
        this.results.compatibility.level = 'compatible';
        this.results.compatibility.description = '完全兼容';
      }

      // 存储详细问题信息
      this.results.compatibility.issues = issueMessages;
      this.results.compatibility.detailedIssues = {
        critical: criticalIssues,
        warning: warningIssues,
        info: infoIssues
      };

      console.log('兼容性分析完成:', {
        level: this.results.compatibility.level,
        critical: criticalIssues.length,
        warning: warningIssues.length,
        info: infoIssues.length
      });
    },

    // ================ 显示相关 ================
    showLoading: function (show) {
      var loadingEl = document.getElementById('loading');
      var resultEl = document.getElementById('result');

      if (loadingEl && resultEl) {
        loadingEl.style.display = show ? 'block' : 'none';
        resultEl.style.display = show ? 'none' : 'block';
      }
    },

    showError: function (message) {
      var html = '<div class="error">';
      html += '<h3 style="color: red;">检测失败</h3>';
      html += '<p>' + (message || '未知错误') + '</p>';
      html += '<button onclick="location.reload()">刷新重试</button>';
      html += '</div>';

      document.getElementById('result').innerHTML = html;
      this.showLoading(false);
    },

    escapeHtml: function(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    // ================ 更新页面副标题 ================
    updateSubtitle: function() {
      var subtitleEl = document.getElementById('subtitle');
      if (!subtitleEl) return;

      var level = this.results.compatibility.level;
      var texts = {
        'compatible': '✅ 检测完成：完全兼容 Vue3',
        'partial': '⚠️ 检测完成：部分兼容 Vue3',
        'incompatible': '❌ 检测完成：不兼容 Vue3'
      };

      subtitleEl.textContent = texts[level] || '检测完成';

      // 移除旧的状态类
      subtitleEl.classList.remove('compatible', 'partial', 'incompatible');
      // 添加新的状态类
      subtitleEl.classList.add(level);
    },
    // ================ 显示完整结果 ================
    displayResults: function () {
      // 更新副标题
      this.updateSubtitle();

      var results = this.results;
      var suggestions = this.generateSuggestions();

      var html = '';

      // 1. 顶部状态卡片
      html += '<div class="status-card ' + results.compatibility.level + '">';
      html += '<h2>检测结果: ' + results.compatibility.description + '</h2>';
      html += '<p>检测时间: ' + results.detectionTime + '</p>';
      html += '</div>';

      // 2. 环境信息汇总表格
      html += '<div class="info-section">';
      html += '<h3>📊 环境信息汇总</h3>';
      html += '<table class="info-table">';
      html += '<tr><th>类别</th><th>项目</th><th>检测值</th><th>状态</th></tr>';

      // 浏览器信息
      html += '<tr><td rowspan="4">浏览器</td>';
      html += '<td>类型</td><td>' + results.browser.name + '</td>';
      html += '<td>' + this.getStatusIcon(results.browser.name !== 'Unknown') + '</td></tr>';

      html += '<tr><td>版本</td><td>' + (results.browser.version || 'Unknown') + '</td>';
      html += '<td>' + this.getVersionStatus(results.browser) + '</td></tr>';

      html += '<tr><td>渲染引擎</td><td>' + results.browser.engine + '</td><td>✅</td></tr>';

      html += '<tr><td>User Agent</td>';
      html += '<td class="mono" title="' + this.escapeHtml(results.browser.userAgent) + '">';
      if (results.browser.userAgent.length > 50) {
        html += results.browser.userAgent.substring(0, 50) + '...';
      } else {
        html += results.browser.userAgent;
      }
      html += '</td><td>📝</td></tr>';

      // 操作系统
      html += '<tr><td rowspan="3">操作系统</td>';
      html += '<td>类型</td><td>' + results.os.name + '</td><td>✅</td></tr>';

      html += '<tr><td>版本</td><td>' + results.os.version + '</td>';
      html += '<td>' + this.getOSStatus(results.os) + '</td></tr>';

      html += '<tr><td>架构</td><td>' + results.os.architecture + '</td><td>🔧</td></tr>';

      // 硬件信息
      html += '<tr><td rowspan="3">硬件</td>';
      html += '<td>CPU 核心</td><td>' + results.hardware.cpuCores + '</td><td>⚙️</td></tr>';

      html += '<tr><td>内存</td><td>' + results.hardware.memory + '</td><td>💾</td></tr>';

      html += '<tr><td>屏幕分辨率</td><td>' + results.hardware.screen.width + '×' + results.hardware.screen.height + '</td><td>🖥️</td></tr>';

      // 核心特性支持
      html += '<tr><td rowspan="4">Vue3 核心特性</td>';
      html += '<td>Proxy API</td><td>' + (results.features.es6.proxy ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.es6.proxy ? '✅' : '❌') + '</td></tr>';

      html += '<tr><td>Reflect API</td><td>' + (results.features.es6.reflect ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.es6.reflect ? '✅' : '❌') + '</td></tr>';

      html += '<tr><td>Promise</td><td>' + (results.features.es6.promise ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.es6.promise ? '✅' : '⚠️') + '</td></tr>';

      html += '<tr><td>Symbol</td><td>' + (results.features.es6.symbol ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.es6.symbol ? '✅' : '⚠️') + '</td></tr>';

      // CSS 特性
      html += '<tr><td rowspan="3">CSS 特性</td>';
      html += '<td>Flexbox</td><td>' + (results.features.css.flexbox ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.css.flexbox ? '✅' : '⚠️') + '</td></tr>';

      html += '<tr><td>CSS Grid</td><td>' + (results.features.css.grid ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.css.grid ? '✅' : '⚠️') + '</td></tr>';

      html += '<tr><td>CSS 变量</td><td>' + (results.features.css.cssVariables ? '支持' : '不支持') + '</td>';
      html += '<td>' + (results.features.css.cssVariables ? '✅' : '⚠️') + '</td></tr>';

      html += '</table>';
      html += '</div>';

      // 3. 问题明细（如果有）
      if (results.compatibility.detailedIssues) {
        var detailed = results.compatibility.detailedIssues;
        var hasAnyIssues = detailed.critical.length > 0 ||
          detailed.warning.length > 0 ||
          detailed.info.length > 0;

        if (hasAnyIssues) {
          html += '<div class="issues-section">';
          html += '<h3>📋 详细问题报告</h3>';

          // 显示严重问题
          if (detailed.critical.length > 0) {
            html += '<div class="issue-category critical">';
            html += '<h4>❌ 严重问题 (' + detailed.critical.length + ' 个)</h4>';
            html += '<p class="category-desc">这些问题导致无法运行 Vue3</p>';
            html += '<ul class="issues-list">';
            for (var i = 0; i < detailed.critical.length; i++) {
              html += '<li class="critical-issue">';
              html += '<strong>' + detailed.critical[i].message + '</strong>';
              html += '<p class="issue-desc">' + detailed.critical[i].description + '</p>';
              html += '</li>';
            }
            html += '</ul>';
            html += '</div>';
          }

          // 显示警告问题
          if (detailed.warning.length > 0) {
            html += '<div class="issue-category warning">';
            html += '<h4>⚠️ 建议优化 (' + detailed.warning.length + ' 个)</h4>';
            html += '<p class="category-desc">这些问题可能影响使用体验</p>';
            html += '<ul class="issues-list">';
            for (var j = 0; j < detailed.warning.length; j++) {
              html += '<li class="warning-issue">';
              html += '<strong>' + detailed.warning[j].message + '</strong>';
              html += '<p class="issue-desc">' + detailed.warning[j].description + '</p>';
              html += '</li>';
            }
            html += '</ul>';
            html += '</div>';
          }

          // 显示信息问题
          if (detailed.info.length > 0) {
            html += '<div class="issue-category info">';
            html += '<h4>ℹ️ 参考信息 (' + detailed.info.length + ' 个)</h4>';
            html += '<p class="category-desc">这些问题不影响核心功能</p>';
            html += '<ul class="issues-list">';
            for (var k = 0; k < detailed.info.length; k++) {
              html += '<li class="info-issue">';
              html += '<strong>' + detailed.info[k].message + '</strong>';
              html += '<p class="issue-desc">' + detailed.info[k].description + '</p>';
              html += '</li>';
            }
            html += '</ul>';
            html += '</div>';
          }

          html += '</div>';
        }
      }

      // 4. 优化建议
      html += '<div class="suggestions-section">';
      html += '<h3>💡 优化建议</h3>';

      if (suggestions.length > 0) {
        for (var i = 0; i < suggestions.length; i++) {
          var suggestion = suggestions[i];
          html += '<div class="suggestion-card ' + suggestion.type + '">';
          html += '<div class="suggestion-header">';
          html += '<span class="suggestion-category">' + suggestion.category + '</span>';
          html += '<span class="suggestion-type ' + suggestion.type + '">' + this.getSuggestionTypeText(suggestion.type) + '</span>';
          html += '</div>';
          html += '<h4>' + suggestion.title + '</h4>';
          html += '<p class="suggestion-desc">' + suggestion.description + '</p>';
          html += '<p class="suggestion-details">' + suggestion.details + '</p>';

          if (suggestion.actions && suggestion.actions.length > 0) {
            html += '<div class="suggestion-actions">';
            for (var j = 0; j < suggestion.actions.length; j++) {
              var action = suggestion.actions[j];
              if (action.url === '#') {
                html += '<button class="action-btn">' + action.text + '</button>';
              } else {
                html += '<a href="' + action.url + '" target="_blank" class="action-btn">' + action.text + '</a>';
              }
            }
            html += '</div>';
          }
          html += '</div>';
        }
      }
      html += '</div>';

      // 5. 底部操作说明
      html += '<div class="footer-notes">';
      html += '<p><strong>说明：</strong></p>';
      html += '<ul>';
      html += '<li>✅ 完全支持 | ⚠️ 部分支持/可能有问题 | ❌ 不支持</li>';
      html += '<li>以上检测基于 Vue3 官方兼容标准</li>';
      html += '<li>建议使用 Chrome 64+、Firefox 59+、Safari 11+、Edge 79+ 等现代浏览器</li>';
      html += '</ul>';
      html += '</div>';

      document.getElementById('result').innerHTML = html;
      this.bindEvents();
    },

    // ================ 显示辅助函数 ================
    getStatusIcon: function (supported) {
      return supported ? '✅' : '❌';
    },

    getVersionStatus: function (browser) {
      if (browser.name === 'Unknown' || !browser.version) return '❓';

      var key = this.getBrowserKey(browser.name);
      var minVersion = VUE3_REQUIREMENTS.browsers[key];

      if (!minVersion) return '⚠️';
      return browser.version >= minVersion ? '✅' : '❌';
    },

    getOSStatus: function (os) {
      if (os.name === 'Windows' && (os.version === 'XP' || os.version === '2000')) {
        return '❌';
      }
      return '✅';
    },

    getSuggestionTypeText: function (type) {
      var map = {
        'critical': '严重问题', 'warning': '建议优化', 'info': '参考信息', 'success': '状态良好',
      };
      return map[type] || type;
    },

    // ================ 优化建议生成器 ================
    // ================ 优化建议生成器（修正版） ================
    generateSuggestions: function() {
      var results = this.results;
      var compatibility = results.compatibility;
      var detailedIssues = compatibility.detailedIssues;
      var suggestions = [];

      console.log('生成建议，兼容性等级:', compatibility.level);

      // ===== 1. 根据兼容性等级生成主建议 =====

      if (compatibility.level === 'incompatible') {
        // 不兼容：显示核心问题解决方案
        if (detailedIssues.critical && detailedIssues.critical.length > 0) {
          var mainCritical = detailedIssues.critical[0]; // 取第一个核心问题

          suggestions.push({
            type: 'critical',
            category: 'browser',
            title: '无法运行 Vue3',
            description: mainCritical.message,
            details: mainCritical.description,
            actions: this.getCriticalIssueActions(mainCritical)
          });

          // 如果有多个核心问题，添加额外建议
          if (detailedIssues.critical.length > 1) {
            suggestions.push({
              type: 'critical',
              category: 'multiple',
              title: '存在多个兼容性问题',
              description: '共发现 ' + detailedIssues.critical.length + ' 个核心问题',
              details: '需要解决所有核心问题才能运行 Vue3 应用',
              actions: [{ text: '查看所有问题', url: '#' }]
            });
          }
        }
      }
      else if (compatibility.level === 'partial') {
        // 部分兼容：显示优化建议
        var hasWarningIssues = detailedIssues.warning && detailedIssues.warning.length > 0;
        var hasOnlyInfoIssues = !hasWarningIssues && detailedIssues.info && detailedIssues.info.length > 0;

        if (hasWarningIssues) {
          // 有警告级别问题
          var mainWarning = detailedIssues.warning[0];

          suggestions.push({
            type: 'warning',
            category: 'optimization',
            title: '可运行 Vue3，建议优化',
            description: '您的浏览器可以运行 Vue3，但部分功能可能受限',
            details: '发现 ' + detailedIssues.warning.length + ' 个建议优化的问题。' +
              '例如：' + mainWarning.message,
            actions: [
              { text: '查看优化建议', url: '#' },
              { text: '升级浏览器', url: this.getBrowserDownloadUrl(results.browser.name) }
            ]
          });
        } else if (hasOnlyInfoIssues) {
          // 只有信息级别问题（如 WeakMap/WeakSet）
          suggestions.push({
            type: 'info',
            category: 'compatibility',
            title: '部分兼容 Vue3',
            description: '核心功能完全支持，部分增强特性不可用',
            details: '您的浏览器支持所有 Vue3 必需特性，可以正常运行 Vue3 应用。' +
              '仅部分高级 ES6 特性不支持，不影响大多数使用场景。',
            actions: [
              { text: '继续使用当前浏览器', url: '#' },
              { text: '了解 Vue3 兼容性', url: 'https://v3.vuejs.org/guide/migration/introduction.html#browser-support' }
            ]
          });
        }
      }
      else if (compatibility.level === 'compatible') {
        // 完全兼容
        suggestions.push({
          type: 'success',
          category: 'compatibility',
          title: '完全兼容 Vue3',
          description: '您的浏览器环境非常适合运行 Vue3 应用',
          details: '所有必需特性和大多数增强特性都支持，可以流畅运行 Vue3 开发的项目。',
          actions: [
            { text: '学习 Vue3', url: 'https://vuejs.org/' },
            { text: 'Vue3 官方文档', url: 'https://v3.vuejs.org/' }
          ]
        });
      }

      // ===== 2. 添加具体问题建议 =====

      // 2.1 浏览器版本建议
      if (results.browser.name !== 'Unknown' && results.browser.version) {
        var browserKey = this.getBrowserKey(results.browser.name);
        var minVersion = VUE3_REQUIREMENTS.browsers[browserKey];

        if (minVersion && results.browser.version < minVersion) {
          // 已经在 critical/warning 中处理过了，这里可以跳过或细化
        }
      }

      // 2.2 具体特性建议
      if (detailedIssues.info && detailedIssues.info.length > 0) {
        // WeakMap/WeakSet 特殊建议
        var hasWeakMapSet = false;
        for (var i = 0; i < detailedIssues.info.length; i++) {
          if (detailedIssues.info[i].message.indexOf('WeakMap') > -1 ||
            detailedIssues.info[i].message.indexOf('WeakSet') > -1) {
            hasWeakMapSet = true;
            break;
          }
        }

        if (hasWeakMapSet) {
          suggestions.push({
            type: 'info',
            category: 'feature',
            title: '关于 WeakMap/WeakSet',
            description: '高级 ES6 特性支持',
            details: 'WeakMap 和 WeakSet 是 ES6 高级特性，大多数 Vue3 应用不依赖它们。' +
              '只有使用特定高级功能（如 Vue DevTools 的某些特性）时才需要。',
            actions: [
              { text: '了解 WeakMap/WeakSet', url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap' },
              { text: 'Vue3 技术要求', url: 'https://v3.vuejs.org/guide/migration/introduction.html#browser-support' }
            ]
          });
        }
      }

      // 2.3 CSS 特性建议
      if (detailedIssues.info) {
        for (var j = 0; j < detailedIssues.info.length; j++) {
          if (detailedIssues.info[j].message.indexOf('CSS') > -1) {
            suggestions.push({
              type: 'info',
              category: 'css',
              title: 'CSS 特性支持',
              description: '样式显示可能受影响',
              details: '不支持某些 CSS 特性可能导致页面样式与设计不一致，' +
                '但不会影响 Vue3 的功能和交互。',
              actions: [
                { text: 'CSS 兼容性查询', url: 'https://caniuse.com/' },
                { text: '现代 CSS 学习', url: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS' }
              ]
            });
            break;
          }
        }
      }

      // 2.4 硬件建议（如果硬件信息可用且较低）
      if (results.hardware.memory && results.hardware.memory !== 'Unknown') {
        var memoryGB = parseFloat(results.hardware.memory);
        if (memoryGB < 2) {
          suggestions.push({
            type: 'warning',
            category: 'hardware',
            title: '硬件性能注意',
            description: '内存较小：' + results.hardware.memory,
            details: '运行大型 Vue3 应用时可能出现卡顿，建议关闭不必要的标签页和程序。',
            actions: [
              { text: '内存优化技巧', url: 'https://support.microsoft.com/zh-cn/windows' }
            ]
          });
        }
      }

      // ===== 3. 如果没有生成任何建议，添加一个默认建议 =====
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'info',
          category: 'general',
          title: '检测完成',
          description: '请查看上方详细结果',
          details: '检测已完成，请查看环境信息和兼容性详情。',
          actions: [
            { text: '重新检测', url: '#' }
          ]
        });
      }

      return suggestions;
    },

    // ================ 新增辅助函数 ================
    getCriticalIssueActions: function(issue) {
      var actions = [];

      if (issue.message.indexOf('Internet Explorer') > -1) {
        actions = [
          { text: '下载 Chrome', url: 'https://www.google.com/chrome/' },
          { text: '下载 Firefox', url: 'https://www.mozilla.org/firefox/' },
          { text: '下载 Edge', url: 'https://www.microsoft.com/edge' }
        ];
      }
      else if (issue.message.indexOf('Edge (Legacy)') > -1) {
        actions = [
          { text: '下载 Edge (Chromium)', url: 'https://www.microsoft.com/edge' },
          { text: 'Edge 升级指南', url: 'https://support.microsoft.com/help/4027667' }
        ];
      }
      else if (issue.message.indexOf('版本过低') > -1) {
        var browserName = issue.message.split(' ')[0];
        actions = this.getBrowserUpgradeActions(browserName);
      }
      else if (issue.message.indexOf('Proxy') > -1 || issue.message.indexOf('Reflect') > -1) {
        actions = [
          { text: '查看浏览器支持', url: 'https://caniuse.com/proxy' },
          { text: '更换现代浏览器', url: 'https://www.google.com/chrome/' }
        ];
      }
      else {
        actions = [
          { text: '查看解决方案', url: '#' },
          { text: '重新检测', url: '#' }
        ];
      }

      return actions;
    },

    getBrowserDownloadUrl: function(browserName) {
      var urls = {
        'Chrome': 'https://www.google.com/chrome/',
        'Firefox': 'https://www.mozilla.org/firefox/',
        'Safari': 'https://support.apple.com/safari',
        'Edge': 'https://www.microsoft.com/edge',
        'Opera': 'https://www.opera.com/'
      };

      for (var key in urls) {
        if (browserName.indexOf(key) > -1) {
          return urls[key];
        }
      }

      return 'https://www.google.com/chrome/';
    },

    // ================ 辅助函数 ================
    getBrowserKey: function (browserName) {
      var name = browserName.toLowerCase();
      if (name.indexOf('chrome') > -1) return 'chrome';
      if (name.indexOf('firefox') > -1) return 'firefox';
      if (name.indexOf('safari') > -1) return 'safari';
      if (name.indexOf('edge') > -1) return 'edge';
      if (name.indexOf('opera') > -1) return 'opera';
      if (name.indexOf('ie') > -1 || name.indexOf('internet') > -1) return 'ie';
      if (name.indexOf('samsung') > -1) return 'samsung';
      if (name.indexOf('uc') > -1) return 'uc';
      return null;
    },

    getBrowserUpgradeActions: function (browserName) {
      var actions = [];
      var name = browserName.toLowerCase();

      if (name.indexOf('chrome') > -1) {
        actions.push({text: '下载最新 Chrome', url: 'https://www.google.com/chrome/'});
        actions.push({text: '手动更新 Chrome', url: 'chrome://settings/help'});
      } else if (name.indexOf('firefox') > -1) {
        actions.push({text: '下载最新 Firefox', url: 'https://www.mozilla.org/firefox/'});
        actions.push({text: 'Firefox 更新指南', url: 'https://support.mozilla.org/kb/update-firefox-latest-release'});
      } else if (name.indexOf('safari') > -1) {
        actions.push({text: '更新 macOS 系统', url: 'https://support.apple.com/macos/upgrade'});
        actions.push({text: 'Safari 版本说明', url: 'https://support.apple.com/safari'});
      } else if (name.indexOf('edge') > -1) {
        actions.push({text: '下载最新 Edge', url: 'https://www.microsoft.com/edge'});
        actions.push({text: 'Edge 更新指南', url: 'https://support.microsoft.com/help/4027667'});
      } else if (name.indexOf('opera') > -1) {
        actions.push({text: '下载最新 Opera', url: 'https://www.opera.com/'});
      }

      return actions;
    },

    bindEvents: function () {
      var self = this;
      var recheckBtn = document.getElementById('recheck-btn');

      if (recheckBtn) {
        recheckBtn.onclick = function () {
          self.runDetection();
        };
      }
    },
  };

  // 暴露到全局
  window.Vue3Detector = Vue3Detector;

})();