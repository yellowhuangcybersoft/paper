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
  clearBoard,
  findBestSolution
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

// 解法相關
const solution = ref(null)
const isSolving = ref(false)

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
  isEditMode.value = false
  selectedRing.value = null
  selectedSector.value = null
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

// 尋找最佳解法
function handleFindSolution() {
  isSolving.value = true
  solution.value = null
  
  // 使用 setTimeout 讓 UI 有機會更新
  setTimeout(() => {
    const result = findBestSolution()
    solution.value = result
    isSolving.value = false
  }, 50)
}

// 關閉解法視窗
function handleCloseSolution() {
  solution.value = null
}
</script>

<template>
  <div class="app">
    <header>
      <h1>🎮 紙片馬力歐 摺紙國王 戰鬥模擬器</h1>
      <div class="header-info-row">
        <p>4圈 x 12格 環狀轉盤戰鬥系統</p>
        <span v-if="!isEditMode" class="move-info">步數: {{ remainingMoves }} / {{ moveLimit }}</span>
      </div>
    </header>
<style>
.header-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.2em;
  margin-bottom: 0.5em;
}
.move-info {
  color: #1976d2;
  font-weight: bold;
  font-size: 1.1em;
  background: #fff;
  border-radius: 8px;
  padding: 2px 12px;
  box-shadow: 0 1px 4px #0001;
}
@media (max-width: 600px) {
  .move-info {
    font-size: 1em;
    padding: 2px 8px;
  }
}
</style>

    <main>
      <BoardView
        :grid="grid"
        :target-grid="targetGrid"
        :selected-ring="selectedRing"
        :selected-sector="selectedSector"
        :operation-mode="operationMode"
        :is-edit-mode="isEditMode"
        :edit-type="editType"
        :remaining-moves="remainingMoves"
        :move-limit="moveLimit"
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
        :is-edit-mode="isEditMode"
        :solution="solution"
        :is-solving="isSolving"
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
        @find-solution="handleFindSolution"
        @close-solution="handleCloseSolution"
      />
    </main>

    <footer class="desktop-only">
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
  margin-bottom: 20px;
}

header h1 {
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}

header p {
  font-size: 1rem;
  opacity: 0.9;
}

main {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
}

footer {
  text-align: center;
  color: white;
  margin-top: 20px;
  opacity: 0.8;
  font-size: 13px;
}

/* 手機板 RWD */
@media (max-width: 768px) {
  .app {
    padding: 8px;
  }
  
  header {
    margin-bottom: 8px;
  }
  
  header h1 {
    font-size: 1.2rem;
  }
  
  header p {
    font-size: 0.75rem;
  }
  
  main {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .desktop-only {
    display: none;
  }
}
</style>
