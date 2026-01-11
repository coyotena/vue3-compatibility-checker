// ==============================================
// Vue3 兼容性检测器 - 完整特性显示版
// 版本：v1.4 - 所有浏览器显示完整检查项
// ==============================================

;(function () {
  // ==============================================
  // 1. IE检测和版本判断
  // ==============================================

  // 检测是否是IE浏览器
  var isIE = (function() {
    var ua = navigator.userAgent || '';
    return ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1;
  })();

  // 获取IE具体版本
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

  // 判断是否是低版本IE（IE8及以下）
  var IS_IE_LOW = isIE && IE_VERSION !== null && IE_VERSION <= 8;

  // ==============================================
  // 2. IE低版本专用修复 (IE6-8)
  // ==============================================

  if (IS_IE_LOW) {
    console.log('检测到低版本IE: ' + IE_VERSION + '，应用兼容性修复');

    // 1. 安全执行包装器（避免try-catch作用域问题）
    window._ieSafeTry = function(fn, errorCallback) {
      try {
        return fn();
      } catch (e) {
        if (errorCallback) {
          errorCallback(e);
        }
        return null;
      }
    };

    // 2. 修复 JSON (IE7及以下)
    if (!window.JSON) {
      window.JSON = {
        parse: function(sJSON) {
          return eval('(' + sJSON + ')');
        },
        stringify: function(vContent) {
          if (vContent === null || vContent === undefined) {
            return String(vContent);
          }

          switch (typeof vContent) {
            case 'string':
              return '"' + vContent.replace(/"/g, '\\"') + '"';
            case 'number':
            case 'boolean':
              return String(vContent);
            case 'object':
              if (vContent.constructor === Array) {
                var sOutput = '';
                for (var nId = 0; nId < vContent.length; nId++) {
                  sOutput += this.stringify(vContent[nId]) + ',';
                }
                return '[' + sOutput.substr(0, sOutput.length - 1) + ']';
              }
              if (vContent.constructor === Date) {
                return '"' + vContent.toISOString() + '"';
              }
              var sOutput = '';
              for (var sProp in vContent) {
                if (vContent.hasOwnProperty(sProp)) {
                  sOutput += '"' + sProp + '":' + this.stringify(vContent[sProp]) + ',';
                }
              }
              return '{' + sOutput.substr(0, sOutput.length - 1) + '}';
          }
          return '""';
        }
      };
    }

    // 3. 修复 Array.isArray (IE8及以下)
    if (!Array.isArray) {
      Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
      };
    }

    // 4. 修复 window.location.origin (IE10及以下)
    if (!window.location.origin) {
      window.location.origin = window.location.protocol + '//' +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '');
    }

    // 5. 修复 Date.now (IE8及以下) - 如果还没有被修复
    if (!Date.now) {
      Date.now = function() {
        return new Date().getTime();
      };
    }

    // 6. 修复 console 对象 (IE6-8可能不存在)
    if (!window.console) {
      window.console = {
        log: function() {
          try {
            var args = Array.prototype.slice.call(arguments);
            var msg = args.join(' ');

            // 尝试输出到页面隐藏元素
            var debugEl = document.getElementById('debug-output');
            if (!debugEl) {
              debugEl = document.createElement('div');
              debugEl.id = 'debug-output';
              debugEl.style.cssText = 'display:none;position:absolute;left:-9999px;';
              document.body.appendChild(debugEl);
            }
            debugEl.innerHTML += msg + '<br>';
          } catch(e) {
            // 什么都不做，避免出错
          }
        },
        error: function() {
          var args = Array.prototype.slice.call(arguments);
          console.log('[ERROR] ' + args.join(' '));
        },
        warn: function() {
          var args = Array.prototype.slice.call(arguments);
          console.log('[WARN] ' + args.join(' '));
        },
        info: function() {
          var args = Array.prototype.slice.call(arguments);
          console.log('[INFO] ' + args.join(' '));
        }
      };
    }
  }

  // ==============================================
  // 3. 安全特性检测函数
  // ==============================================

  function safeTestFeature(code) {
    // IE低版本特殊处理
    if (IS_IE_LOW) {
      // 使用全局的错误处理器避免作用域问题
      var result = window._ieSafeTry ? window._ieSafeTry(function() {
        // IE6-7: 避免使用new Function，直接返回false
        if (IE_VERSION <= 7) {
          return false;
        }

        // IE8: 可以尝试使用Function，但要更安全
        try {
          var testFunc = new Function(
            'try { ' + code + '; return true; } catch(e) { return false; }'
          );
          return testFunc() === true;
        } catch (e) {
          return false;
        }
      }, function(e) {
        return false;
      }) : false;

      return result;
    }

    // 现代浏览器和IE9+使用原有逻辑
    try {
      var testFunc = new Function(
        'try { ' + code + '; return true; } catch(e) { return false; }'
      );
      return testFunc() === true;
    } catch (e) {
      return false;
    }
  }

  // ==============================================
  // 4. IE安全的下载函数
  // ==============================================

  function downloadFileIE(content, fileName, mimeType) {
    // IE低版本特殊处理
    try {
      // 方法1：使用IE特有的execCommand
      if (window.ActiveXObject || "ActiveXObject" in window) {
        var win = window.open('', '_blank');
        if (win) {
          win.document.write('<html><head><title>' + fileName + '</title></head><body>' +
            '<pre style="white-space: pre-wrap; word-wrap: break-word;">' +
            escapeHtmlForIE(content) + '</pre></body></html>');
          win.document.close();

          // 尝试保存
          setTimeout(function() {
            try {
              win.document.execCommand('SaveAs', true, fileName);
            } catch (e) {
              // 忽略错误
            }
            setTimeout(function() { win.close(); }, 500);
          }, 100);

          return true;
        }
      }

      // 方法2：创建文本区域让用户复制
      var textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
      document.body.appendChild(textarea);
      textarea.select();

      var copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (e) {
        copied = false;
      }

      document.body.removeChild(textarea);

      if (copied) {
        alert('✅ 内容已复制到剪贴板\n\n请打开记事本或其他文本编辑器，按Ctrl+V粘贴内容，然后保存为文件。\n建议文件名: ' + fileName);
        return true;
      } else {
        // 方法3：直接显示内容让用户手动复制
        var win = window.open('', '_blank');
        win.document.write('<html><head><title>' + fileName + ' - 请复制内容</title>' +
          '<style>body { font-family: Arial; padding: 20px; } pre { background: #f5f5f5; padding: 15px; }</style></head>' +
          '<body><h3>请复制以下内容：</h3>' +
          '<pre>' + escapeHtmlForIE(content) + '</pre>' +
          '<p>复制后，请粘贴到文本编辑器中保存为文件。</p></body></html>');
        win.document.close();
        return true;
      }
    } catch (e) {
      console.error('IE下载失败:', e);
      return false;
    }
  }

  // IE安全的HTML转义
  function escapeHtmlForIE(text) {
    if (text === null || text === undefined) return '';

    var str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==============================================
  // 5. 原有代码从这里开始
  // ==============================================

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

    // ================ 统一WebGL检测 ================
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
  // 导出功能辅助函数
  // ==============================================

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

  // 安全下载文件（兼容所有浏览器）
  function downloadFile(content, fileName, mimeType) {
    // IE低版本使用专用函数
    if (IS_IE_LOW) {
      return downloadFileIE(content, fileName, mimeType);
    }

    try {
      // 现代浏览器方式
      var blob = new Blob([content], { type: mimeType });

      // IE10-11 的特殊方法
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
        return true;
      }

      // 其他现代浏览器
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

      // 回退方案
      if (IS_IE_LOW) {
        return downloadFileIE(content, fileName, mimeType);
      }

      // 通用回退：提示用户复制
      if (confirm('文件下载失败，是否复制内容到剪贴板？')) {
        var textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.display = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showExportFeedback('✅ 内容已复制到剪贴板，请手动保存', 'success');
        } catch (e) {
          showExportFeedback('❌ 复制失败，请手动保存以下内容：\n' + content.substring(0, 500) + '...', 'error');
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

  // 2. 修复 Object.keys()（IE8不支持）
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

  // 3. 修复 Function.prototype.bind（IE8不支持）
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

  // 4. 修复 addEventListener/removeEventListener
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

    // ================ 导出为 JSON 格式 ================
    exportAsJSON: function() {
      try {
        // 准备导出数据
        var exportData = {
          meta: {
            tool: 'Vue3 Compatibility Detector',
            version: '2.0',
            generatedAt: new Date().toLocaleString(),
            url: window.location.href,
            userAgent: navigator.userAgent
          },

          detection: {
            time: this.results.detectionTime,
            compatibility: {
              level: this.results.compatibility.level,
              description: this.results.compatibility.description
            },
            browser: {
              name: this.results.browser.name,
              version: this.results.browser.version,
              isIE: this.results.browser.isIE
            },
            os: {
              name: this.results.os.name,
              version: this.results.os.version
            },
            features: this.results.features
          },

          vue3Requirements: {
            browsers: VUE3_REQUIREMENTS.browsers,
            coreFeatures: ['Proxy', 'Reflect', 'Promise', 'Symbol', 'Map', 'Set']
          },

          issues: this.results.compatibility.issues || []
        };

        // 转换为JSON字符串
        var jsonString;
        try {
          jsonString = JSON.stringify(exportData, null, 2);
        } catch (e) {
          jsonString = JSON.stringify({
            meta: exportData.meta,
            compatibility: exportData.detection.compatibility,
            browser: exportData.detection.browser,
            issues: exportData.issues
          });
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

    // ================ 导出为 HTML 报告 ================
    exportAsHTML: function() {
      try {
        var results = this.results;
        var suggestions = this.generateSuggestions();

        // 生成状态图标
        var statusIcon = '📊';
        if (results.compatibility.level === 'compatible') statusIcon = '✅';
        else if (results.compatibility.level === 'partial') statusIcon = '⚠️';
        else if (results.compatibility.level === 'incompatible') statusIcon = '❌';

        // 生成特性支持表格
        var featuresTablesHTML = this.buildFullFeaturesTablesHTML();

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
          '        .feature-table {\n' +
          '            width: 100%;\n' +
          '            border-collapse: collapse;\n' +
          '            margin: 15px 0;\n' +
          '            font-size: 14px;\n' +
          '        }\n' +
          '        \n' +
          '        .feature-table th, .feature-table td {\n' +
          '            border: 1px solid #ddd;\n' +
          '            padding: 12px;\n' +
          '            text-align: left;\n' +
          '        }\n' +
          '        \n' +
          '        .feature-table th {\n' +
          '            background-color: #f5f5f5;\n' +
          '            font-weight: bold;\n' +
          '            color: #555;\n' +
          '        }\n' +
          '        \n' +
          '        .feature-table td.supported {\n' +
          '            color: #4caf50;\n' +
          '            font-weight: bold;\n' +
          '        }\n' +
          '        \n' +
          '        .feature-table td.not-supported {\n' +
          '            color: #f44336;\n' +
          '            font-weight: bold;\n' +
          '        }\n' +
          '        \n' +
          '        .feature-table tr:nth-child(even) {\n' +
          '            background-color: #f9f9f9;\n' +
          '        }\n' +
          '        \n' +
          '        .feature-table tr:hover {\n' +
          '            background-color: #f1f1f1;\n' +
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
          '        .recommended {\n' +
          '            background-color: #fff3e0;\n' +
          '            color: #ef6c00;\n' +
          '            padding: 3px 8px;\n' +
          '            border-radius: 4px;\n' +
          '            font-size: 12px;\n' +
          '        }\n' +
          '        \n' +
          '        .footer {\n' +
          '            text-align: center;\n' +
          '            margin-top: 40px;\n' +
          '            padding-top: 20px;\n' +
          '            border-top: 1px solid #eee;\n' +
          '            color: #666;\n' +
          '            font-size: 14px;\n' +
          '        }\n' +
          '    </style>\n' +
          '</head>\n' +
          '<body>\n' +
          '    <div class="header">\n' +
          '        <h1>' + statusIcon + ' Vue3 兼容性检测报告</h1>\n' +
          '        <p>生成时间: ' + new Date().toLocaleString() + '</p>\n' +
          '        <div class="compatibility-badge ' + results.compatibility.level + '">\n' +
          '            ' + results.compatibility.description.toUpperCase() + '\n' +
          '        </div>\n' +
          '    </div>\n' +
          '    \n' +
          '    <div class="section">\n' +
          '        <h2>📊 检测摘要</h2>\n' +
          '        <table class="feature-table">\n' +
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
          '    </div>\n' +

          featuresTablesHTML +

          '    <div class="footer">\n' +
          '        <p>此报告由 Vue3 兼容性检测工具生成</p>\n' +
          '        <p>检测工具地址: ' + this.escapeHtml(window.location.href) + '</p>\n' +
          '        <p>生成时间: ' + new Date().toLocaleString() + '</p>\n' +
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
      // IE低版本特殊提示
      if (IS_IE_LOW) {
        var subtitle = document.getElementById('subtitle');
        if (subtitle) {
          subtitle.innerHTML = '🔍 正在检测 IE' + IE_VERSION + ' 兼容性...<br>' +
            '<small style="color: #666;">注意：IE' + IE_VERSION + ' 不支持 Vue3，正在生成详细报告...</small>';
        }
      }

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

        // 5. 同步WebGL数据
        DataManager.syncWebGLData();

      } catch (error) {
        console.error('信息收集失败:', error);
        // 即使失败，也设置一些基本数据
        DataManager.set('browser', {
          name: isIE ? 'Internet Explorer' : '检测失败',
          version: IE_VERSION || '0',
          isIE: isIE
        });
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

      // ===== 检测浏览器类型和版本 =====

      // IE 11
      if (ua.indexOf('Trident') > -1 && ua.indexOf('rv:') > -1) {
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
      // Edge (Chromium)
      else if (ua.indexOf('Edg/') > -1) {
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

      // ===== 检测渲染引擎 =====
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

      // ===== 检测JS引擎信息 =====
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

      // ===== 检测操作系统类型和版本 =====

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

      // ===== 系统位数检测 =====
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

    // ================ 特性支持检测（显示所有项） ================
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
      // 所有特性都检查，IE低版本结果都是false

      features.es6 = {
        // Vue3 绝对必需
        proxy: !IS_IE_LOW && typeof Proxy !== 'undefined',
        reflect: !IS_IE_LOW && typeof Reflect !== 'undefined',
        promise: !IS_IE_LOW && typeof Promise !== 'undefined',
        symbol: !IS_IE_LOW && typeof Symbol !== 'undefined',
        map: !IS_IE_LOW && typeof Map !== 'undefined',
        set: !IS_IE_LOW && typeof Set !== 'undefined',

        // Vue3 内部优化使用
        weakMap: !IS_IE_LOW && typeof WeakMap !== 'undefined',
        weakSet: !IS_IE_LOW && typeof WeakSet !== 'undefined',

        // Vue3 常用工具依赖
        objectAssign: !IS_IE_LOW && typeof Object.assign === 'function',
        arrayIncludes: !IS_IE_LOW && 'includes' in Array.prototype,
        stringIncludes: !IS_IE_LOW && 'includes' in String.prototype,
        arrayFrom: !IS_IE_LOW && typeof Array.from === 'function',
        asyncAwait: !IS_IE_LOW && this.testAsyncAwaitSupport(),

        // 对象方法
        objectKeys: typeof Object.keys === 'function',
        objectEntries: !IS_IE_LOW && typeof Object.entries === 'function',
        objectValues: !IS_IE_LOW && typeof Object.values === 'function',
        objectFromEntries: !IS_IE_LOW && typeof Object.fromEntries === 'function',

        // 语法支持
        arrowFunctions: !IS_IE_LOW && this.testArrowFunctions(),
        templateLiterals: !IS_IE_LOW && this.testTemplateLiterals(),
        letConst: !IS_IE_LOW && this.testLetConst(),
        classes: !IS_IE_LOW && this.testClassSupport(),
        defaultParams: !IS_IE_LOW && this.testDefaultParameters(),
        restParams: !IS_IE_LOW && this.testRestParameters(),
        spread: !IS_IE_LOW && this.testSpreadOperator(),
        destructuring: !IS_IE_LOW && this.testDestructuring(),
        forOf: !IS_IE_LOW && this.testForOfSupport()
      };

      // ===== ES2016+ 特性 =====
      features.es2016 = {
        arrayPrototypeIncludes: !IS_IE_LOW && 'includes' in Array.prototype,
        exponentiationOperator: !IS_IE_LOW && this.testExponentiationOperator()
      };

      features.es2017 = {
        objectEntries: !IS_IE_LOW && typeof Object.entries === 'function',
        objectValues: !IS_IE_LOW && typeof Object.values === 'function',
        stringPadding: !IS_IE_LOW && 'padStart' in String.prototype && 'padEnd' in String.prototype,
        asyncAwait: !IS_IE_LOW && this.testAsyncAwaitSupport()
      };

      features.es2018 = {
        objectSpread: !IS_IE_LOW && this.testObjectSpread(),
        promiseFinally: !IS_IE_LOW && 'finally' in Promise.prototype,
        asyncIteration: !IS_IE_LOW && this.testAsyncIteration()
      };

      // ===== CSS 特性 =====
      // CSS特性正常检测，因为IE可能部分支持
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
        serviceWorker: !IS_IE_LOW && 'serviceWorker' in navigator,
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        indexDB: !IS_IE_LOW && 'indexedDB' in window,
        fetch: !IS_IE_LOW && 'fetch' in window,
        geolocation: 'geolocation' in navigator,
        webWorkers: !IS_IE_LOW && 'Worker' in window,
        webSockets: !IS_IE_LOW && 'WebSocket' in window,
        intersectionObserver: !IS_IE_LOW && 'IntersectionObserver' in window,
        mutationObserver: !IS_IE_LOW && 'MutationObserver' in window,
        performance: 'performance' in window,
        performanceObserver: !IS_IE_LOW && 'PerformanceObserver' in window,
        navigatorShare: !IS_IE_LOW && 'share' in navigator,
        clipboard: !IS_IE_LOW && 'clipboard' in navigator,
        es6Modules: !IS_IE_LOW && 'noModule' in HTMLScriptElement.prototype,
        dynamicImport: !IS_IE_LOW && this.testDynamicImport()
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
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('var x = 1; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testES2016Support: function () {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('return Math.pow(2, 3)');
        fn();
        return true;
      } catch (e) {
        return false;
      }
    },

    testES2017Support: function () {
      if (IS_IE_LOW) return false;

      try {
        return this.testAsyncAwaitSupport();
      } catch (e) {
        return false;
      }
    },

    testArrowFunctions: function() {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('var fn = function() {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testTemplateLiterals: function() {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('var str = "template"; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testLetConst: function() {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('var testLet = 1; var testConst = 2; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testClassSupport: function () {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('function TestClass() {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testDefaultParameters: function () {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('function test(a) { return a || 1; }; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testRestParameters: function() {
      if (IS_IE_LOW) return false;
      return safeTestFeature('function test() { var args = arguments; return args; }');
    },

    testSpreadOperator: function() {
      if (IS_IE_LOW) return false;
      return safeTestFeature('var arr = [1,2,3].concat([4,5])');
    },

    testDestructuring: function () {
      if (IS_IE_LOW) return false;

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
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('return Math.pow(2, 3)');
        fn();
        return true;
      } catch (e) {
        return false;
      }
    },

    testAsyncAwaitSupport: function() {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('return Promise && Promise.resolve && true');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testObjectSpread: function() {
      if (IS_IE_LOW) return false;
      return safeTestFeature('var obj = Object.assign({}, {a: 1})');
    },

    testAsyncIteration: function() {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testForOfSupport: function() {
      if (IS_IE_LOW) return false;

      try {
        var fn = new Function('for (var i = 0; i < 3; i++) {}; return true;');
        return fn() === true;
      } catch (e) {
        return false;
      }
    },

    testDynamicImport: function() {
      if (IS_IE_LOW) return false;

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
          message: 'Internet Explorer ' + (IE_VERSION || '') + ' 不支持 Vue3',
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

      removeClass(subtitleEl, 'compatible');
      removeClass(subtitleEl, 'partial');
      removeClass(subtitleEl, 'incompatible');
      addClass(subtitleEl, level);
    },

    // ================ 构建完整的特性支持表格HTML ================
    buildFullFeaturesTablesHTML: function() {
      var results = this.results;
      var html = '<div class="section">\n' +
        '<h2>⚙️ 特性支持详情</h2>\n';

      // 1. Vue3 核心特性表格
      html += '<div style="margin-bottom: 30px;">\n';
      html += '<h3>Vue3 核心依赖特性</h3>\n';
      html += '<table class="feature-table">\n';
      html += '<thead><tr><th>特性</th><th>支持情况</th><th>重要性</th><th>说明</th></tr></thead>\n';
      html += '<tbody>\n';

      var coreFeatures = [
        { key: 'proxy', name: 'Proxy API', required: true, desc: 'Vue3 响应式系统核心' },
        { key: 'reflect', name: 'Reflect API', required: true, desc: 'Vue3 响应式系统辅助' },
        { key: 'promise', name: 'Promise', required: true, desc: '异步操作处理' },
        { key: 'symbol', name: 'Symbol', required: true, desc: '唯一标识符，Vue内部使用' },
        { key: 'map', name: 'Map', required: true, desc: '键值对集合' },
        { key: 'set', name: 'Set', required: true, desc: '值集合' },
        { key: 'weakMap', name: 'WeakMap', required: false, desc: '弱引用键值对' },
        { key: 'weakSet', name: 'WeakSet', required: false, desc: '弱引用值集合' }
      ];

      for (var i = 0; i < coreFeatures.length; i++) {
        var feature = coreFeatures[i];
        var supported = results.features.es6[feature.key];
        html += '<tr>\n';
        html += '<td><strong>' + feature.name + '</strong></td>\n';
        html += '<td class="' + (supported ? 'supported' : 'not-supported') + '">\n';
        html += supported ? '✅ 支持' : '❌ 不支持';
        html += '</td>\n';
        html += '<td>' + (feature.required ? '<span class="required">必需</span>' : '<span class="recommended">推荐</span>') + '</td>\n';
        html += '<td><small>' + feature.desc + '</small></td>\n';
        html += '</tr>\n';
      }
      html += '</tbody></table>\n';
      html += '</div>\n';

      // 2. ES6+ 语法特性表格
      html += '<div style="margin-bottom: 30px;">\n';
      html += '<h3>ES6+ 语法特性</h3>\n';
      html += '<table class="feature-table">\n';
      html += '<thead><tr><th>特性</th><th>支持情况</th><th>用途</th></tr></thead>\n';
      html += '<tbody>\n';

      var syntaxFeatures = [
        { key: 'arrowFunctions', name: '箭头函数', desc: '简洁的函数语法，this绑定' },
        { key: 'templateLiterals', name: '模板字符串', desc: '字符串插值和多行字符串' },
        { key: 'letConst', name: 'let/const', desc: '块级作用域变量声明' },
        { key: 'classes', name: 'Class', desc: '类语法糖' },
        { key: 'defaultParams', name: '默认参数', desc: '函数参数默认值' },
        { key: 'restParams', name: '剩余参数', desc: '...args 参数收集' },
        { key: 'spread', name: '扩展运算符', desc: '... 展开语法' },
        { key: 'destructuring', name: '解构赋值', desc: '对象/数组解构' },
        { key: 'forOf', name: 'for...of', desc: '可迭代对象遍历' },
        { key: 'asyncAwait', name: 'async/await', desc: '异步编程语法糖' }
      ];

      for (var j = 0; j < syntaxFeatures.length; j++) {
        var syntaxFeature = syntaxFeatures[j];
        var syntaxSupported = results.features.es6[syntaxFeature.key];

        html += '<tr>\n';
        html += '<td>' + syntaxFeature.name + '</td>\n';
        html += '<td class="' + (syntaxSupported ? 'supported' : 'not-supported') + '">\n';
        html += syntaxSupported ? '✅ 支持' : '❌ 不支持';
        html += '</td>\n';
        html += '<td><small>' + syntaxFeature.desc + '</small></td>\n';
        html += '</tr>\n';
      }
      html += '</tbody></table>\n';
      html += '</div>\n';

      // 3. Web APIs 表格
      html += '<div style="margin-bottom: 30px;">\n';
      html += '<h3>Web API 支持</h3>\n';
      html += '<table class="feature-table">\n';
      html += '<thead><tr><th>API</th><th>支持情况</th><th>用途</th></tr></thead>\n';
      html += '<tbody>\n';

      var webAPIs = [
        { key: 'fetch', name: 'Fetch API', desc: '网络请求，替代 XMLHttpRequest' },
        { key: 'localStorage', name: 'localStorage', desc: '本地持久化存储' },
        { key: 'sessionStorage', name: 'sessionStorage', desc: '会话存储' },
        { key: 'webgl', name: 'WebGL', desc: '3D图形渲染' },
        { key: 'webWorkers', name: 'Web Workers', desc: '多线程处理' },
        { key: 'webSockets', name: 'WebSocket', desc: '全双工通信' },
        { key: 'geolocation', name: 'Geolocation', desc: '地理位置获取' },
        { key: 'serviceWorker', name: 'Service Worker', desc: '离线应用、推送' },
        { key: 'indexDB', name: 'IndexedDB', desc: '客户端数据库' }
      ];

      for (var k = 0; k < webAPIs.length; k++) {
        var api = webAPIs[k];
        var apiSupported = results.features.webAPIs[api.key];
        var apiDetails = '';

        if (api.key === 'webgl' && apiSupported) {
          apiDetails = '版本: ' + this.escapeHtml(results.features.webAPIs.webglVersion || 'Unknown');
        }

        html += '<tr>\n';
        html += '<td>' + api.name + '</td>\n';
        html += '<td class="' + (apiSupported ? 'supported' : 'not-supported') + '">\n';
        html += apiSupported ? '✅ 支持' : '❌ 不支持';
        if (apiDetails) html += '<br><small>' + apiDetails + '</small>';
        html += '</td>\n';
        html += '<td><small>' + api.desc + '</small></td>\n';
        html += '</tr>\n';
      }
      html += '</tbody></table>\n';
      html += '</div>\n';

      // 4. CSS 特性表格
      html += '<div>\n';
      html += '<h3>CSS 特性支持</h3>\n';
      html += '<table class="feature-table">\n';
      html += '<thead><tr><th>特性</th><th>支持情况</th><th>用途</th></tr></thead>\n';
      html += '<tbody>\n';

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

      for (var l = 0; l < cssFeatures.length; l++) {
        var cssFeature = cssFeatures[l];
        var cssSupported = results.features.css[cssFeature.key];
        html += '<tr>\n';
        html += '<td>' + cssFeature.name + '</td>\n';
        html += '<td class="' + (cssSupported ? 'supported' : 'not-supported') + '">\n';
        html += cssSupported ? '✅ 支持' : '❌ 不支持';
        html += '</td>\n';
        html += '<td><small>' + cssFeature.desc + '</small></td>\n';
        html += '</tr>\n';
      }
      html += '</tbody></table>\n';
      html += '</div>\n';

      html += '</div>\n';
      return html;
    },
// ================ 构建特性支持表格（带折叠功能） ================
    buildFullFeaturesTables: function() {
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
      html += '<tr><th>特性</th><th>支持情况</th><th>重要性</th><th>说明</th></tr>';

      var coreFeatures = [
        { key: 'proxy', name: 'Proxy API', required: true, desc: 'Vue3 响应式系统核心' },
        { key: 'reflect', name: 'Reflect API', required: true, desc: 'Vue3 响应式系统辅助' },
        { key: 'promise', name: 'Promise', required: true, desc: '异步操作处理' },
        { key: 'symbol', name: 'Symbol', required: true, desc: '唯一标识符，Vue内部使用' },
        { key: 'map', name: 'Map', required: true, desc: '键值对集合' },
        { key: 'set', name: 'Set', required: true, desc: '值集合' },
        { key: 'weakMap', name: 'WeakMap', required: false, desc: '弱引用键值对' },
        { key: 'weakSet', name: 'WeakSet', required: false, desc: '弱引用值集合' }
      ];

      for (var i = 0; i < coreFeatures.length; i++) {
        var feature = coreFeatures[i];
        var supported = features[feature.key];
        html += '<tr>';
        html += '<td><strong>' + feature.name + '</strong></td>';
        html += '<td class="' + (supported ? 'supported' : 'not-supported') + '">';
        html += supported ? '✅ 支持' : '❌ 不支持';
        html += '</td>';
        html += '<td>' + (feature.required ? '<span class="required">必需</span>' : '<span class="recommended">推荐</span>') + '</td>';
        html += '<td><small>' + feature.desc + '</small></td>';
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
        { key: 'arrowFunctions', name: '箭头函数', desc: '简洁函数语法，this绑定' },
        { key: 'templateLiterals', name: '模板字符串', desc: '字符串插值和多行字符串' },
        { key: 'letConst', name: 'let/const', desc: '块级作用域变量声明' },
        { key: 'classes', name: 'Class', desc: '类语法糖' },
        { key: 'defaultParams', name: '默认参数', desc: '函数参数默认值' },
        { key: 'restParams', name: '剩余参数', desc: '...args 参数收集' },
        { key: 'spread', name: '扩展运算符', desc: '... 展开语法' },
        { key: 'destructuring', name: '解构赋值', desc: '对象/数组解构' },
        { key: 'forOf', name: 'for...of', desc: '可迭代对象遍历' }
      ];

      for (var i = 0; i < importantFeatures.length; i++) {
        var feature = importantFeatures[i];
        var supported = results.features.es6[feature.key];

        html += '<tr>';
        html += '<td>' + feature.name + '</td>';
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
      html += '<tr><th>API</th><th>支持情况</th><th>用途</th></tr>';

      var webAPIs = [
        { key: 'fetch', name: 'Fetch API', desc: '网络请求，替代 XMLHttpRequest' },
        { key: 'localStorage', name: 'localStorage', desc: '本地持久化存储' },
        { key: 'sessionStorage', name: 'sessionStorage', desc: '会话存储' },
        { key: 'webgl', name: 'WebGL', desc: '3D图形渲染' },
        { key: 'webWorkers', name: 'Web Workers', desc: '多线程处理' },
        { key: 'webSockets', name: 'WebSocket', desc: '全双工通信' },
        { key: 'geolocation', name: 'Geolocation', desc: '地理位置获取' },
        { key: 'serviceWorker', name: 'Service Worker', desc: '离线应用、推送' },
        { key: 'indexDB', name: 'IndexedDB', desc: '客户端数据库' }
      ];

      for (var i = 0; i < webAPIs.length; i++) {
        var api = webAPIs[i];
        var apiSupported = results.features.webAPIs[api.key];
        var apiDetails = '';

        if (api.key === 'webgl' && apiSupported) {
          apiDetails = '版本: ' + this.escapeHtml(results.features.webAPIs.webglVersion || 'Unknown');
        }

        html += '<tr>';
        html += '<td>' + api.name + '</td>';
        html += '<td class="' + (apiSupported ? 'supported' : 'not-supported') + '">';
        html += apiSupported ? '✅ 支持' : '❌ 不支持';
        if (apiDetails) html += '<br><small>' + apiDetails + '</small>';
        html += '</td>';
        html += '<td><small>' + api.desc + '</small></td>';
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
        html += '<td>' + cssFeature.name + '</td>';
        html += '<td class="' + (cssSupported ? 'supported' : 'not-supported') + '">';
        html += cssSupported ? '✅ 支持' : '❌ 不支持';
        html += '</td>';
        html += '<td><small>' + cssFeature.desc + '</small></td>';
        html += '</tr>';
      }
      html += '</table>';
      return html;
    },

// ================ 构建环境信息汇总表格 ================
    buildEnvironmentInfoTable: function() {
      var results = this.results;
      var html = '<div class="info-section" style="margin-top: 30px;">';
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

      return html;
    },

// ================ 修改displayResults函数 ================
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

      if (IS_IE_LOW) {
        html += '<p><strong style="color: #f44336;">⚠️ 注意：Internet Explorer ' + IE_VERSION + ' 不支持 Vue3</strong></p>';
      }

      html += '</div>';

      // 2. 特性支持详情 - 所有浏览器都显示完整表格（带折叠）
      html += this.buildFullFeaturesTables();

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

          html += '</div>';
        }
      }

      // 4. 环境信息汇总
      html += this.buildEnvironmentInfoTable();
      
      // 5. 优化建议
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

      // 6. 底部操作说明
      html += '<div class="footer-notes">';
      html += '<p><strong>说明：</strong></p>';
      html += '<ul>';
      html += '<li>✅ 完全支持 | ⚠️ 部分支持/可能有问题 | ❌ 不支持</li>';
      html += '<li>以上检测基于 Vue3 官方兼容标准</li>';

      if (IS_IE_LOW) {
        html += '<li><strong style="color: #f44336;">Internet Explorer ' + IE_VERSION + ' 不支持 Vue3，建议更换浏览器</strong></li>';
      } else {
        html += '<li>建议使用 Chrome 64+、Firefox 59+、Safari 11+、Edge 79+ 等现代浏览器</li>';
      }

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

      // ===== 2. IE特殊建议 =====
      if (IS_IE_LOW) {
        suggestions.unshift({
          type: 'critical',
          category: 'ie',
          title: 'Internet Explorer 限制',
          description: 'IE' + IE_VERSION + ' 不支持现代 Web 特性',
          details: 'Internet Explorer ' + IE_VERSION + ' 是过时的浏览器，不支持 ES6+ 特性、现代 CSS 和许多 Web API。Vue3 及大多数现代网页应用都无法在 IE 中运行。',
          actions: [
            { text: '下载 Chrome', url: 'https://www.google.com/chrome/' },
            { text: '下载 Firefox', url: 'https://www.mozilla.org/firefox/' },
            { text: '下载 Edge', url: 'https://www.microsoft.com/edge' }
          ]
        });
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
    openShareModal: function() {
      if (IS_IE_LOW) {
        alert('分享功能在 Internet Explorer ' + IE_VERSION + ' 中不可用。\n\n请使用现代浏览器访问此页面。');
        return;
      }

      if (!this.results || !this.results.detectionTime) {
        showExportFeedback('❌ 请先完成检测', 'error');
        return;
      }

      var shareData = this.generateShareData();

      document.getElementById('share-link-input').value = shareData.url;

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

      document.getElementById('share-modal').style.display = 'flex';
    },

    generateShareData: function() {
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

      // 分享按钮（IE低版本禁用）
      var shareBtn = document.getElementById('share-btn');
      if (shareBtn) {
        addEvent(shareBtn, 'click', function() {
          if (IS_IE_LOW) {
            alert('分享功能在 Internet Explorer ' + IE_VERSION + ' 中不可用。\n\n请使用现代浏览器访问此页面。');
            return;
          }
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

  // IE低版本加载完成后的特殊处理
  if (IS_IE_LOW) {
    domReady(function() {
      var subtitle = document.getElementById('subtitle');
      if (subtitle) {
        subtitle.innerHTML = '🔍 正在检测 Internet Explorer ' + IE_VERSION + ' 兼容性...<br>' +
          '<small style="color: #666;">注意：IE 不支持 Vue3，但我们会显示详细的特性检查结果</small>';
      }

      var shareBtn = document.getElementById('share-btn');
      if (shareBtn) {
        shareBtn.style.display = 'none';
      }
    });
  }

})();