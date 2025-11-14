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
            <div class="content-area">
              <div class="complaint-tasks-content">
                <el-table :data="tasks" style="width: 100%" v-loading="loadingTasks">
                  <el-table-column prop="type" label="投诉类型" width="120" />
                  <el-table-column prop="description" label="投诉内容" />
                  <el-table-column label="投诉位置" width="180">
                    <template #default="scope">
                      <span>经度: {{ scope.row.complaintLongitude }}<br />纬度: {{ scope.row.complaintLatitude }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="100" />
                  <el-table-column label="操作" width="140">
                    <template #default="scope">
                      <el-button
                          v-if="scope.row.status === '待处理'"
                          type="primary"
                          size="small"
                          @click="openCompleteDialog(scope.row)"
                      >
                        提交结果
                      </el-button>
                      <span v-else>已完成</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <el-dialog
                  v-model="completeDialogVisible"
                  title="提交处理结果"
                  width="480px"
              >
                <el-form label-width="80px">
                  <el-form-item label="说明">
                    <el-input
                        type="textarea"
                        v-model="resultText"
                        placeholder="请简要描述处理过程和结果"
                        :rows="3"
                    />
                  </el-form-item>
                  <el-form-item label="位置">
                    <div>
                      <div v-if="resultLocation">
                        经度: {{ resultLocation.longitude }}，纬度: {{ resultLocation.latitude }}
                      </div>
                      <el-button type="primary" size="small" @click="getCurrentLocation">
                        获取当前位置
                      </el-button>
                    </div>
                  </el-form-item>
                  <el-form-item label="照片">
                    <div>
                      <input type="file" accept="image/*" @change="onResultPhotoChange" />
                      <div v-if="resultPhotoPreview" style="margin-top: 8px;">
                        <img
                            :src="resultPhotoPreview"
                            alt="处理照片预览"
                            style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px;"
                        />
                        <el-button type="text" size="small" @click="clearResultPhoto">删除</el-button>
                      </div>
                    </div>
                  </el-form-item>
                </el-form>
                <template #footer>
      <span class="dialog-footer">
        <el-button @click="completeDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitResult">提 交</el-button>
      </span>
                </template>
              </el-dialog>
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
import axios from 'axios'
import { Setting, Bicycle, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref({})

// 投诉任务列表
const tasks = ref([])
const loadingTasks = ref(false)

// 提交结果对话框
const completeDialogVisible = ref(false)
const currentTask = ref(null)
const resultText = ref('')
const resultLocation = ref(null)
const resultPhotoPreview = ref(null)
const resultPhotoFile = ref(null)

const roleMap = { OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }
const roleTag = { OPERATOR: 'warning', MAINTAINER: 'info', PARK_ADMIN: 'danger' }

// 加载当前维护员的任务列表
const loadTasks = async () => {
  if (!user.value.id) return
  loadingTasks.value = true
  try {
    const res = await axios.get('/api/complaint-tasks', {
      params: { maintainerId: user.value.id }
    })
    tasks.value = res.data || []
  } catch (e) {
    ElMessage.error('任务列表获取失败')
  } finally {
    loadingTasks.value = false
  }
}

// 打开提交结果弹窗
const openCompleteDialog = (task) => {
  currentTask.value = task
  resultText.value = ''
  resultLocation.value = null
  resultPhotoPreview.value = null
  resultPhotoFile.value = null
  completeDialogVisible.value = true
}

// 获取当前位置
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    ElMessage.error('当前浏览器不支持定位')
    return
  }
  navigator.geolocation.getCurrentPosition(
      pos => {
        resultLocation.value = {
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }
      },
      () => {
        ElMessage.error('无法获取位置信息，请检查定位权限')
      }
  )
}

// 选择处理结果照片
const onResultPhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    resultPhotoFile.value = file
    resultPhotoPreview.value = URL.createObjectURL(file)
  }
}

const clearResultPhoto = () => {
  resultPhotoFile.value = null
  resultPhotoPreview.value = null
}

// 提交处理结果到后端
const submitResult = async () => {
  if (!currentTask.value) return
  if (!resultText.value || !resultLocation.value) {
    ElMessage.warning('请填写处理说明并获取位置信息')
    return
  }
  try {
    const formData = new FormData()
    formData.append('resultText', resultText.value)
    formData.append('latitude', resultLocation.value.latitude)
    formData.append('longitude', resultLocation.value.longitude)
    formData.append('maintainerId', String(user.value.id))
    formData.append('maintainerName', user.value.name || '')
    if (resultPhotoFile.value) {
      formData.append('photo', resultPhotoFile.value)
    }

    await axios.post(`/api/complaint-tasks/${currentTask.value.id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    ElMessage.success('任务已完成')
    completeDialogVisible.value = false

    const target = tasks.value.find(t => t.id === currentTask.value.id)
    if (target) {
      target.status = '已完成'
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  }
}

onMounted(async () => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  if (user.value.role !== 'MAINTAINER') {
    ElMessage.error('无权限访问维护后台')
    const redirect = user.value?.role === 'TENANT' ? '/home' : '/admin'
    router.replace(redirect)
    return
  }
  await loadTasks()
})

const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出维护后台')
  router.push('/login')
}
</script>


<style scoped>
@import './admin-style.css';
</style>
