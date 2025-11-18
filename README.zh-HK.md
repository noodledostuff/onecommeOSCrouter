# OneComme OSC Router 外掛程式

*其他語言版本: [English](README.md) | [日本語](README.ja.md)*

**將你的 OneComme 聊天訊息轉換為強大的 OSC 數據流,適用於 VRChat、OBS、TouchDesigner 和其他創意應用程式**

OneComme OSC Router 是一個全面的外掛程式,在 OneComme 的多平台聊天捕獲和支援 OSC 的應用程式之間架起橋樑。它智能地處理來自 YouTube、Bilibili 和 Niconico 的聊天訊息,將其轉換為具有複雜路由功能的結構化 OSC 訊息。

> ⚠️ **重要**: 這是專為 OneComme 設計的外掛程式。它不能作為獨立應用程式使用,需要安裝並運行 OneComme。

---

## 🎯 此外掛程式的功能

OSC Router 作為智能中間件層運作,具有以下功能:

- **捕獲** - 從支援的平台捕獲 OneComme 處理的所有聊天訊息
- **處理** - 透過可自訂的過濾和路由規則處理訊息
- **轉換** - 將聊天數據轉換為帶有 JSON 載荷的結構化 OSC 訊息
- **路由** - 根據你的自訂邏輯將訊息路由到不同的 OSC 端點
- **監控** - 透過即時偵錯和分析監控訊息流

### 支援的 OneComme 平台

| 平台 | 訊息類型 | 特殊功能 |
|----------|---------------|------------------|
| **YouTube** | 留言、Super Chat、會員資格 | 金額檢測、貨幣處理、會員等級 |
| **Bilibili** | 留言、禮物、艦長狀態 | 金幣數量、用戶等級、VIP 檢測 |
| **Niconico** | 留言、高級用戶 | 高級用戶檢測、時間戳處理 |

---

## ✨ 主要功能

### 🅰️ 進階訊息路由
- **多條件邏輯**: 使用 AND/OR 邏輯鏈創建複雜規則
- **平台特定過濾**: 根據平台、用戶狀態、訊息內容或金額進行路由
- **表情符號管理**: 可選地從聊天訊息中刪除表情符號內容以獲得乾淨的文字輸出
- **端點自訂**: 將不同的訊息類型發送到不同的 OSC 地址
- **即時處理**: 零延遲的訊息轉換和路由

### 🖥️ 專業網頁介面
- **直觀儀表板**: 在 `http://localhost:19101` 可存取的簡潔分頁介面
- **即時訊息監控器**: 即時查看傳入和傳出的 OSC 訊息
- **規則建構器**: 具有條件測試的視覺化規則創建
- **配置管理**: 輕鬆備份和分享的設定匯出/匯入

### 💾 智能持久化
- **全自動儲存**: 自動儲存設定、規則和 UI 偏好
- **會話連續性**: 記住你最後活躍的分頁和表單草稿
- **備份系統**: 自動配置備份防止數據遺失
- **遷移支援**: 透過配置版本控制實現無縫更新

### 🔧 開發者友善架構
- **RESTful API**: 用於程式化控制的完整 HTTP API
- **可擴展設計**: 平台處理程序可輕鬆擴展
- **全面記錄**: 詳細的偵錯輸出和訊息追蹤
- **測試套件**: 內建配置和 OSC 可靠性測試

---

## 🚀 OneComme 整合指南

### 先決條件
- 已安裝 **OneComme** 並為你的串流平台配置
- **Node.js 16.0.0+**(通常與 OneComme 外掛程式捆綁在一起)
- **支援 OSC 的應用程式**(VRChat、OBS、TouchDesigner 等)

### 在 OneComme 中安裝

1. **下載外掛程式**
   - 將此存儲庫複製或下載到你的 OneComme 外掛程式目錄
   - 確保所有檔案都在名為 `onecommeOSCrouter` 的資料夾中
   - 所有必需的依賴項都包含在外掛程式中

2. **在 OneComme 中啟用**
   - 重新啟動 OneComme 以檢測新外掛程式
   - 導航到 OneComme 的外掛程式設定
   - 啟用「OneComme OSC Router」

3. **驗證安裝**
   - 檢查 OneComme 的主控台中的外掛程式載入訊息
   - 訪問 `http://localhost:19101` 以存取網頁介面
   - 確保啟動期間沒有出現錯誤訊息

---

## ⚙️ 配置與設定

### 初始配置

首次載入時,外掛程式會創建針對常見用例優化的預設配置:

**預設 OSC 設定:**
- **主機**: `127.0.0.1`(本地機器)
- **連接埠**: `19100`(標準 VRChat OSC 連接埠)
- **網頁介面**: `http://localhost:19101`

**預設訊息路由:**
- `/onecomme/youtube/comment` → YouTube 留言
- `/onecomme/youtube/superchat` → YouTube Super Chat
- `/onecomme/bilibili/comment` → Bilibili 留言
- `/onecomme/bilibili/gift` → Bilibili 禮物
- `/onecomme/niconico/comment` → Niconico 留言

