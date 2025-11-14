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
                    <img
                        v-if="scope.row.photoUrl"
                        :src="getFullUrl(scope.row.photoUrl)"
                        style="width:60px;height:60px;object-fit:cover;border-radius:6px;"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="位置" width="160">
                  <template #default="scope">
                    <span>经度: {{ scope.row.longitude }}<br />纬度: {{ scope.row.latitude }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="statusTagType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template #default="scope">
                    <el-button
                        v-if="scope.row.status === '未处理'"
                        type="primary"
                        size="small"
                        @click="openAssignDialog(scope.row)"
                    >
                      指派任务
                    </el-button>
                    <span v-else>已派单/已处理</span>
                  </template>
                </el-table-column>
              </el-table>

              <el-dialog
                  v-model="assignDialogVisible"
                  title="指派维护员"
                  width="400px"
              >
                <el-form label-width="80px">
                  <el-form-item label="投诉">
                    <div v-if="currentComplaint">
                      {{ currentComplaint.type }} - {{ currentComplaint.description }}
                    </div>
                  </el-form-item>
                  <el-form-item label="维护员">
                    <el-select v-model="selectedMaintainerId" placeholder="请选择维护员">
                      <el-option
                          v-for="m in maintainers"
                          :key="m.id"
                          :label="m.name + '（' + m.phone + '）'"
                          :value="m.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-form>
                <template #footer>
      <span class="dialog-footer">
        <el-button @click="assignDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAssign">确 定</el-button>
      </span>
                </template>
              </el-dialog>
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
import axios from 'axios'
import { getFullUrl } from '../utils/url'
import { fetchComplaints } from '../utils/complaints'
import { Setting, ChatDotRound, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})
const complaints = ref([])
const loadingComplaints = ref(false)

// 维护员相关
const maintainers = ref([])
const assignDialogVisible = ref(false)
const selectedMaintainerId = ref(null)
const currentComplaint = ref(null)

const roleMap = { OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }
const roleTag = { OPERATOR: 'warning', MAINTAINER: 'info', PARK_ADMIN: 'danger' }

// 状态标签颜色：未处理=红，中=黄，已处理=绿
const statusTagType = (status) => {
  if (status === '未处理') return 'danger'
  if (status === '处理中') return 'warning'
  return 'success'
}

// 加载投诉列表
const load = async () => {
  loadingComplaints.value = true
  try {
    complaints.value = await fetchComplaints()
  } catch (e) {
    ElMessage.error('投诉列表获取失败')
  } finally {
    loadingComplaints.value = false
  }
}

// 加载维护员列表
const loadMaintainers = async () => {
  try {
    const res = await axios.get('/api/admin/maintainers')
    maintainers.value = res.data || []
  } catch (e) {
    ElMessage.error('维护员列表获取失败')
  }
}

// 打开指派对话框
const openAssignDialog = (complaint) => {
  currentComplaint.value = complaint
  selectedMaintainerId.value = null
  assignDialogVisible.value = true
}

// 确认指派
const confirmAssign = async () => {
  if (!currentComplaint.value || !selectedMaintainerId.value) {
    ElMessage.warning('请选择维护员')
    return
  }
  try {
    await axios.post('/api/complaint-tasks', {
      complaintId: currentComplaint.value.id,
      maintainerId: selectedMaintainerId.value
    })
    ElMessage.success('任务已指派给维护员')
    assignDialogVisible.value = false

    // 前端直接将状态改为“处理中”，避免重新刷新
    const target = complaints.value.find(c => c.id === currentComplaint.value.id)
    if (target) {
      target.status = '处理中'
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '指派失败')
  }
}

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
  await loadMaintainers()
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
