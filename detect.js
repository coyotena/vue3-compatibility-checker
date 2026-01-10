// ==============================================
// Vue3 兼容性检测器 - 降级版（ES5语法）
// 版本：v1.1 - 增强浏览器信息解析
// ==============================================
try {
;(function () {

  var DataManager = {
    // 主数据存储
    _state: {
      detectionTime: '',
      compatibility: { level: '', description: '', issues: [], detailedIssues: {} },
      browser: {},
      os: {},
      hardware: {},
      features: {}
    },

    // WebGL检测缓存（单一数据源）
    _webglCache: null,

    // ================ 数据访问接口 ================
    getState: function() {
      return this._state;
    },

    get: function(path) {
      var parts = path.split('.');
      var current = this._state;
      for (var i = 0; i < parts.length; i++) {
        if (current[parts[i]] === undefined) return undefined;
        current = current[parts[i]];
      }
      return current;
    },

    set: function(path, value) {
      var parts = path.split('.');
      var current = this._state;
      for (var i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    },

    // ================ 统一WebGL检测（关键！） ================
    getWebGLInfo: function() {
      if (this._webglCache !== null) {
        return this._webglCache;
      }

      var result = {
        supported: false,
        version: '不支持',
        vendor: 'Unknown',
        renderer: 'Unknown'
      };

      try {
        var canvas = document.createElement('canvas');
        var gl = null;
        var contexts = [
          { name: 'WebGL 2.0', context: canvas.getContext('webgl2') },
          { name: 'WebGL 1.0', context: canvas.getContext('webgl') },
          { name: '实验性 WebGL', context: canvas.getContext('experimental-webgl') }
        ];

        for (var i = 0; i < contexts.length; i++) {
          if (contexts[i].context) {
            gl = contexts[i].context;
            result.version = contexts[i].name;
            result.supported = true;
            break;
          }
        }

        if (gl) {
          var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
            result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
          }
        }
      } catch (e) {
        console.warn('WebGL检测失败:', e.message);
      }

      this._webglCache = result;
      return result;
    },

    // 同步WebGL数据到所有位置
    syncWebGLData: function() {
      var webglInfo = this.getWebGLInfo();

      // 同步到硬件信息
      if (!this._state.hardware.gpu) this._state.hardware.gpu = {};
      this._state.hardware.gpu.webgl = webglInfo.supported;
      this._state.hardware.gpu.webglVersion = webglInfo.version;
      this._state.hardware.gpu.vendor = webglInfo.vendor;
      this._state.hardware.gpu.renderer = webglInfo.renderer;

      // 同步到features.webgl
      this._state.features.webgl = webglInfo.supported;
      this._state.features.webglVersion = webglInfo.version;

      // 同步到features.webAPIs
      if (!this._state.features.webAPIs) this._state.features.webAPIs = {};
      this._state.features.webAPIs.webgl = webglInfo.supported;
      this._state.features.webAPIs.webglVersion = webglInfo.version;

      return webglInfo;
    }
  };
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
  // ==============================================
  // 导出功能辅助函数
  // ==============================================

  function safeTestFeature(code) {
    // 1. 快速IE检测
    var ua = navigator.userAgent || '';
    var isIE = ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1;

    if (isIE) {
      // IE 绝对不支持这些 ES6+ 特性
      return false;
    }

    // 2. 安全检测
    try {
      var testFunc = new Function(
        'try { ' + code + '; return true; } catch(e) { return false; }'
      );
      return testFunc() === true;
    } catch (e) {
      return false;
    }
  }

  // 显示导出反馈提示
  function showExportFeedback(message, type) {
    var feedback = document.getElementById('export-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = 'export-feedback';
      feedback.className = 'export-feedback';
      document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.style.backgroundColor = type === 'success' ? '#4caf50' :
      type === 'error' ? '#f44336' : '#ff9800';
    feedback.style.display = 'block';

    setTimeout(function() {
      feedback.style.display = 'none';
    }, 3000);
  }

  // 安全下载文件
  function downloadFile(content, fileName, mimeType) {
    try {
      var blob = new Blob([content], { type: mimeType });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 释放内存
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 100);

      return true;
    } catch (error) {
      console.error('下载文件失败:', error);
      return false;
    }
  }

  // 1. 检测是否支持 classList
  var hasClassList = 'classList' in document.createElement('div');

// 2. 兼容的 addClass 函数
  function addClass(element, className) {
    if (!element) return;

    if (hasClassList) {
      element.classList.add(className);
    } else {
      // IE8-9 兼容
      var current = element.className;
      if (current.indexOf(className) === -1) {
        element.className = current + (current ? ' ' : '') + className;
      }
    }
  }

// 3. 兼容的 removeClass 函数
  function removeClass(element, className) {
    if (!element) return;

    if (hasClassList) {
      element.classList.remove(className);
    } else {
      // IE8-9 兼容
      var current = element.className;
      var newClassName = current.replace(
        new RegExp('(^|\\s)' + className + '(\\s|$)', 'g'),
        '$1$2'
      ).replace(/\s+/g, ' ').trim();
      element.className = newClassName;
    }
  }

// 4. 兼容的 hasClass 函数
  function hasClass(element, className) {
    if (!element) return false;

    if (hasClassList) {
      return element.classList.contains(className);
    } else {
      // IE8-9 兼容
      return new RegExp('(^|\\s)' + className + '(\\s|$)').test(element.className);
    }
  }

// 5. 兼容的 toggleClass 函数
  function toggleClass(element, className) {
    if (!element) return;

    if (hasClassList) {
      element.classList.toggle(className);
    } else {
      if (hasClass(element, className)) {
        removeClass(element, className);
      } else {
        addClass(element, className);
      }
    }
  }

// 6. 兼容的 setClass 函数（设置特定类，移除其他）
  function setClass(element, className) {
    if (!element) return;
    element.className = className;
  }

  // 1. 兼容的事件绑定函数
  function addEvent(element, eventName, handler) {
    if (!element) return;

    if (element.addEventListener) {
      // 现代浏览器
      element.addEventListener(eventName, handler, false);
    } else if (element.attachEvent) {
      // IE8 及以下
      element.attachEvent('on' + eventName, handler);
    } else {
      // 非常老的浏览器
      element['on' + eventName] = handler;
    }
  }

  // 2. 兼容的事件移除函数
  function removeEvent(element, eventName, handler) {
    if (!element) return;

    if (element.removeEventListener) {
      element.removeEventListener(eventName, handler, false);
    } else if (element.detachEvent) {
      element.detachEvent('on' + eventName, handler);
    } else {
      element['on' + eventName] = null;
    }
  }

  // 3. DOM 就绪检测（替代 DOMContentLoaded）
  function domReady(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // 已经加载完成
      setTimeout(callback, 1);
    } else if (document.addEventListener) {
      // 现代浏览器
      document.addEventListener('DOMContentLoaded', callback);
    } else if (document.attachEvent) {
      // IE8 及以下
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete') {
          callback();
        }
      });
    } else {
      // 最后手段
      window.onload = callback;
    }
  }

  /* ==============================================
   IE8 兼容性修复 - 基础polyfill
   ============================================== */

// 1. 修复 Array.prototype 方法（ES5 polyfill）
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
      var T, k;
      if (this == null) {
        throw new TypeError(' this is null or not defined');
      }
      var O = Object(this);
      var len = O.length >>> 0;
      if (typeof callback !== "function") {
        throw new TypeError(callback + ' is not a function');
      }
      if (arguments.length > 1) {
        T = thisArg;
      }
      k = 0;
      while (k < len) {
        var kValue;
        if (k in O) {
          kValue = O[k];
          callback.call(T, kValue, k, O);
        }
        k++;
      }
    };
  }

// 2. 修复 Date.now()（IE8不支持）
  if (!Date.now) {
    Date.now = function() {
      return new Date().getTime();
    };
  }

// 3. 修复 Object.keys()（IE8不支持）
  if (!Object.keys) {
    Object.keys = (function() {
      var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

      return function(obj) {
        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [], prop, i;

        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }

// 4. 修复 Function.prototype.bind（IE8不支持）
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function() {},
        fBound = function() {
          return fToBind.apply(
            this instanceof fNOP && oThis ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments))
          );
        };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }

// 5. 修复 console 对象（IE8可能没有console）
  if (typeof console === 'undefined') {
    window.console = {
      log: function() {},
      error: function() {},
      warn: function() {},
      info: function() {}
    };
  }