### 網頁介面概述

在 `http://localhost:19101` 存取配置介面:

#### 📊 **概覽分頁**
- 即時訊息統計
- 連線狀態指示器
- 快速存取常用設定
- 系統健康監控

#### 📜 **規則分頁**
- 使用視覺化規則建構器創建和管理路由規則
- 使用預先填入表單的專用編輯模式**編輯現有規則**
- 使用切換開關啟用/停用規則
- 使用確認提示刪除規則
- 使用範例訊息測試規則
- 匯入/匯出規則集
- 規則優先級管理

#### 📋 **日誌分頁**
- 顯示傳入/傳出數據的即時訊息監控器
- 訊息過濾和搜尋
- 匯出日誌以進行偵錯
- 清除日誌歷史記錄

#### ⚙️ **設定分頁**
- OSC 輸出配置
- **表情符號移除**: 切換以從聊天訊息中刪除表情符號內容
- 網頁介面偏好
- 進階連線設定
- 配置備份/還原

---

## 🎨 創建自訂路由規則

規則系統能夠實現複雜的訊息處理邏輯。以下是全面的範例:

### 範例 1: 高額捐贈警報

**目標**: 將重要捐贈路由到特殊警報端點

```json
{
  "name": "高額捐贈",
  "description": "將大額捐贈路由到警報系統",
  "endpoint": "/alerts/bigdonation",
  "conditions": {
    "logic": "OR",
    "groups": [
      {
        "logic": "AND",
        "conditions": [
          {"field": "service", "operator": "equals", "value": "youtube"},
          {"field": "type", "operator": "equals", "value": "superchat"},
          {"field": "amount", "operator": "greater_than", "value": "20"}
        ]
      },
      {
        "logic": "AND",
        "conditions": [
          {"field": "service", "operator": "equals", "value": "bilibili"},
          {"field": "type", "operator": "equals", "value": "gift"},
          {"field": "coins", "operator": "greater_than", "value": "100"}
        ]
      }
    ]
  },
  "fieldMappings": {
    "username": "name",
    "message": "comment",
    "value": ["amount", "coins"],
    "currency": "currency",
    "platform": "service"
  }
}
```

### 可用的條件運算符

| 運算符 | 描述 | 範例 |
|----------|-------------|---------|
| `equals` | 完全匹配 | `"service" equals "youtube"` |
| `not_equals` | 不相等 | `"type" not_equals "comment"` |
| `contains` | 字串包含 | `"comment" contains "hello"` |
| `not_contains` | 字串不包含 | `"comment" not_contains "spam"` |
| `greater_than` | 數字比較 | `"amount" greater_than "10"` |
| `less_than` | 數字比較 | `"amount" less_than "5"` |
| `regex` | 正則表達式 | `"comment" regex "\\d+"` |
| `exists` | 欄位有值 | `"amount" exists` |
| `not_exists` | 欄位為空 | `"gift_name" not_exists` |

---

## 📡 OSC 訊息格式

外掛程式發送的所有 OSC 訊息都包含結構化 JSON 數據:

### 標準訊息結構

```json
{
  "timestamp": "2024-09-20T08:30:01.123Z",
  "service": "youtube",
  "type": "superchat",
  "user": {
    "id": "UC1234567890",
    "name": "StreamerFan123",
    "display_name": "StreamerFan123"
  },
  "message": {
    "content": "精彩的直播！繼續努力！",
    "id": "msg_12345"
  },
  "platform_data": {
    "amount": "5.00",
    "currency": "USD",
    "is_member": true,
    "membership_months": 6
  },
  "processing": {
    "rule_matched": "高額捐贈",
    "endpoint": "/alerts/bigdonation",
    "processed_at": "2024-09-20T08:30:01.125Z"
  }
}
```

---

## 🧪 測試與偵錯

### 內建測試套件

外掛程式包含全面的測試工具:

#### 配置測試
```bash
node tests/test-config-persistence.js
```

#### OSC 可靠性測試
```bash
node tests/test-osc-reliability.js
```

#### 即時監控器
```bash
node tests/osc-monitor.js
```

#### OSC 訊息格式測試
```bash
node tests/test-osc-message-formats.js
```

---

## ❓ 常見問題 (Q&A)

### Q1: 為什麼要實現為 OneComme 外掛程式而不是獨立應用程式?

