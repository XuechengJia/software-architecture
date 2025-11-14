<template>
  <div class="admin-page">
    <!-- 顶部信息栏 -->
    <div class="admin-header">
      <div class="admin-header-left">
        <h2>人员管理</h2>
        <p class="subtitle">维护员、运营、租客账号与园区绑定管理</p>
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
            <el-button
                type="text"
                :icon="Setting"
                @click="goBackAdmin"
            >
              返回园区管理
            </el-button>
            <el-button
                type="text"
                :icon="SwitchButton"
                @click="logout"
            >
              退出登录
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 主体内容：三类人员 -->
    <el-card shadow="never" class="main-card">
      <div class="card-header">
        <div class="card-title">
          账号列表
        </div>
        <div class="card-actions">
          <el-button type="primary" @click="loadAllPeople" :loading="loadingAny">
            刷新全部
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <!-- 维护员 -->
        <el-tab-pane label="维护员" name="maintainers">
          <el-table
              :data="maintainers"
              style="width: 100%;"
              v-loading="loadingMaintainers"
              empty-text="暂无维护员"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="160" />
            <el-table-column prop="phone" label="手机号" width="160" />
            <el-table-column label="状态" width="140">
              <template #default="scope">
                <el-tag
                    v-if="scope.row.status === 'ACTIVE'"
                    type="success"
                >
                  启用
                </el-tag>
                <el-tag
                    v-else
                    type="info"
                >
                  禁用
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="园区" min-width="220">
              <template #default="scope">
                <span v-if="maintainerParkNames(scope.row).length">
                  {{ maintainerParkNames(scope.row).join('、') }}
                </span>
                <span v-else class="text-muted">
                  未绑定园区
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260">
              <template #default="scope">
                <el-button
                    size="small"
                    @click="openEditParksDialog(scope.row)"
                >
                  编辑园区绑定
                </el-button>
                <el-switch
                    style="margin-left: 8px;"
                    v-model="scope.row.status"
                    active-value="ACTIVE"
                    inactive-value="INACTIVE"
                    @change="onMaintainerStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 运营 -->
        <el-tab-pane label="运营" name="operators">
          <el-table
              :data="operators"
              style="width: 100%;"
              v-loading="loadingOperators"
              empty-text="暂无运营账号"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="160" />
            <el-table-column prop="phone" label="手机号" width="160" />
            <el-table-column label="状态" width="140">
              <template #default="scope">
                <el-tag
                    v-if="scope.row.status === 'ACTIVE'"
                    type="success"
                >
                  启用
                </el-tag>
                <el-tag
                    v-else
                    type="info"
                >
                  禁用
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-switch
                    v-model="scope.row.status"
                    active-value="ACTIVE"
                    inactive-value="INACTIVE"
                    @change="onOperatorStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 租客 -->
        <el-tab-pane label="租客" name="tenants">
          <el-table
              :data="tenants"
              style="width: 100%;"
              v-loading="loadingTenants"
              empty-text="暂无租客账号"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="160" />
            <el-table-column prop="phone" label="手机号" width="160" />
            <el-table-column label="状态" width="140">
              <template #default="scope">
                <el-tag
                    v-if="scope.row.status === 'ACTIVE'"
                    type="success"
                >
                  启用
                </el-tag>
                <el-tag
                    v-else
                    type="info"
                >
                  禁用
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-switch
                    v-model="scope.row.status"
                    active-value="ACTIVE"
                    inactive-value="INACTIVE"
                    @change="onTenantStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 编辑园区绑定弹窗（仅维护员用） -->
    <el-dialog
        v-model="editDialogVisible"
        title="编辑维护员园区绑定"
        width="480px"
    >
      <el-form label-width="80px">
        <el-form-item label="维护员">
          <div v-if="currentMaintainer">
            {{ currentMaintainer.name }}（{{ currentMaintainer.phone }}）
          </div>
        </el-form-item>
        <el-form-item label="园区">
          <el-select
              v-model="editParkIds"
              multiple
              filterable
              placeholder="请选择园区"
              :loading="loadingParks"
              style="width: 100%;"
          >
            <el-option
                v-for="p in parks"
                :key="p.id"
                :label="p.name"
                :value="p.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="saveMaintainerParks">保 存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Setting, UserFilled, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()

// 当前用户
const user = ref({})

// 角色显示
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

// 当前 tab
const activeTab = ref('maintainers')

// 维护员列表
const maintainers = ref([])
const loadingMaintainers = ref(false)

// 运营列表
const operators = ref([])
const loadingOperators = ref(false)

// 租客列表
const tenants = ref([])
const loadingTenants = ref(false)

