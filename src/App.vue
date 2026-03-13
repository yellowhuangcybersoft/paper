<script setup>
import { ref, computed } from 'vue'
import BoardView from './components/BoardView.vue'
import ControlPanel from './components/ControlPanel.vue'
import { useBoard } from './composables/useBoard'

// 使用盤面 composable
const {
  grid,
  moveLimit,
  remainingMoves,
  history,
  toggleEnemy,
  saveInitialState,
  reset,
  rotateRing,
  slideSector,
  undo,
  clearBoard
} = useBoard()

// 編輯/操作模式
const isEditMode = ref(true)

// 選中的格子
const selectedCell = ref(null)

// 歷史記錄長度
const historyLength = computed(() => history.value.length)

// 處理格子點擊
function handleCellClick({ ring, sector }) {
  if (isEditMode.value) {
    toggleEnemy(ring, sector)
  } else {
    selectedCell.value = { ring, sector }
  }
}

// 處理旋轉
function handleRotateRing({ ring, steps }) {
  rotateRing(ring, steps)
}

// 處理滑動
function handleSlideSector({ sector, steps }) {
  slideSector(sector, steps)
}

// 處理取消
function handleUndo() {
  undo()
}

// 處理重製
function handleReset() {
  reset()
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
  selectedCell.value = null
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
        :selected-cell="selectedCell"
        :is-edit-mode="isEditMode"
        @cell-click="handleCellClick"
      />

      <ControlPanel
        :move-limit="moveLimit"
        :remaining-moves="remainingMoves"
        :history-length="historyLength"
        @update:move-limit="updateMoveLimit"
        @rotate-ring="handleRotateRing"
        @slide-sector="handleSlideSector"
        @undo="handleUndo"
        @reset="handleReset"
        @save-initial="handleSaveInitial"
        @clear-board="handleClearBoard"
        @mode-change="handleModeChange"
      />
    </main>

    <footer>
      <p>操作說明：編輯模式下點擊格子設置敵人，操作模式下可旋轉圈或滑動徑向排列敵人</p>
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