**A**: 當 OneComme 已經解決了 YouTube、Bilibili 和 Niconico 的複雜多平台身份驗證、訊息獲取、速率限制和 API 處理的挑戰時,為什麼要重新發明輪子? 透過構建為外掛程式,我們可以專注於我們最擅長的事情——智能訊息路由和 OSC 整合——同時利用 OneComme 強大且經過實戰檢驗的聊天捕獲基礎架構。這種方法意味著:
- **無重複身份驗證流程**: OneComme 處理所有平台登入和 API 金鑰
- **自動更新**: 當平台更改其 API 時,OneComme 只需更新一次即可適用於所有外掛程式
- **較低的維護成本**: 我們不需要為每個平台維護單獨的 API 客戶端
- **更好的可靠性**: OneComme 經過驗證的訊息捕獲系統比從頭開始更穩定
- **統一配置**: 用戶已經為串流設定了 OneComme——只需添加外掛程式即可

### Q2: 我可以在沒有 OneComme 的情況下使用此外掛程式嗎?

**A**: 不可以,此外掛程式需要安裝並運行 OneComme。OneComme 提供此外掛程式依賴的訊息捕獲基礎架構。將 OneComme 視為數據源,將此外掛程式視為將該數據轉換為 OSC 訊息的專用處理器。

### Q3: Binary 和 String OSC 訊息格式有什麼區別?

**A**: 
- **Binary 格式**(預設): 將 JSON 數據作為二進位 blob 發送。這是大多數應用程式期望的標準 OSC 數據格式(VRChat、TouchOSC、TouchDesigner 等)。除非有特定原因,否則請使用此格式。
- **String 格式**: 將 JSON 作為純 UTF-8 文字字串發送。某些自訂 OSC 接收器或基於文字的應用程式可能需要此格式。它對於偵錯也很有用,因為數據在網絡監控器中是人類可讀的。

如果你的 OSC 接收器未正確解析訊息,請嘗試在設定分頁中切換格式。

### Q4: 這能與 VRChat 一起使用嗎?

**A**: 可以! 預設 OSC 連接埠(19100)是 VRChat 的標準 OSC 輸入連接埠。外掛程式發送可由 VRChat 的 OSC 系統接收的結構化 JSON 訊息。你可以創建自訂路由規則,將不同的訊息類型發送到不同的 VRChat 化身參數或世界觸發器。許多 VRChat 創作者使用此外掛程式在世界中顯示聊天訊息、Super Chat 警報和觀眾互動。

### Q5: 外掛程式會減慢或影響 OneComme 的性能嗎?

**A**: 不會。外掛程式異步運行,並在與 OneComme 主捕獲系統分離的線程中處理訊息。OSC 訊息發送是非阻塞的,因此即使目標應用程式響應緩慢,也不會影響 OneComme 捕獲聊天訊息的能力。外掛程式的記憶體佔用量最小,並使用高效的循環緩衝區進行訊息記錄。

### Q6: 我可以同時將訊息路由到多個應用程式嗎?

**A**: 目前,外掛程式發送到設定中配置的單個 OSC 主機/連接埠。但是,你可以:
- 使用 OSC 路由軟體(如 OSCRouter 或 Chataigne)將訊息重新分發到多個目的地
- 在不同連接埠上運行外掛程式的多個實例(需要修改程式碼)
- 使用不同端點創建規則——你的接收應用程式可以監聽多個 OSC 地址

### Q7: 當我的目標應用程式未運行時,訊息會發生什麼?

**A**: 訊息透過 UDP 發送,這是一種「即發即棄」協定。如果目標應用程式未運行或未監聽:
- 外掛程式將繼續發送訊息(它們只會被網絡堆疊丟棄)
- 外掛程式中不會顯示錯誤(這是正常的 OSC 行為)
- 當你的目標應用程式啟動並開始監聽時,它將立即接收新訊息
- 你可以使用內建的 OSC 監控器(`npm run monitor`)來驗證訊息是否正確發送

### Q8: 如何為特定用戶或訊息內容創建規則?

**A**: 使用網頁介面(規則分頁)中的視覺化規則建構器或手動編輯 `routing-rules.json`。規則支援:
- **欄位匹配**: 用戶名、訊息內容、捐贈金額、用戶等級、VIP 狀態
- **運算符**: equals、contains、greater_than、less_than、正則表達式模式
- **邏輯組合**: 用於複雜條件的 AND/OR 邏輯
- **平台過濾**: 僅 YouTube、僅 Bilibili 或跨平台規則

請參閱「創建自訂路由規則」部分以獲取詳細範例。

---

## 📄 授權與鳴謝

**MIT 授權** - 完整條款請參閱 [LICENSE](LICENSE) 檔案

### 第三方依賴項
- **node-osc**: OSC 通訊函式庫
- **express**: 網頁伺服器框架
- **OneComme**: 聊天捕獲平台(必需)

### 鳴謝
- 啟發此專案的原始 OneComme OSC 外掛程式的 **VirtualCast 團隊**
- 提供可擴展外掛程式架構的 OneComme 開發團隊
- 提供協定規範和最佳實踐的 OSC 社群
- 提供反饋和改進的貢獻者和用戶

---

**Created by noodledostuff** | [GitHub 個人檔案](https://github.com/noodledostuff)

*透過智能聊天到 OSC 路由轉變你的串流體驗* 🚀