// 是否有任何一个列表在加载（给“刷新全部”按钮用）
const loadingAny = ref(false)

// 园区列表
const parks = ref([])
const loadingParks = ref(false)

// 维护员 -> 绑定园区 ID 列表缓存
const maintainerParkMap = ref({})

// 编辑弹窗
const editDialogVisible = ref(false)
const currentMaintainer = ref(null)
const editParkIds = ref([])

// 根据维护员对象，算出绑定的园区名称列表
const maintainerParkNames = (maintainer) => {
  if (!maintainer || !maintainer.id) return []
  const map = maintainerParkMap.value || {}
  const ids = map[maintainer.id] || []
  if (!ids.length) return []
  return ids
      .map(id => {
        const p = parks.value.find(pp => pp.id === id)
        return p ? p.name : null
      })
      .filter(Boolean)
}

// 加载维护员列表
const loadMaintainers = async () => {
  loadingMaintainers.value = true
  try {
    const res = await axios.get('/api/admin/maintainers')
    maintainers.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取维护员列表失败')
  } finally {
    loadingMaintainers.value = false
  }
}

// 加载运营列表
const loadOperators = async () => {
  loadingOperators.value = true
  try {
    const res = await axios.get('/api/admin/operators')
    operators.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取运营账号失败')
  } finally {
    loadingOperators.value = false
  }
}

// 加载租客列表
const loadTenants = async () => {
  loadingTenants.value = true
  try {
    const res = await axios.get('/api/admin/tenants-accounts')
    tenants.value = res.data || []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取租客账号失败')
  } finally {
    loadingTenants.value = false
  }
}

// 一键刷新全部
const loadAllPeople = async () => {
  loadingAny.value = true
  try {
    await Promise.all([
      loadMaintainers(),
      loadOperators(),
      loadTenants()
    ])
  } finally {
    loadingAny.value = false
  }
}

// 加载园区列表（管理员专用接口，避免 /api/parks 401）
const loadParks = async () => {
  if (parks.value.length > 0) return
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

// 打开编辑园区绑定弹窗
const openEditParksDialog = async (row) => {
  currentMaintainer.value = row
  editParkIds.value = []
  editDialogVisible.value = true

  await loadParks()

  try {
    const res = await axios.get(`/api/admin/maintainers/${row.id}/parks`)
    const ids = res.data?.parkIds || []
    editParkIds.value = ids
    maintainerParkMap.value = {
      ...maintainerParkMap.value,
      [row.id]: ids
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '获取维护员园区绑定失败')
  }
}

// 保存维护员园区绑定
const saveMaintainerParks = async () => {
  if (!currentMaintainer.value) return
  try {
    const payload = { parkIds: editParkIds.value }
    await axios.put(`/api/admin/maintainers/${currentMaintainer.value.id}/parks`, payload)
    maintainerParkMap.value = {
      ...maintainerParkMap.value,
      [currentMaintainer.value.id]: [...editParkIds.value]
    }
    ElMessage.success('园区绑定已更新')
    editDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '更新园区绑定失败')
  }
}

// 启用 / 禁用维护员
const onMaintainerStatusChange = async (row) => {
  const newStatus = row.status
  try {
    await axios.patch(`/api/admin/maintainers/${row.id}/status`, {
      status: newStatus
    })
    ElMessage.success(newStatus === 'ACTIVE' ? '已启用维护员' : '已禁用维护员')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '更新维护员状态失败')
    row.status = newStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  }
}

// 启用 / 禁用运营账号
const onOperatorStatusChange = async (row) => {
  const newStatus = row.status
  try {
    await axios.patch(`/api/admin/operators/${row.id}/status`, {
      status: newStatus
    })
    ElMessage.success(newStatus === 'ACTIVE' ? '已启用运营账号' : '已禁用运营账号')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '更新运营账号状态失败')
    row.status = newStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  }
}

// 启用 / 禁用租客账号
const onTenantStatusChange = async (row) => {
  const newStatus = row.status
  try {
    await axios.patch(`/api/admin/tenants-accounts/${row.id}/status`, {
      status: newStatus
    })
    ElMessage.success(newStatus === 'ACTIVE' ? '已启用租客账号' : '已禁用租客账号')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '更新租客账号状态失败')
    row.status = newStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  }
}

// 返回园区管理首页（/admin）
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

  // 权限校验：只有 PARK_ADMIN 可以访问
  if (user.value.role !== 'PARK_ADMIN') {
    ElMessage.error('无权限访问人员管理')
    const redirect = user.value?.role === 'TENANT'
        ? '/home'
        : (user.value?.role === 'OPERATOR' ? '/operator' : '/login')
    router.replace(redirect)
    return
  }

  await loadAllPeople()
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
</style>
