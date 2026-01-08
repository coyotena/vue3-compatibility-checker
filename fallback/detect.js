// ==============================================
// Vue3 兼容性检测器 - 降级版（ES5语法）
// 确保兼容 IE11、Chrome 50+ 等老旧浏览器
// ==============================================

;(function() {
  'use strict';

  // 全局对象，避免污染全局命名空间
  var Vue3Detector = {
    // 检测结果存储
    results: {},

    // 初始化检测
    runDetection: function() {
      console.log('开始 Vue3 兼容性检测...');

      // 显示加载中
      this.showLoading(true);

      // 逐步执行检测（使用 setTimeout 模拟异步，避免阻塞）
      var self = this;
      setTimeout(function() {
        self.collectBrowserInfo();
        self.checkVue3Features();
        self.analyzeCompatibility();
        self.displayResults();
        self.showLoading(false);
      }, 500); // 短暂延迟，让用户看到加载效果
    },

    // 显示/隐藏加载动画
    showLoading: function(show) {
      var loadingEl = document.getElementById('loading');
      var resultEl = document.getElementById('result');

      if (show) {
        loadingEl.style.display = 'block';
        resultEl.style.display = 'none';
      } else {
        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';
      }
    },

    // 收集浏览器信息
    collectBrowserInfo: function() {
      console.log('收集浏览器信息...');
      var ua = navigator.userAgent;

      this.results.browser = {
        userAgent: ua,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor
      };
    },

    // 检测 Vue3 必需特性
    checkVue3Features: function() {
      console.log('检测 Vue3 特性支持...');

      this.results.features = {
        // Vue3 核心依赖
        proxy: typeof Proxy !== 'undefined',
        reflect: typeof Reflect !== 'undefined',
        promise: typeof Promise !== 'undefined',
        symbol: typeof Symbol !== 'undefined',

        // ES6+ 特性
        arrowFunctions: (function() {
          try { eval('var fn = () => {}'); return true; }
          catch(e) { return false; }
        })(),
        templateLiterals: (function() {
          try { eval('var str = `template`'); return true; }
          catch(e) { return false; }
        })()
      };
    },

    // 分析兼容性
    analyzeCompatibility: function() {
      console.log('分析兼容性...');

      var features = this.results.features;
      var allCoreSupported = features.proxy &&
        features.reflect &&
        features.promise &&
        features.symbol;

      if (allCoreSupported) {
        this.results.compatibility = '完全兼容';
        this.results.compatibilityLevel = 'compatible';
      } else {
        this.results.compatibility = '不兼容';
        this.results.compatibilityLevel = 'incompatible';
      }

      // 收集不兼容的原因
      this.results.issues = [];
      if (!features.proxy) this.results.issues.push('不支持 Proxy API');
      if (!features.reflect) this.results.issues.push('不支持 Reflect API');
      if (!features.promise) this.results.issues.push('不支持 Promise');
      if (!features.symbol) this.results.issues.push('不支持 Symbol');
    },

    // 显示结果
    displayResults: function() {
      console.log('显示检测结果...');

      var result = this.results;
      var html = '';

      // 兼容性结论
      html += '<div class="result-item">';
      html += '<div class="result-title">兼容性结论</div>';
      html += '<div class="result-content">';
      html += '<h2 class="' + result.compatibilityLevel + '">';
      html += result.compatibility;
      html += '</h2>';

      if (result.issues && result.issues.length > 0) {
        html += '<p>检测到以下问题：</p><ul>';
        for (var i = 0; i < result.issues.length; i++) {
          html += '<li>' + result.issues[i] + '</li>';
        }
        html += '</ul>';
      } else {
        html += '<p>🎉 您的浏览器完全支持 Vue3！</p>';
      }
      html += '</div></div>';

      // 浏览器信息
      html += '<div class="result-item">';
      html += '<div class="result-title">浏览器信息</div>';
      html += '<div class="result-content">';
      html += '<p>User Agent: ' + result.browser.userAgent + '</p>';
      html += '<p>平台: ' + result.browser.platform + '</p>';
      html += '<p>语言: ' + result.browser.language + '</p>';
      html += '</div></div>';

      // 特性支持详情
      html += '<div class="result-item">';
      html += '<div class="result-title">特性支持详情</div>';
      html += '<div class="result-content">';
      for (var key in result.features) {
        if (result.features.hasOwnProperty(key)) {
          var supported = result.features[key] ? '✅ 支持' : '❌ 不支持';
          html += '<p>' + key + ': ' + supported + '</p>';
        }
      }
      html += '</div></div>';

      // 将HTML插入到页面
      document.getElementById('result').innerHTML = html;

      // 绑定重新检测按钮事件
      this.bindEvents();
    },

    // 绑定按钮事件
    bindEvents: function() {
      var self = this;
      var recheckBtn = document.getElementById('recheck-btn');

      if (recheckBtn) {
        recheckBtn.onclick = function() {
          self.runDetection();
        };
      }

      // 导出按钮（下一阶段实现）
      var exportBtn = document.getElementById('export-btn');
      if (exportBtn) {
        exportBtn.onclick = function() {
          alert('导出功能将在下一阶段实现');
        };
      }
    }
  };

  // 暴露到全局
  window.Vue3Detector = Vue3Detector;

})();