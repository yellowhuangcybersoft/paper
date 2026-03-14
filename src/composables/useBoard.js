import { ref, reactive, computed } from 'vue'

// 盤面參數
export const NUM_RINGS = 4
export const NUM_SECTORS = 12

// 格子類型
export const CELL_EMPTY = null
export const CELL_ENEMY = 'enemy'
export const CELL_TARGET = 'target'

// 將 sector 索引轉換為時鐘位置標籤（sector 0 對應 1點位置）
export function getSectorClockLabel(sector) {
  const clock = ((sector + 1) % 12) || 12
  return `${clock}點`
}

// 取得滑動線的標籤 (如 "1-7點線")
export function getSlideLineLabel(sector) {
  const oppositeSector = (sector + 6) % 12
  const clock1 = ((sector + 1) % 12) || 12
  const clock2 = ((oppositeSector + 1) % 12) || 12
  return `${clock1}-${clock2}點線`
}

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
  const moveLimit = ref(3)

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
      // 逐格重置以確保響應式更新
      for (let r = 0; r < NUM_RINGS; r++) {
        for (let s = 0; s < NUM_SECTORS; s++) {
          grid.value[r][s] = initialGrid.value[r][s]
        }
      }
    }
    if (initialTargetGrid.value) {
      for (let r = 0; r < NUM_RINGS; r++) {
        for (let s = 0; s < NUM_SECTORS; s++) {
          targetGrid.value[r][s] = initialTargetGrid.value[r][s]
        }
      }
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

  // 滑動徑向（徑sector和對角徑oppositeSector組成一條8格直線，整條線一起滑動）
  // 順序：sector圈4→圈1（外到內），oppositeSector圈1→圈4（內到外）
  function slideSector(sector, steps) {
    // 計算對角線徑向
    const oppositeSector = (sector + 6) % NUM_SECTORS
    
    // 使用較小的 sector 作為操作索引（確保徑1和徑7視為同一操作）
    const operationIndex = Math.min(sector, oppositeSector)
    
    // 檢查是否可以操作
    if (currentOperation.value !== null && 
        (currentOperation.value.type !== 'slide' || currentOperation.value.index !== operationIndex) &&
        remainingMoves.value <= 0) {
      return false
    }

    // 組成8格的線性陣列（穿過圓心的直線）
    // sector從外到內（圈4→圈1，即索引3→0）
    // oppositeSector從內到外（圈1→圈4，即索引0→3）
    const line = []
    for (let r = NUM_RINGS - 1; r >= 0; r--) {
      line.push({ ring: r, sector: sector })
    }
    for (let r = 0; r < NUM_RINGS; r++) {
      line.push({ ring: r, sector: oppositeSector })
    }
    
    // 提取當前值
    const values = line.map(cell => grid.value[cell.ring][cell.sector])
    
    // 旋轉陣列（8格為一個環）
    const n = values.length // 8
    const normalizedSteps = ((steps % n) + n) % n
    const newValues = [
      ...values.slice(n - normalizedSteps),
      ...values.slice(0, n - normalizedSteps)
    ]

    // 檢查並更新步數
    checkAndIncrementMove('slide', operationIndex)

    // 儲存操作歷史
    history.value.push({ type: 'slide', sector, oppositeSector, steps: -steps, wasNewMove: false })
    
    // 更新盤面
    for (let i = 0; i < line.length; i++) {
      grid.value[line[i].ring][line[i].sector] = newValues[i]
    }
    return true
  }

  // 取消上一步操作（整個步驟 - 同一圈/排的所有操作）
  function undo() {
    if (history.value.length === 0) return false

    // 找出當前步驟的所有操作（同一 type 和 index）
    const lastOp = history.value[history.value.length - 1]
    const lastType = lastOp.type
    const lastIndex = lastType === 'rotate' ? lastOp.ring : Math.min(lastOp.sector, lastOp.oppositeSector)
    
    // 收集屬於同一步驟的所有操作
    const opsToUndo = []
    while (history.value.length > 0) {
      const op = history.value[history.value.length - 1]
      const opType = op.type
      const opIndex = opType === 'rotate' ? op.ring : Math.min(op.sector, op.oppositeSector)
      
      if (opType === lastType && opIndex === lastIndex) {
        opsToUndo.push(history.value.pop())
      } else {
        break
      }
    }
    
    // 反向執行所有操作
    for (const op of opsToUndo) {
      if (op.type === 'rotate') {
        const { ring, steps } = op
        const row = grid.value[ring]
        const n = row.length
        const normalizedSteps = ((steps % n) + n) % n
        grid.value[ring] = [
          ...row.slice(n - normalizedSteps),
          ...row.slice(0, n - normalizedSteps)
        ]
      } else if (op.type === 'slide') {
        const { sector, oppositeSector, steps } = op
        
        const line = []
        for (let r = NUM_RINGS - 1; r >= 0; r--) {
          line.push({ ring: r, sector: sector })
        }
        for (let r = 0; r < NUM_RINGS; r++) {
          line.push({ ring: r, sector: oppositeSector })
        }
        
        const values = line.map(cell => grid.value[cell.ring][cell.sector])
        const n = values.length
        const normalizedSteps = ((steps % n) + n) % n
        const newValues = [
          ...values.slice(n - normalizedSteps),
          ...values.slice(0, n - normalizedSteps)
        ]
        
        for (let i = 0; i < line.length; i++) {
          grid.value[line[i].ring][line[i].sector] = newValues[i]
        }
      }
    }

    // 回溯當前操作狀態
    if (history.value.length === 0) {
      currentOperation.value = null
      moveCount.value = 0
    } else {
      // 重新計算步數
      let count = 0
      let prevOp = null
      for (const op of history.value) {
        const opType = op.type
        const opIndex = opType === 'rotate' ? op.ring : Math.min(op.sector, op.oppositeSector)
        if (prevOp === null || prevOp.type !== opType || prevOp.index !== opIndex) {
          count++
          prevOp = { type: opType, index: opIndex }
        }
      }
      moveCount.value = count
      currentOperation.value = prevOp
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

  // 獲取盤面狀態的字串表示（用於狀態比較）
  function getGridState(g) {
    return JSON.stringify(g)
  }

  // 檢查是否達成目標（所有敵人都在目標格內）
  function checkWin(g, tg) {
    // 找出所有敵人位置
    const enemies = []
    for (let r = 0; r < NUM_RINGS; r++) {
      for (let s = 0; s < NUM_SECTORS; s++) {
        if (g[r][s] === CELL_ENEMY) {
          enemies.push({ ring: r, sector: s })
        }
      }
    }
    
    // 檢查是否有敵人
    if (enemies.length === 0) return false
    
    // 檢查所有敵人是否都在目標格內
    return enemies.every(e => tg[e.ring][e.sector])
  }

  // 模擬旋轉操作（不影響實際盤面）
  function simulateRotate(g, ring, steps) {
    const newGrid = g.map(row => [...row])
    const row = newGrid[ring]
    const n = row.length
    const normalizedSteps = ((steps % n) + n) % n
    newGrid[ring] = [
      ...row.slice(n - normalizedSteps),
      ...row.slice(0, n - normalizedSteps)
    ]
    return newGrid
  }

  // 模擬滑動操作（不影響實際盤面）
  function simulateSlide(g, sector, steps) {
    const newGrid = g.map(row => [...row])
    const oppositeSector = (sector + 6) % NUM_SECTORS
    
    // 組成8格的線性陣列
    const line = []
    for (let r = NUM_RINGS - 1; r >= 0; r--) {
      line.push({ ring: r, sector: sector })
    }
    for (let r = 0; r < NUM_RINGS; r++) {
      line.push({ ring: r, sector: oppositeSector })
    }
    
    // 提取當前值
    const values = line.map(cell => newGrid[cell.ring][cell.sector])
    
    // 旋轉陣列
    const n = values.length
    const normalizedSteps = ((steps % n) + n) % n
    const newValues = [
      ...values.slice(n - normalizedSteps),
      ...values.slice(0, n - normalizedSteps)
    ]
    
    // 更新盤面
    for (let i = 0; i < line.length; i++) {
      newGrid[line[i].ring][line[i].sector] = newValues[i]
    }
    return newGrid
  }

  // 計算操作步數（換圈/排才算一步）
  function calculateMoveCount(operations) {
    if (operations.length === 0) return 0
    
    let count = 1
    let lastOp = operations[0]
    
    for (let i = 1; i < operations.length; i++) {
      const op = operations[i]
      const lastIndex = lastOp.type === 'slide' 
        ? Math.min(lastOp.index, (lastOp.index + 6) % NUM_SECTORS)
        : lastOp.index
      const currentIndex = op.type === 'slide'
        ? Math.min(op.index, (op.index + 6) % NUM_SECTORS)
        : op.index
      
      if (lastOp.type !== op.type || lastIndex !== currentIndex) {
        count++
        lastOp = op
      }
    }
    return count
  }

  // 合併連續同組操作並生成帶 xN 的標籤（使用淨移動量）
  function mergeOperations(operations) {
    if (operations.length === 0) return []
    
    const merged = []
    let currentGroup = null
    
    for (const op of operations) {
      const opIndex = op.type === 'slide'
        ? Math.min(op.index, (op.index + 6) % NUM_SECTORS)
        : op.index
      
      if (currentGroup && currentGroup.type === op.type && currentGroup.opIndex === opIndex) {
        // 同組操作，累加淨移動量（帶符號）
        currentGroup.netSteps += op.steps
      } else {
        // 新組操作
        if (currentGroup) {
          merged.push(currentGroup)
        }
        currentGroup = {
          type: op.type,
          index: op.index,
          opIndex,
          netSteps: op.steps
        }
      }
    }
    
    if (currentGroup) {
      merged.push(currentGroup)
    }
    
    // 生成標籤
    return merged.map(group => {
      let label
      const absSteps = Math.abs(group.netSteps)
      
      if (group.netSteps === 0) {
        // 淨移動量為0（已歸位）
        if (group.type === 'rotate') {
          label = `圈${group.index + 1} (已歸位)`
        } else {
          const lineLabel = getSlideLineLabel(group.index)
          label = `${lineLabel} (已歸位)`
        }
      } else if (group.type === 'rotate') {
        const direction = group.netSteps > 0 ? '↻ 順旋' : '↺ 逆旋'
        label = `圈${group.index + 1} ${direction}` + (absSteps > 1 ? ` x${absSteps}` : '')
      } else {
        const lineLabel = getSlideLineLabel(group.index)
        const direction = group.netSteps > 0 ? '➡️ 右滑' : '⬅️ 左滑'
        label = `${lineLabel} ${direction}` + (absSteps > 1 ? ` x${absSteps}` : '')
      }
      
      return { ...group, label }
    })
  }

  // 檢查是否所有敵人都達成 2x2（圈1圈2相鄰兩格）或 1x4（同一側4格）陣型
  function checkAligned(g) {
    // 收集所有敵人位置
    const enemies = new Set()
    for (let r = 0; r < NUM_RINGS; r++) {
      for (let s = 0; s < NUM_SECTORS; s++) {
        if (g[r][s] === CELL_ENEMY) {
          enemies.add(`${r},${s}`)
        }
      }
    }
    if (enemies.size === 0) return false
    
    // 收集所有被陣型覆蓋的敵人
    const covered = new Set()
    
    // 檢查所有 2x2 陣型：圈0和圈1（內圈1、2），相鄰兩個 sector
    for (let s = 0; s < NUM_SECTORS; s++) {
      const nextS = (s + 1) % NUM_SECTORS
      const positions = [
        `0,${s}`, `0,${nextS}`,
        `1,${s}`, `1,${nextS}`
      ]
      // 檢查這 4 個位置是否都有敵人
      if (positions.every(p => enemies.has(p))) {
        positions.forEach(p => covered.add(p))
      }
    }
    
    // 檢查所有 1x4 陣型：同一 sector 上 4 個圈都有敵人
    for (let s = 0; s < NUM_SECTORS; s++) {
      const positions = [`0,${s}`, `1,${s}`, `2,${s}`, `3,${s}`]
      if (positions.every(p => enemies.has(p))) {
        positions.forEach(p => covered.add(p))
      }
    }
    
    // 所有敵人都必須被陣型覆蓋
    return enemies.size > 0 && [...enemies].every(e => covered.has(e))
  }

  // BFS 求解最佳解法
  function findBestSolution(maxMoves = null) {
    const startGrid = initialGrid.value ? JSON.parse(JSON.stringify(initialGrid.value)) : JSON.parse(JSON.stringify(grid.value))
    const tg = initialTargetGrid.value ? JSON.parse(JSON.stringify(initialTargetGrid.value)) : JSON.parse(JSON.stringify(targetGrid.value))
    const limit = maxMoves ?? moveLimit.value
    
    // 檢查是否有敵人和目標
    let hasEnemy = false
    let hasTarget = false
    for (let r = 0; r < NUM_RINGS; r++) {
      for (let s = 0; s < NUM_SECTORS; s++) {
        if (startGrid[r][s] === CELL_ENEMY) hasEnemy = true
        if (tg[r][s]) hasTarget = true
      }
    }
    
    if (!hasEnemy) {
      return { success: false, operations: [], message: '請先設置敵人！' }
    }
    
    // 決定使用哪種勝利條件
    const useAlignMode = !hasTarget
    
    // 檢查是否已達成
    if (useAlignMode) {
      if (checkAligned(startGrid)) {
        return { success: true, operations: [], message: '敵人已對齊！' }
      }
    } else {
      if (checkWin(startGrid, tg)) {
        return { success: true, operations: [], message: '已達成目標！' }
      }
    }
    
    // BFS 狀態: { grid, operations, lastOp }
    const queue = [{ grid: startGrid, operations: [], lastOp: null }]
    const visited = new Set()
    visited.add(getGridState(startGrid))
    
    // 生成所有可能的操作
    function getNextStates(state) {
      const results = []
      const { grid: g, operations, lastOp } = state
      
      // 旋轉操作（每圈左右各一次）
      for (let ring = 0; ring < NUM_RINGS; ring++) {
        for (const steps of [-1, 1]) {
          const newGrid = simulateRotate(g, ring, steps)
          const newOps = [...operations, { type: 'rotate', index: ring, steps, label: `圈${ring + 1} ${steps > 0 ? '↻ 順時針' : '↺ 逆時針'}` }]
          
          // 計算當前操作步數
          const moveCount = calculateMoveCount(newOps)
          if (moveCount <= limit) {
            results.push({ grid: newGrid, operations: newOps, lastOp: { type: 'rotate', index: ring } })
          }
        }
      }
      
      // 滑動操作（0-5 對應 6 條直線，每條左右各一次）
      for (let sector = 0; sector < 6; sector++) {
        for (const steps of [-1, 1]) {
          const newGrid = simulateSlide(g, sector, steps)
          const oppositeSector = (sector + 6) % NUM_SECTORS
          const lineLabel = getSlideLineLabel(sector)
          const newOps = [...operations, { type: 'slide', index: sector, steps, label: `${lineLabel} ${steps > 0 ? '➡️ 右滑動' : '⬅️ 左滑動'}` }]
          
          // 計算當前操作步數
          const moveCount = calculateMoveCount(newOps)
          if (moveCount <= limit) {
            results.push({ grid: newGrid, operations: newOps, lastOp: { type: 'slide', index: sector } })
          }
        }
      }
      
      return results
    }
    
    // BFS 搜索
    let iterations = 0
    const maxIterations = 100000 // 防止無限循環
    
    while (queue.length > 0 && iterations < maxIterations) {
      iterations++
      const current = queue.shift()
      
      const nextStates = getNextStates(current)
      
      for (const next of nextStates) {
        const stateKey = getGridState(next.grid)
        
        // 根據模式檢查勝利條件
        const isWin = useAlignMode ? checkAligned(next.grid) : checkWin(next.grid, tg)
        
        if (isWin) {
          const mergedOps = mergeOperations(next.operations)
          const moveCount = calculateMoveCount(next.operations)
          const successMsg = `共 ${moveCount} 步操作，${next.operations.length} 次旋轉/滑動`
          return { 
            success: true, 
            operations: mergedOps, 
            moveCount: moveCount,
            message: successMsg
          }
        }
        
        if (!visited.has(stateKey)) {
          visited.add(stateKey)
          queue.push(next)
        }
      }
    }
    
    const failMsg = useAlignMode 
      ? `在 ${limit} 步內找不到對齊解法` 
      : `在 ${limit} 步內找不到解法，請嘗試增加步數上限`
    
    return { 
      success: false, 
      operations: [], 
      message: iterations >= maxIterations 
        ? '搜索超時，請嘗試減少敵人數量或增加步數上限' 
        : failMsg
    }
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
    clearBoard,
    findBestSolution,
    checkWin
  }
}
