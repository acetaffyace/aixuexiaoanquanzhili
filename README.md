# 知安校园安全学习

工作目录固定为 `D:/project/aixuexiaozhili`，远程仓库为 `https://github.com/acetaffyace/aixuexiaoanquanzhili.git`。应用版本 0.2.0；模板规格版本 0.3，两者独立。

当前优先任务是研究真实题库、验证视觉模板。2026-10-09 阅读651条来源记录（含重复），形成14类模板规格；规格数量不代表在线自动改题能力。

## 当前能力与内容状态

- 已实现教师/学生登录隔离、导入去重、疑题审核、发布撤回、持久化练习、服务端判分、逐题/整组揭晓、学校形象设置和拖动排序（含键盘支持）。
- 内置7道演示原题，经当前样例适配器和排序门槛处理为5道发布、2道待审核。这是干净临时数据库中的样例结果，不表示已有演示数据库的实时数量。
- 视觉研究批次有24条：15条首批、3条补充适配、6条疑题；正式教学发布0条。2026-10-12检查发现18条非阻断蓝图缺少有效素材/观察/审核凭据，不能沿用旧报告宣称通过。
- 应用 AI 为预生成样例适配器，任意输入在线改题/生图、独立自动视觉审查尚未接入；Word/PDF导入、正式账号管理、多人部署加固尚未实现。

## 运行

需要 Node.js 22.13+；服务无第三方运行依赖。

```powershell
npm start
```

默认 `http://127.0.0.1:4185`，教师 `/teacher`，学生 `/student`；模板预览 `/templates.html`，研究试答 `/visual-pilot.html`。

| 身份 | 账号 | 演示密码 |
|---|---|---|
| 教师 | teacher | teacher-demo |
| 学生 | student01 至 student05 | 123456 |

服务端环境变量 `TEACHER_PIN`、`STUDENT_PIN` 可修改密码，`PORT` 可修改端口。默认绑定本机，尚未接入学校统一认证。数据库为 `data/demo.sqlite`。维护脚本会修改数据库，运行前查看脚本清单；无需为启动重复执行升级。

## 目录

| 目录 | 职责 |
|---|---|
| `src/` | 服务端业务、存储、样例提供方与研究门槛 |
| `web/` | 浏览器静态页面、共享交互和可公开素材 |
| `config/` | 机器可读模板规格与研究蓝图 |
| `docs/` | 需求、架构、研究结论与可审查证据 |
| `research/` | 本地原始题库和原题快照，不提交完整档案 |
| `scripts/` | 研究、构建、维护、验证，按副作用分组 |
| `test/` | 自动测试，使用临时数据库 |
| `data/`、`artifacts/` | 本地运行数据、临时检查产物，不提交 |
| `.migration-backup/` | 封存的旧副本，不在其中开发或运行 |

## 验证

```powershell
npm test
npm run test:pilot
npm run verify:browser
npm run verify:pilot
```

核心测试不依赖原题档案。视觉试验测试依赖本地原题快照和真实审核凭据；当前有2项既有失败，详情见[复现与基线记录](docs/engineering/reproducibility.md)，未跳过或降低断言。

浏览器检查需要 Playwright 与可用 Chromium/Edge；可运行 `npm install --no-save --package-lock=false playwright@1.58.2` 配置检查依赖，并按需 `npx playwright install chromium`。也可通过 `PLAYWRIGHT_MODULE` 指定现有 Playwright 模块入口。检查使用临时数据库，截图写入 `artifacts/`。

## 阅读与复现

先读[题库研究](docs/research/question-bank-study.md)，再读[模板规格](docs/research/template-catalog.md)。[文档导航](docs/README.md)、[脚本输入输出](scripts/README.md)、[维护来源](config/README.md)、[本地研究说明](research/README.md)。

完整题库及部分审核输入不随仓库提供。当前可复现核心演示和页面检查，不能从干净克隆完整重建历史视觉审核结果。不要为了得到“通过”而生成审核凭据或重算指纹；缺失输入与恢复条件见复现记录。
