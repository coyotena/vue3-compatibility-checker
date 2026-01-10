// 临时测试：绝对兼容IE的版本
console.log('检测脚本开始执行（兼容版）');

window.Vue3Detector = {
  runDetection: function() {
    console.log('runDetection 被调用');
    var resultEl = document.getElementById('result');
    var loadingEl = document.getElementById('loading');
    var subtitleEl = document.getElementById('subtitle');

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