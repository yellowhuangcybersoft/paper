<template>
  <div class="board-container">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- 背景圓圈 -->
      <circle
        v-for="ring in NUM_RINGS"
        :key="'bg-' + ring"
        :cx="center"
        :cy="center"
        :r="getRingRadius(ring - 1)"
        fill="none"
        stroke="#e0e0e0"
        stroke-width="2"
      />
      
      <!-- 徑向線 -->
      <line
        v-for="sector in NUM_SECTORS"
        :key="'line-' + sector"
        :x1="center"
        :y1="center"
        :x2="center + Math.cos((sector - 1) * sectorAngle - Math.PI / 2) * outerRadius"
        :y2="center + Math.sin((sector - 1) * sectorAngle - Math.PI / 2) * outerRadius"
        stroke="#e0e0e0"
        stroke-width="1"
      />
      
      <!-- 格子（可點擊） -->
      <g v-for="ring in NUM_RINGS" :key="'ring-' + ring">
        <g v-for="sector in NUM_SECTORS" :key="'cell-' + ring + '-' + sector">
          <path
            :d="getCellPath(ring - 1, sector - 1)"
            :fill="getCellFill(ring - 1, sector - 1)"
            :stroke="selectedCell && selectedCell.ring === ring - 1 && selectedCell.sector === sector - 1 ? '#ff6b6b' : '#999'"
            :stroke-width="selectedCell && selectedCell.ring === ring - 1 && selectedCell.sector === sector - 1 ? 3 : 1"
            class="cell"
            @click="onCellClick(ring - 1, sector - 1)"
          />
          <!-- 敵人圖示 -->
          <text
            v-if="grid[ring - 1][sector - 1]"
            :x="getCellCenter(ring - 1, sector - 1).x"
            :y="getCellCenter(ring - 1, sector - 1).y"
            text-anchor="middle"
            dominant-baseline="central"
            font-size="16"
            fill="#333"
          >
            👾
          </text>
        </g>
      </g>
      
      <!-- 中心圓（馬力歐位置） -->
      <circle
        :cx="center"
        :cy="center"
        :r="innerRadius - 10"
        fill="#ffeb3b"
        stroke="#ffc107"
        stroke-width="3"
      />
      <text
        :x="center"
        :y="center"
        text-anchor="middle"
        dominant-baseline="central"
        font-size="24"
      >
        🍄
      </text>
    </svg>
    
    <!-- 圈數與徑向標記 -->
    <div class="ring-labels">
      <span v-for="ring in NUM_RINGS" :key="'label-' + ring" class="ring-label">
        圈 {{ ring }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NUM_RINGS, NUM_SECTORS } from '../composables/useBoard'

const props = defineProps({
  grid: {
    type: Array,
    required: true
  },
  selectedCell: {
    type: Object,
    default: null
  },
  isEditMode: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['cell-click'])

// SVG 尺寸設定
const size = 500
const center = size / 2
const outerRadius = 220
const innerRadius = 60
const ringWidth = (outerRadius - innerRadius) / NUM_RINGS
const sectorAngle = (2 * Math.PI) / NUM_SECTORS

// 計算每一圈的半徑
function getRingRadius(ring) {
  return innerRadius + ringWidth * (ring + 1)
}

// 計算格子的 SVG path
function getCellPath(ring, sector) {
  const r1 = innerRadius + ringWidth * ring
  const r2 = innerRadius + ringWidth * (ring + 1)
  const a1 = sector * sectorAngle - Math.PI / 2
  const a2 = (sector + 1) * sectorAngle - Math.PI / 2

  const x1 = center + r1 * Math.cos(a1)
  const y1 = center + r1 * Math.sin(a1)
  const x2 = center + r2 * Math.cos(a1)
  const y2 = center + r2 * Math.sin(a1)
  const x3 = center + r2 * Math.cos(a2)
  const y3 = center + r2 * Math.sin(a2)
  const x4 = center + r1 * Math.cos(a2)
  const y4 = center + r1 * Math.sin(a2)

  return `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1}`
}

// 計算格子中心點
function getCellCenter(ring, sector) {
  const r = innerRadius + ringWidth * (ring + 0.5)
  const a = (sector + 0.5) * sectorAngle - Math.PI / 2
  return {
    x: center + r * Math.cos(a),
    y: center + r * Math.sin(a)
  }
}

// 格子填充色
function getCellFill(ring, sector) {
  if (props.grid[ring][sector]) {
    return '#ffcdd2' // 有敵人時為紅色底
  }
  return (ring + sector) % 2 === 0 ? '#f5f5f5' : '#ffffff'
}

// 點擊格子
function onCellClick(ring, sector) {
  emit('cell-click', { ring, sector })
}
</script>

<style scoped>
.board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.cell {
  cursor: pointer;
  transition: opacity 0.2s;
}

.cell:hover {
  opacity: 0.7;
}

.ring-labels {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.ring-label {
  font-size: 14px;
  color: #666;
}
</style>
