<template>
  <div class="control-panel">
    <!-- 模式切換 - 左右開關按鈕 -->
    <div class="mode-toggle-container">
      <button 
        :class="['mode-toggle-btn', 'left', isEditMode ? 'active' : '']"
        @click="setEditMode(true)"
      >
        📝 編輯模式
      </button>
      <button 
        :class="['mode-toggle-btn', 'right', !isEditMode ? 'active' : '']"
        @click="setEditMode(false)"
      >
        🎮 操作模式
      </button>
    </div>

    <!-- 編輯模式設定 -->
    <div v-if="isEditMode" class="section edit-section">
      <!-- 編輯類型切換 -->
      <div class="segmented-control">
        <button 
          :class="['segment-btn', editType === 'enemy' ? 'active' : '']"
          @click="setEditType('enemy')"
        >
          👾 設置敵人
        </button>
        <button 
          :class="['segment-btn', editType === 'target' ? 'active' : '']"
          @click="setEditType('target')"
        >
          ⭐ 設置目標
        </button>
      </div>
      
      <div class="step-row">
        <label>步數:</label>
        <div class="segmented-control compact step-control">
          <button 
            :class="['segment-btn', moveLimit === 2 ? 'active' : '']"
            @click="emit('update:moveLimit', 2)"
          >
            2步
          </button>
          <button 
            :class="['segment-btn', moveLimit === 3 ? 'active' : '']"
            @click="emit('update:moveLimit', 3)"
          >
            3步
          </button>
        </div>
        <button @click="clearBoard" class="btn btn-danger btn-clear">🗑️ 清空</button>
      </div>
      <p class="hint desktop-only">👆 點擊盤面上的格子來設置/移除{{ editType === 'enemy' ? '敵人' : '目標' }}</p>
    </div>

    <!-- 操作模式設定 -->
    <div v-else class="section operation-section">
      <!-- 操作模式切換 -->
      <div class="operation-row">
        <div class="segmented-control compact mode-switch">
          <button :class="['segment-btn', operationMode === 'rotate' ? 'active' : '']" @click="setOperationMode('rotate')">
            🔄 旋轉
          </button>
          <button :class="['segment-btn', operationMode === 'slide' ? 'active' : '']" @click="setOperationMode('slide')">
            ↔️ 滑動
          </button>
        </div>
        <div class="direction-btns">
          <template v-if="operationMode === 'rotate'">
            <button @click="rotateLeft" class="btn btn-action" :disabled="selectedRing === null">↺ 逆旋</button>
            <button @click="rotateRight" class="btn btn-action" :disabled="selectedRing === null">↻ 順旋</button>
          </template>
          <template v-else>
            <button @click="slideLeft" class="btn btn-action-green" :disabled="selectedSector === null">⬅ 左滑</button>
            <button @click="slideRight" class="btn btn-action-green" :disabled="selectedSector === null">➡ 右滑</button>
          </template>
        </div>
      </div>

      <div class="button-group">
        <button @click="undo" class="btn btn-secondary" :disabled="historyLength === 0">
          ↩️ 取消此步
        </button>
        <button @click="reset" class="btn btn-warning">
          🔄 重來
        </button>
      </div>

      <hr />

      <!-- 操作紀錄與最佳解法區域 - 左右分欄 -->
      <div class="history-solution-container">
        <!-- 左側：使用者操作紀錄 -->
        <div class="user-history-panel">
          <h4>📝 你的操作</h4>
          <div v-if="userHistory.length > 0" class="history-steps">
            <div 
              v-for="(op, index) in userHistory" 
              :key="index" 
              class="step-item user-step"
            >
              <span class="step-number">{{ index + 1 }}.</span>
              <span class="step-label">{{ op.label }}</span>
            </div>
          </div>
          <p v-else class="empty-hint">尚未操作</p>
        </div>

        <!-- 右側：最佳解法 -->
        <div class="solution-area">
          <div class="solution-title-row">
            <h4>💡 最佳解法</h4>
            <div class="solution-btns">
              <button 
                @click="findSolution" 
                class="btn btn-solution-sm" 
                :disabled="isSolving || isPlayingSolution"
              >
                {{ isSolving ? '搜尋中...' : (isPlayingSolution ? '播放中...' : '🔍 尋找') }}
              </button>
              <button 
                v-if="solution && solution.success"
                @click="replaySolution" 
                class="btn btn-replay-sm"
                :disabled="isPlayingSolution"
              >
                🔄
              </button>
            </div>
          </div>

          <!-- 解法顯示區域 -->
          <div v-if="solution" class="solution-result">
            <div class="solution-header">
              <span>{{ solution.success ? '✅' : '❌ 無解' }}</span>
              <button class="close-btn" @click="closeSolution">✕</button>
            </div>
            <div v-if="solution.success && solution.operations.length > 0" class="solution-steps">
              <div 
                v-for="(op, index) in solution.operations" 
                :key="index" 
                class="step-item"
              >
                <span class="step-number">{{ index + 1 }}.</span>
                <span class="step-label">{{ op.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getSlideLineLabel } from '../composables/useBoard'

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
  },
  currentOperation: {
    type: Object,
    default: null
  },
  selectedRing: {
    type: Number,
    default: null
  },
  selectedSector: {
    type: Number,
    default: null
  },
  isEditMode: {
    type: Boolean,
    default: true
  },
  solution: {
    type: Object,
    default: null
  },
  isSolving: {
    type: Boolean,
    default: false
  },
  isPlayingSolution: {
    type: Boolean,
    default: false
  },
  userHistory: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:moveLimit',
  'rotate-ring',
  'slide-sector',
  'undo',
  'reset',
  'clear-board',
  'mode-change',
  'edit-type-change',
  'operation-mode-change',
  'find-solution',
  'close-solution',
  'replay-solution'
])

