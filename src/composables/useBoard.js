import { ref, reactive, computed } from 'vue'

// 盤面參數
export const NUM_RINGS = 4
export const NUM_SECTORS = 12

// 格子類型
export const CELL_EMPTY = null
export const CELL_ENEMY = 'enemy'
export const CELL_TARGET = 'target'

export function useBoard() {
  // 盤面: 4圈x12格，初始為 null（無敵人）
  const grid = ref(
    Array.from({ length: NUM_RINGS }, () =>
      Array.from({ length: NUM_SECTORS }, () => CELL_EMPTY)
    )
  )

  // 目標格盤面（與敵人分開）
  const targetGrid = ref(
    Array.from({ length: NUM_RINGS }, () =>
      Array.from({ length: NUM_SECTORS }, () => false)
    )
  )

  // 初始盤面（用於重製）
  const initialGrid = ref(null)
  const initialTargetGrid = ref(null)

  // 可操作次數
  const moveLimit = ref(2)

  // 已使用操作次數（只有換圈/排才計算）
  const moveCount = ref(0)

  // 當前操作的圈/排（用於判斷是否換圈/排）
  const currentOperation = ref(null) // { type: 'rotate'|'slide', index: number }

  // 操作歷史（用於取消）
  const history = ref([])

  // 剩餘操作次數
  const remainingMoves = computed(() => moveLimit.value - moveCount.value)

  // 設置敵人
  function setEnemy(ring, sector) {
    grid.value[ring][sector] = CELL_ENEMY
  }

  // 移除敵人
  function removeEnemy(ring, sector) {
    grid.value[ring][sector] = CELL_EMPTY
  }

  // 切換敵人（點擊格子用）
  function toggleEnemy(ring, sector) {
    if (grid.value[ring][sector] === CELL_EMPTY) {
      setEnemy(ring, sector)
    } else {
      removeEnemy(ring, sector)
    }
  }

  // 設置目標格
  function setTarget(ring, sector) {
    targetGrid.value[ring][sector] = true
  }

  // 移除目標格
  function removeTarget(ring, sector) {
    targetGrid.value[ring][sector] = false
  }

  // 切換目標格
  function toggleTarget(ring, sector) {
    targetGrid.value[ring][sector] = !targetGrid.value[ring][sector]
  }

  // 儲存初始盤面
  function saveInitialState() {
    initialGrid.value = JSON.parse(JSON.stringify(grid.value))
    initialTargetGrid.value = JSON.parse(JSON.stringify(targetGrid.value))
    history.value = []
    moveCount.value = 0
    currentOperation.value = null
  }

  // 重製盤面（回到初始狀態）
  function reset() {
    if (initialGrid.value) {
      grid.value = JSON.parse(JSON.stringify(initialGrid.value))
    }
    history.value = []
    moveCount.value = 0
    currentOperation.value = null
  }

  // 檢查是否需要增加步數（換圈/排時）
  function checkAndIncrementMove(type, index) {
    if (currentOperation.value === null) {
      // 第一次操作
      currentOperation.value = { type, index }
      moveCount.value++
      return true
    }
    
    if (currentOperation.value.type !== type || currentOperation.value.index !== index) {
      // 換到不同的圈或排
      if (remainingMoves.value <= 0) {
        return false // 已無剩餘操作次數
      }
      currentOperation.value = { type, index }
      moveCount.value++
    }
    return true
  }

  // 旋轉某一圈（steps > 0 順時針，< 0 逆時針）
  function rotateRing(ring, steps) {
    // 檢查是否可以操作
    if (currentOperation.value !== null && 
        (currentOperation.value.type !== 'rotate' || currentOperation.value.index !== ring) &&
        remainingMoves.value <= 0) {
      return false
    }

    const row = grid.value[ring]
    const n = row.length
    const normalizedSteps = ((steps % n) + n) % n
    const newRow = [
      ...row.slice(n - normalizedSteps),
      ...row.slice(0, n - normalizedSteps)
    ]
    
    // 檢查並更新步數
    checkAndIncrementMove('rotate', ring)
    
    // 儲存操作歷史（反向操作用於 undo）
    history.value.push({ type: 'rotate', ring, steps: -steps, wasNewMove: false })
    grid.value[ring] = newRow
    return true
  }

  // 滑動徑向（steps > 0 向外，< 0 向內）
  function slideSector(sector, steps) {
    // 檢查是否可以操作
    if (currentOperation.value !== null && 
        (currentOperation.value.type !== 'slide' || currentOperation.value.index !== sector) &&
        remainingMoves.value <= 0) {
      return false
    }

    const col = grid.value.map(row => row[sector])
    const n = col.length
    const normalizedSteps = ((steps % n) + n) % n
    const newCol = [
      ...col.slice(n - normalizedSteps),
      ...col.slice(0, n - normalizedSteps)
    ]

    // 檢查並更新步數
    checkAndIncrementMove('slide', sector)

    // 儲存操作歷史
    history.value.push({ type: 'slide', sector, steps: -steps, wasNewMove: false })
    newCol.forEach((val, r) => {
      grid.value[r][sector] = val
    })
    return true
  }

  // 取消上一步操作
  function undo() {
    if (history.value.length === 0) return false

    const lastOp = history.value.pop()

    if (lastOp.type === 'rotate') {
      const { ring, steps } = lastOp
      const row = grid.value[ring]
      const n = row.length
      const normalizedSteps = ((steps % n) + n) % n
      grid.value[ring] = [
        ...row.slice(n - normalizedSteps),
        ...row.slice(0, n - normalizedSteps)
      ]
    } else if (lastOp.type === 'slide') {
      const { sector, steps } = lastOp
      const col = grid.value.map(row => row[sector])
      const n = col.length
      const normalizedSteps = ((steps % n) + n) % n
      const newCol = [
        ...col.slice(n - normalizedSteps),
        ...col.slice(0, n - normalizedSteps)
      ]
      newCol.forEach((val, r) => {
        grid.value[r][sector] = val
      })
    }

    // 回溯當前操作狀態
    if (history.value.length === 0) {
      currentOperation.value = null
      moveCount.value = 0
    } else {
      // 找到最後一個操作，判斷當前應該在哪個圈/排
      const prevOp = history.value[history.value.length - 1]
      const prevType = prevOp.type
      const prevIndex = prevType === 'rotate' ? prevOp.ring : prevOp.sector
      
      // 重新計算步數
      let count = 0
      let lastOp = null
      for (const op of history.value) {
        const opType = op.type
        const opIndex = opType === 'rotate' ? op.ring : op.sector
        if (lastOp === null || lastOp.type !== opType || lastOp.index !== opIndex) {
          count++
          lastOp = { type: opType, index: opIndex }
        }
      }
      moveCount.value = count
      currentOperation.value = lastOp
    }
    
    return true
  }

  // 清空盤面
  function clearBoard() {
    grid.value = Array.from({ length: NUM_RINGS }, () =>
      Array.from({ length: NUM_SECTORS }, () => CELL_EMPTY)
    )
    targetGrid.value = Array.from({ length: NUM_RINGS }, () =>
      Array.from({ length: NUM_SECTORS }, () => false)
    )
    history.value = []
    moveCount.value = 0
    currentOperation.value = null
  }

  return {
    grid,
    targetGrid,
    initialGrid,
    moveLimit,
    moveCount,
    remainingMoves,
    history,
    currentOperation,
    setEnemy,
    removeEnemy,
    toggleEnemy,
    setTarget,
    removeTarget,
    toggleTarget,
    saveInitialState,
    reset,
    rotateRing,
    slideSector,
    undo,
    clearBoard
  }
}
