// 从环境变量获取 API 基地址
export const apiBase = import.meta.env.VITE_API_BASE || window.location.origin

/**
 * 将相对路径转换为完整的 URL
 * @param {string} url - 相对路径或完整 URL
 * @returns {string} - 完整的 URL
 */
export function getFullUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBase + (url.startsWith('/') ? '' : '/') + url
}