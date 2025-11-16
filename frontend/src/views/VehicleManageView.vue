<template>
  <div class="admin-container">
    <div class="background-wrapper"><div class="bg-animation"></div></div>
    <div class="admin-content">
      <el-affix :offset="0">
        <div class="admin-header">
          <div class="header-left">
            <el-icon class="admin-icon"><Setting /></el-icon>
            <span class="header-title">车辆运维管理</span>
          </div>

          <div class="header-right">
            <div class="user-info">
              <el-avatar :size="36" :icon="UserFilled" class="user-avatar" />
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <el-tag :type="roleTag[user.role]" effect="light" size="small">
                  {{ roleMap[user.role] }}
                </el-tag>
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
        <!-- 顶部操作栏 -->
        <div class="toolbar">
          <el-select
              v-model="filterParkId"
              placeholder="按园区筛选"
              clearable
              style="width: 220px; margin-right: 12px;"
              @change="onParkChange"
          >
            <el-option
                v-for="p in parks"
                :key="p.id"
                :label="p.name"
                :value="p.id"
            />
          </el-select>

          <el-button type="primary" @click="openCreateDialog">
            新车投放
          </el-button>
          <el-button @click="loadVehicles" :loading="loadingVehicles" style="margin-left: 8px;">
            刷新
          </el-button>
        </div>

        <!-- 车辆表格 -->
        <el-card class="content-card" shadow="hover">
          <template #header>
            <div class="content-header">
              <el-icon class="content-icon"><Location /></el-icon>
              <span class="content-title">车辆列表</span>
            </div>
          </template>

          <el-table
              :data="vehicles"
              style="width: 100%;"
              v-loading="loadingVehicles"
              empty-text="暂无车辆"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="code" label="车辆编码" width="160" />
            <el-table-column label="所属园区" width="180">
              <template #default="scope">
                {{ parkName(scope.row.park_id) || '未绑定' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="140">
              <template #default="scope">
                <el-tag
                    v-if="scope.row.status === 'IDLE'"
                    type="success"
                >
                  空闲
                </el-tag>
                <el-tag
                    v-else-if="scope.row.status === 'IN_USE'"
                    type="warning"
                >
                  使用中
                </el-tag>
                <el-tag
                    v-else
                    type="info"
                >
                  维护中
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="电量" width="140">
              <template #default="scope">
                <el-progress
                    :percentage="scope.row.battery || 0"
                    :text-inside="true"
                    :stroke-width="16"
                />
              </template>
            </el-table-column>
            <el-table-column label="坐标" min-width="200">
              <template #default="scope">
                <span v-if="scope.row.longitude != null && scope.row.latitude != null" class="text-muted">
                  经度: {{ scope.row.longitude }}，纬度: {{ scope.row.latitude }}
                </span>
                <span v-else class="text-muted">未设置</span>
              </template>
            </el-table-column>
            <el-table-column label="停车区" width="160">
              <template #default="scope">
    <span v-if="scope.row.parking_fence_id">
      {{ parkingFenceName(scope.row.parking_fence_id) }}
    </span>
                <span v-else class="text-muted">未指定</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="260">
              <template #default="scope">
                <el-button size="small" @click="openEditDialog(scope.row)">
                  编辑
                </el-button>
                <el-button
                    v-if="scope.row.status !== 'MAINTENANCE'"
                    size="small"
                    type="warning"
                    @click="setMaintenance(scope.row)"
                >
                  设为维修
                </el-button>
                <el-button
                    v-else
                    size="small"
                    type="success"
                    @click="setIdle(scope.row)"
                >
                  恢复可用
                </el-button>
                <el-button
                    size="small"
                    type="danger"
                    @click="deleteVehicle(scope.row)"
                    style="margin-left: 4px;"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-card class="content-card" shadow="hover" style="margin-bottom: 16px;">
          <template #header>
            <div class="content-header">
              <el-icon class="content-icon"><Location /></el-icon>
              <span class="content-title">停车区容量概览</span>
            </div>
          </template>

          <div v-if="!filterParkId" class="text-muted">
            请先选择一个园区查看停车区容量情况。
          </div>
          <el-skeleton v-else :loading="loadingStats" animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 60%;" />
              <el-skeleton-item variant="text" style="width: 40%; margin-top: 8px;" />
            </template>
            <template #default>
              <div v-if="parkingStats.length === 0" class="text-muted">
                当前园区暂无停车区围栏。
              </div>
              <el-row v-else :gutter="12">
                <el-col
                    v-for="s in parkingStats"
                    :key="s.id"
                    :span="8"
                    style="margin-bottom: 8px;"
                >
                  <el-card shadow="never" :class="s.overloaded ? 'overloaded-card' : ''">
                    <div class="stat-name">{{ s.name }}</div>
                    <div class="stat-line">
                      车辆数：{{ s.currentCount }} / {{ s.maxVehicles ?? '未设置' }}
                    </div>
                    <div v-if="s.overloaded" class="stat-alert">
                      <el-tag type="danger" size="small">已超阈值</el-tag>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </template>
          </el-skeleton>
        </el-card>


        <!-- 新增 / 编辑车辆弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="form.id ? '编辑车辆' : '新车投放'"
            width="520px"
        >
          <el-form label-width="90px">
            <el-form-item label="车辆编码">
              <el-input v-model="form.code" placeholder="请输入车辆编码（车牌或编号）" />
            </el-form-item>
            <el-form-item label="所属园区">
              <el-select v-model="form.parkId" placeholder="请选择园区" style="width: 100%;">
                <el-option
                    v-for="p in parks"
                    :key="p.id"
                    :label="p.name"
                    :value="p.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="停车区（可选）">
              <el-select
                  v-model="form.parkingFenceId"
                  placeholder="选择停车区（可留空）"
                  clearable
                  style="width: 100%;"
              >
                <el-option
                    v-for="f in parkingFences"
                    :key="f.id"
                    :label="f.name"
                    :value="f.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="电量">
              <el-input
                  v-model="form.battery"
                  placeholder="0 - 100，留空默认 100"
                  type="number"
                  min="0"
                  max="100"
              />
            </el-form-item>
            <el-form-item label="经度">
              <el-input v-model="form.longitude" placeholder="可选，例如：121.123456" />
            </el-form-item>
            <el-form-item label="纬度">
              <el-input v-model="form.latitude" placeholder="可选，例如：31.123456" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">取 消</el-button>
              <el-button type="primary" @click="submitForm">保 存</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, UserFilled, SwitchButton, Location } from '@element-plus/icons-vue'

const router = useRouter()
// 停车围栏列表（当前园区）
const parkingFences = ref([])

// 停车围栏统计
const parkingStats = ref([])
const loadingStats = ref(false)

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

// 园区
const parks = ref([])
const filterParkId = ref(null)

// 车辆
const vehicles = ref([])
const loadingVehicles = ref(false)

// 新增/编辑弹窗
const dialogVisible = ref(false)
const form = ref({
  id: null,
  code: '',
  parkId: null,
  battery: 100,
  longitude: '',
  latitude: '',
  parkingFenceId: null
})

const parkName = (parkId) => {
  const p = parks.value.find(p => p.id === parkId)
  return p ? p.name : ''
}

const loadParks = async () => {
  try {
    // 使用管理员视角的园区接口，返回值是一个数组
    const res = await axios.get('/api/admin/parks')
    parks.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取园区列表失败')
  }
}

const loadVehicles = async () => {
  loadingVehicles.value = true
  try {
    const params = {}
    if (filterParkId.value) {
      params.parkId = filterParkId.value
    }
    const res = await axios.get('/api/admin/vehicles', { params })
    vehicles.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取车辆列表失败')
  } finally {
    loadingVehicles.value = false
  }
}

const loadParkingFences = async () => {
  if (!filterParkId.value) {
    parkingFences.value = []
    return
  }
  try {
    const res = await axios.get('/api/admin/park-fences', {
      params: { parkId: filterParkId.value }
    })
    // 只保留停车区类型
    parkingFences.value = (res.data || []).filter(f => f.fence_type === 'PARKING')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取停车区失败')
  }
}

const loadParkingStats = async () => {
  if (!filterParkId.value) {
    parkingStats.value = []
    return
  }
  loadingStats.value = true
  try {
    const res = await axios.get('/api/admin/park-fences/stats', {
      params: { parkId: filterParkId.value }
    })
    parkingStats.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取停车区统计失败')
  } finally {
    loadingStats.value = false
  }
}

const openCreateDialog = () => {
  form.value = {
    id: null,
    code: '',
    parkId: filterParkId.value || (parks.value[0] && parks.value[0].id) || null,
    battery: 100,
    longitude: '',
    latitude: '',
    parkingFenceId: null
  }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  form.value = {
    id: row.id,
    code: row.code,
    parkId: row.park_id,
    battery: row.battery,
    longitude: row.longitude ?? '',
    latitude: row.latitude ?? '',
    parkingFenceId: row.parking_fence_id ?? null
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!form.value.code || !form.value.parkId) {
    ElMessage.warning('请填写车辆编码并选择园区')
    return
  }
  const payload = {
    code: form.value.code,
    parkId: form.value.parkId,
    battery: form.value.battery,
    longitude: form.value.longitude,
    latitude: form.value.latitude,
    parkingFenceId: form.value.parkingFenceId
  }
  try {
    if (form.value.id) {
      await axios.put(`/api/admin/vehicles/${form.value.id}`, payload)
      ElMessage.success('车辆已更新')
    } else {
      await axios.post('/api/admin/vehicles', payload)
      ElMessage.success('车辆已创建')
    }
    dialogVisible.value = false
    await loadVehicles()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '保存车辆失败')
  }
}

