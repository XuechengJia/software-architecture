<!-- src/views/AdminView.vue -->
<template>
  <div class="admin-container">
    <div class="background-wrapper">
      <div class="bg-animation"></div>
    </div>

    <div class="admin-content">
      <!-- 顶部用户信息栏 -->
      <el-affix :offset="0">
        <div class="admin-header">
          <div class="header-left">
            <el-icon class="admin-icon"><Setting /></el-icon>
            <span class="header-title">管理后台</span>
          </div>
          <div class="header-right">
            <div class="user-info">
              <el-avatar :size="36" :icon="UserFilled" class="user-avatar" />
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <el-tag :type="roleTag" effect="light" size="small">
                  {{ roleMap[user.role] }}
                </el-tag>
              </div>
            </div>
            <el-button v-if="user.role !== 'TENANT'" type="primary" plain @click="switchToHome">切换到用户首页</el-button>
            <el-button type="danger" plain @click="logout" class="logout-btn">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-button>
          </div>
        </div>
      </el-affix>

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 左侧菜单 -->
        <el-card class="menu-card" shadow="hover">
          <template #header>
            <div class="menu-header">
              <el-icon><Menu /></el-icon>
              <span>功能菜单</span>
            </div>
          </template>

          <el-menu
              :default-active="activeMenu"
              @select="handleMenu"
              class="admin-menu"
          >
            <el-menu-item index="dashboard" class="menu-item">
              <el-icon class="menu-icon"><DataBoard /></el-icon>
              <span class="menu-text">数据看板</span>
            </el-menu-item>

            <el-menu-item index="vehicles" class="menu-item">
              <el-icon class="menu-icon"><Bicycle /></el-icon>
              <span class="menu-text">车辆管理</span>
            </el-menu-item>

            <el-menu-item index="complaints" class="menu-item">
              <el-icon class="menu-icon"><ChatDotRound /></el-icon>
              <span class="menu-text">投诉处理</span>
            </el-menu-item>

            <el-menu-item
                index="users"
                class="menu-item"
                v-if="user.role === 'PARK_ADMIN'"
            >
              <el-icon class="menu-icon"><User /></el-icon>
              <span class="menu-text">用户管理</span>
            </el-menu-item>
          </el-menu>
        </el-card>

        <!-- 右侧内容区域 -->
        <el-card class="content-card" shadow="hover">
          <template #header>
            <div class="content-header">
              <el-icon class="content-icon" :class="getContentIcon(activeMenu)"></el-icon>
              <span class="content-title">{{ getContentTitle(activeMenu) }}</span>
            </div>
          </template>

          <div class="content-area">
            <!-- 数据看板 -->
            <div v-if="activeMenu === 'dashboard'" class="dashboard-content">
              <div class="stats-grid">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-item">
                    <el-icon class="stat-icon primary"><TrendCharts /></el-icon>
                    <div class="stat-info">
                      <div class="stat-value">1,234</div>
                      <div class="stat-label">总车辆数</div>
                    </div>
                  </div>
                </el-card>
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-item">
                    <el-icon class="stat-icon success"><CircleCheck /></el-icon>
                    <div class="stat-info">
                      <div class="stat-value">856</div>
                      <div class="stat-label">可用车辆</div>
                    </div>
                  </div>
                </el-card>
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-item">
                    <el-icon class="stat-icon warning"><Warning /></el-icon>
                    <div class="stat-info">
                      <div class="stat-value">{{ complaints.filter(c=>c.status==='未处理').length }}</div>
                      <div class="stat-label">待处理投诉</div>
                    </div>
                  </div>
                </el-card>
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-item">
                    <el-icon class="stat-icon info"><User /></el-icon>
                    <div class="stat-info">
                      <div class="stat-value">5,678</div>
                      <div class="stat-label">注册用户</div>
                    </div>
                  </div>
                </el-card>
              </div>
            </div>

            <!-- 投诉处理区域 -->
            <div v-else-if="activeMenu === 'complaints'" class="complaints-content">
              <el-table :data="complaints" style="width: 100%" v-loading="loadingComplaints">
                <el-table-column prop="type" label="类型" width="120" />
                <el-table-column prop="description" label="说明" />
                <el-table-column label="照片" width="100">
                  <template #default="scope">
                    <img v-if="scope.row.photoUrl" :src="getFullUrl(scope.row.photoUrl)" alt="投诉照片" style="width:60px;height:60px;object-fit:cover;border-radius:6px;" />
                  </template>
                </el-table-column>
                <el-table-column label="位置" width="160">
                  <template #default="scope">
                    <span>经度: {{ scope.row.longitude }}<br/>纬度: {{ scope.row.latitude }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === '未处理' ? 'danger' : 'success'">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button v-if="scope.row.status==='未处理'" type="primary" size="small" @click="handleComplaintItem(scope.row.id)">处理</el-button>
                    <span v-else>已处理</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 其他功能区域 -->
            <div v-else class="placeholder-content">
              <el-empty :description="getPlaceholderText(activeMenu)">
                <template #image>
                  <el-icon :class="getContentIcon(activeMenu) + ' placeholder-icon'"></el-icon>
                </template>
              </el-empty>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFullUrl } from '../utils/url'
