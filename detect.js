// 临时测试：绝对兼容IE的版本
console.log('检测脚本开始执行（兼容版）');

window.Vue3Detector = {
  runDetection: function() {
    console.log('runDetection 被调用');
    var resultEl = document.getElementById('result');
    var loadingEl = document.getElementById('loading');
    var subtitleEl = document.getElementById('subtitle');

    if (loadingEl) loadingEl.style.display = 'none';
    if (subtitleEl) subtitleEl.textContent = '检测完成';

    if (resultEl) {
      var ua = navigator.userAgent;
      var isIE = ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1;

      var resultHtml = '<div style="padding:20px;">' +
        '<h2>✅ 测试成功</h2>' +
        '<p>这个简化版脚本在您的浏览器中成功运行。</p>' +
        '<p>浏览器: ' + (isIE ? 'Internet Explorer' : '现代浏览器') + '</p>' +
        '<p>User Agent: ' + ua + '</p>' +
        '</div>';

      resultEl.innerHTML = resultHtml;
      resultEl.style.display = 'block';
    }
  }
};

console.log('Vue3Detector 对象已创建');