const setMaintenance = async (row) => {
  try {
    await axios.patch(`/api/admin/vehicles/${row.id}/status`, { status: 'MAINTENANCE' })
    ElMessage.success('已设置为维修中')
    await loadVehicles()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '设置维修状态失败')
  }
}

const parkingFenceName = (fenceId) => {
  const f = parkingFences.value.find(f => f.id === fenceId)
  return f ? f.name : ''
}

const setIdle = async (row) => {
  try {
    await axios.patch(`/api/admin/vehicles/${row.id}/status`, { status: 'IDLE' })
    ElMessage.success('已恢复可用')
    await loadVehicles()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '设置空闲状态失败')
  }
}

const deleteVehicle = async (row) => {
  try {
    await ElMessageBox.confirm(
        `确认删除车辆「${row.code}」？`,
        '提示',
        { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await axios.delete(`/api/admin/vehicles/${row.id}`)
    ElMessage.success('车辆已删除')
    await loadVehicles()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '删除车辆失败')
  }
}
const onParkChange = async () => {
  await loadVehicles()
  await loadParkingFences()
  await loadParkingStats()
}

const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出管理后台')
  router.push('/login')
}
onMounted(async () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
  }

  if (user.value.role !== 'OPERATOR') {
    ElMessage.error('无权限访问车辆运维管理')
    router.replace('/admin')
    return
  }

  await loadParks()
  // 默认选第一个园区
  if (!filterParkId.value && parks.value.length > 0) {
    filterParkId.value = parks.value[0].id
  }
  await loadVehicles()
  await loadParkingFences()
  await loadParkingStats()
})

</script>

<style scoped>
@import './admin-style.css';

.toolbar {
  margin: 16px 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.text-muted {
  color: #a8abb2;
  font-size: 13px;
}
.stat-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.stat-line {
  font-size: 13px;
  color: #606266;
}
.stat-alert {
  margin-top: 4px;
}
.overloaded-card {
  border-color: #f56c6c;
}

</style>