import { fetchComplaints, handleComplaint } from '../utils/complaints'
import {
  Setting,
  DataBoard,
  Bicycle,
  ChatDotRound,
  User,
  UserFilled,
  SwitchButton,
  Menu,
  TrendCharts,
  CircleCheck,
  Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})
const activeMenu = ref('dashboard')
const complaints = ref([])
const loadingComplaints = ref(false)

const roleMap = {
  OPERATOR: '运营',
  MAINTAINER: '维护员',
  PARK_ADMIN: '管理员'
}

const roleTag = {
  OPERATOR: 'warning',
  MAINTAINER: 'info',
  PARK_ADMIN: 'danger'
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  fetchComplaintsList()
})

const fetchComplaintsList = async () => {
  loadingComplaints.value = true
  try {
    complaints.value = await fetchComplaints()
  } catch (e) {
    ElMessage.error('投诉列表获取失败')
  }
  loadingComplaints.value = false
}

const handleComplaintItem = async (id) => {
  try {
    await handleComplaint(id)
    // 立即更新本地状态
    const complaint = complaints.value.find(c => c.id === id)
    if (complaint) {
      complaint.status = '已处理'
    }
    ElMessage.success('投诉已处理')
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

const handleMenu = (key) => {
  activeMenu.value = key
}

const getContentIcon = (menu) => {
  const icons = {
    dashboard: 'DataBoard',
    vehicles: 'Bicycle',
    complaints: 'ChatDotRound',
    users: 'User'
  }
  return icons[menu] || 'DataBoard'
}

const getContentTitle = (menu) => {
  const titles = {
    dashboard: '数据看板',
    vehicles: '车辆管理',
    complaints: '投诉处理',
    users: '用户管理'
  }
  return titles[menu] || '管理后台'
}

const getPlaceholderText = (menu) => {
  const texts = {
    dashboard: '暂无数据',
    vehicles: '车辆管理功能开发中',
    complaints: '投诉处理功能开发中',
    users: '用户管理功能开发中'
  }
  return texts[menu] || '功能开发中'
}

const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出管理后台')
  router.push('/login')
}
const switchToHome = () => {
  router.push('/home')
}

</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  position: relative;
  overflow: hidden;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="%23409eff" opacity="0.03" d="M288 480a96 96 0 1 0 0-192 96 96 0 0 0 0 192zm0-128a32 32 0 1 1 0 64 32 32 0 0 1 0-64zM736 480a96 96 0 1 0 0-192 96 96 0 0 0 0 192zm0-128a32 32 0 1 1 0 64 32 32 0 0 1 0-64zM832 64H192c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-96 224H288c-17.7 0-32 14.3-32 32v256c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32zm-448 64h448v256H288V384z"/></svg>') center/cover;
  animation: float 25s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(180deg); }
}

.admin-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 64px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-icon {
  font-size: 24px;
  color: #409eff;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.logout-btn {
  border-radius: 6px;
  padding: 8px 16px;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.menu-card {
  width: 240px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.admin-menu {
  border: none;
}

.menu-item {
  margin: 4px 8px;
  border-radius: 8px;
  height: 48px;
  transition: all 0.3s ease;
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

.content-card {
  flex: 1;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  min-height: 600px;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.content-icon {
  font-size: 20px;
  color: #409eff;
}

.content-title {
  font-size: 18px;
  color: #303133;
}

.content-area {
  padding: 8px;
}

/* 数据看板样式 */
.dashboard-content {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.stat-icon {
  font-size: 36px;
  padding: 12px;
  border-radius: 12px;
}

.stat-icon.primary {
  color: #409eff;
  background: #f0f7ff;
}

.stat-icon.success {
  color: #67c23a;
  background: #f0f9ff;
}

.stat-icon.warning {
  color: #e6a23c;
  background: #fdf6ec;
}

.stat-icon.info {
  color: #909399;
  background: #f4f4f5;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.placeholder-icon {
  font-size: 64px;
  color: #409eff;
  opacity: 0.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    padding: 16px;
  }

  .menu-card {
    width: 100%;
  }

  .admin-header {
    padding: 0 16px;
  }

  .header-right {
    gap: 12px;
  }

  .user-details {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
