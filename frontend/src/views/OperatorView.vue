<!-- src/views/OperatorView.vue -->
<template>
  <div class="admin-container">
    <div class="background-wrapper"><div class="bg-animation"></div></div>
    <div class="admin-content">
      <el-affix :offset="0">
        <div class="admin-header">
          <div class="header-left">
            <el-icon class="admin-icon"><Setting /></el-icon>
            <span class="header-title">运营后台</span>
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
              <el-icon class="content-icon"><ChatDotRound /></el-icon>
              <span class="content-title">投诉处理</span>
            </div>
          </template>

          <div class="content-area">
            <div class="complaints-content">
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
                    <el-tag :type="scope.row.status === '未处理' ? 'danger' : 'success'">{{ scope.row.status }}</el-tag>
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
import { Setting, ChatDotRound, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})
const complaints = ref([])
const loadingComplaints = ref(false)

const roleMap = { OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }
const roleTag = { OPERATOR: 'warning', MAINTAINER: 'info', PARK_ADMIN: 'danger' }

onMounted(async () => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  // 权限校验
  if (user.value.role !== 'OPERATOR') {
    ElMessage.error('无权限访问运营后台')
    const redirect = user.value?.role === 'TENANT' ? '/home' : '/admin'
    router.replace(redirect)
    return
  }
  await load()
})

const load = async () => {
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
    const complaint = complaints.value.find(c => c.id === id)
    if (complaint) complaint.status = '已处理'
    ElMessage.success('投诉已处理')
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出管理后台')
  router.push('/login')
}
</script>

<style scoped>
@import './admin-style.css';
</style>
