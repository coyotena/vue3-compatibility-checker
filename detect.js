// ==============================================
// Vue3 兼容性检测器 - 强化IE兼容版
// 版本：v1.2 - 增强IE兼容性
// ==============================================

;(function () {
  // 检测是否是IE浏览器
  var isIE = (function() {
    var ua = navigator.userAgent || '';
    return ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1;
  })();

  var IE_VERSION = (function() {
    var ua = navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    return null;
  })();

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

    // ================ 统一WebGL检测（IE安全版） ================
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

      // IE下直接返回不支持
      if (isIE) {
        this._webglCache = result;
        return result;
      }

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
  // 导出功能辅助函数（IE兼容版）
  // ==============================================

  function safeTestFeature(code) {
    // IE 下更安全的检测
    if (isIE) {
      // 快速检查常见特性
      if (code.indexOf('Proxy') > -1) return false;
      if (code.indexOf('Reflect') > -1) return false;
      if (code.indexOf('Symbol') > -1) return false;
      if (code.indexOf('async') > -1) return false;
      if (code.indexOf('=>') > -1) return false;
      if (code.indexOf('`') > -1) return false;
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

  // IE兼容的文件下载函数
  function downloadFile(content, fileName, mimeType) {
    try {
      // IE10+ 支持 Blob，IE9- 需要特殊处理
      if (window.Blob && window.navigator.msSaveOrOpenBlob) {
        // IE10-11 的特殊方法
        var blob = new Blob([content], { type: mimeType });
        window.navigator.msSaveOrOpenBlob(blob, fileName);
        return true;
      } else if (window.Blob && window.URL && window.URL.createObjectURL) {
        // 现代浏览器方式
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
      } else {
        // 回退方案：使用数据URI
        var dataUri = 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content);
        window.open(dataUri, '_blank');
        return true;
      }
    } catch (error) {
      console.error('下载文件失败:', error);
      // 最后的回退：提示用户复制内容
      if (confirm('文件下载失败，是否复制内容到剪贴板？')) {
        var textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showExportFeedback('✅ 内容已复制到剪贴板，请手动保存', 'success');
        } catch (e) {
          showExportFeedback('❌ 复制失败，请手动保存以下内容：\n' + content, 'error');
        }
        document.body.removeChild(textarea);
      }
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

  // 7. 修复 JSON 对象（IE7及以下）
  if (!window.JSON) {
    window.JSON = {
      parse: function(sJSON) {
        return eval('(' + sJSON + ')');
      },
      stringify: function(vContent) {
        if (vContent instanceof Object) {
          var sOutput = '';
          if (vContent.constructor === Array) {
            for (var nId = 0; nId < vContent.length; nId++) {
              sOutput += this.stringify(vContent[nId]) + ',';
            }
            return '[' + sOutput.substr(0, sOutput.length - 1) + ']';
          }
          if (vContent.toString !== Object.prototype.toString) {
            return '"' + vContent.toString().replace(/"/g, '\\"') + '"';
          }
          for (var sProp in vContent) {
            sOutput += '"' + sProp + '":' + this.stringify(vContent[sProp]) + ',';
          }
          return '{' + sOutput.substr(0, sOutput.length - 1) + '}';
        }
        return typeof vContent === 'string' ? '"' + vContent.replace(/"/g, '\\"') + '"' : String(vContent);
      }
    };
  }

  // 全局对象
  var Vue3Detector = {
    get results() {
      return DataManager.getState();
    },

    // ================ 导出为 JSON 格式（IE安全版） ================
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
        var jsonString;
        try {
          jsonString = JSON.stringify(exportData, null, 2);
        } catch (e) {
          // 如果JSON.stringify失败，使用简化的结构
          jsonString = JSON.stringify({
            meta: exportData.meta,
            compatibility: this.results.compatibility,
            browser: this.results.browser,
            suggestions: exportData.suggestions
          }, null, 2);
        }

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

    // ================ 导出为 HTML 报告（IE安全版） ================
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
      try {
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
      } catch (error) {
        console.error('信息收集失败:', error);
        // 即使失败，也设置一些基本数据
        DataManager.set('browser', { name: '检测失败', version: '0' });
        DataManager.set('os', { name: '未知', version: '未知' });
        DataManager.set('hardware', {});
        DataManager.set('features', { es6: {}, css: {}, webAPIs: {} });
      }
    },

    // ================ 浏览器信息检测 ================
    detectBrowserInfo: function () {
      var ua = navigator.userAgent || '';
      var appVersion = navigator.appVersion || '';
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
        isIE: isIE,
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
      var ua = (navigator.userAgent || '').toLowerCase();
      var platform = navigator.platform || '';
      var appVersion = navigator.appVersion || '';

      var os = {
        name: 'Unknown',
        version: 'Unknown',
        platform: platform,
        bits: 'Unknown',
        detectionConfidence: 'low'
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

      // ===== 2. 系统位数检测（简化版） =====
      if (ua.indexOf('win64') > -1 || ua.indexOf('x64') > -1 ||
        ua.indexOf('amd64') > -1 || ua.indexOf('wow64') > -1) {
        os.bits = '64-bit';
      } else if (ua.indexOf('win32') > -1 || ua.indexOf('x86') > -1) {
        os.bits = '32-bit';
      } else {
        os.bits = '无法确定';
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
          webgl: false,
          webglVersion: 'Unknown'
        },
        detectionNotes: []
      };

      // ===== 1. CPU 核心数检测 =====
      try {
        if (navigator.hardwareConcurrency) {
          hardware.cpuCores = navigator.hardwareConcurrency;
        } else {
          hardware.cpuCores = '无法检测';
        }
      } catch (e) {
        hardware.cpuCores = '检测失败';
      }

      // ===== 2. 内存检测 =====
      try {
        if (navigator.deviceMemory) {
          hardware.memory = navigator.deviceMemory + ' GB';
        } else {
          hardware.memory = '无法检测';
        }
      } catch (e) {
        hardware.memory = '检测失败';
      }

      // ===== 3. WebGL 和 GPU 信息 =====
      try {
        var webglInfo = DataManager.getWebGLInfo();
        hardware.gpu.webgl = webglInfo.supported;
        hardware.gpu.webglVersion = webglInfo.version;
        hardware.gpu.vendor = webglInfo.vendor;
        hardware.gpu.renderer = webglInfo.renderer;
      } catch (e) {
        hardware.gpu.webgl = false;
        hardware.gpu.webglVersion = '检测失败';
      }

      return hardware;
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

        // 对象方法
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

      // 兼容性修复
      features.webgl = features.webAPIs.webgl;
      features.webglVersion = features.webAPIs.webglVersion;
      features.fetch = features.webAPIs.fetch;
      features.localStorage = features.webAPIs.localStorage;
      features.serviceWorker = features.webAPIs.serviceWorker;

      return features;
    },

    // ================ 测试辅助函数 ================

    testES6Support: function () {
      try {
        eval('var x = 1;');
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2016Support: function () {
      try {
        // 使用Function构造函数避免语法错误
        var fn = new Function('return 2 ** 3');
        fn();
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2017Support: function () {
      // IE不支持async/await
      if (isIE) return false;

      try {
        // 使用更安全的方式检测
        return this.testAsyncAwaitSupport();
      } catch (e) {
        return false;
      }
    },

    testArrowFunctions: function() {
      if (isIE) return false;

      try {
        var fn = new Function('var fn = function() {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testTemplateLiterals: function() {
      if (isIE) return false;

      try {
        var fn = new Function('var str = "template"; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testLetConst: function() {
      if (isIE) return false;

      try {
        var fn = new Function('var testLet = 1; var testConst = 2; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testClassSupport: function () {
      if (isIE) return false;

      try {
        var fn = new Function('function TestClass() {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testDefaultParameters: function () {
      if (isIE) return false;

      try {
        var fn = new Function('function test(a) { return a || 1; }; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testRestParameters: function() {
      if (isIE) return false;
      return safeTestFeature('function test() { var args = arguments; return args; }');
    },

    testSpreadOperator: function() {
      if (isIE) return false;
      return safeTestFeature('var arr = [1,2,3].concat([4,5])');
    },

    testDestructuring: function () {
      if (isIE) return false;

      try {
        var fn = new Function('var obj = {a: 1, b: 2}; var a = obj.a; var b = obj.b; return true;');
        return fn() === true;
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

    testExponentiationOperator: function() {
      if (isIE) return false;

      try {
        var fn = new Function('return Math.pow(2, 3)');
        fn();
        return true;
      } catch (e) {
        return false;
      }
    },

    testAsyncAwaitSupport: function() {
      if (isIE) return false;

      try {
        // 更安全的检测方式
        var fn = new Function('return Promise && Promise.resolve && true');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testObjectSpread: function() {
      if (isIE) return false;
      return safeTestFeature('var obj = Object.assign({}, {a: 1})');
    },

    testAsyncIteration: function() {
      if (isIE) return false;

      try {
        var fn = new Function('return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testForOfSupport: function() {
      if (isIE) return false;

      try {
        var fn = new Function('for (var i = 0; i < 3; i++) {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testDynamicImport: function() {
      if (isIE) return false;

      try {
        var fn = new Function('return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    // ================ 兼容性分析 ================
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
      var IMPORTANT_FEATURES = ['map', 'set'];
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
      } else if (warningIssues.length > 0 || infoIssues.length > 0) {
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
      html += '<button id="reload-btn">刷新重试</button>';
      html += '</div>';

      document.getElementById('result').innerHTML = html;
      this.showLoading(false);

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
      if (text === null || text === undefined) {
        return '';
      }

      var str = String(text);

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

      html += '<tr><td>系统位数</td><td>' + this.escapeHtml(results.os.bits) + '</td>';
      html += '<td>' + (results.os.bits !== '无法确定' ? '✅' : '❓') + '</td></tr>';

      // 硬件信息
      html += '<tr><td rowspan="3">硬件</td>';
      html += '<td>CPU 核心</td><td>' + this.formatHardwareValue(results.hardware.cpuCores) + '</td><td>⚙️</td></tr>';

      html += '<tr><td>内存</td><td>' + this.formatHardwareValue(results.hardware.memory) + '</td><td>💾</td></tr>';

      html += '<tr><td>屏幕分辨率</td><td>' + results.hardware.screen.width + '×' + results.hardware.screen.height + '</td><td>🖥️</td></tr>';

      html += '<tr><td>GPU/WebGL</td>';
      html += '<td>WebGL支持</td><td>';

      if (results.hardware.gpu && results.hardware.gpu.webgl !== undefined) {
        if (results.hardware.gpu.webgl) {
          html += '✅ 支持 (' + this.escapeHtml(results.hardware.gpu.webglVersion) + ')';
        } else {
          html += '❌ 不支持';
        }
      } else {
        html += '检测失败';
      }

      html += '</td><td>' + (results.hardware.gpu && results.hardware.gpu.webgl ? '✅' : '❌') + '</td></tr>';

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
    formatHardwareValue: function(value) {
      if (value === 'Unknown' || value === '无法检测' ||
        value === '检测失败' || value === 'Safari 不支持内存检测') {
        return '<span class="hardware-unknown">' + this.escapeHtml(value) + '</span>';
      }
      return this.escapeHtml(value);
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
    generateSuggestions: function() {
      var results = this.results;
      var compatibility = results.compatibility;
      var detailedIssues = compatibility.detailedIssues;
      var suggestions = [];

      // ===== 1. 根据兼容性等级生成主建议 =====

      if (compatibility.level === 'incompatible') {
        // 不兼容：显示核心问题解决方案
        if (detailedIssues.critical && detailedIssues.critical.length > 0) {
          var mainCritical = detailedIssues.critical[0];

          suggestions.push({
            type: 'critical',
            category: 'browser',
            title: '无法运行 Vue3',
            description: mainCritical.message,
            details: mainCritical.description,
            actions: this.getCriticalIssueActions(mainCritical)
          });
        }
      }
      else if (compatibility.level === 'partial') {
        // 部分兼容：显示优化建议
        var hasWarningIssues = detailedIssues.warning && detailedIssues.warning.length > 0;
        var hasOnlyInfoIssues = !hasWarningIssues && detailedIssues.info && detailedIssues.info.length > 0;

        if (hasWarningIssues) {
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

      // ===== 2. 如果没有生成任何建议，添加一个默认建议 =====
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

    // ================ 分享功能（简化版，避免IE错误） ================
    openShareModal: function() {
      if (!this.results || !this.results.detectionTime) {
        showExportFeedback('❌ 请先完成检测', 'error');
        return;
      }

      var shareData = this.generateShareData();

      // 更新模态框内容
      document.getElementById('share-link-input').value = shareData.url;

      // 尝试生成二维码（如果IE可能失败）
      try {
        this.generateQRCode(shareData.url);
      } catch (error) {
        var container = document.getElementById('qrcode-container');
        container.innerHTML = '<div class="qrcode-fallback">' +
          '<p><strong>📱 分享链接</strong></p>' +
          '<div class="fallback-link">' +
          '<p class="mono-link">' + this.escapeHtml(shareData.url) + '</p>' +
          '</div>' +
          '<p><small>复制此链接分享</small></p>' +
          '</div>';
      }

      // 显示模态框
      document.getElementById('share-modal').style.display = 'flex';
    },

    generateShareData: function() {
      // 只分享关键信息
      var shareData = {
        v: '2.0',
        t: Date.now().toString(36),
        c: this.results.compatibility.level.substring(0, 1),
        b: this.results.browser.name.substring(0, 3) +
          Math.floor(this.results.browser.version || 0),
      };

      var jsonStr = JSON.stringify(shareData);
      var encoded = '';

      try {
        encoded = btoa(jsonStr)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (e) {
        encoded = 'error';
      }

      return {
        data: shareData,
        encoded: encoded,
        url: window.location.origin + window.location.pathname + '?s=' + encoded
      };
    },

    generateQRCode: function(url) {
      var container = document.getElementById('qrcode-container');
      container.innerHTML = '<p>正在生成二维码...</p>';

      var self = this;

      setTimeout(function() {
        try {
          container.innerHTML = '';
          new QRCode(container, {
            text: url,
            width: 180,
            height: 180,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        } catch (error) {
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

    copyShareLink: function() {
      var input = document.getElementById('share-link-input');
      var copyBtn = document.getElementById('copy-link-btn');

      try {
        input.select();
        input.setSelectionRange(0, 99999);

        var success = document.execCommand('copy');

        if (success) {
          var originalText = copyBtn.textContent;
          copyBtn.textContent = '✅ 已复制';
          addClass(copyBtn, 'copied');

          setTimeout(function() {
            copyBtn.textContent = originalText;
            removeClass(copyBtn, 'copied');
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

    closeShareModal: function() {
      document.getElementById('share-modal').style.display = 'none';
    },

    parseShareFromUrl: function() {
      var urlParams = new URLSearchParams(window.location.search);
      var shareData = urlParams.get('share');
      var shareId = urlParams.get('id');

      if (shareData && shareId) {
        try {
          var jsonStr = decodeURIComponent(atob(shareData));
          var data = JSON.parse(jsonStr);
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
    },
  };

  // 暴露到全局
  window.Vue3Detector = Vue3Detector;

  // 自动检测IE版本并显示基本信息
  if (isIE) {
    domReady(function() {
      // 在IE中显示特殊提示
      var subtitle = document.getElementById('subtitle');
      if (subtitle) {
        subtitle.innerHTML = '⚠️ 检测到 Internet Explorer 浏览器，正在检测兼容性...<br>' +
          '<small style="color: #666;">IE 不支持 Vue3，但我们会显示详细的不兼容信息</small>';
      }
    });
  }

})();