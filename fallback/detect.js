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
    analyzeCompatibility: function () {
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
        var criticalIssues = issues.filter(function (issue) {
          return issue.indexOf('不支持') > -1 || issue.indexOf('Internet Explorer') > -1 || issue.indexOf('Edge (Legacy)') > -1;
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

    // ================ 显示完整结果 ================
    displayResults: function () {
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
      if (results.compatibility.issues.length > 0) {
        html += '<div class="issues-section">';
        html += '<h3>⚠️ 检测到的问题</h3>';
        html += '<ul class="issues-list">';
        for (var i = 0; i < results.compatibility.issues.length; i++) {
          html += '<li>' + results.compatibility.issues[i] + '</li>';
        }
        html += '</ul>';
        html += '</div>';
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
    generateSuggestions: function () {
      var results = this.results;
      var browser = results.browser;
      var features = results.features;
      var os = results.os;
      var suggestions = [];

      // ===== 1. 浏览器相关建议 =====

      // IE 浏览器
      if (browser.isIE) {
        suggestions.push({
          type: 'critical',
          category: 'browser',
          title: '更换浏览器',
          description: 'Internet Explorer 不支持 Vue3，请更换为现代浏览器',
          details: 'Vue3 依赖 ES6+ 特性，IE 完全不支持。',
          actions: [{text: '下载 Chrome', url: 'https://www.google.com/chrome/'}, {
            text: '下载 Firefox',
            url: 'https://www.mozilla.org/firefox/',
          }, {text: '下载 Edge', url: 'https://www.microsoft.com/edge'}],
        });
      }

      // Edge Legacy
      else if (browser.isEdgeLegacy) {
        suggestions.push({
          type: 'critical',
          category: 'browser',
          title: '升级 Edge 浏览器',
          description: 'Edge (Legacy) 已停止支持，请升级到 Edge (Chromium)',
          details: 'Edge (Chromium) 是基于 Chrome 的新版本，完全支持 Vue3。',
          actions: [{text: '下载 Edge (Chromium)', url: 'https://www.microsoft.com/edge'}],
        });
      }

      // 浏览器版本过低
      else if (browser.name !== 'Unknown' && browser.version) {
        var browserKey = this.getBrowserKey(browser.name);
        var minVersion = VUE3_REQUIREMENTS.browsers[browserKey];

        if (minVersion && browser.version < minVersion) {
          suggestions.push({
            type: browser.version < minVersion - 20 ? 'critical' : 'warning',
            category: 'browser',
            title: '升级 ' + browser.name + ' 版本',
            description: browser.name + ' 版本过低 (当前: v' + browser.version + ', 要求: ≥v' + minVersion + ')',
            details: 'Vue3 需要较新版本的浏览器以获得更好的性能和安全性。',
            actions: this.getBrowserUpgradeActions(browser.name),
          });
        }
      }

      // ===== 2. 核心特性不支持 =====

      // Proxy API
      if (!features.es6.proxy) {
        suggestions.push({
          type: 'critical',
          category: 'feature',
          title: '不支持 Proxy API',
          description: '您的浏览器不支持 JavaScript Proxy API',
          details: 'Vue3 的响应式系统依赖 Proxy API 实现，这是必需特性。',
          actions: [{text: '查看浏览器支持情况', url: 'https://caniuse.com/proxy'}, {
            text: '更换支持的浏览器',
            url: '#',
          }],
        });
      }

      // Reflect API
      if (!features.es6.reflect) {
        suggestions.push({
          type: 'critical',
          category: 'feature',
          title: '不支持 Reflect API',
          description: '您的浏览器不支持 JavaScript Reflect API',
          details: 'Vue3 的部分功能依赖 Reflect API。',
          actions: [{text: '查看浏览器支持情况', url: 'https://caniuse.com/mdn-javascript_builtins_reflect'}],
        });
      }

      // ===== 3. ES6 特性支持不全 =====
      var missingES6Features = [];
      for (var key in features.es6) {
        if (features.es6.hasOwnProperty(key) && !features.es6[key] && ['proxy', 'reflect'].indexOf(key) === -1) {
          missingES6Features.push(key);
        }
      }

      if (missingES6Features.length > 0 && missingES6Features.length < 5) {
        suggestions.push({
          type: 'warning',
          category: 'feature',
          title: '部分 ES6 特性不支持',
          description: '缺少 ' + missingES6Features.join(', ') + ' 等特性',
          details: '可能影响 Vue3 某些高级功能，但核心功能仍可用。',
          actions: [{text: '升级浏览器以获得完整支持', url: '#'}],
        });
      }

      // ===== 4. CSS 特性支持 =====
      var missingCSSFeatures = [];
      for (var key in features.css) {
        if (features.css.hasOwnProperty(key) && !features.css[key]) {
          missingCSSFeatures.push(key);
        }
      }

      if (missingCSSFeatures.length > 0) {
        suggestions.push({
          type: 'info',
          category: 'css',
          title: 'CSS 特性支持不全',
          description: '不支持 ' + missingCSSFeatures.join(', ') + ' 等 CSS 特性',
          details: '可能导致页面样式显示不正常，但不影响 Vue3 核心功能运行。',
          actions: [{text: '了解 CSS 兼容性', url: 'https://caniuse.com/'}],
        });
      }

      // ===== 5. WebGL 不支持 =====
      if (!features.webgl) {
        suggestions.push({
          type: 'info',
          category: 'hardware',
          title: '不支持 WebGL',
          description: '您的浏览器或设备不支持 WebGL',
          details: '影响 Vue3 的 3D 和 Canvas 相关组件，普通网页功能不受影响。',
          actions: [{text: '启用 WebGL 指南', url: 'https://get.webgl.org/'}, {text: '检查显卡驱动', url: '#'}],
        });
      }

      // ===== 6. 操作系统相关建议 =====

      // Windows 7 特殊处理
      if (os.name === 'Windows' && os.version === '7') {
        var isModernBrowser = browser.name === 'Chrome' && browser.version >= 64 || browser.name === 'Firefox' && browser.version >= 59 || browser.name === 'Edge' && browser.version >= 79;

        if (!isModernBrowser) {
          suggestions.push({
            type: 'warning',
            category: 'os',
            title: 'Windows 7 系统限制',
            description: 'Windows 7 对新版浏览器支持有限',
            details: 'Windows 7 最高支持 Chrome 109。请确保使用支持的浏览器版本。',
            actions: [{
              text: '升级到 Windows 10/11',
              url: 'https://www.microsoft.com/windows',
            }, {text: '使用支持的浏览器版本', url: '#'}],
          });
        }
      }

      // Windows XP 及更早
      if (os.name === 'Windows' && (os.version === 'XP' || os.version === '2000')) {
        suggestions.push({
          type: 'critical',
          category: 'os',
          title: '操作系统已停止支持',
          description: os.version + ' 已停止安全更新和技术支持',
          details: '建议升级到 Windows 10 或 Windows 11 以获得更好的安全性和兼容性。',
          actions: [{text: '升级到 Windows 10/11', url: 'https://www.microsoft.com/windows'}, {
            text: '考虑更换操作系统',
            url: '#',
          }],
        });
      }

      // ===== 7. 硬件相关建议 =====

      // 内存可能不足（检测到且小于 2GB）
      if (results.hardware.memory && results.hardware.memory !== 'Unknown') {
        var memoryGB = parseFloat(results.hardware.memory);
        if (memoryGB < 2) {
          suggestions.push({
            type: 'warning',
            category: 'hardware',
            title: '内存可能不足',
            description: '当前内存: ' + results.hardware.memory + ' (建议 ≥ 2GB)',
            details: '内存不足可能导致运行大型 Vue3 应用时页面卡顿。',
            actions: [{text: '关闭不必要的标签页', url: '#'}, {text: '考虑升级硬件', url: '#'}],
          });
        }
      }

      // CPU 核心数较少
      if (results.hardware.cpuCores && results.hardware.cpuCores !== 'Unknown') {
        if (results.hardware.cpuCores < 2) {
          suggestions.push({
            type: 'info',
            category: 'hardware',
            title: 'CPU 核心数较少',
            description: '当前 CPU 核心: ' + results.hardware.cpuCores + ' (建议 ≥ 2核心)',
            details: '可能影响复杂 Vue3 应用的渲染性能。',
            actions: [{text: '关闭后台程序', url: '#'}],
          });
        }
      }

      // ===== 8. 如果没有问题 =====
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'success',
          category: 'general',
          title: '环境优秀',
          description: '您的浏览器环境非常适合运行 Vue3 应用',
          details: '所有必需特性都支持，可以流畅运行 Vue3 开发的项目。',
          actions: [{text: '学习 Vue3', url: 'https://vuejs.org/'}, {
            text: 'Vue3 官方文档',
            url: 'https://v3.vuejs.org/',
          }],
        });
      }

      return suggestions;
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