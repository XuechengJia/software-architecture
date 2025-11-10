import axios from 'axios'
import { getFullUrl } from './url'

/**
 * 获取投诉列表，自动补全图片 URL
 */
export async function fetchComplaints() {
  try {
    const res = await axios.get('/api/complaints')
    return (res.data || []).map(item => ({
      ...item,
      photoUrl: item.photoUrl ? getFullUrl(item.photoUrl) : null
    }))
  } catch (e) {
    throw new Error('获取投诉列表失败')
  }
}

/**
 * 处理投诉
 * @param {number|string} id - 投诉 ID
 */
export async function handleComplaint(id) {
  try {
    const res = await axios.post(`/api/complaints/${id}/handle`)
    return res.data
  } catch (e) {
    throw new Error('处理投诉失败')
  }
}