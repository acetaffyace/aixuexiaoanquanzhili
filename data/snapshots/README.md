# 本地演示数据库快照

`demo.sqlite` 是2026-10-13通过 Node SQLite backup API 从本地运行数据库导出的完整一致性快照，包含备份时已提交的 WAL 数据。完整性检查为 `ok`。运行中的数据库、WAL/SHM和旧备份仍由Git忽略。

恢复到新克隆：先确认服务已停止且目标 `data/demo.sqlite` 不存在，再在项目根目录运行：

```powershell
Copy-Item data/snapshots/demo.sqlite data/demo.sqlite
npm start
```

已有数据库时先单独备份它及对应 WAL/SHM 文件；不要直接覆盖运行中的数据库。快照保留本地题目、版本、练习记录、设置和角色资料，不代表其中研究题目已通过审核。图片保存在仓库的 `web/assets/` 和 `artifacts/image-study-2026-10-12/`。
