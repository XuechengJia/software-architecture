<!-- src/views/HomeView.vue -->
<template>
  <div class="home-container">
    <!-- 顶部用户信息 -->
    <el-affix :offset="0">
      <div class="header">
        <div class="user-info">
          <el-avatar :size="42" :icon="UserFilled" class="user-avatar" />
          <div class="info">
            <div class="name">{{ user.name }}</div>
            <div class="role">{{ roleMap[user.role] }}</div>
          </div>
        </div>
        <el-button type="primary" plain @click="logout" class="logout-btn">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
        </el-button>
      </div>
    </el-affix>

    <!-- 主内容：左侧菜单 + 右侧视图 -->
    <div class="main-content">
      <!-- 左侧菜单 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <el-icon><Menu /></el-icon>
          <span>功能菜单</span>
        </div>
        <el-menu
            :default-active="activeTab"
            @select="handleTabChange"
            class="custom-menu"
        >
          <el-menu-item index="map" class="menu-item">
            <el-icon class="menu-icon"><Location /></el-icon>
            <span class="menu-text">地图找车</span>
          </el-menu-item>
          <el-menu-item index="riding" :disabled="!hasOngoingRide" class="menu-item">
            <el-icon class="menu-icon"><Bicycle /></el-icon>
            <span class="menu-text">
              骑行中 {{ currentRide ? `(${currentRide.vehicle_code})` : '(无)' }}
            </span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧内容 -->
      <div class="content-area">
        <keep-alive>
          <MapView v-if="activeTab === 'map'" />
          <RidingView v-else />
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Location,
  Bicycle,
  UserFilled,
  SwitchButton,
  Menu
} from '@element-plus/icons-vue'
import MapView from './MapView.vue'
import RidingView from './RidingView.vue'

const router = useRouter()
const user = ref({})
const activeTab = ref('map')
const currentRide = ref(null)

const roleMap = { TENANT: '租客', OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }

const hasOngoingRide = computed(() => !!currentRide.value?.id)

// 实时更新骑行状态
const updateRideStatus = () => {
  const ride = localStorage.getItem('current_ride')
  const parsed = ride ? JSON.parse(ride) : null
  currentRide.value = parsed

  if (parsed?.id && activeTab.value !== 'riding') {
    activeTab.value = 'riding'
    ElMessage.success(`开始骑行 ${parsed.vehicle_code}`)
  } else if (!parsed && activeTab.value === 'riding') {
    activeTab.value = 'map'
  }
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  updateRideStatus()

  // 监听 storage 变化 + 自定义事件
  window.addEventListener('storage', updateRideStatus)
  window.addEventListener('ride-started', updateRideStatus)
  window.addEventListener('ride-ended', updateRideStatus)

  // 轮询兜底
  const interval = setInterval(updateRideStatus, 1000)
  onUnmounted(() => {
    clearInterval(interval)
    window.removeEventListener('storage', updateRideStatus)
    window.removeEventListener('ride-started', updateRideStatus)
    window.removeEventListener('ride-ended', updateRideStatus)
  })
})

const handleTabChange = (key) => {
  if (key === 'riding' && !hasOngoingRide.value) {
    ElMessage.warning('您当前没有正在进行的骑行')
    return
  }
  activeTab.value = key
}

const logout = () => {
  localStorage.clear()
  currentRide.value = null
  ElMessage.success('已退出')
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.header {
  height: 64px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e4e7ed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info .name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.info .role {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.logout-btn {
  border-radius: 6px;
  padding: 8px 16px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
  border-bottom: 1px solid #e4e7ed;
  background: #f8fafc;
}

.custom-menu {
  border: none;
  flex: 1;
}

.menu-item {
  margin: 4px 12px;
  border-radius: 6px;
  height: 48px;
}

.menu-item:hover {
  background: #f0f7ff;
}

.menu-item.is-active {
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  color: white;
}

.menu-item.is-active .menu-icon {
  color: white;
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-weight: 500;
}

.content-area {
  flex: 1;
  padding: 0;
  overflow: auto;
  background: #f9fafc;
  height: 100%;
}
</style>
