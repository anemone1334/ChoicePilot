# ChoicePilot 前端 Demo

AI 购物决策助手的 P0 / P0.5 前端演示版。

## 功能

- 自然语言购物需求输入
- AI 模拟解析与需求卡确认
- 三套购买方案：预算节省型 / 综合平衡型 / 体验优先型
- 商品锁定、品类替换
- 购物车草稿、总价重算、模拟提交
- P0.5：价格太高 → 同品类低价替代 → 运营审核 → 模拟触达 → 用户重新加购
- 验证台与演示事件日志

当前使用模拟商品和模拟 AI，不连接真实商品、支付、库存或营销渠道。

## 本地运行

这是纯 HTML/CSS/JavaScript 项目，不需要 Node.js。

直接双击 `index.html` 即可运行。

也可以使用任意静态服务器，例如：

```bash
python -m http.server 8000
```

然后访问：

`http://localhost:8000`

## GitHub Pages

1. 新建 GitHub Repository。
2. 上传本项目中的 `index.html`、`styles.css`、`app.js`。
3. Repository → Settings → Pages。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/ (root)`。
6. 保存后等待 GitHub Pages 发布。

## Vercel

本项目是静态网站，不需要构建命令。

1. 将项目上传到 GitHub。
2. 登录 Vercel。
3. Import Git Repository。
4. 选择该 Repository。
5. Framework Preset 选择 `Other`（或让 Vercel 自动识别静态项目）。
6. Build Command 留空。
7. Output Directory 留空。
8. Deploy。

部署后即可获得一个 `vercel.app` 在线网址。

## 项目结构

```text
ChoicePilot/
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore
```
