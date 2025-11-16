<template>
  <div class="chat-page">
    <header class="chat-header">
      <h2>园区群聊</h2>
      <div class="chat-user">
        <span class="name">{{ user?.name || '未登录' }}</span>
        <span class="role" v-if="user?.role">{{ roleMap[user.role] || user.role }}</span>
      </div>
    </header>

    <main class="chat-main">
      <div class="chat-messages" ref="msgContainer">
        <div
            v-for="m in messages"
            :key="m.id"
            class="chat-message"
        >
          <div class="msg-header">
            <span class="sender">
              {{ m.senderName || '用户' }}
              <span class="sender-role" v-if="m.senderRole">
                {{ roleMap[m.senderRole] || m.senderRole }}
              </span>
            </span>
            <span class="time">{{ formatTime(m.timestamp) }}</span>
          </div>

          <div class="msg-body">
            <span v-if="!m.isDeleted && m.message">{{ m.message }}</span>
            <span v-else class="deleted-text">此消息已被管理员删除</span>
          </div>

          <div class="msg-actions" v-if="isAdmin">
            <button
                class="btn-delete"
                v-if="!m.isDeleted"
                @click="deleteMessage(m.id)"
            >
              删除
            </button>
          </div>
        </div>

        <div v-if="!messages.length" class="empty">
          暂无消息，快来发第一条吧～
        </div>
      </div>

      <div class="chat-input">
        <textarea
            v-model="newMessage"
            rows="2"
            placeholder="输入消息，按发送发送到群聊"
        ></textarea>
        <button
            class="btn-send"
            :disabled="sending || !newMessage.trim()"
            @click="send"
        >
          {{ sending ? '发送中...' : '发送' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import axios from 'axios'

const messages = ref([])
const newMessage = ref('')
const sending = ref(false)
const msgContainer = ref(null)

const user = ref(null)
const chatGroup = ref('GLOBAL') // 你也可以按园区 ID 来设不同群

const roleMap = {
  TENANT: '普通用户',
  OPERATOR: '运营',
  MAINTAINER: '维护员',
  PARK_ADMIN: '管理员'
}

const adminRoles = ['OPERATOR', 'MAINTAINER', 'PARK_ADMIN']
const isAdmin = computed(() => user.value && adminRoles.includes(user.value.role))

let timer = null

const loadMessages = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const res = await axios.get('/api/messages', {
      params: { chatGroup: chatGroup.value, limit: 100 },
      headers: { Authorization: `Bearer ${token}` }
    })
    messages.value = (res.data?.messages || []).slice().reverse()

    await nextTick()
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  } catch (e) {
    console.error('加载消息失败', e)
  }
}

const send = async () => {
  if (!newMessage.value.trim()) return

  const token = localStorage.getItem('token')
  if (!token) {
    alert('请先登录')
    return
  }

  sending.value = true
  try {
    const res = await axios.post('/api/messages', {
      message: newMessage.value,
      chatGroup: chatGroup.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = res.data?.data
    if (data) {
      messages.value.push(data)
      await nextTick()
      if (msgContainer.value) {
        msgContainer.value.scrollTop = msgContainer.value.scrollHeight
      }
    }
    newMessage.value = ''
  } catch (e) {
    console.error('发送失败', e)
    alert(e.response?.data?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

const deleteMessage = async (id) => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('请先登录')
    return
  }
  if (!confirm('确定要删除这条消息吗？')) return

  try {
    await axios.delete(`/api/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const target = messages.value.find(m => m.id === id)
    if (target) {
      target.isDeleted = true
    }
  } catch (e) {
    console.error('删除失败', e)
    alert(e.response?.data?.message || '删除失败')
  }
}

const formatTime = (val) => {
  if (!val) return ''
  const d = new Date(val)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) {
    user.value = JSON.parse(u)
  }
  loadMessages()
  // 简单轮询，每 5 秒刷新一次
  timer = setInterval(loadMessages, 5000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.chat-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.chat-header h2 {
  margin: 0;
}
.chat-user {
  display: flex;
  gap: 8px;
  font-size: 14px;
}
.chat-user .role {
  padding: 2px 6px;
  border-radius: 10px;
  background: #ecf5ff;
  color: #409eff;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
}

.chat-message {
  margin-bottom: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #f7f8fa;
}
.msg-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.sender {
  font-weight: 600;
  font-size: 13px;
}
.sender-role {
  margin-left: 4px;
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 10px;
  background: #fdf6ec;
  color: #e6a23c;
}
.time {
  font-size: 12px;
  color: #999;
}
.msg-body {
  font-size: 14px;
}
.deleted-text {
  font-size: 13px;
  color: #c0c4cc;
  font-style: italic;
}

.msg-actions {
  margin-top: 4px;
  text-align: right;
}
.btn-delete {
  border: none;
  background: transparent;
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
}

.empty {
  text-align: center;
  color: #999;
  margin-top: 20px;
}

.chat-input {
  border-top: 1px solid #ebeef5;
  padding: 8px 10px;
  display: flex;
  gap: 8px;
}
.chat-input textarea {
  flex: 1;
  resize: none;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  padding: 6px 8px;
  font-size: 14px;
  outline: none;
}
.chat-input textarea:focus {
  border-color: #409eff;
}
.btn-send {
  width: 80px;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}
.btn-send:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
