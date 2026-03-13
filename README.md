# 🎮 紙片瑪利歐：摺紙國王 戰鬥模擬器

Paper Mario: The Origami King Battle Simulator

一個模擬《紙片瑪利歐：摺紙國王》環狀轉盤戰鬥系統的網頁應用程式。玩家可以編輯盤面、設置敵人與目標，並透過旋轉與滑動操作來排列敵人位置。

## 📸 遊戲截圖

![Battle Simulator](screenshot.png)

---

## 🚀 快速開始

### 環境需求

- [Node.js](https://nodejs.org/) 18.0 或更高版本
- npm 或 yarn 套件管理器

### 安裝與啟動

```bash
# 1. 進入專案目錄
cd paper

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 開啟瀏覽器訪問
# http://localhost:5173/
```

### 建置生產版本

```bash
npm run build
```

建置完成後，靜態檔案會輸出至 `dist/` 目錄。

---

## 🌐 部署到網路

### 方法一：GitHub Pages（推薦）

#### 步驟 1：建立 GitHub 倉庫

1. 前往 [GitHub](https://github.com/) 並登入
2. 點擊右上角 **+** → **New repository**
3. 命名為 `paper-mario-battle-simulator`（或自訂名稱）
4. 設為 **Public**
5. 點擊 **Create repository**

#### 步驟 2：推送程式碼

```bash
# 初始化 Git（如果尚未初始化）
git init

# 添加所有檔案
git add .

# 提交
git commit -m "Initial commit"

# 設定遠端倉庫（替換 <USERNAME> 為你的 GitHub 帳號）
git remote add origin https://github.com/<USERNAME>/paper-mario-battle-simulator.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 步驟 3：部署到 GitHub Pages

```bash
# 自動建置並部署
npm run deploy
```

#### 步驟 4：設定 GitHub Pages

1. 前往你的 GitHub 倉庫
2. 點擊 **Settings** → **Pages**
3. 在 **Source** 選擇 `gh-pages` 分支
4. 點擊 **Save**
5. 等待幾分鐘後，你的網站將上線於：
   ```
   https://<USERNAME>.github.io/paper-mario-battle-simulator/
   ```

⚠️ **注意**：如果你使用不同的倉庫名稱，需要修改 `vite.config.js` 中的 `base` 路徑：

```javascript
base: '/你的倉庫名稱/'
```

---

### 方法二：Vercel（最簡單）

1. 前往 [Vercel](https://vercel.com/) 並使用 GitHub 登入
2. 點擊 **Add New** → **Project**
3. 選擇你的 GitHub 倉庫
4. 框架預設會自動偵測為 Vite
5. 點擊 **Deploy**
6. 完成！Vercel 會自動給你一個網址

✅ 優點：每次 push 到 GitHub 時會自動重新部署

---

### 方法三：Netlify

1. 前往 [Netlify](https://www.netlify.com/) 並使用 GitHub 登入
2. 點擊 **Add new site** → **Import an existing project**
3. 選擇你的 GitHub 倉庫
4. 建置設定：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 點擊 **Deploy site**

---

## 🎯 功能介紹

### 盤面結構

- **4 圈 × 12 格**：環狀轉盤共 48 個格子
- **圈 (Ring)**：從內到外分別為圈 1 至圈 4
- **徑向 (Sector)**：從 12 點鐘方向順時針編號為徑 1 至徑 12

### 編輯模式 📝

| 功能 | 說明 |
|------|------|
| 設置敵人 👾 | 點擊格子放置/移除敵人（紅色顯示） |
| 設置目標 ⭐ | 點擊格子放置/移除目標（綠色顯示） |
| 可操作次數 | 設定玩家可用的操作步數（1-10） |
| 儲存初始盤面 | 儲存當前配置作為初始狀態 |
| 清空盤面 | 移除所有敵人與目標 |

### 操作模式 🎮

| 功能 | 說明 |
|------|------|
| 轉圈模式 🔄 | 點擊盤面選擇圈，順/逆時針旋轉 |
| 滑動模式 ↕️ | 點擊盤面選擇徑向，整條直線滑動 |
| 取消上一步 | 復原最後一次操作 |
| 重製盤面 | 回到初始盤面狀態 |

### 操作計數規則

- **同一圈/徑向**可無限次旋轉或滑動，不消耗額外步數
- **切換到不同圈/徑向**時才消耗一步
- 步數用完後無法再切換操作目標

### 滑動機制說明

滑動操作會將**對角線兩條徑向組成一條 8 格直線**，整條線向同一方向循環滾動：

```
選擇徑 1 時，同時連動徑 7（對角線）

  徑1側               圓心               徑7側
[圈4] [圈3] [圈2] [圈1]  🍄  [圈1] [圈2] [圈3] [圈4]
  ↓     ↓     ↓     ↓       ↓     ↓     ↓     ↓
 向右滑動時，整條線順時針循環
```

---

## 📁 專案架構

```
paper/
├── index.html              # HTML 入口
├── package.json            # 專案配置與依賴
├── vite.config.js          # Vite 建置配置
├── README.md               # 專案說明文件
│
├── public/                 # 靜態資源
│
└── src/
    ├── main.js             # Vue 應用程式入口
    ├── App.vue             # 根元件（整合盤面與控制面板）
    ├── style.css           # 全域樣式
    │
    ├── components/         # Vue 元件
    │   ├── BoardView.vue   # 環狀盤面顯示元件
    │   └── ControlPanel.vue # 控制面板元件
    │
    └── composables/        # Vue 組合式函數
        └── useBoard.js     # 盤面狀態管理邏輯
```

---

## 🏗️ 技術架構

### 技術棧

| 技術 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | 前端框架（Composition API） |
| [Vite](https://vitejs.dev/) | 建置工具與開發伺服器 |
| SVG | 環狀盤面繪製 |
| CSS3 | 樣式與動畫效果 |

### 設計模式

#### 1. Composition API + Composables

使用 Vue 3 的 Composition API，將盤面狀態邏輯封裝於 `useBoard.js`：

```javascript
// src/composables/useBoard.js
export function useBoard() {
  const grid = ref([...])        // 敵人盤面
  const targetGrid = ref([...])  // 目標盤面
  
  function rotateRing(ring, steps) { ... }
  function slideSector(sector, steps) { ... }
  
  return { grid, rotateRing, slideSector, ... }
}
```

#### 2. 元件分離

- **App.vue**：整合狀態與事件處理
- **BoardView.vue**：純顯示元件，接收 props 並發送事件
- **ControlPanel.vue**：控制介面，發送操作事件

#### 3. 資料結構

```javascript
// 盤面資料（4圈 × 12格）
grid[ring][sector] = 'enemy' | null

// 目標格資料
targetGrid[ring][sector] = true | false

// 操作歷史（用於 undo）
history = [
  { type: 'rotate', ring: 0, steps: -1 },
  { type: 'slide', sector: 0, oppositeSector: 6, steps: 1 }
]

// 當前操作（用於判斷是否換圈/徑）
currentOperation = { type: 'rotate' | 'slide', index: number }
```

---

## 🎨 UI/UX 設計

### 視覺元素

| 元素 | 顏色 | 說明 |
|------|------|------|
| 敵人格 | 紅色 `#ffcdd2` | 有敵人的格子 |
| 目標格 | 綠色 `#e8f5e9` | 目標位置 |
| 選中圈 | 紅框高亮 | 轉圈模式下選中的圈 |
| 選中徑 | 綠框高亮 | 滑動模式下選中的徑向 |
| 中心 | 黃色 + 🍄 | 馬力歐位置 |

### 互動設計

- **即時反饋**：點擊格子後立即更新顯示
- **高亮提示**：選中圈或徑向時顯示高亮效果
- **模式切換**：透過按鈕切換編輯類型與操作模式
- **狀態顯示**：即時顯示剩餘步數與當前操作目標

---

## 📝 開發筆記

### 核心演算法

#### 旋轉圈

```javascript
// 將陣列向右旋轉 steps 格
const newRow = [...row.slice(-steps), ...row.slice(0, -steps)]
```

#### 滑動徑向

```javascript
// 組成 8 格直線（徑 sector 外→內 + 徑 opposite 內→外）
for (r = 3 → 0) line.push(grid[r][sector])
for (r = 0 → 3) line.push(grid[r][oppositeSector])

// 整條線循環滾動
const newLine = [...line.slice(-steps), ...line.slice(0, -steps)]
```

### 未來擴充方向

- [ ] 多種敵人類型
- [ ] 攻擊判定與傷害計算
- [ ] 關卡匯入/匯出功能
- [ ] 自動求解演算法
- [ ] 動畫效果優化
- [ ] 行動裝置支援

---

## 📄 授權

本專案僅供學習與研究用途。  
《紙片瑪利歐：摺紙國王》為任天堂之智慧財產權。

---

## 🙏 致謝

- 遊戲設計靈感來自《Paper Mario: The Origami King》
- 使用 [Vue 3](https://vuejs.org/) 與 [Vite](https://vitejs.dev/) 開發
