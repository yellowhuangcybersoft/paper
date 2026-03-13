<script setup>
import { ref, computed } from 'vue'
import BoardView from './components/BoardView.vue'
import ControlPanel from './components/ControlPanel.vue'
import { useBoard } from './composables/useBoard'

// 使用盤面 composable
const {
  grid,
  targetGrid,
  moveLimit,
  remainingMoves,
  history,
  currentOperation,
  toggleEnemy,
  toggleTarget,
  saveInitialState,
  reset,
  rotateRing,
  slideSector,
  undo,
  clearBoard
} = useBoard()

// 編輯/操作模式
const isEditMode = ref(true)

// 編輯類型 (enemy / target)
const editType = ref('enemy')

// 操作模式 (rotate / slide)
const operationMode = ref('rotate')

// 選中的圈/排
const selectedRing = ref(null)
const selectedSector = ref(null)

// 歷史記錄長度
const historyLength = computed(() => history.value.length)

// 處理格子點擊（編輯模式）
function handleCellClick({ ring, sector, editType: type }) {
  if (type === 'enemy') {
    toggleEnemy(ring, sector)
  } else {
    toggleTarget(ring, sector)
  }
}

// 處理圈選擇（操作模式）
function handleRingSelect(ring) {
  selectedRing.value = ring
}

// 處理徑向選擇（操作模式）
function handleSectorSelect(sector) {
  selectedSector.value = sector
}

// 處理旋轉
function handleRotateRing({ ring, steps }) {
  if (ring !== null) {
    rotateRing(ring, steps)
  }
}

// 處理滑動
function handleSlideSector({ sector, steps }) {
  if (sector !== null) {
    slideSector(sector, steps)
  }
}

// 處理取消
function handleUndo() {
  undo()
}

// 處理重製
function handleReset() {
  reset()
  selectedRing.value = null
  selectedSector.value = null
}

// 處理儲存初始
function handleSaveInitial() {
  saveInitialState()
  alert('已儲存初始盤面！')
}

// 處理清空
function handleClearBoard() {
  if (confirm('確定要清空盤面嗎？')) {
    clearBoard()
  }
}

// 處理模式變化
function handleModeChange(editMode) {
  isEditMode.value = editMode
  // 切換到操作模式時重置選擇
  if (!editMode) {
    selectedRing.value = null
    selectedSector.value = null
  }
}

// 處理編輯類型變化
function handleEditTypeChange(type) {
  editType.value = type
}

// 處理操作模式變化
function handleOperationModeChange(mode) {
  operationMode.value = mode
  // 切換操作模式時重置選擇
  selectedRing.value = null
  selectedSector.value = null
}

// 更新操作次數上限
function updateMoveLimit(val) {
  moveLimit.value = val
}
</script>

<template>
  <div class="app">
    <header>
      <h1>🎮 紙片馬力歐 摺紙國王 戰鬥模擬器</h1>
      <p>4圈 x 12格 環狀轉盤戰鬥系統</p>
    </header>

    <main>
      <BoardView
        :grid="grid"
        :target-grid="targetGrid"
        :selected-ring="selectedRing"
        :selected-sector="selectedSector"
        :operation-mode="operationMode"
        :is-edit-mode="isEditMode"
        :edit-type="editType"
        @cell-click="handleCellClick"
        @ring-select="handleRingSelect"
        @sector-select="handleSectorSelect"
      />

      <ControlPanel
        :move-limit="moveLimit"
        :remaining-moves="remainingMoves"
        :history-length="historyLength"
        :current-operation="currentOperation"
        :selected-ring="selectedRing"
        :selected-sector="selectedSector"
        @update:move-limit="updateMoveLimit"
        @rotate-ring="handleRotateRing"
        @slide-sector="handleSlideSector"
        @undo="handleUndo"
        @reset="handleReset"
        @save-initial="handleSaveInitial"
        @clear-board="handleClearBoard"
        @mode-change="handleModeChange"
        @edit-type-change="handleEditTypeChange"
        @operation-mode-change="handleOperationModeChange"
      />
    </main>

    <footer>
      <p>
        <strong>編輯模式：</strong>點擊格子設置敵人(👾)或目標(⭐) | 
        <strong>操作模式：</strong>點擊選擇圈/排，然後旋轉或滑動
      </p>
      <p><small>同一圈/排可無限操作，換到別圈/排才算一步</small></p>
    </footer>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

header h1 {
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 10px;
}

header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

main {
  display: flex;
  gap: 30px;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
}

footer {
  text-align: center;
  color: white;
  margin-top: 30px;
  opacity: 0.8;
  font-size: 14px;
}
</style>
