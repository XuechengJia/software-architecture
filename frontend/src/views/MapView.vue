<template>
  <div class="map-container">
    <div id="amap-container"></div>

    <!-- 右侧车辆列表 -->
    <div class="vehicle-list">
      <div class="list-header">
        <h3>附近车辆 ({{ vehicles.length }})</h3>
        <el-tag v-if="currentRide" type="warning" size="small">
          骑行中: {{ currentRide.vehicle_code }}
        </el-tag>
      </div>

      <!-- 车辆卡片 -->
      <el-card
          v-for="v in paginatedVehicles"
          :key="v.id"
          class="vehicle-card"
          :class="{ active: activeVehicleId === v.id }"
          @click="focusVehicle(v)"
          style="cursor: pointer; transition: all 0.3s;"
      >
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold text-lg">{{ v.code }}</div>
            <div class="text-sm text-gray-500">
              电量: {{ v.battery }}% · {{ statusMap[v.status] }}
            </div>
          </div>
          <el-tag :type="statusTag[v.status]" size="small">
            {{ statusMap[v.status] }}
          </el-tag>
        </div>
      </el-card>

      <!-- 分页 -->
      <el-pagination
          v-if="vehicles.length > pageSize"
          v-model:current-page="page"
          :page-size="pageSize"
          :total="vehicles.length"
          layout="prev, pager, next"
          small
          background
          class="pagination"
      />
    </div>

    <!-- 扫码解锁弹窗 -->
    <el-dialog
        v-model="unlockDialog.visible"
        title="扫码解锁"
        width="340px"
        center
        :close-on-click-modal="false"
    >
      <div class="text-center">
        <div id="qrcode" ref="qrcode"></div>
        <p class="mt-3 text-sm text-gray-600">请用APP扫描二维码解锁</p>
      </div>
      <template #footer>
        <el-button @click="cancelUnlock">取消</el-button>
        <el-button type="primary" @click="simulateScan" :loading="unlocking">
          模拟扫码成功
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import QRCode from 'qrcode.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const vehicles = ref([])
const page = ref(1)
const pageSize = ref(6)
const paginatedVehicles = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return vehicles.value.slice(start, start + pageSize.value)
})
const currentRide = ref(null)
const unlockDialog = ref({ visible: false, vehicle: null })
const unlocking = ref(false)
const activeVehicleId = ref(null)

let map = null
let markers = []

// 状态映射
const statusMap = {
  IDLE: '空闲',
  IN_USE: '使用中',
  LOCKED: '锁定',
  MAINTENANCE: '维护中'
}
const statusTag = {
  IDLE: 'success',
  IN_USE: 'warning',
  LOCKED: 'danger',
  MAINTENANCE: 'info'
}

// 加载高德地图
const loadAMap = () => new Promise((resolve) => {
  if (window.AMap) return resolve(window.AMap)
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/maps?v=2.0&key=439942f223315c82fa3695c7902ad31f&plugin=AMap.ControlBar'
  script.onload = () => resolve(window.AMap)
  document.head.appendChild(script)
})

// 初始化地图
const initMap = async () => {
  const AMap = await loadAMap()
  map = new AMap.Map('amap-container', {
    zoom: 15,
    center: [116.31, 39.91],
    pitch: 45,
    viewMode: '3D'
  })
  map.addControl(new AMap.ControlBar())
  fetchVehicles()
  setInterval(fetchVehicles, 5000)
}

// 获取车辆
const fetchVehicles = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/vehicles', {
      headers: { Authorization: `Bearer ${token}` }
    })
    vehicles.value = res.data.vehicles || []

    // 清除旧标记
    if (markers.length) map.remove(markers)
    markers = []

    vehicles.value.forEach(v => {
      const coords = v.location?.coordinates || v.location
      if (!coords || coords.length < 2) return
      const [lng, lat] = coords.map(Number)
      if (isNaN(lng) || isNaN(lat)) return

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        title: `${v.code} (${v.battery}%)`,
        icon: v.status === 'IN_USE'
            ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
            : 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
      })

      marker.on('click', () => {
        if (localStorage.getItem('current_ride')) {
          ElMessage.warning('您已有一辆车正在使用中')
          return
        }
        unlockDialog.value = { visible: true, vehicle: v }
        nextTick(() => renderQRCode(v))
      })

      markers.push(marker)
    })

    if (markers.length) {
      map.add(markers)
      map.setFitView(markers)
    }
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
  }
}

// 聚焦车辆
const focusVehicle = (vehicle) => {
  activeVehicleId.value = vehicle.id
  const coords = vehicle.location?.coordinates || vehicle.location
  if (coords && coords.length >= 2) {
    const [lng, lat] = coords.map(Number)
    map.setZoomAndCenter(18, [lng, lat])
  }

  if (localStorage.getItem('current_ride')) {
    ElMessage.warning('您已有一辆车正在使用中')
    return
  }

  unlockDialog.value = { visible: true, vehicle }
  nextTick(() => renderQRCode(vehicle))
}

// 生成二维码
const renderQRCode = (vehicle) => {
  const qr = document.getElementById('qrcode')
  if (qr) qr.innerHTML = ''
  new QRCode(qr, {
    text: JSON.stringify({ action: 'unlock', vehicleId: vehicle.id }),
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff'
  })
}

// 模拟扫码
const simulateScan = async () => {
  unlocking.value = true
  try {
    const token = localStorage.getItem('token')
    const vehicleId = unlockDialog.value.vehicle.id
    const { data } = await axios.post('/api/ride/start', { vehicleId }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const rideInfo = {
      id: data.ride.id,
      start_time: data.ride.start_time,
      vehicle_code: unlockDialog.value.vehicle.code
    }
    localStorage.setItem('current_ride', JSON.stringify(rideInfo))

    ElMessage.success(`解锁成功！开始骑行 ${unlockDialog.value.vehicle.code}`)
    unlockDialog.value.visible = false

    // 通知 HomeView
    window.dispatchEvent(new Event('ride-started'))
  } catch (err) {
    const msg = err.response?.data?.message || '解锁失败'
    ElMessage.error(msg.includes('正在使用中') ? '您已有一辆车正在使用中' : msg)
  } finally {
    unlocking.value = false
  }
}

const cancelUnlock = () => {
  unlockDialog.value.visible = false
}

onMounted(() => {
  initMap()
  currentRide.value = JSON.parse(localStorage.getItem('current_ride') || 'null')
})

onUnmounted(() => {
  if (map) map.destroy()
})
</script>

<style scoped>
.map-container {
  position: relative;
  height: 100%;
}
#amap-container {
  width: 100%;
  height: 100%;
}
.vehicle-list {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  max-height: 85vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid #e4e7ed;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
.vehicle-card {
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
}
.vehicle-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}
.vehicle-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}
.pagination {
  margin-top: 12px;
  text-align: center;
}
</style>
