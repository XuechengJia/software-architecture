<!-- src/views/MaintainerView.vue -->
<template>
  <div class="admin-container">
    <div class="background-wrapper"><div class="bg-animation"></div></div>
    <div class="admin-content">
      <el-affix :offset="0">
        <div class="admin-header">
          <div class="header-left">
            <el-icon class="admin-icon"><Setting /></el-icon>
            <span class="header-title">维护后台</span>
          </div>
          <div class="header-right">
            <div class="user-info">
              <el-avatar :size="36" :icon="UserFilled" class="user-avatar" />
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <el-tag :type="roleTag[user.role]" effect="light" size="small">{{ roleMap[user.role] }}</el-tag>
              </div>
            </div>
            <el-button type="danger" plain @click="logout" class="logout-btn">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-button>
          </div>
        </div>
      </el-affix>

      <div class="main-content">
        <el-card class="content-card" shadow="hover">
          <template #header>
            <div class="content-header">
              <el-icon class="content-icon"><Bicycle /></el-icon>
              <span class="content-title">车辆调度</span>
            </div>
          </template>

          <div class="content-area">
            <div class="placeholder-content">
              <el-empty description="车辆调度功能（界面占位）"></el-empty>
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
import { Setting, Bicycle, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})

const roleMap = { OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }
const roleTag = { OPERATOR: 'warning', MAINTAINER: 'info', PARK_ADMIN: 'danger' }

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  if (user.value.role !== 'MAINTAINER') {
    ElMessage.error('无权限访问维护后台')
    const redirect = user.value?.role === 'TENANT' ? '/home' : '/admin'
    router.replace(redirect)
    return
  }
})

const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出管理后台')
  router.push('/login')
}
</script>

<style scoped>
@import './admin-style.css';
</style>