// 本地狀態
const editType = ref('enemy') // 'enemy' or 'target'
const operationMode = ref('rotate') // 'rotate' or 'slide'

// 雙向綁定 moveLimit
const moveLimit = computed({
  get: () => props.moveLimit,
  set: (val) => emit('update:moveLimit', val)
})

// 設置編輯模式
function setEditMode(mode) {
  emit('mode-change', mode)
}

// 設置編輯類型
function setEditType(type) {
  editType.value = type
  emit('edit-type-change', type)
}

// 設置操作模式
function setOperationMode(mode) {
  operationMode.value = mode
  emit('operation-mode-change', mode)
}

// 操作方法
function rotateLeft() {
  emit('rotate-ring', { ring: props.selectedRing, steps: -1 })
}

function rotateRight() {
  emit('rotate-ring', { ring: props.selectedRing, steps: 1 })
}

function slideLeft() {
  emit('slide-sector', { sector: props.selectedSector, steps: -1 })
}

function slideRight() {
  emit('slide-sector', { sector: props.selectedSector, steps: 1 })
}

function undo() {
  emit('undo')
}

function reset() {
  emit('reset')
}

function clearBoard() {
  emit('clear-board')
}

function findSolution() {
  emit('find-solution')
}

function closeSolution() {
  emit('close-solution')
}

function replaySolution() {
  emit('replay-solution')
}
</script>