// 6. 修复 addEventListener/removeEventListener
  if (!document.addEventListener) {
    // 我们已经有了自己的 addEvent 函数，这里确保它可用
    if (!window.addEvent) {
      window.addEvent = function(element, eventName, handler) {
        if (element.attachEvent) {
          element.attachEvent('on' + eventName, handler);
        } else {
          element['on' + eventName] = handler;
        }
      };
    }

    if (!window.removeEvent) {
      window.removeEvent = function(element, eventName, handler) {
        if (element.detachEvent) {
          element.detachEvent('on' + eventName, handler);
        } else {
          element['on' + eventName] = null;
        }
      };
    }
  }

  // 全局对象
  var Vue3Detector = {
    get results() {
      return DataManager.getState();
    },

    // ================ 导出为 JSON 格式（修复版） ================
    exportAsJSON: function() {
      try {
        // 准备导出数据 - 使用完整的新数据结构
        var exportData = {
          // 元数据
          meta: {
            tool: 'Vue3 Compatibility Detector',
            version: '2.0',
            generatedAt: new Date().toISOString(),
            generatedAtLocal: new Date().toLocaleString(),
            url: window.location.href,
            userAgent: navigator.userAgent
          },

          // 检测结果 - 使用完整的新数据结构
          detection: {
            time: this.results.detectionTime,
            compatibility: this.results.compatibility,
            browser: this.results.browser,
            os: this.results.os,
            hardware: this.results.hardware,
            features: {
              // ES 特性
              es6: this.results.features.es6,
              es2016: this.results.features.es2016 || {},
              es2017: this.results.features.es2017 || {},
              es2018: this.results.features.es2018 || {},

              // CSS 特性
              css: this.results.features.css,

              // Web APIs - 直接使用完整对象
              webAPIs: this.results.features.webAPIs
            }
          },

          // Vue3 兼容性要求
          vue3Requirements: {
            browsers: VUE3_REQUIREMENTS.browsers,
            coreFeatures: ['Proxy', 'Reflect', 'Promise', 'Symbol', 'Map', 'Set']
          },

          // 检测到的所有问题
          issues: {
            all: this.results.compatibility.issues || [],
            critical: (this.results.compatibility.detailedIssues &&
              this.results.compatibility.detailedIssues.critical) || [],
            warning: (this.results.compatibility.detailedIssues &&
              this.results.compatibility.detailedIssues.warning) || [],
            info: (this.results.compatibility.detailedIssues &&
              this.results.compatibility.detailedIssues.info) || []
          },

          // 优化建议摘要
          suggestions: this.generateSuggestions().map(function(suggestion) {
            return {
              type: suggestion.type,
              category: suggestion.category,
              title: suggestion.title,
              description: suggestion.description,
              details: suggestion.details,
              actions: suggestion.actions || []
            };
          })
        };

        // 转换为格式化的 JSON 字符串
        var jsonString = JSON.stringify(exportData, null, 2);

        // 生成文件名
        var fileName = 'vue3-compatibility-' +
          (this.results.browser.name || 'browser').toLowerCase().replace(/\s+/g, '-') + '-' +
          new Date().getTime() + '.json';

        // 下载文件
        if (downloadFile(jsonString, fileName, 'application/json')) {
          showExportFeedback('✅ 结果已导出为 JSON 文件', 'success');
        } else {
          showExportFeedback('❌ 导出失败，请重试', 'error');
        }

      } catch (error) {
        console.error('导出 JSON 失败:', error);
        showExportFeedback('❌ 导出出错: ' + error.message, 'error');
      }
    },
    // ================ 导出为 HTML 报告（ES5 兼容版） ================
    // ================ 导出为 HTML 报告（修复版） ================
    exportAsHTML: function() {
      try {
        var results = this.results;
        var suggestions = this.generateSuggestions();

        // 生成状态图标
        var statusIcon = '📊';
        if (results.compatibility.level === 'compatible') statusIcon = '✅';
        else if (results.compatibility.level === 'partial') statusIcon = '⚠️';
        else if (results.compatibility.level === 'incompatible') statusIcon = '❌';

        // 生成问题列表 HTML
        var issuesHTML = '';
        if (results.compatibility.detailedIssues) {
          var detailed = results.compatibility.detailedIssues;

          if (detailed.critical && detailed.critical.length > 0) {
            issuesHTML += '<h4>❌ 严重问题</h4><ul>';
            for (var i = 0; i < detailed.critical.length; i++) {
              issuesHTML += '<li>' + this.escapeHtml(detailed.critical[i].message) + '</li>';
            }
            issuesHTML += '</ul>';
          }

          if (detailed.warning && detailed.warning.length > 0) {
            issuesHTML += '<h4>⚠️ 建议优化</h4><ul>';
            for (var j = 0; j < detailed.warning.length; j++) {
              issuesHTML += '<li>' + this.escapeHtml(detailed.warning[j].message) + '</li>';
            }
            issuesHTML += '</ul>';
          }
        }

        // 生成建议 HTML
        var suggestionsHTML = '';
        for (var s = 0; s < suggestions.length; s++) {
          var suggestion = suggestions[s];
          var actionsText = '';

          if (suggestion.actions && suggestion.actions.length > 0) {
            var actionTexts = [];
            for (var a = 0; a < suggestion.actions.length; a++) {
              actionTexts.push(suggestion.actions[a].text);
            }
            actionsText = '<p><small>建议操作: ' + actionTexts.join(', ') + '</small></p>';
          }

          suggestionsHTML += '<div class="suggestion-card ' + suggestion.type + '">' +
            '<h3>' + this.escapeHtml(suggestion.title) + '</h3>' +
            '<p><strong>' + this.escapeHtml(suggestion.description) + '</strong></p>' +
            '<p>' + this.escapeHtml(suggestion.details) + '</p>' +
            actionsText +
            '</div>';
        }

        // ===== 生成特性支持表格 =====
        var featuresTablesHTML = '';

        // 1. Vue3 核心特性表格
        featuresTablesHTML += '<h3>Vue3 核心依赖特性</h3>';
        featuresTablesHTML += '<table>';
        featuresTablesHTML += '<tr><th>特性</th><th>支持情况</th><th>重要性</th></tr>';

        var coreFeatures = [
          { key: 'proxy', name: 'Proxy API', required: true },
          { key: 'reflect', name: 'Reflect API', required: true },
          { key: 'promise', name: 'Promise', required: true },
          { key: 'symbol', name: 'Symbol', required: true },
          { key: 'map', name: 'Map', required: true },
          { key: 'set', name: 'Set', required: true }
        ];

        for (var cf = 0; cf < coreFeatures.length; cf++) {
          var coreFeature = coreFeatures[cf];
          var coreSupported = results.features.es6[coreFeature.key];
          featuresTablesHTML += '<tr>';
          featuresTablesHTML += '<td>' + coreFeature.name + '</td>';
          featuresTablesHTML += '<td>' + (coreSupported ? '✅ 支持' : '❌ 不支持') + '</td>';
          featuresTablesHTML += '<td>' + (coreFeature.required ? '<span class="required">必需</span>' : '推荐') + '</td>';
          featuresTablesHTML += '</tr>';
        }
        featuresTablesHTML += '</table>';

        // 2. 重要 ES6+ 特性表格
        featuresTablesHTML += '<h3>重要 ES6+ 特性</h3>';
        featuresTablesHTML += '<table>';
        featuresTablesHTML += '<tr><th>特性</th><th>支持情况</th><th>用途</th></tr>';

        var importantFeatures = [
          { key: 'asyncAwait', name: 'async/await', desc: '异步编程、组合式API' },
          { key: 'objectAssign', name: 'Object.assign', desc: '选项合并、props 处理' },
          { key: 'arrowFunctions', name: '箭头函数', desc: '简洁函数语法' },
          { key: 'templateLiterals', name: '模板字符串', desc: '字符串拼接、模板' },
          { key: 'letConst', name: 'let/const', desc: '块级作用域变量' },
          { key: 'destructuring', name: '解构赋值', desc: '对象/数组解构' },
          { key: 'spread', name: '扩展运算符', desc: '数组/对象展开' },
          { key: 'arrayIncludes', name: 'Array.includes', desc: '数组包含判断' },
          { key: 'stringIncludes', name: 'String.includes', desc: '字符串包含判断' }
        ];

        for (var imp = 0; imp < importantFeatures.length; imp++) {
          var impFeature = importantFeatures[imp];
          var impSupported = false;

          // 特殊处理 async/await（可能在 es2017 中）
          if (impFeature.key === 'asyncAwait') {
            impSupported = (results.features.es2017 && results.features.es2017.asyncAwait) ||
              results.features.es6.asyncAwait;
          } else {
            impSupported = results.features.es6[impFeature.key];
          }

          featuresTablesHTML += '<tr>';
          featuresTablesHTML += '<td>' + impFeature.name + '</td>';
          featuresTablesHTML += '<td>' + (impSupported ? '✅ 支持' : '❌ 不支持') + '</td>';
          featuresTablesHTML += '<td>' + impFeature.desc + '</td>';
          featuresTablesHTML += '</tr>';
        }
        featuresTablesHTML += '</table>';

        // 3. Web APIs 支持表格
        featuresTablesHTML += '<h3>Web API 支持</h3>';
        featuresTablesHTML += '<table>';
        featuresTablesHTML += '<tr><th>API</th><th>支持情况</th><th>详情</th></tr>';

        var webAPIs = [
          { key: 'webgl', name: 'WebGL', desc: '3D 图形渲染' },
          { key: 'fetch', name: 'Fetch API', desc: '网络请求' },
          { key: 'localStorage', name: 'localStorage', desc: '本地存储' },
          { key: 'serviceWorker', name: 'Service Worker', desc: '离线应用、推送' },
          { key: 'indexDB', name: 'IndexedDB', desc: '客户端数据库' },
          { key: 'es6Modules', name: 'ES6 模块', desc: '模块化开发' },
          { key: 'intersectionObserver', name: 'IntersectionObserver', desc: '元素可见性监听' },
          { key: 'mutationObserver', name: 'MutationObserver', desc: 'DOM 变化监听' }
        ];

        for (var wa = 0; wa < webAPIs.length; wa++) {
          var api = webAPIs[wa];
          var apiSupported = results.features.webAPIs[api.key];
          var apiDetails = '';

          if (api.key === 'webgl' && apiSupported) {
            apiDetails = '版本: ' + this.escapeHtml(results.features.webAPIs.webglVersion || 'Unknown');
          }

          featuresTablesHTML += '<tr>';
          featuresTablesHTML += '<td>' + api.name + '<br><small>' + api.desc + '</small></td>';
          featuresTablesHTML += '<td>' + (apiSupported ? '✅ 支持' : '❌ 不支持') + '</td>';
          featuresTablesHTML += '<td>' + apiDetails + '</td>';
          featuresTablesHTML += '</tr>';
        }
        featuresTablesHTML += '</table>';

        // 4. CSS 特性支持表格
        featuresTablesHTML += '<h3>CSS 特性支持</h3>';
        featuresTablesHTML += '<table>';
        featuresTablesHTML += '<tr><th>特性</th><th>支持情况</th><th>用途</th></tr>';

        var cssFeatures = [
          { key: 'flexbox', name: 'Flexbox', desc: '弹性布局' },
          { key: 'grid', name: 'CSS Grid', desc: '网格布局' },
          { key: 'cssVariables', name: 'CSS 变量', desc: '自定义属性、主题' },
          { key: 'transform', name: 'Transform', desc: '元素变换' },
          { key: 'transition', name: 'Transition', desc: '过渡动画' },
          { key: 'animation', name: 'Animation', desc: '关键帧动画' },
          { key: 'calc', name: 'calc()', desc: '动态计算值' },
          { key: 'filter', name: 'Filter', desc: '滤镜效果' }
        ];

        for (var css = 0; css < cssFeatures.length; css++) {
          var cssFeature = cssFeatures[css];
          var cssSupported = results.features.css[cssFeature.key];
          featuresTablesHTML += '<tr>';
          featuresTablesHTML += '<td>' + cssFeature.name + '</td>';
          featuresTablesHTML += '<td>' + (cssSupported ? '✅ 支持' : '❌ 不支持') + '</td>';
          featuresTablesHTML += '<td>' + cssFeature.desc + '</td>';
          featuresTablesHTML += '</tr>';
        }
        featuresTablesHTML += '</table>';

        // ===== 完整的 HTML 报告 =====
        var htmlContent = '<!DOCTYPE html>\n' +
          '<html lang="zh-CN">\n' +
          '<head>\n' +
          '    <meta charset="UTF-8">\n' +
          '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
          '    <title>Vue3 兼容性检测报告</title>\n' +
          '    <style>\n' +
          '        * {\n' +
          '            margin: 0;\n' +
          '            padding: 0;\n' +
          '            box-sizing: border-box;\n' +
          '        }\n' +
          '        \n' +
          '        body {\n' +
          '            font-family: "Microsoft YaHei", Arial, sans-serif;\n' +
          '            line-height: 1.6;\n' +
          '            color: #333;\n' +
          '            background-color: #f8f9fa;\n' +
          '            padding: 20px;\n' +
          '            max-width: 1200px;\n' +
          '            margin: 0 auto;\n' +
          '        }\n' +
          '        \n' +
          '        .header {\n' +
          '            text-align: center;\n' +
          '            margin-bottom: 30px;\n' +
          '            padding-bottom: 20px;\n' +
          '            border-bottom: 2px solid #42b883;\n' +
          '        }\n' +
          '        \n' +
          '        .header h1 {\n' +
          '            color: #42b883;\n' +
          '            margin-bottom: 10px;\n' +
          '        }\n' +
          '        \n' +
          '        .compatibility-badge {\n' +
          '            display: inline-block;\n' +
          '            padding: 8px 16px;\n' +
          '            border-radius: 20px;\n' +
          '            font-weight: bold;\n' +
          '            margin: 10px 0;\n' +
          '        }\n' +
          '        \n' +
          '        .compatible { background-color: #e8f5e9; color: #2e7d32; }\n' +
          '        .partial { background-color: #fff3e0; color: #ef6c00; }\n' +
          '        .incompatible { background-color: #ffebee; color: #c62828; }\n' +
          '        \n' +
          '        .section {\n' +
          '            background: white;\n' +
          '            padding: 25px;\n' +
          '            border-radius: 8px;\n' +
          '            margin-bottom: 20px;\n' +
          '            box-shadow: 0 2px 10px rgba(0,0,0,0.05);\n' +
          '        }\n' +
          '        \n' +
          '        .section h2 {\n' +
          '            color: #42b883;\n' +
          '            margin-bottom: 20px;\n' +
          '            padding-bottom: 10px;\n' +
          '            border-bottom: 1px solid #eee;\n' +
          '        }\n' +
          '        \n' +
          '        .section h3 {\n' +
          '            color: #555;\n' +
          '            margin: 25px 0 15px 0;\n' +
          '            font-size: 18px;\n' +
          '        }\n' +
          '        \n' +
          '        table {\n' +
          '            width: 100%;\n' +
          '            border-collapse: collapse;\n' +
          '            margin: 15px 0;\n' +
          '            font-size: 14px;\n' +
          '        }\n' +
          '        \n' +
          '        th, td {\n' +
          '            border: 1px solid #ddd;\n' +
          '            padding: 12px;\n' +
          '            text-align: left;\n' +
          '        }\n' +
          '        \n' +
          '        th {\n' +
          '            background-color: #f5f5f5;\n' +
          '            font-weight: bold;\n' +
          '            color: #555;\n' +
          '        }\n' +
          '        \n' +
          '        tr:nth-child(even) {\n' +
          '            background-color: #f9f9f9;\n' +
          '        }\n' +
          '        \n' +
          '        tr:hover {\n' +
          '            background-color: #f1f1f1;\n' +
          '        }\n' +
          '        \n' +
          '        .suggestion-card {\n' +
          '            border-left: 4px solid;\n' +
          '            padding: 15px;\n' +
          '            margin: 10px 0;\n' +
          '            background-color: #f8f9fa;\n' +
          '        }\n' +
          '        \n' +
          '        .critical { border-color: #f44336; }\n' +
          '        .warning { border-color: #ff9800; }\n' +
          '        .info { border-color: #2196f3; }\n' +
          '        .success { border-color: #4caf50; }\n' +
          '        \n' +
          '        .footer {\n' +
          '            text-align: center;\n' +
          '            margin-top: 40px;\n' +
          '            padding-top: 20px;\n' +
          '            border-top: 1px solid #eee;\n' +
          '            color: #666;\n' +
          '            font-size: 14px;\n' +
          '        }\n' +
          '        \n' +
          '        .timestamp {\n' +
          '            color: #888;\n' +
          '            font-size: 14px;\n' +
          '            margin: 5px 0;\n' +
          '        }\n' +
          '        \n' +
          '        .required {\n' +
          '            background-color: #ffebee;\n' +
          '            color: #c62828;\n' +
          '            padding: 3px 8px;\n' +
          '            border-radius: 4px;\n' +
          '            font-size: 12px;\n' +
          '            font-weight: bold;\n' +
          '        }\n' +
          '        \n' +
          '        small {\n' +
          '            color: #666;\n' +
          '            font-size: 12px;\n' +
          '        }\n' +
          '        \n' +
          '        @media print {\n' +
          '            body {\n' +
          '                background: white;\n' +
          '                padding: 0;\n' +
          '            }\n' +
          '            \n' +
          '            .section {\n' +
          '                box-shadow: none;\n' +
          '                border: 1px solid #ddd;\n' +
          '                page-break-inside: avoid;\n' +
          '            }\n' +
          '        }\n' +
          '    </style>\n' +
          '</head>\n' +
          '<body>\n' +
          '    <div class="header">\n' +
          '        <h1>' + statusIcon + ' Vue3 兼容性检测报告</h1>\n' +
          '        <p class="timestamp">生成时间: ' + new Date().toLocaleString() + '</p>\n' +
          '        <div class="compatibility-badge ' + results.compatibility.level + '">\n' +
          '            ' + results.compatibility.description.toUpperCase() + '\n' +
          '        </div>\n' +
          '    </div>\n' +
          '    \n' +
          '    <div class="section">\n' +
          '        <h2>📊 检测摘要</h2>\n' +
          '        <table>\n' +
          '            <tr>\n' +
          '                <th width="120">检测时间</th>\n' +
          '                <td>' + this.escapeHtml(results.detectionTime) + '</td>\n' +
          '            </tr>\n' +
          '            <tr>\n' +
          '                <th>浏览器</th>\n' +
          '                <td>' + this.escapeHtml(results.browser.name) + ' ' + this.escapeHtml(results.browser.version || '') + '</td>\n' +
          '            </tr>\n' +
          '            <tr>\n' +
          '                <th>操作系统</th>\n' +
          '                <td>' + this.escapeHtml(results.os.name) + ' ' + this.escapeHtml(results.os.version) + '</td>\n' +
          '            </tr>\n' +
          '            <tr>\n' +
          '                <th>兼容性状态</th>\n' +
          '                <td><strong>' + this.escapeHtml(results.compatibility.description) + '</strong></td>\n' +
          '            </tr>\n' +
          '        </table>\n' +
          '    </div>\n';

        // 添加问题部分（如果有）
        if (issuesHTML) {
          htmlContent += '    <div class="section">\n' +
            '        <h2>⚠️ 检测到的问题</h2>\n' +
            '        ' + issuesHTML + '\n' +
            '    </div>\n';
        }

        // 添加特性支持部分
        htmlContent += '    <div class="section">\n' +
          '        <h2>⚙️ 特性支持详情</h2>\n' +
          '        ' + featuresTablesHTML + '\n' +
          '    </div>\n';

        // 添加建议部分
        if (suggestionsHTML) {
          htmlContent += '    <div class="section">\n' +
            '        <h2>💡 优化建议</h2>\n' +
            '        ' + suggestionsHTML + '\n' +
            '    </div>\n';
        }

        // 添加 Vue3 要求部分
        htmlContent += '    <div class="section">\n' +
          '        <h2>📋 Vue3 兼容性要求</h2>\n' +
          '        <table>\n' +
          '            <tr>\n' +
          '                <th>浏览器</th>\n' +
          '                <th>最低要求版本</th>\n' +
          '            </tr>\n' +
          '            <tr><td>Chrome</td><td>≥ 64</td></tr>\n' +
          '            <tr><td>Firefox</td><td>≥ 59</td></tr>\n' +
          '            <tr><td>Safari</td><td>≥ 11</td></tr>\n' +
          '            <tr><td>Edge</td><td>≥ 79</td></tr>\n' +
          '            <tr><td>Opera</td><td>≥ 51</td></tr>\n' +
          '        </table>\n' +
          '        <p style="margin-top: 15px; color: #666;">\n' +
          '            <small>以上要求基于 Vue3 官方文档。IE 浏览器不支持 Vue3。</small>\n' +
          '        </p>\n' +
          '    </div>\n' +
          '    \n' +
          '    <div class="footer">\n' +
          '        <p>此报告由 Vue3 兼容性检测工具生成</p>\n' +
          '        <p>检测工具地址: ' + this.escapeHtml(window.location.href) + '</p>\n' +
          '        <p>生成时间: ' + new Date().toLocaleString() + '</p>\n' +
          '        <p style="margin-top: 10px; color: #999;">\n' +
          '            <small>报告仅供参考，具体兼容性以实际测试为准</small>\n' +
          '        </p>\n' +
          '    </div>\n' +
          '</body>\n' +
          '</html>';

        // 生成文件名
        var fileName = 'vue3-compatibility-report-' +
          new Date().getTime() + '.html';

        // 下载文件
        if (downloadFile(htmlContent, fileName, 'text/html')) {
          showExportFeedback('✅ HTML 报告已生成并下载', 'success');

          // 可选：在新标签页预览
          var previewWindow = window.open();
          previewWindow.document.write(htmlContent);
          previewWindow.document.close();

        } else {
          showExportFeedback('❌ 导出失败，请重试', 'error');
        }

      } catch (error) {
        console.error('导出 HTML 失败:', error);
        showExportFeedback('❌ 导出出错: ' + error.message, 'error');
      }
    },
    // ================ 主入口 ================
    runDetection: function () {
      alert(1);
      // 记录检测时间
      DataManager.set('detectionTime', new Date().toLocaleString());

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
      }, 800);
    },

    // ================ 信息收集 ================
    collectAllInfo: function () {
      // 1. 浏览器信息
      DataManager.set('browser', this.detectBrowserInfo());

      // 2. 操作系统信息
      DataManager.set('os', this.detectOSInfo());

      // 3. 硬件信息（基础）
      DataManager.set('hardware', this.detectHardwareInfo());

      // 4. 特性支持检测（完整检测）
      var features = this.detectFeatureSupport();
      DataManager.set('features', features);

      // 5. 🔥 关键：同步WebGL数据
      DataManager.syncWebGLData();

      // 6. 添加检测状态标记（为折叠功能准备）
      DataManager.set('features.detectionStatus', {
        coreFeatures: true,      // 核心特性已检测
        importantFeatures: true, // ES6+特性已检测
        webAPIs: true,          // Web API已检测
        cssFeatures: true        // CSS特性已检测
      });
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
    detectOSInfo: function() {
      var ua = navigator.userAgent.toLowerCase();
      var platform = navigator.platform || '';
      var appVersion = navigator.appVersion || '';

      var os = {
        name: 'Unknown',
        version: 'Unknown',
        platform: platform,
        bits: 'Unknown',           // 系统位数（32/64）
        detectionConfidence: 'low' // 检测置信度：high/medium/low
      };

      // ===== 1. 检测操作系统类型和版本 =====

      // Windows
      if (platform.indexOf('Win') > -1 || ua.indexOf('windows') > -1) {
        os.name = 'Windows';

        // Windows 版本检测
        if (ua.indexOf('windows nt 10.0') > -1) os.version = '10';
        else if (ua.indexOf('windows nt 6.3') > -1) os.version = '8.1';
        else if (ua.indexOf('windows nt 6.2') > -1) os.version = '8';
        else if (ua.indexOf('windows nt 6.1') > -1) os.version = '7';
        else if (ua.indexOf('windows nt 6.0') > -1) os.version = 'Vista';
        else if (ua.indexOf('windows nt 5.1') > -1) os.version = 'XP';
        else if (ua.indexOf('windows nt 5.0') > -1) os.version = '2000';
        else if (ua.indexOf('windows nt') > -1) {
          var match = ua.match(/windows nt (\d+\.\d+)/);
          if (match) os.version = match[1];
        }
      }
      // macOS
      else if (platform.indexOf('Mac') > -1 || ua.indexOf('mac os') > -1) {
        os.name = 'macOS';
        var match = ua.match(/mac os x (\d+[._]\d+[._]?\d*)/);
        if (match) {
          os.version = match[1].replace(/_/g, '.');
          os.detectionConfidence = 'high';
        }
      }
      // Linux
      else if (platform.indexOf('Linux') > -1 || ua.indexOf('linux') > -1) {
        os.name = 'Linux';
        // 尝试检测具体发行版
        if (ua.indexOf('ubuntu') > -1) os.version = 'Ubuntu';
        else if (ua.indexOf('fedora') > -1) os.version = 'Fedora';
        else if (ua.indexOf('centos') > -1) os.version = 'CentOS';
        else if (ua.indexOf('debian') > -1) os.version = 'Debian';
        else if (ua.indexOf('android') > -1) {
          os.name = 'Android';
          var match = ua.match(/android (\d+\.?\d*)/);
          if (match) os.version = match[1];
        }
        else os.version = 'Unknown';
      }
      // iOS
      else if (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) {
        os.name = 'iOS';
        var match = ua.match(/os (\d+[._]\d+)/);
        if (match) os.version = match[1].replace(/_/g, '.');
        os.detectionConfidence = 'high';
      }

      // ===== 2. 增强系统位数检测 =====

      var detectedBits = null;
      var confidence = 'low';
      var detectionMethod = '未知';

      // 方法1：通过 User Agent 明确标识
      if (ua.indexOf('win64') > -1 || ua.indexOf('x64') > -1 ||
        ua.indexOf('amd64') > -1 || ua.indexOf('wow64') > -1) {
        detectedBits = '64-bit';
        confidence = 'high';
        detectionMethod = 'User Agent 标识';
      }
      // 方法2：Windows 特定检测
      else if (os.name === 'Windows') {
        if (ua.indexOf('win64') > -1 || ua.indexOf('x64') > -1) {
          detectedBits = '64-bit';
          confidence = 'high';
          detectionMethod = 'Windows 64位标识';
        }
        else if (ua.indexOf('wow64') > -1) {
          detectedBits = '32-bit (运行在64位系统上)';
          confidence = 'high';
          detectionMethod = 'WOW64 标识';
        }
        else if (ua.indexOf('win32') > -1 || ua.indexOf('x86') > -1) {
          detectedBits = '32-bit';
          confidence = 'medium';
          detectionMethod = 'Windows 32位标识';
        }
      }
      // 方法3：macOS 检测（现代 macOS 都是 64 位）
      else if (os.name === 'macOS') {
        if (os.version !== 'Unknown') {
          var versionNum = parseFloat(os.version.split('.')[0]);
          // macOS 10.6 (Snow Leopard) 开始支持 64 位
          // macOS 10.15 (Catalina) 开始仅支持 64 位
          if (versionNum >= 10.15) {
            detectedBits = '64-bit (仅支持64位)';
            confidence = 'high';
            detectionMethod = 'macOS 版本推断';
          } else if (versionNum >= 10.6) {
            detectedBits = '64-bit (可能)';
            confidence = 'medium';
            detectionMethod = 'macOS 版本推断';
          }
        }
      }
      // 方法4：Linux 检测
      else if (os.name === 'Linux') {
        if (ua.indexOf('x86_64') > -1 || ua.indexOf('x64') > -1) {
          detectedBits = '64-bit';
          confidence = 'high';
          detectionMethod = 'Linux 架构标识';
        }
        else if (ua.indexOf('i686') > -1 || ua.indexOf('i386') > -1) {
          detectedBits = '32-bit';
          confidence = 'medium';
          detectionMethod = 'Linux 架构标识';
        }
        // Android 通常是 64 位（新设备）
        else if (os.name === 'Android') {
          if (parseFloat(os.version) >= 5.0) {
            detectedBits = '64-bit (可能)';
            confidence = 'medium';
            detectionMethod = 'Android 版本推断';
          }
        }
      }
      // 方法5：iOS 检测（都是 64 位，iPhone 5s 之后）
      else if (os.name === 'iOS') {
        if (parseFloat(os.version) >= 7.0) {
          detectedBits = '64-bit (iOS 7+ 支持)';
          confidence = 'high';
          detectionMethod = 'iOS 版本推断';
        }
      }

      // 方法6：通过 navigator 属性（有限支持）
      if (!detectedBits && navigator.cpuClass) {
        detectedBits = navigator.cpuClass.indexOf('64') > -1 ? '64-bit' : '32-bit';
        confidence = 'medium';
        detectionMethod = 'navigator.cpuClass';
      }

      // 方法7：通过用户代理中的通用线索
      if (!detectedBits) {
        // 如果用户代理中包含 "64" 但不包含 "WOW64"
        if (appVersion.indexOf('64') > -1 && appVersion.indexOf('WOW64') === -1) {
          detectedBits = '64-bit (可能)';
          confidence = 'low';
          detectionMethod = 'User Agent 数字推断';
        }
      }

      // 最终结果
      if (detectedBits) {
        os.bits = detectedBits;
        os.detectionConfidence = confidence;
        os.bitsDetectionMethod = detectionMethod;
      } else {
        os.bits = '无法确定';
        os.detectionConfidence = 'low';
        os.bitsDetectionMethod = '无可靠标识';
      }

      // 简化显示版本（用于界面显示）
      os.architecture = os.bits;

      // 如果是低置信度，添加说明
      if (confidence === 'low') {
        os.bitsNote = '检测结果仅供参考，实际系统可能不同';
      }

      return os;
    },

    // ================ 硬件信息检测 ================
    detectHardwareInfo: function() {
      var hardware = {
        cpuCores: 'Unknown',
        memory: 'Unknown',
        screen: {
          width: window.screen.width || 0,
          height: window.screen.height || 0,
          colorDepth: window.screen.colorDepth || 0,
          pixelRatio: window.devicePixelRatio || 1,
          availWidth: window.screen.availWidth || 0,
          availHeight: window.screen.availHeight || 0
        },
        gpu: {
          webgl: false,  // 初始化为false，后面通过DataManager同步
          webglVersion: 'Unknown'
        },
        detectionNotes: []
      };


      // ===== 1. CPU 核心数检测 =====
      try {
        if (navigator.hardwareConcurrency) {
          // Safari 6.1+ 支持 hardwareConcurrency
          hardware.cpuCores = navigator.hardwareConcurrency;
        } else {
          hardware.cpuCores = '无法检测';
          hardware.detectionNotes.push('CPU核心数: 浏览器不支持 navigator.hardwareConcurrency');
        }
      } catch (e) {
        hardware.cpuCores = '检测失败';
        console.warn('CPU核心数检测失败:', e.message);
      }

      // ===== 2. 内存检测 =====
      try {
        // 方法1：使用 navigator.deviceMemory（只有 Chrome 等支持）
        if (navigator.deviceMemory) {
          hardware.memory = navigator.deviceMemory + ' GB';
        }
        // 方法2：Safari 和其他浏览器的回退方案
        else {
          hardware.memory = '无法检测';
          hardware.detectionNotes.push('内存大小: 浏览器不支持 navigator.deviceMemory');

          // 可以根据浏览器类型给出提示
          var browserName = this.results.browser.name;
          if (browserName.indexOf('Safari') > -1) {
            hardware.memory = 'Safari 不支持内存检测';
          } else if (browserName.indexOf('Firefox') > -1) {
            hardware.memory = 'Firefox 不支持内存检测';
          } else if (browserName.indexOf('IE') > -1 ||
            browserName.indexOf('Edge') > -1) {
            hardware.memory = '此浏览器不支持内存检测';
          }
        }
      } catch (e) {
        hardware.memory = '检测失败';
        console.warn('内存检测失败:', e.message);
      }

      // ===== 3. WebGL 和 GPU 信息 =====
      try {
        var webglInfo = DataManager.getWebGLInfo();
        hardware.gpu.webgl = webglInfo.supported;
        hardware.gpu.webglVersion = webglInfo.version;
        hardware.gpu.vendor = webglInfo.vendor;
        hardware.gpu.renderer = webglInfo.renderer;

        if (!webglInfo.supported) {
          hardware.detectionNotes.push('WebGL: 不支持或已禁用');
        }
      } catch (e) {
        hardware.gpu.webgl = false;
        hardware.gpu.webglVersion = '检测失败';
        console.warn('WebGL检测失败:', e.message);
      }


      // ===== 4. 其他硬件信息 =====

      // 时区信息（虽然不是硬件，但有用）
      hardware.timezone = {
        offset: new Date().getTimezoneOffset(),
        name: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
      };

      // 电池信息（如果支持）
      if ('getBattery' in navigator) {
        try {
          // 注意：这是异步的，我们不在这里等待
          hardware.batterySupported = true;
        } catch (e) {
          hardware.batterySupported = false;
        }
      }

      // 在线状态
      hardware.online = navigator.onLine;

      // 连接信息（如果支持）
      if ('connection' in navigator) {
        var conn = navigator.connection;
        hardware.connection = {
          type: conn.type || 'unknown',
          effectiveType: conn.effectiveType || 'unknown',
          downlink: conn.downlink || 'unknown',
          rtt: conn.rtt || 'unknown',
          saveData: conn.saveData || false
        };
      }

      return hardware;
    },

    testExponentiationOperator: function() {
      try {
        eval('2 ** 3');
        return true;
      } catch (e) {
        return false;
      }
    },

    testAsyncAwaitSupport: function() {
      try {
        // 直接尝试创建 async 函数
        var testFn = async function() { return 42; };

        // 检查是否创建成功且是函数
        if (typeof testFn !== 'function') return false;

        // 检查构造函数名称（你的浏览器显示 AsyncFunction）
        if (testFn.constructor.name !== 'AsyncFunction') return false;

        // 检查是否能返回 Promise
        var result = testFn();
        if (!(result instanceof Promise)) return false;

        return true;

      } catch (error) {
        return false;
      }
    },

    testObjectSpread: function() {
      return safeTestFeature('var obj = {...{a: 1}}');
    },

    testAsyncIteration: function() {
      try {
        eval('async function* test() {}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testForOfSupport: function() {
      try {
        eval('for (var x of [1,2,3]) {}');
        return true;
      } catch (e) {
        return false;
      }
    },

    testDynamicImport: function() {
      try {
        // 检查动态 import() 语法支持
        eval('import("").catch(() => {})');
        return true;
      } catch (e) {
        return false;
      }
    },

    // 获取 WebGL 信息
    getWebGLInfo: function() {
      var result = {
        supported: false,
        version: '不支持',
        vendor: 'Unknown',
        renderer: 'Unknown'
      };

      try {
        var canvas = document.createElement('canvas');
        var gl = null;

        // 尝试不同版本的 WebGL
        var contexts = [
          { name: 'WebGL 2.0', context: canvas.getContext('webgl2') },
          { name: 'WebGL 1.0', context: canvas.getContext('webgl') },
          { name: '实验性 WebGL', context: canvas.getContext('experimental-webgl') }
        ];

        for (var i = 0; i < contexts.length; i++) {
          if (contexts[i].context) {
            gl = contexts[i].context;
            result.version = contexts[i].name;
            result.supported = true;
            break;
          }
        }

        if (gl) {
          var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
            result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
          }
        }
      } catch (e) {
      }

      return result;
    },

    // ================ 特性支持检测 ================
    detectFeatureSupport: function() {
      var features = {
        es6: {},
        es2016: {},
        es2017: {},
        es2018: {},
        css: {},
        webAPIs: {}
      };

      // ===== ES6 核心特性 =====
      features.es6 = {
        // Vue3 绝对必需
        proxy: typeof Proxy !== 'undefined',
        reflect: typeof Reflect !== 'undefined',
        promise: typeof Promise !== 'undefined',
        symbol: typeof Symbol !== 'undefined',
        map: typeof Map !== 'undefined',
        set: typeof Set !== 'undefined',

        // Vue3 内部优化使用
        weakMap: typeof WeakMap !== 'undefined',
        weakSet: typeof WeakSet !== 'undefined',

        // Vue3 常用工具依赖
        objectAssign: typeof Object.assign === 'function',
        arrayIncludes: 'includes' in Array.prototype,
        stringIncludes: 'includes' in String.prototype,
        arrayFrom: typeof Array.from === 'function',
        asyncAwait: this.testAsyncAwaitSupport(),

        // 对象方法（选项合并等使用）
        objectKeys: typeof Object.keys === 'function',
        objectEntries: typeof Object.entries === 'function',
        objectValues: typeof Object.values === 'function',
        objectFromEntries: typeof Object.fromEntries === 'function',

        // 语法支持
        arrowFunctions: this.testArrowFunctions(),
        templateLiterals: this.testTemplateLiterals(),
        letConst: this.testLetConst(),
        classes: this.testClassSupport(),
        defaultParams: this.testDefaultParameters(),
        restParams: this.testRestParameters(),
        spread: this.testSpreadOperator(),
        destructuring: this.testDestructuring(),
        forOf: this.testForOfSupport()
      };

      // ===== ES2016+ 特性 =====
      features.es2016 = {
        arrayPrototypeIncludes: 'includes' in Array.prototype,
        exponentiationOperator: this.testExponentiationOperator()
      };

      features.es2017 = {
        objectEntries: typeof Object.entries === 'function',
        objectValues: typeof Object.values === 'function',
        stringPadding: 'padStart' in String.prototype && 'padEnd' in String.prototype
      };

      features.es2018 = {
        objectSpread: this.testObjectSpread(),
        promiseFinally: 'finally' in Promise.prototype,
        asyncIteration: this.testAsyncIteration()
      };

      // ===== CSS 特性 =====
      features.css = {
        flexbox: this.testCSSFeature('display', 'flex'),
        grid: this.testCSSFeature('display', 'grid'),
        cssVariables: this.testCSSVariables(),
        transform: this.testCSSFeature('transform', 'translate(10px)'),
        transition: this.testCSSFeature('transition', 'all 0.3s'),
        animation: this.testCSSFeature('animation', 'fadeIn 1s'),
        calc: this.testCSSFeature('width', 'calc(100% - 20px)'),
        filter: this.testCSSFeature('filter', 'blur(5px)')
      };

      // ===== Web APIs =====
      var webglInfo = DataManager.getWebGLInfo();

      features.webAPIs = {
        webgl: webglInfo.supported,
        webglVersion: webglInfo.version,
        serviceWorker: 'serviceWorker' in navigator,
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        indexDB: 'indexedDB' in window,
        fetch: 'fetch' in window,
        geolocation: 'geolocation' in navigator,
        webWorkers: 'Worker' in window,
        webSockets: 'WebSocket' in window,
        intersectionObserver: 'IntersectionObserver' in window,
        mutationObserver: 'MutationObserver' in window,
        performance: 'performance' in window,
        performanceObserver: 'PerformanceObserver' in window,
        navigatorShare: 'share' in navigator,
        clipboard: 'clipboard' in navigator,
        es6Modules: 'noModule' in HTMLScriptElement.prototype,
        dynamicImport: this.testDynamicImport()
      };

      // ====================================================
      // 🛠️ 兼容性修复：确保重要属性在根级别也存在
      // 这样旧代码（使用 features.webgl）和新代码（使用 features.webAPIs.webgl）都能正常工作
      // ====================================================

      // 1. WebGL 相关
      features.webgl = features.webAPIs.webgl;
      features.webglVersion = features.webAPIs.webglVersion;

      // 2. 网络相关 API
      features.fetch = features.webAPIs.fetch;
      features.webSockets = features.webAPIs.webSockets;
      features.geolocation = features.webAPIs.geolocation;

      // 3. 存储相关 API
      features.localStorage = features.webAPIs.localStorage;
      features.sessionStorage = features.webAPIs.sessionStorage;
      features.indexDB = features.webAPIs.indexDB;

      // 4. 工作者和 Service Worker
      features.serviceWorker = features.webAPIs.serviceWorker;
      features.webWorkers = features.webAPIs.webWorkers;

      // 5. 模块化支持
      features.es6Modules = features.webAPIs.es6Modules;
      features.dynamicImport = features.webAPIs.dynamicImport;

      // 6. 观察者 API
      features.intersectionObserver = features.webAPIs.intersectionObserver;
      features.mutationObserver = features.webAPIs.mutationObserver;
      features.resizeObserver = features.webAPIs.resizeObserver;

      // 7. 性能 API
      features.performance = features.webAPIs.performance;
      features.performanceObserver = features.webAPIs.performanceObserver;

      // 8. 现代 Web API
      features.navigatorShare = features.webAPIs.navigatorShare;
      features.clipboard = features.webAPIs.clipboard;

      // 9. ES2016+ 特性同步到 es6 对象（因为显示代码在 es6 中查找）
      // async/await
      if (features.es2017 && features.es2017.asyncAwait !== undefined) {
        features.es6.asyncAwait = features.es2017.asyncAwait;
      }
      // objectEntries / objectValues
      if (features.es2017) {
        if (features.es2017.objectEntries !== undefined) {
          features.es6.objectEntries = features.es2017.objectEntries;
        }
        if (features.es2017.objectValues !== undefined) {
          features.es6.objectValues = features.es2017.objectValues;
        }
      }
      // arrayPrototypeIncludes
      if (features.es2016 && features.es2016.arrayPrototypeIncludes !== undefined) {
        features.es6.arrayPrototypeIncludes = features.es2016.arrayPrototypeIncludes;
      }

      // ====================================================
      // 结束兼容性修复
      // ====================================================

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

    testArrowFunctions: function() {
      try {
        // 使用 Function 构造函数代替 eval
        var fn = Function('var fn = () => {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testTemplateLiterals: function() {
      try {
        var fn = Function('var str = `template`; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testLetConst: function() {
      try {
        var fn = Function('let testLet = 1; const testConst = 2; return true;');
        return fn() === true;
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

    testRestParameters: function() {
      return safeTestFeature('function test(...args) { return args; }');
    },

    testSpreadOperator: function() {
      return safeTestFeature('var arr = [...[1,2,3]]');
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
      var webglInfo = DataManager.getWebGLInfo();
      if (!webglInfo.supported) {
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
      var self = this;
      var html = '<div class="error">';
      html += '<h3 style="color: red;">检测失败</h3>';
      html += '<p>' + (message || '未知错误') + '</p>';
      html += '<button id="reload-btn">刷新重试</button>'; // 改为使用id
      html += '</div>';

      document.getElementById('result').innerHTML = html;
      this.showLoading(false);

      // 延迟绑定事件，确保DOM已更新
      setTimeout(function() {
        var reloadBtn = document.getElementById('reload-btn');
        if (reloadBtn) {
          addEvent(reloadBtn, 'click', function() {
            location.reload();
          });
        }
      }, 10);
    },

    escapeHtml: function(text) {
      // 处理各种类型的输入
      if (text === null || text === undefined) {
        return '';
      }

      // 转换为字符串
      var str = String(text);

      // 转义 HTML 特殊字符
      return str
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
      removeClass(subtitleEl, 'compatible');
      removeClass(subtitleEl, 'partial');
      removeClass(subtitleEl, 'incompatible');
      // 添加新的状态类
      addClass(subtitleEl, level);
    },
    // ================ 显示完整结果 ================
    displayResults: function () {
      // 更新副标题
      this.updateSubtitle();

      var results = this.results; // 现在从DataManager获取
      var suggestions = this.generateSuggestions();
      var html = '';

      // 1. 顶部状态卡片
      html += '<div class="status-card ' + results.compatibility.level + '">';
      html += '<h2>检测结果: ' + results.compatibility.description + '</h2>';
      html += '<p>检测时间: ' + results.detectionTime + '</p>';
      html += '</div>';

      html += this.buildFeaturesCollapsible();

      html += '<tr><td>WebGL支持</td>';
      html += '<td>状态</td><td>';

      if (results.hardware.gpu && results.hardware.gpu.webgl !== undefined) {
        if (results.hardware.gpu.webgl) {
          html += '✅ 支持 (' + this.escapeHtml(results.hardware.gpu.webglVersion) + ')';
        } else {
          html += '❌ 不支持';
        }
      } else {
        html += '检测中...';
      }

      html += '</td><td>' + (results.hardware.gpu && results.hardware.gpu.webgl ? '✅' : '❌') + '</td></tr>';

      html += '</table>';
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

      html += '<tr><td>系统位数</td><td>';

      // 显示系统位数和检测置信度
      html += this.escapeHtml(results.os.bits);

      // 如果是低置信度，添加说明图标
      if (results.os.detectionConfidence === 'low' ||
        results.os.bits === '无法确定') {
        html += ' <span class="low-confidence" title="检测置信度较低，结果仅供参考">⚠️</span>';
      }

      html += '</td>';

      // 状态列显示
      html += '<td>';
      if (results.os.bits === '无法确定') {
        html += '❓';
      } else if (results.os.detectionConfidence === 'low') {
        html += '⚠️';
      } else if (results.os.detectionConfidence === 'medium') {
        html += '✅';
      } else if (results.os.detectionConfidence === 'high') {
        html += '✅';
      } else {
        html += '🔧';
      }
      html += '</td></tr>';

      // 硬件信息
      html += '<tr><td rowspan="3">硬件</td>';
      html += '<td>CPU 核心</td><td>' + this.formatHardwareValue(results.hardware.cpuCores) + '</td><td>⚙️</td></tr>';

      html += '<tr><td>内存</td><td>' + this.formatHardwareValue(results.hardware.memory) + '</td><td>💾</td></tr>';

      html += '<tr><td>屏幕分辨率</td><td>' + results.hardware.screen.width + '×' + results.hardware.screen.height + '</td><td>🖥️</td></tr>';

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

      html += '<div class="footer-notes">';
      html += '<p><strong>说明：</strong></p>';
      html += '<ul>';
      html += '<li>✅ 完全支持 | ⚠️ 部分支持/可能有问题 | ❌ 不支持</li>';
      html += '<li>❓ 无法确定 | 🔧 技术信息</li>';

      // 如果系统位数检测置信度低，添加特殊说明
      if (results.os.detectionConfidence === 'low' ||
        results.os.bits === '无法确定') {
        html += '<li>⚠️ 系统位数检测受浏览器安全限制，结果可能不准确</li>';
        html += '<li>💡 现代操作系统（Windows 10+, macOS 10.6+, 主流 Linux）通常为 64 位</li>';
      }

      html += '<li>Vue3 对系统位数无特殊要求，32/64 位均可运行</li>';
      html += '</ul>';
      html += '</div>';

      document.getElementById('result').innerHTML = html;
      this.bindEvents();
    },
    // ================ 新增：构建折叠面板 ================
    buildFeaturesCollapsible: function() {
      var results = this.results;
      var html = '<div class="features-section collapsible-section">';
      html += '<h3>⚙️ 特性支持详情 <small style="color:#666; font-weight:normal;">(点击展开/折叠)</small></h3>';

      // 1. Vue3核心特性面板（默认展开）
      html += '<div class="collapsible-panel expanded" id="core-features-panel">';
      html += '<div class="panel-header" onclick="Vue3Detector.togglePanel(\'core-features\')">';
      html += '<h4><span class="arrow">▼</span> Vue3 核心依赖特性</h4>';
      html += '</div>';
      html += '<div class="panel-content" id="core-features-content">';
      html += this.buildCoreFeaturesTable();
      html += '</div>';
      html += '</div>';

      // 2. 重要ES6+特性面板（默认折叠）
      html += '<div class="collapsible-panel" id="important-features-panel">';
      html += '<div class="panel-header" onclick="Vue3Detector.togglePanel(\'important-features\')">';
      html += '<h4><span class="arrow">▶</span> 重要 ES6+ 特性</h4>';
      html += '</div>';
      html += '<div class="panel-content" id="important-features-content" style="display:none;">';
      html += this.buildImportantFeaturesTable();
      html += '</div>';
      html += '</div>';

      // 3. Web API支持面板（默认折叠）
      html += '<div class="collapsible-panel" id="webapi-features-panel">';
      html += '<div class="panel-header" onclick="Vue3Detector.togglePanel(\'webapi-features\')">';
      html += '<h4><span class="arrow">▶</span> Web API 支持</h4>';
      html += '</div>';
      html += '<div class="panel-content" id="webapi-features-content" style="display:none;">';
      html += this.buildWebAPIsTable();
      html += '</div>';
      html += '</div>';

      // 4. CSS特性支持面板（默认折叠）
      html += '<div class="collapsible-panel" id="css-features-panel">';
      html += '<div class="panel-header" onclick="Vue3Detector.togglePanel(\'css-features\')">';
      html += '<h4><span class="arrow">▶</span> CSS 特性支持</h4>';
      html += '</div>';
      html += '<div class="panel-content" id="css-features-content" style="display:none;">';
      html += this.buildCSSFeaturesTable();
      html += '</div>';
      html += '</div>';

      html += '</div>';
      return html;
    },

    // ================ 新增：面板切换函数 ================
    togglePanel: function(panelType) {
      var panel = document.getElementById(panelType + '-panel');
      var content = document.getElementById(panelType + '-content');
      var arrow = panel.querySelector('.arrow');

      if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        arrow.textContent = '▼';
        addClass(panel, 'expanded');
      } else {
        content.style.display = 'none';
        arrow.textContent = '▶';
        removeClass(panel, 'expanded');
      }
    },

    // ================ 新增：构建各个表格的函数 ================
    buildCoreFeaturesTable: function() {
      var features = this.results.features.es6;
      var html = '<table class="feature-table">';
      html += '<tr><th>特性</th><th>支持情况</th><th>重要性</th></tr>';

      var coreFeatures = [
        { key: 'proxy', name: 'Proxy API', required: true },
        { key: 'reflect', name: 'Reflect API', required: true },
        { key: 'promise', name: 'Promise', required: true },
        { key: 'symbol', name: 'Symbol', required: true },
        { key: 'map', name: 'Map', required: true },
        { key: 'set', name: 'Set', required: true }
      ];

      for (var i = 0; i < coreFeatures.length; i++) {
        var feature = coreFeatures[i];
        var supported = features[feature.key];
        html += '<tr>';
        html += '<td>' + feature.name + '</td>';
        html += '<td class="' + (supported ? 'supported' : 'not-supported') + '">';
        html += supported ? '✅ 支持' : '❌ 不支持';
        html += '</td>';
        html += '<td>' + (feature.required ? '<span class="required">必需</span>' : '推荐') + '</td>';
        html += '</tr>';
      }

      html += '</table>';
      return html;
    },

    buildImportantFeaturesTable: function() {
      var results = this.results;
      var html = '<table class="feature-table">';
      html += '<tr><th>特性</th><th>支持情况</th><th>用途</th></tr>';

      var importantFeatures = [
        { key: 'asyncAwait', name: 'async/await', desc: '异步编程、组合式API' },
        { key: 'objectAssign', name: 'Object.assign', desc: '选项合并、props 处理' },
        { key: 'arrowFunctions', name: '箭头函数', desc: '简洁函数语法' },
        { key: 'templateLiterals', name: '模板字符串', desc: '字符串拼接、模板' },
        { key: 'letConst', name: 'let/const', desc: '块级作用域变量' },
        { key: 'destructuring', name: '解构赋值', desc: '对象/数组解构' },
        { key: 'spread', name: '扩展运算符', desc: '数组/对象展开' },
        { key: 'arrayIncludes', name: 'Array.includes', desc: '数组包含判断' },
        { key: 'stringIncludes', name: 'String.includes', desc: '字符串包含判断' }
      ];

      for (var i = 0; i < importantFeatures.length; i++) {
        var feature = importantFeatures[i];
        var supported = false;

        if (feature.key === 'asyncAwait') {
          supported = (results.features.es2017 && results.features.es2017.asyncAwait) ||
            results.features.es6.asyncAwait;
        } else {
          supported = results.features.es6[feature.key];
        }

        html += '<tr>';
        html += '<td><strong>' + feature.name + '</strong></td>';
        html += '<td class="' + (supported ? 'supported' : 'not-supported') + '">';
        html += supported ? '✅ 支持' : '❌ 不支持';
        html += '</td>';
        html += '<td><small>' + feature.desc + '</small></td>';
        html += '</tr>';
      }

      html += '</table>';
      return html;
    },

    buildWebAPIsTable: function() {
      var results = this.results;
      var html = '<table class="feature-table">';
      html += '<tr><th>API</th><th>支持情况</th><th>详情</th></tr>';

      var webAPIs = [
        { key: 'webgl', name: 'WebGL', desc: '3D 图形渲染' },
        { key: 'fetch', name: 'Fetch API', desc: '网络请求' },
        { key: 'localStorage', name: 'localStorage', desc: '本地存储' },
        { key: 'serviceWorker', name: 'Service Worker', desc: '离线应用、推送' },
        { key: 'indexDB', name: 'IndexedDB', desc: '客户端数据库' },
        { key: 'es6Modules', name: 'ES6 模块', desc: '模块化开发' },
        { key: 'intersectionObserver', name: 'IntersectionObserver', desc: '元素可见性监听' },
        { key: 'mutationObserver', name: 'MutationObserver', desc: 'DOM 变化监听' }
      ];

      for (var i = 0; i < webAPIs.length; i++) {
        var api = webAPIs[i];
        var apiSupported = results.features.webAPIs[api.key];
        var apiDetails = '';

        // 🔥 关键：WebGL信息从统一数据源获取
        if (api.key === 'webgl') {
          var webglInfo = DataManager.getWebGLInfo();
          apiSupported = webglInfo.supported;
          if (apiSupported) {
            apiDetails = '版本: ' + this.escapeHtml(webglInfo.version);
          }
        }

        html += '<tr>';
        html += '<td><strong>' + api.name + '</strong><br><small>' + api.desc + '</small></td>';
        html += '<td class="' + (apiSupported ? 'supported' : 'not-supported') + '">';
        html += apiSupported ? '✅ 支持' : '❌ 不支持';
        html += '</td>';
        html += '<td>' + apiDetails + '</td>';
        html += '</tr>';
      }

      html += '</table>';
      return html;
    },

    buildCSSFeaturesTable: function() {
      var features = this.results.features.css;
      var html = '<table class="feature-table">';
      html += '<tr><th>特性</th><th>支持情况</th><th>用途</th></tr>';

      var cssFeatures = [
        { key: 'flexbox', name: 'Flexbox', desc: '弹性布局' },
        { key: 'grid', name: 'CSS Grid', desc: '网格布局' },
        { key: 'cssVariables', name: 'CSS 变量', desc: '自定义属性、主题' },
        { key: 'transform', name: 'Transform', desc: '元素变换' },
        { key: 'transition', name: 'Transition', desc: '过渡动画' },
        { key: 'animation', name: 'Animation', desc: '关键帧动画' },
        { key: 'calc', name: 'calc()', desc: '动态计算值' },
        { key: 'filter', name: 'Filter', desc: '滤镜效果' }
      ];

      for (var i = 0; i < cssFeatures.length; i++) {
        var cssFeature = cssFeatures[i];
        var cssSupported = features[cssFeature.key];
        html += '<tr>';
        html += '<td><strong>' + cssFeature.name + '</strong></td>';
        html += '<td class="' + (cssSupported ? 'supported' : 'not-supported') + '">';
        html += cssSupported ? '✅ 支持' : '❌ 不支持';
        html += '</td>';
        html += '<td><small>' + cssFeature.desc + '</small></td>';
        html += '</tr>';
      }

      html += '</table>';
      return html;
    },
    // ================ 显示辅助函数 ================
    formatHardwareValue: function(value) {
      if (value === 'Unknown' || value === '无法检测' ||
        value === '检测失败' || value === 'Safari 不支持内存检测') {
        return '<span class="hardware-unknown">' + this.escapeHtml(value) + '</span>';
      }
      return this.escapeHtml(value);
    },

    getHardwareStatusIcon: function(value, type) {
      if (value === 'Unknown' || value === '无法检测' || value === '检测失败') {
        return '❓';
      }
      if (value === 'Safari 不支持内存检测' && type === 'memory') {
        return '⚠️';
      }
      return '⚙️';
    },
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

    // ================ 分享功能 ================
    // 生成分享数据
    // 修改 generateShareData 函数
    generateShareData: function() {
      // 只分享关键信息，大大缩短数据
      var shareData = {
        v: '2.0', // 版本
        t: Date.now().toString(36), // 时间戳用36进制缩短
        c: this.results.compatibility.level.substring(0, 1), // 只取第一个字母：c/p/i
        b: this.results.browser.name.substring(0, 3) +
          Math.floor(this.results.browser.version || 0), // 浏览器简写+版本
      };

      // 使用更短的编码
      var jsonStr = JSON.stringify(shareData);
      // 使用更URL友好的编码
      var encoded = btoa(jsonStr)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // 移除等号

      return {
        data: shareData,
        encoded: encoded,
        url: window.location.origin + window.location.pathname + '?s=' + encoded
      };
    },

    // 生成分享 ID（6位字母数字）
    generateShareId: function() {
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var id = '';
      for (var i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    },

    // 生成分享链接
    generateShareUrl: function(base64Data, shareId) {
      var baseUrl = window.location.href.split('?')[0];
      return baseUrl + '?share=' + base64Data + '&id=' + shareId;
    },

    // 打开分享模态框
    openShareModal: function() {
      if (!this.results || !this.results.detectionTime) {
        showExportFeedback('❌ 请先完成检测', 'error');
        return;
      }

      var shareData = this.generateShareData();

      // 更新模态框内容
      document.getElementById('share-link-input').value = shareData.url;
      // document.getElementById('share-id').textContent = shareData.id;

      // 生成二维码
      this.generateQRCode(shareData.url);

      // 显示模态框
      document.getElementById('share-modal').style.display = 'flex';

    },

    // 生成二维码（简单实现，如果可用则使用，否则显示提示）
    generateQRCode: function(url) {
      var container = document.getElementById('qrcode-container');
      container.innerHTML = '<p>正在生成二维码...</p>';

      var self = this;

      setTimeout(function() {
        try {
          // 清空容器
          container.innerHTML = '';

          // 尝试使用 QRCode.js
          new QRCode(container, {
            text: url,
            width: 180,
            height: 180,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });

        } catch (error) {

          // 显示回退界面
          container.innerHTML = '<div class="qrcode-fallback">' +
            '<p><strong>📱 分享链接</strong></p>' +
            '<div class="fallback-link">' +
            '<p class="mono-link">' + self.escapeHtml(url) + '</p>' +
            '</div>' +
            '<p><small>复制此链接分享，或使用其他工具生成二维码</small></p>' +
            '</div>';
        }
      }, 100);
    },

    // 二维码生成失败时的回退显示
    showQRCodeFallback: function(container, url, error) {
      var errorMsg = error ? '<p><small>错误: ' + this.escapeHtml(error.message) + '</small></p>' : '';

      container.innerHTML = '<div class="qrcode-fallback">' +
        '<p><strong>⚠️ 二维码生成受限</strong></p>' +
        '<p>您的浏览器环境不支持二维码生成，请使用以下替代方式：</p>' +
        '<div class="fallback-link">' +
        '<p><strong>分享链接：</strong></p>' +
        '<p class="mono-link">' + this.escapeHtml(url.substring(0, 50)) + '...</p>' +
        '</div>' +
        '<p><small>提示：您可以直接复制上方的分享链接</small></p>' +
        errorMsg +
        '</div>';
    },

    // 复制链接到剪贴板
    copyShareLink: function() {
      var input = document.getElementById('share-link-input');
      var copyBtn = document.getElementById('copy-link-btn');

      try {
        input.select();
        input.setSelectionRange(0, 99999); // 移动设备支持

        var success = document.execCommand('copy');

        if (success) {
          // 显示成功反馈
          var originalText = copyBtn.textContent;
          copyBtn.textContent = '✅ 已复制';
          addClass(copyBtn, 'copied');

          // 3秒后恢复
          setTimeout(function() {
            copyBtn.textContent = originalText;
            addClass(copyBtn, 'copied')
          }, 3000);

          showExportFeedback('✅ 链接已复制到剪贴板', 'success');
        } else {
          showExportFeedback('❌ 复制失败，请手动复制', 'error');
        }
      } catch (error) {
        console.error('复制失败:', error);
        showExportFeedback('❌ 复制失败: ' + error.message, 'error');
      }
    },

    // 关闭分享模态框
    closeShareModal: function() {
      document.getElementById('share-modal').style.display = 'none';
    },

    // 解析分享链接（从URL参数中读取分享数据）
    parseShareFromUrl: function() {
      var urlParams = new URLSearchParams(window.location.search);
      var shareData = urlParams.get('share');
      var shareId = urlParams.get('id');

      if (shareData && shareId) {
        try {
          // 解码 Base64
          var jsonStr = decodeURIComponent(atob(shareData));
          var data = JSON.parse(jsonStr);

          // 这里可以添加逻辑来显示分享的数据
          // 例如：显示"这是来自分享的检测结果"
          return data;
        } catch (error) {
          console.error('解析分享数据失败:', error);
          return null;
        }
      }

      return null;
    },
    bindEvents: function() {
      var self = this;

      // 重新检测按钮
      var recheckBtn = document.getElementById('recheck-btn');
      if (recheckBtn) {
        addEvent(recheckBtn, 'click', function() {
          self.runDetection();
        });
      }

      // JSON 导出按钮
      var exportJsonBtn = document.getElementById('export-json-btn');
      if (exportJsonBtn) {
        addEvent(exportJsonBtn, 'click', function() {
          if (self.results && self.results.detectionTime) {
            self.exportAsJSON();
          } else {
            // 显示错误提示（稍后实现）
            alert('请先完成检测');
          }
        });
      }

      // HTML 导出按钮
      var exportHtmlBtn = document.getElementById('export-html-btn');
      if (exportHtmlBtn) {
        addEvent(exportHtmlBtn, 'click', function() {
          if (self.results && self.results.detectionTime) {
            self.exportAsHTML();
          } else {
            alert('请先完成检测');
          }
        });
      }

      // 分享按钮
      var shareBtn = document.getElementById('share-btn');
      if (shareBtn) {
        addEvent(shareBtn, 'click', function() {
          self.openShareModal();
        });
      }

      // 复制链接按钮
      var copyLinkBtn = document.getElementById('copy-link-btn');
      if (copyLinkBtn) {
        addEvent(copyLinkBtn, 'click', function() {
          self.copyShareLink();
        });
      }

      // 关闭模态框按钮
      var closeModalBtn = document.getElementById('close-share-modal');
      if (closeModalBtn) {
        addEvent(closeModalBtn, 'click', function() {
          self.closeShareModal();
        });
      }

      // 点击模态框外部关闭
      var modal = document.getElementById('share-modal');
      if (modal) {
        addEvent(modal, 'click', function(event) {
          if (event.target === modal) {
            self.closeShareModal();
          }
        });
      }
      /*
      // 页面加载时检查是否有分享链接
      window.onload = function() {
        var sharedData = self.parseShareFromUrl();
        if (sharedData) {
          // 可以在这里显示分享的数据
          // 可以添加一个提示，比如："正在查看分享的检测结果"
        }

        // 原有的检测逻辑
        if (window.Vue3Detector && window.Vue3Detector.runDetection) {
          window.Vue3Detector.runDetection();
        } else {
          document.getElementById('result').innerHTML =
            '<p style="color: red;">检测脚本加载失败，请刷新页面重试。</p>';
          document.getElementById('loading').style.display = 'none';
          document.getElementById('result').style.display = 'block';
        }
      };
      */
    },
  };

  // 暴露到全局
  window.Vue3Detector = Vue3Detector;

})();
} catch (initError) {
  // 如果初始化失败，提供一个最简化的降级版本
  console.error('Vue3Detector 主逻辑初始化失败:', initError);

  window.Vue3Detector = {
    runDetection: function() {
      var resultEl = document.getElementById('result');
      var loadingEl = document.getElementById('loading');
      var subtitleEl = document.getElementById('subtitle');

      if (loadingEl) loadingEl.style.display = 'none';
      if (subtitleEl) subtitleEl.textContent = '初始化失败';

      if (resultEl) {
        var isIE = navigator.userAgent.indexOf('MSIE') > -1 ||
          navigator.userAgent.indexOf('Trident/') > -1;
        var ieHint = isIE ? '<p>检测到您正在使用旧版Internet Explorer浏览器，该浏览器无法运行Vue3。</p>' : '';

        resultEl.innerHTML =
          '<div style="padding: 30px; text-align: center; background: #f8d7da; color: #721c24; border-radius: 5px;">' +
          '<h3>❌ 兼容性检测器启动失败</h3>' +
          '<p><strong>原因:</strong> ' + (initError.message || '未知错误') + '</p>' +
          ieHint +
          '<p>建议使用 Chrome、Edge、Firefox 等现代浏览器。</p>' +
          '<button onclick="location.reload()" style="padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 4px;">刷新页面</button>' +
          '</div>';
        resultEl.style.display = 'block';
      }
    },
    // 提供一个方法让外部知道初始化失败了
    initFailed: true,
    initError: initError
  };
}
window.Vue3Detector = window.Vue3Detector || {
  runDetection: function() {
    alert('检测脚本完全加载失败，请刷新页面。');
  }
};
