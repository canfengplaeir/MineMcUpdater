/**
 * 通用工具函数
 */

/**
 * 打开外部链接
 * @param {string} url - 要打开的URL
 */
export function openLink(url) {
  if (url && typeof url === 'string') {
    // 使用electron shell或其他方式打开链接
    if (window.api && window.api.openExternal) {
      window.api.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }
}

/**
 * 强制重新应用元素动画
 * @param {NodeList|Array} elements - 要重新应用动画的元素列表
 */
export function reapplyAnimations(elements) {
  elements.forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth; // 触发重排
    el.style.animation = '';
  });
}

/**
 * 延迟执行函数
 * @param {Function} fn - 要延迟执行的函数
 * @param {number} ms - 延迟时间(毫秒)
 * @returns {Promise} - Promise对象
 */
export function delay(fn, ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      const result = fn();
      resolve(result);
    }, ms);
  });
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间(毫秒)
 * @returns {Function} - 防抖后的函数
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
} 