<style scoped>
.control-panel {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 模式切換按鈕 */
.mode-toggle-container {
  display: flex;
  background: #e9ecef;
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 12px;
}

.mode-toggle-btn {
  flex: 1;
  padding: 8px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  color: #666;
  transition: all 0.3s ease;
}

.mode-toggle-btn.left {
  border-radius: 8px 0 0 8px;
}

.mode-toggle-btn.right {
  border-radius: 0 8px 8px 0;
}

.mode-toggle-btn.active {
  background: #fff;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.mode-toggle-btn:not(.active):hover {
  background: rgba(255, 255, 255, 0.5);
}

h4 {
  margin: 0 0 6px 0;
  color: #555;
  font-size: 13px;
}

.section {
  margin-bottom: 8px;
}

/* Segmented Control 開關樣式 */
.segmented-control {
  display: flex;
  background: #e9ecef;
  border-radius: 8px;
  padding: 2px;
  margin-bottom: 10px;
}

.segmented-control.compact {
  margin-bottom: 0;
  flex: 1;
}

.segment-btn {
  flex: 1;
  padding: 6px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.segment-btn.active {
  background: #fff;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.segment-btn:not(.active):hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 步數行：標籤 + 開關 + 清空按鈕 */
.step-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.step-row label {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}

.step-control {
  flex: 1;
}

.btn-clear {
  padding: 6px 10px !important;
  flex: none;
  white-space: nowrap;
}

/* 操作行：開關 + 方向按鈕 */
.operation-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.mode-switch {
  flex: 1;
  min-width: 0;
}

.direction-btns {
  display: flex;
  gap: 4px;
  flex: 1;
}

.direction-btns .btn {
  flex: 1;
  padding: 6px 8px;
  font-size: 12px;
  white-space: nowrap;
}

.btn-sm {
  padding: 6px 12px !important;
  font-size: 16px !important;
  min-width: 40px;
}

/* 解法標題行 */
.solution-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.solution-title-row h4 {
  margin: 0;
}

.solution-btns {
  display: flex;
  gap: 4px;
}

.btn-replay-sm {
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: #ff9800;
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-replay-sm:hover:not(:disabled) {
  background: #f57c00;
}

.btn-replay-sm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-solution-sm {
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-solution-sm:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-solution-sm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.edit-type-toggle,
.operation-mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.toggle-btn {
  flex: 1;
  padding: 6px 8px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
}

.toggle-btn:hover {
  border-color: #aaa;
}

.toggle-btn.active {
  border-color: #2196F3;
  background: #e3f2fd;
  color: #1976d2;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.form-row label {
  min-width: 40px;
  font-size: 13px;
  color: #555;
}

.form-row input,
.form-row select {
  flex: 1;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

/* 滑桿樣式 */
.slider-row {
  gap: 10px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
  color: #667eea;
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.button-group.vertical {
  flex-direction: column;
}

.btn {
  flex: 1;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
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

.btn-action-green {
  background: #4CAF50;
  color: white;
}

.btn-action-green:hover:not(:disabled) {
  background: #43A047;
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

.status-bar small {
  color: #666;
}

.selection-info {
  background: #fff3e0;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 15px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-info strong {
  color: #e65100;
}

.hint-text {
  color: #888;
  font-size: 13px;
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
  margin: 12px 0;
}

/* 解法按鈕 */
.btn-solution {
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 15px;
}

.btn-solution:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-solution:disabled {
  opacity: 0.7;
}

.close-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
}

.close-btn:hover {
  color: #333;
}

.solution-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}

.solution-steps {
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.step-number {
  font-weight: bold;
  color: #667eea;
  margin-right: 8px;
  min-width: 20px;
}

.step-label {
  color: #333;
}

/* 操作紀錄與解法左右分欄 */
.history-solution-container {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.user-history-panel,
.solution-area {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  min-height: 120px;
}

.user-history-panel h4,
.solution-area h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #555;
}

.history-steps {
  max-height: 150px;
  overflow-y: auto;
}

.history-steps .step-item {
  margin-bottom: 4px;
}

.user-step {
  background: #e8f5e9 !important;
}

.user-step .step-number {
  color: #43A047 !important;
}

.empty-hint {
  color: #999;
  font-size: 12px;
  text-align: center;
  margin: 20px 0;
}

.solution-result {
  border-top: 1px solid #eee;
  padding-top: 8px;
  margin-top: 6px;
}

.solution-result .solution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: bold;
}

.solution-result .solution-steps {
  max-height: 100px;
  overflow-y: auto;
}

.solution-result .step-item {
  padding: 4px 6px;
  font-size: 12px;
  margin-bottom: 3px;
}

/* 手機板 RWD */
@media (max-width: 768px) {
  .history-solution-container {
    gap: 6px;
  }
  
  .user-history-panel,
  .solution-area {
    min-height: 100px;
    padding: 6px;
  }
  
  .user-history-panel h4,
  .solution-area h4 {
    font-size: 11px;
    margin-bottom: 4px;
  }
  
  .history-steps,
  .solution-result .solution-steps {
    max-height: 80px;
  }
  
  .history-steps .step-item,
  .solution-result .step-item {
    padding: 2px 4px;
    font-size: 10px;
    margin-bottom: 2px;
  }
  
  .solution-title-row {
    gap: 4px;
  }
  
  .solution-btns {
    gap: 3px;
  }
  
  .btn-solution-sm,
  .btn-replay-sm {
    padding: 3px 6px;
    font-size: 10px;
  }
  
  .solution-result .solution-header {
    font-size: 11px;
  }
  
  .empty-hint {
    font-size: 10px;
    margin: 10px 0;
  }
  
  .operation-row {
    gap: 6px;
  }
  
  .direction-btns {
    gap: 3px;
  }
  
  .direction-btns .btn {
    padding: 5px 6px;
    font-size: 11px;
  }
  
  .mode-switch .segment-btn {
    padding: 5px 4px;
    font-size: 10px;
  }

  .control-panel {
    min-width: auto;
    width: 100%;
    max-width: 400px;
    padding: 10px;
  }
  
  .mode-toggle-container {
    margin-bottom: 10px;
  }
  
  .mode-toggle-btn {
    padding: 8px 4px;
    font-size: 12px;
  }
  
  h4 {
    font-size: 12px;
    margin-bottom: 6px;
  }
  
  .section {
    margin-bottom: 8px;
  }
  
  .segmented-control:not(.compact) {
    margin-bottom: 8px;
  }
  
  .segment-btn {
    padding: 5px 4px;
    font-size: 11px;
  }
  
  .toggle-btn {
    padding: 6px 4px;
    font-size: 11px;
  }
  
  .btn {
    padding: 5px 6px;
    font-size: 11px;
  }
  
  .status-bar {
    padding: 6px;
    margin-bottom: 8px;
    font-size: 12px;
  }
  
  .status-bar strong {
    font-size: 14px;
  }
  
  .selection-info {
    padding: 6px;
    margin-bottom: 8px;
    min-height: 32px;
    font-size: 11px;
  }
  
  .button-group {
    gap: 6px;
  }
  
  .desktop-only {
    display: none;
  }
  
  hr {
    margin: 8px 0;
  }
  
  .btn-solution {
    padding: 10px;
    font-size: 13px;
  }
  
  .solution-steps {
    max-height: 120px;
  }
  
  .step-item {
    padding: 4px 6px;
    font-size: 11px;
    margin-bottom: 4px;
  }
}
</style>
