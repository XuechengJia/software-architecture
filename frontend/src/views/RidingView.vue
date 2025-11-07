<!-- src/views/RidingView.vue -->
<template>
  <div class="riding-container">
    <!-- 主卡片 -->
    <el-card class="riding-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Bicycle /></el-icon>
            <span class="title">骑行中</span>
          </div>
          <el-tag type="success" effect="light" class="status-tag">
            进行中
          </el-tag>
        </div>
      </template>

      <!-- 车辆信息 -->
      <div class="vehicle-info">
        <div class="vehicle-avatar">
          <el-icon class="bike-icon"><Bicycle /></el-icon>
        </div>
        <div class="info-text">
          <h2>{{ vehicleCode }}</h2>
          <div class="status-info">
            <el-tag size="small" type="info">
              <el-icon><Opportunity /></el-icon>
              电量 {{ battery }}%
            </el-tag>
            <el-tag size="small" type="primary">
              <el-icon><Timer /></el-icon>
              已骑行 {{ formatDuration(elapsed) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 费用大屏 -->
      <div class="fee-section">
        <div class="fee-label">当前费用</div>
        <div class="fee-display">
          <div class="currency">¥</div>
          <div class="amount">{{ fee.toFixed(2) }}</div>
        </div>
        <div class="fee-note">每分钟 ¥1.5，起步价 ¥1.5</div>
      </div>

      <!-- 计时器 -->
      <div class="timer-section">
        <div class="timer-card">
          <el-icon class="timer-icon"><Clock /></el-icon>
          <div class="timer-content">
            <div class="timer-label">骑行时长</div>
            <div class="timer-value">{{ formatDuration(elapsed) }}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <el-button
            type="danger"
            size="large"
            @click="finishRide"
            :loading="finishing"
            class="finish-btn"
        >
          <el-icon><SwitchButton /></el-icon>
          结束骑行
        </el-button>
      </div>

      <!-- 安全提示 -->
      <div class="safety-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>请在安全区域停车后结束骑行，注意交通安全</span>
      </div>
    </el-card>

    <!-- 底部提示 -->
    <div class="footer-tip">
      <el-icon><Warning /></el-icon>
      <span>请遵守交通规则，佩戴头盔，安全骑行</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  Bicycle,
  Timer,
  InfoFilled,
  Warning,
  Clock,
  Opportunity,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const ride = ref(JSON.parse(localStorage.getItem('current_ride') || '{}'))
const vehicleCode = ref(ride.value.vehicle_code || '加载中...')
const fee = ref(0)
const elapsed = ref(0)
const finishing = ref(false)
const battery = ref(78)
let timer = null
let startTime = Date.now()

onMounted(() => {
  if (!ride.value?.id) {
    ElMessage.error('无骑行记录')
    router.push('/home')
    return
  }
  startTimer()
})

onUnmounted(() => clearInterval(timer))

const startTimer = () => {
  timer = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    const minutes = elapsed.value / 60
    fee.value = Math.max(minutes * 1.5, 1.5)
  }, 1000)
}

const formatDuration = (s) => {
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

const finishRide = async () => {
  finishing.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.post('/api/ride/finish', { rideId: ride.value.id }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success(`骑行结束！共计 ¥${res.data.fee}`)
    localStorage.removeItem('current_ride')
    window.dispatchEvent(new Event('ride-ended'))
    router.push('/home')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '结束失败')
  } finally {
    finishing.value = false
    clearInterval(timer)
  }
}
</script>

<style scoped>
.riding-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.riding-card {
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #409eff;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  font-weight: 500;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.vehicle-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bike-icon {
  font-size: 36px;
  color: white;
}

.info-text h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.status-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fee-section {
  text-align: center;
  padding: 24px 0;
  margin: 24px 0;
  background: #f8fafc;
  border-radius: 12px;
}

.fee-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.fee-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.currency {
  font-size: 24px;
  color: #f56c6c;
  font-weight: 600;
}

.amount {
  font-size: 48px;
  line-height: 1;
  color: #f56c6c;
  font-weight: 700;
}

.fee-note {
  font-size: 12px;
  color: #909399;
}

.timer-section {
  margin: 24px 0;
}

.timer-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.timer-icon {
  font-size: 32px;
  color: #409eff;
}

.timer-content {
  flex: 1;
}

.timer-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.timer-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  font-family: 'Courier New', monospace;
}

.action-section {
  text-align: center;
  margin: 32px 0 20px;
}

.finish-btn {
  width: 200px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.safety-tip {
  text-align: center;
  font-size: 14px;
  color: #e6a23c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: #fdf6ec;
  border-radius: 6px;
}

.footer-tip {
  margin-top: 24px;
  padding: 12px 24px;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}
</style>
