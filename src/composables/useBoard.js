import { ref, reactive, computed } from 'vue'

// 盤面參數
export const NUM_RINGS = 4
export const NUM_SECTORS = 12

export function useBoard() {
  // 盤面: 4圈x12格，初始為 null（無敵人）
  const grid = ref(
    Array.from({ length: NUM_RINGS }, () =>
      Array.from({ length: NUM_SECTORS }, () => null)
    )
  )

  // 初始盤面（用於重製）
  const initialGrid = ref(null)

  // 可操作次數
  const moveLimit = ref(2)

  // 已使用操作次數
  const moveCount = ref(0)

  // 操作歷史（用於取消）
  const history = ref([])

  // 剩餘操作次數
  const remainingMoves = computed(() => moveLimit.value - moveCount.value)

  // 設置敵人
  function setEnemy(ring, sector, enemyId = 1) {
    grid.value[ring][sector] = enemyId
  }

  // 移除敵人
  function removeEnemy(ring, sector) {
    grid.value[ring][sector] = null
  }

  // 切換敵人（點擊格子用）
  function toggleEnemy(ring, sector) {
    if (grid.value[ring][sector] === null) {
      setEnemy(ring, sector, 1)
    } else {
      removeEnemy(ring, sector)
    }
  }

  // 儲存初始盤面
  function saveInitialState() {
    initialGrid.value = JSON.parse(JSON.stringify(grid.value))
    history.value = []
    moveCount.value = 0
  }

  // 重製盤面（回到初始狀態）
  function reset() {
    if (initialGrid.value) {
      grid.value = JSON.parse(JSON.stringify(initialGrid.value))
      history.value = []
      moveCount.value = 0
    }
  }

  // 旋轉某一圈（steps > 0 順時針，< 0 逆時針）
  function rotateRing(ring, steps) {
    if (remainingMoves.value <= 0) return false

    const row = grid.value[ring]
    const n = row.length
    const normalizedSteps = ((steps % n) + n) % n
    const newRow = [
      ...row.slice(n - normalizedSteps),
      ...row.slice(0, n - normalizedSteps)
    ]
    
    // 儲存操作歷史（反向操作用於 undo）
    history.value.push({ type: 'rotate', ring, steps: -steps })
    grid.value[ring] = newRow
    moveCount.value++
    return true
  }

  // 滑動徑向（steps > 0 向外，< 0 向內）
  function slideSector(sector, steps) {
    if (remainingMoves.value <= 0) return false

    const col = grid.value.map(row => row[sector])
    const n = col.length
    const normalizedSteps = ((steps % n) + n) % n
    const newCol = [
      ...col.slice(n - normalizedSteps),
      ...col.slice(0, n - normalizedSteps)
    ]

    // 儲存操作歷史
    history.value.push({ type: 'slide', sector, steps: -steps })
    newCol.forEach((val, r) => {
      grid.value[r][sector] = val
    })
    moveCount.value++
    return true
  }

  // 取消上一步操作
  function undo() {
    if (history.value.length === 0) return false

    const lastOp = history.value.pop()
    moveCount.value--

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
    return true
  }

  // 清空盤面
  function clearBoard() {
    grid.value = Array.from({ length: NUM_RINGS }, () =>
      Array.from({ length: NUM_SECTORS }, () => null)
    )
    history.value = []
    moveCount.value = 0
  }

  return {
    grid,
    initialGrid,
    moveLimit,
    moveCount,
    remainingMoves,
    history,
    setEnemy,
    removeEnemy,
    toggleEnemy,
    saveInitialState,
    reset,
    rotateRing,
    slideSector,
    undo,
    clearBoard
  }
}
