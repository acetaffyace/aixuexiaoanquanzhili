# 本地研究工作区

`question-banks/` 保存原始下载、页面/PDF提取、索引与抽样输入；`visual-pilot/` 保存原题快照和依据摘录。两者被Git忽略，完整原题不公开打包。

来源地址、文件哈希和原题定位见 `../docs/research/source-register.json`；阅读编号见 `read-log.json`。下载、解析、精读、审核、发布是不同状态。

获取与索引顺序：`scripts/research/research-banks.py` → `index-banks.py` → `read-bank-samples.py`。获取脚本需要Python、requests、PyMuPDF；索引还要求清单所需原始文件。联网重下载不能保证相同内容，应对照来源哈希。失败来源不补造、不绕过验证码。

`build-template-research.py` 还要求 `LZU.pdf` 等历史本地输入，不能把下载脚本当成完整一键复现。视觉重建需要完整索引、来源文件、依据文件和审核凭据；见 `../docs/engineering/reproducibility.md`。未经审核的构建输出继续待审。
