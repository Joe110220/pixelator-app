# 拼豆像素化工具 - Windows 應用構建指南

本文檔說明如何在 Windows 電腦上構建獨立的 .exe 應用程式。

## 前置要求

在開始構建前，請確保您的 Windows 電腦上已安裝以下軟體：

1. **Node.js** (v18 或更高版本)
   - 下載：https://nodejs.org/
   - 選擇 LTS 版本
   - 安裝時勾選 "Add to PATH"

2. **pnpm** (包管理工具)
   - 安裝命令：`npm install -g pnpm`

3. **Git** (可選，用於版本控制)
   - 下載：https://git-scm.com/

## 構建步驟

### 步驟 1：準備項目文件

1. 將整個 `pixelator_app` 文件夾複製到您的 Windows 電腦上
2. 打開命令提示符（CMD）或 PowerShell
3. 進入項目目錄：
   ```bash
   cd path\to\pixelator_app
   ```

### 步驟 2：安裝依賴

運行以下命令安裝所有必要的依賴：

```bash
pnpm install
```

這個過程可能需要 5-10 分鐘，請耐心等待。

### 步驟 3：構建應用

運行以下命令構建 Windows .exe 應用程式：

```bash
pnpm run build:electron
```

構建過程包括：
- 編譯 React 前端應用
- 編譯 Electron 主進程和預加載腳本
- 使用 electron-builder 打包 Windows 安裝程式

構建完成後，您會看到類似的輸出：
```
✓ built in X.XXs
  • electron-builder  version=26.0.12 os=10.0.xxxxx
  • packaging       platform=win32 arch=x64 electron=39.1.0
  • building        target=nsis arch=x64 file=dist-electron\拼豆像素化工具-1.0.0.exe
```

### 步驟 4：找到應用程式

構建完成後，您可以在以下位置找到應用程式：

```
pixelator_app\dist-electron\拼豆像素化工具-1.0.0.exe
```

## 使用應用程式

### 安裝

1. 雙擊 `.exe` 檔案開始安裝
2. 按照安裝嚮導的步驟進行
3. 選擇安裝位置（默認為 Program Files）
4. 完成安裝

### 運行

安裝完成後，您可以：
- 從開始菜單找到「拼豆像素化工具」
- 或雙擊桌面快捷方式運行應用

### 功能

應用程式支援以下功能：

1. **上傳圖片**：支援 JPG、PNG、GIF 等格式
2. **調整像素大小**：使用滑桿調整像素化程度（1-100）
3. **自訂顏色集**：
   - 手動新增顏色
   - 匯入顏色集（TXT 格式）
   - 導出顏色集
4. **生成拼豆預覽**：直接生成拼豆圓形預覽
5. **色號統計**：自動統計所需的拼豆顏色和數量
6. **導出結果**：
   - 下載拼豆預覽圖片
   - 導出 CSV 統計數據

## 本地儲存

所有圖片和數據都儲存在您的電腦本地：

```
C:\Users\YourUsername\AppData\Roaming\拼豆像素化工具\images
```

您可以隨時訪問此文件夾查看或管理您的圖片。

## 故障排除

### 問題 1：安裝依賴失敗

**解決方案**：
```bash
# 清除緩存
pnpm store prune

# 重新安裝
pnpm install
```

### 問題 2：構建失敗

**解決方案**：
```bash
# 清除構建文件
rmdir /s dist dist-electron electron\dist

# 重新構建
pnpm run build:electron
```

### 問題 3：應用無法啟動

**解決方案**：
1. 確保已正確安裝 Node.js
2. 檢查防火牆設置
3. 嘗試以管理員身份運行應用

## 開發模式

如果您想在開發模式下運行應用（用於測試或修改）：

```bash
# 啟動開發伺服器和 Electron
pnpm run dev:electron
```

這會同時啟動 Vite 開發伺服器和 Electron 應用，支援熱重載。

## 更新應用

如果您對應用進行了修改或更新：

1. 進行您的代碼修改
2. 重新運行構建命令：
   ```bash
   pnpm run build:electron
   ```
3. 新的 .exe 檔案會在 `dist-electron` 文件夾中生成

## 顏色集格式

顏色集應為 TXT 文件，每行一種顏色，格式如下：

```
#FF6B6B,紅色
#4ECDC4,青色
#FFE66D,黃色
#95E1D3,薄荷綠
#C7CEEA,淡紫色
```

或簡化格式（無顏色名稱）：

```
#FF6B6B
#4ECDC4
#FFE66D
```

## 技術棧

- **前端**：React 19 + Tailwind CSS 4 + shadcn/ui
- **後端**：Express 4 + tRPC 11
- **桌面框架**：Electron 39
- **圖片處理**：Sharp
- **構建工具**：Vite + Electron Builder

## 許可證

MIT License

## 支援

如有任何問題或建議，請聯繫開發者。

---

祝您使用愉快！
