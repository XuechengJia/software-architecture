<template>
  <div class="complaint-view">
    <header class="cv-header">
      <h2>我要投诉</h2>
      <button class="btn-exit" @click="cancel">取消并返回</button>
    </header>

    <form class="cv-form" @submit.prevent="submitComplaint">
      <div class="row">
        <label>投诉类型 <span class="required">*</span></label>
        <select v-model="type">
          <option value="不文明用车">不文明用车</option>
          <option value="不规范停车">不规范停车</option>
        </select>
      </div>

      <div class="row">
        <label>简要说明 <span class="required">*</span></label>
        <textarea
          v-model="description"
          placeholder="请简要描述问题，越具体越好（例如：车牌/位置/时间）"
        ></textarea>
      </div>

      <div class="row">
        <label>上传照片</label>
        <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
        <div v-if="photoPreview" class="preview">
          <img :src="photoPreview" alt="照片预览" />
          <button type="button" class="btn-small" @click="removePhoto">删除照片</button>
        </div>
      </div>

      <div class="row location-row">
        <label>位置信息 <span class="required">*</span></label>
        <div class="loc-info">
          <div v-if="location" class="loc-text">
            经度: {{ location.longitude }}，纬度: {{ location.latitude }}
          </div>
          <div v-else class="hint">未获取位置信息</div>
          <div class="loc-actions">
            <button type="button" @click="getLocation">获取当前位置</button>
            <button type="button" @click="clearLocation" class="btn-small">清除位置</button>
          </div>
        </div>
      </div>

      <div class="row actions">
        <button type="submit" :disabled="isSubmitting" class="btn-primary">
          {{ isSubmitting ? '提交中...' : '提交投诉' }}
        </button>
        <button type="button" @click="cancel" class="btn-ghost">返回首页</button>
      </div>

      <div v-if="successMsg" class="msg success">{{ successMsg }}</div>
      <div v-if="errorMsg" class="msg error">{{ errorMsg }}</div>
    </form>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ComplaintView',
  data() {
    return {
      type: '',
      description: '',
      photoPreview: null,
      location: null,
      isSubmitting: false,
      successMsg: '',
      errorMsg: ''
    }
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0]
      if (file) {
        this.photoPreview = URL.createObjectURL(file)
      }
    },
    removePhoto() {
      this.photoPreview = null
      this.$refs.fileInput.value = ''
    },
    getLocation() {
      navigator.geolocation.getCurrentPosition(
          pos => {
            this.location = {
              latitude: pos.coords.latitude.toFixed(6),
              longitude: pos.coords.longitude.toFixed(6)
            }
          },
          () => {
            this.errorMsg = '无法获取位置信息，请检查定位权限'
          }
      )
    },
    clearLocation() {
      this.location = null
    },
    async submitComplaint() {
      if (!this.type || !this.description || !this.location) {
        this.errorMsg = '请填写所有必填项后再提交'
        return
      }
      this.isSubmitting = true
      this.successMsg = ''
      this.errorMsg = ''

      try {
        const formData = new FormData()
        formData.append('type', this.type)
        formData.append('description', this.description)
        formData.append('latitude', this.location.latitude)
        formData.append('longitude', this.location.longitude)

        const fileInput = this.$refs.fileInput
        if (fileInput && fileInput.files && fileInput.files[0]) {
          formData.append('photo', fileInput.files[0])
        }

        const res = await axios.post('/api/complaints', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        this.successMsg = res.data?.message || '投诉已提交，感谢您的反馈！'

        // 清空表单
        this.type = ''
        this.description = ''
        this.location = null
        this.photoPreview = null
        if (fileInput) {
          fileInput.value = ''
        }
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '投诉提交失败，请稍后重试'
      } finally {
        this.isSubmitting = false
      }
    },
    cancel() {
      this.$router.push('/')
    }
  }
}
</script>


<style scoped>
/* 整体布局 */
.complaint-view {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 顶部标题栏 */
.cv-header {
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.cv-header h2 {
  font-size: 1.6rem;
  color: #2c3e50;
  margin: 0;
}

/* 表单容器 */
.cv-form {
  background-color: #ffffff;
  width: 100%;
  max-width: 800px;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.row {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #34495e;
}

.required {
  color: #e74c3c;
}

input[type='file'],
select,
textarea,
button {
  font-size: 1rem;
}

select,
textarea {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  outline: none;
  transition: 0.2s;
}

select:focus,
textarea:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

/* 按钮样式 */
button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  transition: 0.2s;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}
.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-ghost {
  background-color: transparent;
  color: #409eff;
  border: 1px solid #409eff;
}
.btn-ghost:hover {
  background-color: #ecf5ff;
}

.btn-small {
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  background-color: #f2f6fc;
}
.btn-small:hover {
  background-color: #e5efff;
}

.btn-exit {
  background-color: #f56c6c;
  color: #fff;
  border-radius: 8px;
  padding: 0.5rem 1rem;
}
.btn-exit:hover {
  background-color: #f78989;
}

.actions {
  display: flex;
  gap: 1rem;
}

/* 图片预览 */
.preview {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.preview img {
  width: 180px;
  height: auto;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  margin-bottom: 0.5rem;
}

/* 位置部分 */
.loc-info {
  background: #f9fafc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 1rem;
}
.loc-text {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}
.hint {
  color: #909399;
}
.loc-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* 消息提示 */
.msg {
  padding: 0.8rem 1rem;
  border-radius: 8px;
  text-align: center;
  margin-top: 1rem;
  font-weight: 500;
}
.msg.success {
  background-color: #f0f9eb;
  color: #67c23a;
}
.msg.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 响应式 */
@media (max-width: 600px) {
  .cv-form {
    padding: 1.2rem;
  }
  .actions {
    flex-direction: column;
  }
}
</style>
