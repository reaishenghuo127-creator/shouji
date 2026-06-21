const CACHE_NAME = 'shouji-offline-v2';
// 需要强行锁在手机本地的资源列表
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // html2pdf.js：纯前端 PDF 生成库，缓存后可离线导出 PDF
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// 1. 安装阶段：强行把"躯壳"写入手机本地存储
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('正在将界面资源锁死在本地缓存...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 拦截请求阶段：断网的核心逻辑
// 手机只要发起访问，先去本地缓存找，找到了直接给（实现秒开、无网打开）；找不到再顺着网线去线上摘
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // 命中本地缓存，直接单机返回
      }
      return fetch(event.request); // 未命中，走网络
    })
  );
});
