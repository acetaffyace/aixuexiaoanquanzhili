# 学校安全题库项目

- 本项目工作目录固定为 `D:/project/aixuexiaozhili`，不要把学校安全项目文件写入 `D:/project/liandong`。
- Git 远程仓库保持 `https://github.com/acetaffyace/aixuexiaoanquanzhili.git`，本地目录名与远程仓库名不同是用户的明确要求。
- 先读 README.md，再读 docs/research/question-bank-study.md 和 docs/research/template-catalog.md。当前优先级是研究真实题库并形成模板，不是继续堆叠界面。
- 教师与学生入口分开；答案逐题/整组揭晓由教师选择；只将疑题交人工审核；不发布纯文字卡。
- 原始来源、原题型、源答案与改编版本分开保存。网上题库不等于经审核的答案库，下载量不等于精读量。
- 排序必须有完整原题和适用的先后依据，交互为拖动并支持键盘；旧自编事故时间线暂不发布。
- AI 使用预生成样例，任意输入在线改题/生图尚未接入。不能把模拟调用显示为真实在线结果。
- 服务入口 server.mjs，默认 http://127.0.0.1:4185；数据库 data/demo.sqlite。
- 测试使用临时数据库：`node --test test/core.test.mjs`。UI 改动运行浏览器检查，不能把测试记录写入演示数据库。
- `.migration-backup/` 是目录迁移时保留的旧副本，不在其中继续开发、启动服务或导入业务数据。
