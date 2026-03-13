<template>
  <div class="control-panel">
    <h3>控制面板</h3>
    
    <!-- 模式切換 -->
    <div class="section">
      <label class="mode-switch">
        <input type="checkbox" v-model="isEditMode" />
        <span>{{ isEditMode ? '📝 編輯模式' : '🎮 操作模式' }}</span>
      </label>
    </div>

    <!-- 編輯模式設定 -->
    <div v-if="isEditMode" class="section edit-section">
      <h4>編輯設定</h4>
      <div class="form-row">
        <label>可操作次數:</label>
        <input type="number" v-model.number="moveLimit" min="1" max="10" />
      </div>
      <div class="button-group">
        <button @click="saveInitial" class="btn btn-primary">💾 儲存初始盤面</button>
        <button @click="clearBoard" class="btn btn-danger">🗑️ 清空盤面</button>
      </div>
      <p class="hint">👆 點擊盤面上的格子來設置/移除敵人</p>
    </div>

    <!-- 操作模式設定 -->
    <div v-else class="section operation-section">
      <h4>操作設定</h4>
      
      <div class="status-bar">
        <span>剩餘操作次數: <strong>{{ remainingMoves }}</strong> / {{ moveLimit }}</span>
      </div>

      <div class="form-row">
        <label>選擇圈:</label>
        <select v-model.number="selectedRing">
          <option v-for="i in 4" :key="i" :value="i - 1">圈 {{ i }}</option>
        </select>
      </div>

      <div class="form-row">
        <label>旋轉格數:</label>
        <input type="number" v-model.number="rotateSteps" min="1" max="11" />
      </div>

      <div class="button-group">
        <button @click="rotateLeft" class="btn btn-action" :disabled="remainingMoves <= 0">
          ↺ 逆時針旋轉
        </button>
        <button @click="rotateRight" class="btn btn-action" :disabled="remainingMoves <= 0">
          ↻ 順時針旋轉
        </button>
      </div>

      <hr />

      <div class="form-row">
        <label>選擇徑向:</label>
        <select v-model.number="selectedSector">
          <option v-for="i in 12" :key="i" :value="i - 1">徑 {{ i }}</option>
        </select>
      </div>

      <div class="form-row">
        <label>滑動格數:</label>
        <input type="number" v-model.number="slideSteps" min="1" max="3" />
      </div>

      <div class="button-group">
        <button @click="slideIn" class="btn btn-action" :disabled="remainingMoves <= 0">
          ⬆️ 向內滑動
        </button>
        <button @click="slideOut" class="btn btn-action" :disabled="remainingMoves <= 0">
          ⬇️ 向外滑動
        </button>
      </div>

      <hr />

      <div class="button-group">
        <button @click="undo" class="btn btn-secondary" :disabled="historyLength === 0">
          ↩️ 取消上一步
        </button>
        <button @click="reset" class="btn btn-warning">
          🔄 重製盤面
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  moveLimit: {
    type: Number,
    required: true
  },
  remainingMoves: {
    type: Number,
    required: true
  },
  historyLength: {
    type: Number,
    required: true
  }
})

const emit = defineEmits([
  'update:moveLimit',
  'rotate-ring',
  'slide-sector',
  'undo',
  'reset',
  'save-initial',
  'clear-board',
  'mode-change'
])

// 本地狀態
const isEditMode = ref(true)
const selectedRing = ref(0)
const selectedSector = ref(0)
const rotateSteps = ref(1)
const slideSteps = ref(1)

// 雙向綁定 moveLimit
const moveLimit = computed({
  get: () => props.moveLimit,
  set: (val) => emit('update:moveLimit', val)
})

// 監聽模式變化
watch(isEditMode, (newVal) => {
  emit('mode-change', newVal)
})

// 操作方法
function rotateLeft() {
  emit('rotate-ring', { ring: selectedRing.value, steps: -rotateSteps.value })
}

function rotateRight() {
  emit('rotate-ring', { ring: selectedRing.value, steps: rotateSteps.value })
}

function slideIn() {
  emit('slide-sector', { sector: selectedSector.value, steps: -slideSteps.value })
}

function slideOut() {
  emit('slide-sector', { sector: selectedSector.value, steps: slideSteps.value })
}

function undo() {
  emit('undo')
}

function reset() {
  emit('reset')
}

function saveInitial() {
  emit('save-initial')
}

function clearBoard() {
  emit('clear-board')
}
</script>

<style scoped>
.control-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  min-width: 280px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
}

h4 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 14px;
}

.section {
  margin-bottom: 15px;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: bold;
  color: #333;
}

.mode-switch input {
  width: 20px;
  height: 20px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.form-row label {
  min-width: 80px;
  font-size: 14px;
  color: #555;
}

.form-row input,
.form-row select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #43A047;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #e53935;
}

.btn-action {
  background: #2196F3;
  color: white;
}

.btn-action:hover:not(:disabled) {
  background: #1e88e5;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #757575;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #f57c00;
}

.status-bar {
  background: #e3f2fd;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 15px;
}

.status-bar strong {
  color: #1976d2;
  font-size: 18px;
}

.hint {
  font-size: 12px;
  color: #888;
  margin-top: 10px;
  text-align: center;
}

hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 15px 0;
}
</style>
