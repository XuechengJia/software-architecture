<template>
  <div class="admin-page">
    <!-- 顶部 -->
    <div class="admin-header">
      <div class="admin-header-left">
        <h2>园区管理</h2>
        <p class="subtitle">园区信息与围栏（骑行范围 / 停车区）维护</p>
      </div>
      <div class="admin-header-right">
        <el-card shadow="never" class="user-card">
          <div class="user-info">
            <el-icon class="user-avatar">
              <UserFilled />
            </el-icon>
            <div class="user-meta">
              <div class="user-name">{{ user.name || '未登录' }}</div>
              <div class="user-role">
                <el-tag :type="roleTag[user.role] || 'info'">
                  {{ roleMap[user.role] || '未知角色' }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="user-actions">
            <el-button type="text" :icon="Setting" @click="goBackAdmin">
              返回园区概览
            </el-button>
            <el-button type="text" :icon="SwitchButton" @click="logout">
              退出登录
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 园区列表 -->
    <el-card shadow="never" class="main-card">
      <div class="card-header">
        <div class="card-title">园区列表</div>
        <div class="card-actions">
          <el-button type="primary" @click="openCreateParkDialog">
            新增园区
          </el-button>
          <el-button @click="loadParks" :loading="loadingParks">
            刷新
          </el-button>
        </div>
      </div>

      <el-table
          :data="parks"
          style="width: 100%;"
          v-loading="loadingParks"
          empty-text="暂无园区"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column prop="location" label="位置描述" width="200" />
        <el-table-column label="中心点" width="200">
          <template #default="scope">
            <span>经度: {{ scope.row.center_lng }}，纬度: {{ scope.row.center_lat }}</span>
          </template>
        </el-table-column>
        <el-table-column label="边界" min-width="220">
          <template #default="scope">
            <span class="text-muted">
              {{ shortBoundary(scope.row.boundary_coordinates) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <el-button size="small" @click="openEditParkDialog(scope.row)">
              编辑
            </el-button>
            <el-button
                size="small"
                type="danger"
                @click="deletePark(scope.row)"
            >
              删除
            </el-button>
            <el-button
                size="small"
                type="primary"
                @click="openFenceDialog(scope.row)"
            >
              围栏管理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑园区弹窗 -->
    <el-dialog
        v-model="parkDialogVisible"
        :title="parkForm.id ? '编辑园区' : '新增园区'"
        width="520px"
    >
      <el-form label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="parkForm.name" placeholder="请输入园区名称" />
        </el-form-item>
        <el-form-item label="位置描述">
          <el-input
              v-model="parkForm.location"
              placeholder="例如：XX科创园A区"
          />
        </el-form-item>
        <el-form-item label="中心经度">
          <el-input v-model="parkForm.centerLng" placeholder="例如：121.123456" />
        </el-form-item>
        <el-form-item label="中心纬度">
          <el-input v-model="parkForm.centerLat" placeholder="例如：31.123456" />
        </el-form-item>
        <el-form-item label="边界坐标">
          <el-input
              type="textarea"
              :rows="4"
              v-model="parkForm.boundaryCoordinates"
              placeholder="暂时用文本维护坐标，例如 lng,lat;lng,lat;..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="parkDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitPark">
            保 存
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 围栏管理弹窗 -->
    <el-dialog
        v-model="fenceDialogVisible"
        :title="'围栏管理 - ' + (currentPark?.name || '')"
        width="700px"
    >
      <div class="fence-header">
        <el-button type="primary" @click="openCreateFenceDialog">
          新增围栏
        </el-button>
        <span class="text-muted" style="margin-left: 12px;">
          围栏类型示例：RIDE（骑行范围）、PARKING（停车区）
        </span>
      </div>

      <el-table
          :data="fences"
          style="width: 100%; margin-top: 10px;"
          v-loading="loadingFences"
          empty-text="暂无围栏"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="fence_type" label="类型" width="120" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column label="坐标" min-width="220">
          <template #default="scope">
            <span class="text-muted">
              {{ shortBoundary(scope.row.coordinates) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="openEditFenceDialog(scope.row)">
              编辑
            </el-button>
            <el-button
                size="small"
                type="danger"
                @click="deleteFence(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 新增/编辑围栏表单 -->
      <el-divider />
      <el-form label-width="90px">
        <el-form-item label="类型">
          <el-select v-model="fenceForm.fenceType" placeholder="请选择类型">
            <el-option label="骑行范围（RIDE）" value="RIDE" />
            <el-option label="停车区（PARKING）" value="PARKING" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="fenceForm.name" placeholder="例如：南门停车区" />
        </el-form-item>
        <el-form-item label="坐标">
          <el-input
              type="textarea"
              :rows="3"
              v-model="fenceForm.coordinates"
              placeholder="暂时用文本维护坐标，例如 lng,lat;lng,lat;..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="fenceDialogVisible = false">关 闭</el-button>
          <el-button type="primary" @click="submitFence">
            保存围栏
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()

const user = ref({})

const roleMap = {
  OPERATOR: '运营',
  MAINTAINER: '维护员',
  PARK_ADMIN: '园区管理员',
  TENANT: '租客'
}
const roleTag = {
  OPERATOR: 'warning',
  MAINTAINER: 'info',
  PARK_ADMIN: 'danger',
  TENANT: 'success'
}

// 园区列表
const parks = ref([])
const loadingParks = ref(false)

// 园区表单
const parkDialogVisible = ref(false)
const parkForm = ref({
  id: null,
  name: '',
  location: '',
  centerLng: '',
  centerLat: '',
  boundaryCoordinates: ''
})

// 围栏相关
const fenceDialogVisible = ref(false)
const currentPark = ref(null)
const fences = ref([])
const loadingFences = ref(false)
const fenceForm = ref({
  id: null,
  fenceType: '',
  name: '',
  coordinates: ''
})

const shortBoundary = (text) => {
  if (!text) return '未设置'
  return text.length > 40 ? text.slice(0, 40) + '...' : text
}

// 加载园区列表
const loadParks = async () => {
  loadingParks.value = true
  try {
    const res = await axios.get('/api/admin/parks')
    parks.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取园区列表失败')
  } finally {
    loadingParks.value = false
  }
}

// 打开新增园区
const openCreateParkDialog = () => {
  parkForm.value = {
    id: null,
    name: '',
    location: '',
    centerLng: '',
    centerLat: '',
    boundaryCoordinates: ''
  }
  parkDialogVisible.value = true
}

// 打开编辑园区
const openEditParkDialog = (row) => {
  parkForm.value = {
    id: row.id,
    name: row.name || '',
    location: row.location || '',
    centerLng: row.center_lng ?? '',
    centerLat: row.center_lat ?? '',
    boundaryCoordinates: row.boundary_coordinates || ''
  }
  parkDialogVisible.value = true
}

// 提交园区
const submitPark = async () => {
  if (!parkForm.value.name) {
    ElMessage.warning('请填写园区名称')
    return
  }
  const payload = {
    name: parkForm.value.name,
    location: parkForm.value.location,
    centerLng: parkForm.value.centerLng,
    centerLat: parkForm.value.centerLat,
    boundaryCoordinates: parkForm.value.boundaryCoordinates
  }
  try {
    if (parkForm.value.id) {
      await axios.put(`/api/admin/parks/${parkForm.value.id}`, payload)
      ElMessage.success('园区已更新')
    } else {
      await axios.post('/api/admin/parks', payload)
      ElMessage.success('园区已创建')
    }
    parkDialogVisible.value = false
    await loadParks()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '保存园区失败')
  }
}

// 删除园区
const deletePark = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确认删除园区「${row.name}」？相关围栏和绑定数据也会被删除。`,
        '提示',
        { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await axios.delete(`/api/admin/parks/${row.id}`)
    ElMessage.success('园区已删除')
    await loadParks()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '删除园区失败')
  }
}

// 打开围栏管理
const openFenceDialog = async (park) => {
  currentPark.value = park
  fenceDialogVisible.value = true
  fenceForm.value = {
    id: null,
    fenceType: '',
    name: '',
    coordinates: ''
  }
  await loadFences()
}

// 加载当前园区的围栏
const loadFences = async () => {
  if (!currentPark.value) return
  loadingFences.value = true
  try {
    const res = await axios.get('/api/admin/park-fences', {
      params: { parkId: currentPark.value.id }
    })
    fences.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取围栏列表失败')
  } finally {
    loadingFences.value = false
  }
}

// 新增围栏
const openCreateFenceDialog = () => {
  fenceForm.value = {
    id: null,
    fenceType: '',
    name: '',
    coordinates: ''
  }
}

// 编辑围栏
const openEditFenceDialog = (row) => {
  fenceForm.value = {
    id: row.id,
    fenceType: row.fence_type,
    name: row.name,
    coordinates: row.coordinates || ''
  }
}

// 保存围栏
const submitFence = async () => {
  if (!currentPark.value) return
  if (!fenceForm.value.fenceType || !fenceForm.value.name) {
    ElMessage.warning('请填写围栏类型和名称')
    return
  }
  const payload = {
    parkId: currentPark.value.id,
    fenceType: fenceForm.value.fenceType,
    name: fenceForm.value.name,
    coordinates: fenceForm.value.coordinates
  }
  try {
    if (fenceForm.value.id) {
      await axios.put(`/api/admin/park-fences/${fenceForm.value.id}`, payload)
      ElMessage.success('围栏已更新')
    } else {
      await axios.post('/api/admin/park-fences', payload)
      ElMessage.success('围栏已创建')
    }
    await loadFences()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '保存围栏失败')
  }
}

// 删除围栏
const deleteFence = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确认删除围栏「${row.name}」？`,
        '提示',
        { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await axios.delete(`/api/admin/park-fences/${row.id}`)
    ElMessage.success('围栏已删除')
    await loadFences()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '删除围栏失败')
  }
}

// 返回园区概览页
const goBackAdmin = () => {
  router.push('/admin')
}

// 退出登录
const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出系统')
  router.push('/login')
}

onMounted(async () => {
  const u = localStorage.getItem('user')
  if (u) {
    user.value = JSON.parse(u)
  }
  // 只有 PARK_ADMIN 可访问
  if (user.value.role !== 'PARK_ADMIN') {
    ElMessage.error('无权限访问园区管理')
    const redirect = user.value?.role === 'TENANT'
        ? '/home'
        : (user.value?.role === 'OPERATOR' ? '/operator' : '/login')
    router.replace(redirect)
    return
  }
  await loadParks()
})
</script>

<style scoped>
.admin-page {
  padding: 16px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin-bottom: 16px;
  gap: 16px;
}

.admin-header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.user-card {
  min-width: 260px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  font-size: 32px;
  margin-right: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
}

.user-role {
  margin-top: 4px;
}

.user-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.main-card {
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.text-muted {
  color: #a8abb2;
  font-size: 13px;
}

.fence-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
</style>
