<!-- src/views/ParkAdminView.vue -->
<template>
  <div class="admin-page">
    <!-- 人员管理按钮（从园区管理页跳转） -->
    <div style="margin-bottom: 12px; text-align: right;">
      <router-link to="/admin/maintainers">
        <el-button type="primary">
          人员管理
        </el-button>
      </router-link>
    </div>
  </div>
  <div class="admin-container">
    <div class="background-wrapper"><div class="bg-animation"></div></div>
    <div class="admin-content">
      <el-affix :offset="0">
        <div class="admin-header">
          <div class="header-left">
            <el-icon class="admin-icon"><Setting /></el-icon>
            <span class="header-title">系统管理员后台</span>
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
              <el-icon class="content-icon"><User /></el-icon>
              <span class="content-title">用户管理</span>
            </div>
          </template>

          <div class="content-area">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <span>租客列表</span>
                    </div>
                  </template>
                  <el-table :data="tenants" style="width:100%" v-loading="loading">
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="name" label="姓名" />
                    <el-table-column prop="phone" label="手机号" width="140" />
                    <el-table-column prop="created_at" label="注册时间" width="180" />
                  </el-table>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <span>活跃用户（近{{ days }}天）</span>
                      <el-button size="mini" @click="refresh">刷新</el-button>
                    </div>
                  </template>
                  <el-table :data="activeUsers" style="width:100%" v-loading="loading">
                    <el-table-column prop="name" label="姓名" />
                    <el-table-column prop="phone" label="手机号" width="140" />
                    <el-table-column prop="rides" label="骑行次数" width="120" />
                  </el-table>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top:16px;">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>热门线路</span>
                  </template>
                  <el-table :data="popularRoutes" style="width:100%" v-loading="loading">
                    <el-table-column label="起点" width="160">
                      <template #default="{ row }">{{ formatRoute(row) }}</template>
                    </el-table-column>
                    <el-table-column prop="cnt" label="次数" width="100" />
                  </el-table>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <span>高峰时段（近{{ days }}天）</span>
                  </template>
                  <el-table :data="peakHours" style="width:100%" v-loading="loading">
                    <el-table-column prop="hour" label="小时" width="100">
                      <template #default="{ row }">{{ row.hour }}:00</template>
                    </el-table-column>
                    <el-table-column prop="cnt" label="次数" width="100" />
                  </el-table>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Setting, User, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})

const roleMap = { OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }
const roleTag = { OPERATOR: 'warning', MAINTAINER: 'info', PARK_ADMIN: 'danger' }

const tenants = ref([])
const activeUsers = ref([])
const popularRoutes = ref([])
const peakHours = ref([])
const loading = ref(false)
const days = ref(30)

const loadStats = async () => {
  loading.value = true
  try {
    const [tRes, aRes, pRes, hRes] = await Promise.all([
      axios.get('/api/admin/tenants'),
      axios.get(`/api/admin/active-users?days=${days.value}`),
      axios.get('/api/admin/popular-routes'),
      axios.get(`/api/admin/peak-hours?days=${days.value}`)
    ])
    tenants.value = tRes.data || []
    activeUsers.value = aRes.data || []
    popularRoutes.value = pRes.data || []
    peakHours.value = hRes.data || []
  } catch (e) {
    console.error(e)
    ElMessage.error('加载统计数据失败')
  }
  loading.value = false
}

const refresh = () => loadStats()

const formatRoute = (row) => {
  if (!row) return ''
  return `${row.start_lon},${row.start_lat} → ${row.end_lon},${row.end_lat}`
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  if (user.value.role !== 'PARK_ADMIN') {
    ElMessage.error('无权限访问系统管理员后台')
    const redirect = user.value?.role === 'TENANT' ? '/home' : '/admin'
    router.replace(redirect)
    return
  }
  loadStats()
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
