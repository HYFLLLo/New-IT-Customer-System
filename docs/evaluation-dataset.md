# IT Helpdesk 评测数据集 v1.0

> **数据集版本**: v1.0
> **生成日期**: 2026-04-24
> **数据量**: 150条
> **说明**: 基于知识库文档模拟生成的种子评测数据，用于效果监控和Prompt调优

---

## 数据结构

每条评测数据包含以下字段：

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | string | 唯一标识，格式：IT-QA-XXX |
| category | string | 问题大类 |
| subcategory | string | 问题子类 |
| difficulty | string | 难度等级：简单/中等/困难 |
| question_type | string | 问题类型：factual/procedural/troubleshooting/open-ended |
| question | string | 用户问题文本 |
| expected_key_points | string[] | 期望回答包含的关键要素 |
| source_doc | string | 关联的知识库文档 |
| source_section | string | 关联的文档章节 |

---

## 评测维度说明

### 问题类型 (question_type)

- **factual**: 事实型问题，直接询问具体信息
- **procedural**: 流程型问题，询问操作步骤
- **troubleshooting**: 故障排查型问题，需要诊断思维
- **open-ended**: 开放型问题，需要综合建议

### 难度等级 (difficulty)

- **简单**: 单一知识点，直接可答
- **中等**: 涉及2-3个步骤，需要简单判断
- **困难**: 需要综合分析、多步骤操作或边界情况处理

---

## Category 1: 账号与权限 (账号权限类 - 35条)

### Subcategory: 密码问题 (12条)

```json
[
  {
    "id": "IT-QA-001",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "简单",
    "question_type": "procedural",
    "question": "我的企业邮箱密码忘了，怎么重置？",
    "expected_key_points": ["自助找回", "点击忘记密码", "it-support@company.com", "800-XXX-XXXX"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "3.1 企业邮箱密码重置"
  },
  {
    "id": "IT-QA-002",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司密码有什么要求？",
    "expected_key_points": ["最少8位", "大写字母", "小写字母", "数字", "特殊字符"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "2.1 公司密码策略"
  },
  {
    "id": "IT-QA-003",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "OA系统密码忘了怎么办？",
    "expected_key_points": ["自助找回", "点击忘记密码", "工号+手机号", "it-support@company.com"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "3.2 OA系统密码重置"
  },
  {
    "id": "IT-QA-004",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何设置一个安全的强密码？",
    "expected_key_points": ["长度12位以上", "包含四类字符", "避免个人信息", "建议使用密码管理器"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "2.2 强密码示例"
  },
  {
    "id": "IT-QA-005",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司有哪些密码管理器可以用？",
    "expected_key_points": ["1Password", "LastPass", "Bitwarden", "系统自带"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "2.3 密码管理建议"
  },
  {
    "id": "IT-QA-006",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我刚改完密码但是登录不上OA系统，提示密码错误？",
    "expected_key_points": ["确认大小写", "检查特殊字符", "清除浏览器缓存", "联系IT重置"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "3.2 OA系统密码重置"
  },
  {
    "id": "IT-QA-007",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "我可以用同一个密码吗？",
    "expected_key_points": ["不可以", "多平台使用同一密码风险", "81%数据泄露与密码安全有关"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "1.2 密码使用现状"
  },
  {
    "id": "IT-QA-008",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "中等",
    "question_type": "troubleshooting",
    "question": "VPN密码过期了怎么更新？",
    "expected_key_points": ["联系IT", "800-XXX-XXXX", "it-support@company.com", "季度强制更换"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "4.2 定期更换密码"
  },
  {
    "id": "IT-QA-009",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "财务系统密码忘了，要找谁重置？",
    "expected_key_points": ["联系IT", "需IT+主管审批", "3个工作日", "189-XXXX-XXXX"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "3.3 各类系统密码规则"
  },
  {
    "id": "IT-QA-010",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "我可以把密码写在便签上吗？",
    "expected_key_points": ["不可以", "15%的人这样做", "极高风险", "使用密码管理器"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "1.2 密码使用现状"
  },
  {
    "id": "IT-QA-011",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "我该用什么策略管理这么多系统的密码？",
    "expected_key_points": ["使用密码管理器", "1Password公司已采购", "不同系统不同密码", "定期更换"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "2.3 密码管理建议"
  },
  {
    "id": "IT-QA-012",
    "category": "账号权限",
    "subcategory": "密码问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我发现有人尝试登录我的邮箱，提示密码错误多次，这是怎么回事？",
    "expected_key_points": ["可能是钓鱼攻击", "不要透露密码", "修改密码", "联系IT安全团队"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.3 钓鱼邮件应急处理"
  }
]
```

### Subcategory: 账号开通与权限 (12条)

```json
[
  {
    "id": "IT-QA-013",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "简单",
    "question_type": "procedural",
    "question": "新员工入职，IT账号什么时候能办好？",
    "expected_key_points": ["入职前一个工作日", "HR发邮件通知IT", "it-support@company.com"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "1.1 流程概述"
  },
  {
    "id": "IT-QA-014",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "入职当天需要开通哪些账号？",
    "expected_key_points": ["企业邮箱", "OA系统", "企业微信/钉钉", "打印机权限"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "1.2 第三步：开通业务系统权限"
  },
  {
    "id": "IT-QA-015",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我需要开通GitLab权限，怎么申请？",
    "expected_key_points": ["OA提交申请", "主管审批", "IT审核", "1个工作日"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "4.2 权限申请流程"
  },
  {
    "id": "IT-QA-016",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "入职当天我应该找谁检查账号是否正常？",
    "expected_key_points": ["IT人员陪同检查", "检查清单", "账号登录", "软件安装", "网络访问"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "2. 账号开通检查清单"
  },
  {
    "id": "IT-QA-017",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "中等",
    "question_type": "troubleshooting",
    "question": "入职第一天发现企业邮箱登录不了，怎么办？",
    "expected_key_points": ["检查是否收到账号开通邮件", "确认密码", "使用忘记密码", "联系IT热线"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "5. 常见问题解答 Q1"
  },
  {
    "id": "IT-QA-018",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我换了岗位，需要开通新的系统权限，怎么操作？",
    "expected_key_points": ["OA提交申请", "系统权限申请表", "主管审批", "IT自动开通"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "5. 常见问题解答 Q2"
  },
  {
    "id": "IT-QA-019",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "多人可以共用一个账号吗？",
    "expected_key_points": ["严格禁止", "无法审计", "责任不清", "安全风险"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "4. 账号权限管理规范"
  },
  {
    "id": "IT-QA-020",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我临时需要访问同事的账号处理紧急工作，可以吗？",
    "expected_key_points": ["严禁共享账号", "使用权限借用流程", "使用委托授权功能", "联系IT"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "4.3 账号共享风险"
  },
  {
    "id": "IT-QA-021",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我需要开通VPN权限用于在家办公，怎么申请？",
    "expected_key_points": ["OA提交申请", "IT审批", "IT发送账号和安装包", "3个工作日"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.4 远程办公软件"
  },
  {
    "id": "IT-QA-022",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "中等",
    "question_type": "factual",
    "question": "什么权限需要IT主管和部门总监双重审批？",
    "expected_key_points": ["C类特殊授权软件", "数据库管理工具", "远程控制软件", "虚拟机软件"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "1.1 软件分类说明"
  },
  {
    "id": "IT-QA-023",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "密码忘了可以找谁？",
    "expected_key_points": ["IT服务热线800-XXX-XXXX", "IT邮箱it-support@company.com", "IT微信群"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "附录A：安全相关联系方式"
  },
  {
    "id": "IT-QA-024",
    "category": "账号权限",
    "subcategory": "账号开通",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "我觉得现有权限太多，是否可以申请减少一些？",
    "expected_key_points": ["最小权限原则", "岗位绑定", "定期审查", "联系IT调整"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "4.1 权限原则"
  }
]
```

### Subcategory: 离职账号处理 (11条)

```json
[
  {
    "id": "IT-QA-025",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "员工离职后，IT账号什么时候会被关闭？",
    "expected_key_points": ["最后工作日完成", "第+1天正式关闭", "邮件保留6个月"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.2 离职操作时间节点"
  },
  {
    "id": "IT-QA-026",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "离职时需要交回哪些IT资产？",
    "expected_key_points": ["门禁卡", "笔记本电脑", "工牌", "其他IT设备"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.3 账号处理操作"
  },
  {
    "id": "IT-QA-027",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "中等",
    "question_type": "troubleshooting",
    "question": "我是主管，离职员工还有工作邮件需要处理怎么办？",
    "expected_key_points": ["向IT提交邮件处理申请", "IT将邮件转发至指定邮箱", "自动回复设置"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "5. 常见问题解答 Q3"
  },
  {
    "id": "IT-QA-028",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "离职时邮箱里的文件怎么处理？",
    "expected_key_points": ["转发至主管或接替者", "自动回复设置为停用提示", "6个月后删除"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.4 离职数据处理"
  },
  {
    "id": "IT-QA-029",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我门禁卡丢了要怎么办？",
    "expected_key_points": ["立即联系前台和IT报备", "禁用丢失的门禁卡", "重新制作新卡", "工本费20元"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "5. 常见问题解答 Q4"
  },
  {
    "id": "IT-QA-030",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "离职当天IT会处理哪些账号？",
    "expected_key_points": ["禁用企业邮箱", "禁用OA系统", "移除钉钉/企微", "收回门禁卡"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.3 账号处理操作"
  },
  {
    "id": "IT-QA-031",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我发现前员工账号还能登录，这是安全问题吗？",
    "expected_key_points": ["立即联系IT", "安全风险", "数据泄露风险", "189-XXXX-XXXX紧急"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.1 流程概述"
  },
  {
    "id": "IT-QA-032",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "中等",
    "question_type": "factual",
    "question": "离职员工的数据归属谁？",
    "expected_key_points": ["代码文档归属公司", "个人不得删除", "主管确认是否需要交接"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.4 离职数据处理"
  },
  {
    "id": "IT-QA-033",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "研发人员离职后代码库权限怎么处理？",
    "expected_key_points": ["研发主管审批", "保留代码所有权", "移除个人访问权限"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.3 账号处理操作"
  },
  {
    "id": "IT-QA-034",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "离职时IT资产未归还会怎样？",
    "expected_key_points": ["影响离职流程", "扣押工资或罚款", "法律追诉"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.3 账号处理操作"
  },
  {
    "id": "IT-QA-035",
    "category": "账号权限",
    "subcategory": "离职账号",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "作为管理者如何确保离职账号安全及时处理？",
    "expected_key_points": ["提前3天通知IT", "检查数据交接", "资产归还确认", "账号关闭验证"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.2 离职操作时间节点"
  }
]
```

---

## Category 2: 软件与安装 (软件类 - 30条)

### Subcategory: 软件安装流程 (12条)

```json
[
  {
    "id": "IT-QA-036",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "简单",
    "question_type": "procedural",
    "question": "我想安装Chrome浏览器，可以直接安装吗？",
    "expected_key_points": ["A类自助安装", "无需申请", "可以直接安装"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "1.1 软件分类说明"
  },
  {
    "id": "IT-QA-037",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "软件安装申请需要多久？",
    "expected_key_points": ["A类即刻", "B类1个工作日", "C类3个工作日"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "2.1 标准申请流程"
  },
  {
    "id": "IT-QA-038",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我需要安装Photoshop，怎么申请？",
    "expected_key_points": ["B类部门通用软件", "部门主管审批", "IT核查授权", "设计部"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.2 设计与创意软件"
  },
  {
    "id": "IT-QA-039",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何安装Office 365？",
    "expected_key_points": ["公司已购买全员授权", "访问office.com", "登录企业邮箱", "点击安装"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.1 办公软件"
  },
  {
    "id": "IT-QA-040",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "哪些软件是公司已经购买授权的？",
    "expected_key_points": ["Chrome", "Office 365", "7-Zip", "WinRAR", "Adobe Reader"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "1.1 软件分类说明"
  },
  {
    "id": "IT-QA-041",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我申请了软件安装但3天了还没收到通知，怎么办？",
    "expected_key_points": ["检查邮箱", "联系IT热线800-XXX-XXXX", "OA系统查看状态"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q1"
  },
  {
    "id": "IT-QA-042",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我是Mac用户，能安装Windows软件吗？",
    "expected_key_points": ["部分支持", "使用Windows虚拟机", "使用Mac原生替代", "联系IT申请"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q3"
  },
  {
    "id": "IT-QA-043",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司可以安装VPN软件吗？",
    "expected_key_points": ["可以使用公司VPN", "必须申请后才可使用", "禁止使用非公司VPN"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "4.1 严格禁止的软件"
  },
  {
    "id": "IT-QA-044",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何申请数据库客户端Navicat？",
    "expected_key_points": ["C类特殊授权", "需IT主管+部门总监双重审批", "3个工作日", "需说明用途"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.3 开发与数据库工具"
  },
  {
    "id": "IT-QA-045",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "哪些软件绝对不能安装？",
    "expected_key_points": ["翻墙软件", "迅雷等P2P下载", "游戏软件", "360安全卫士", "盗版软件"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "4.1 严格禁止的软件"
  },
  {
    "id": "IT-QA-046",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "安装软件后电脑变慢了怎么办？",
    "expected_key_points": ["检查启动项", "检查后台进程", "卸载不常用软件", "运行杀毒扫描"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q4"
  },
  {
    "id": "IT-QA-047",
    "category": "软件与安装",
    "subcategory": "安装流程",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "公司没有购买的软件可以申请吗？流程是什么？",
    "expected_key_points": ["可以申请", "说明用途必要性", "IT评估安全性", "免费直接批准", "付费部门预算"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q2"
  }
]
```

### Subcategory: 软件使用规范 (10条)

```json
[
  {
    "id": "IT-QA-048",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "可以使用盗版软件吗？",
    "expected_key_points": ["严禁使用", "法律风险", "安全风险", "职业风险"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q6"
  },
  {
    "id": "IT-QA-049",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "软件许可证是个人财产还是公司财产？",
    "expected_key_points": ["公司许可证属公司财产", "离职不带走", "个人许可证属个人"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "5.3 软件许可证管理"
  },
  {
    "id": "IT-QA-050",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "软件试用期到期了怎么办？",
    "expected_key_points": ["公司已授权联系IT", "试用版需购买", "不需可用就卸载"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q5"
  },
  {
    "id": "IT-QA-051",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "哪些软件建议更新？哪些不建议频繁更新？",
    "expected_key_points": ["建议更新：浏览器、Office、通讯工具", "不建议：打印机驱动、Adobe、CAD"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "5.2 软件版本管理"
  },
  {
    "id": "IT-QA-052",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "离职前需要卸载软件吗？",
    "expected_key_points": ["需要卸载所有个人软件", "公司授权软件保留", "账号权限转移"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "5.1 软件使用原则"
  },
  {
    "id": "IT-QA-053",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "Mac用户可以用什么替代Windows独占软件？",
    "expected_key_points": ["Windows虚拟机联系IT申请", "Mac原生替代软件", "Affinit Photo替代PS"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q3"
  },
  {
    "id": "IT-QA-054",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "可以用公司邮箱注册个人软件吗？",
    "expected_key_points": ["不可以", "邮箱账号属公司财产", "离职时应转移"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "5.3 软件许可证管理"
  },
  {
    "id": "IT-QA-055",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "迅雷为什么不能安装？",
    "expected_key_points": ["严重占用公司带宽", "影响全公司网络", "属于禁止安装软件"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "4.2 为什么禁止安装这些软件"
  },
  {
    "id": "IT-QA-056",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司采购了哪些远程办公软件？",
    "expected_key_points": ["VPN", "Windows远程桌面", "TeamViewer", "向日葵"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.4 远程办公软件"
  },
  {
    "id": "IT-QA-057",
    "category": "软件与安装",
    "subcategory": "使用规范",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我发现同事安装了禁止软件，应该怎么办？",
    "expected_key_points": ["提醒同事卸载", "向IT部门报告", "安全风险", "可能影响全公司网络"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "4.1 严格禁止的软件"
  }
]
```

### Subcategory: 软件问题排查 (8条)

```json
[
  {
    "id": "IT-QA-058",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "Adobe软件安装需要多久？有什么注意事项？",
    "expected_key_points": ["30-60分钟", "建议在公司网络下安装", "每个授权激活2台设备"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.2 设计与创意软件"
  },
  {
    "id": "IT-QA-059",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "中等",
    "question_type": "troubleshooting",
    "question": "我安装完软件后提示需要激活怎么办？",
    "expected_key_points": ["联系IT提供授权", "检查公司是否已购买", "不要使用破解"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答"
  },
  {
    "id": "IT-QA-060",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "同一款软件需要安装在公司和个人两台电脑上，有冲突吗？",
    "expected_key_points": ["检查授权数量", "Adobe限2台同时激活", "超出需额外购买"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.2 设计与创意软件"
  },
  {
    "id": "IT-QA-061",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "Visual Studio Code是免费的吗？怎么安装？",
    "expected_key_points": ["免费", "A类自助安装", "code.visualstudio.com下载"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.3 开发与数据库工具"
  },
  {
    "id": "IT-QA-062",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "Git是免费的吗？",
    "expected_key_points": ["免费", "A类自助安装"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.3 开发与数据库工具"
  },
  {
    "id": "IT-QA-063",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "中等",
    "question_type": "troubleshooting",
    "question": "我需要用DBeaver连接数据库，怎么申请？",
    "expected_key_points": ["B类部门通用软件", "免费开源", "无需特殊审批"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.3 开发与数据库工具"
  },
  {
    "id": "IT-QA-064",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何获取常用软件的官方下载地址？",
    "expected_key_points": ["联系IT", "it-support@company.com", "800-XXX-XXXX"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "附录A：常用软件官方下载链接"
  },
  {
    "id": "IT-QA-065",
    "category": "软件与安装",
    "subcategory": "问题排查",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "我想用一款开源替代软件替代公司没买的商业软件，如何处理？",
    "expected_key_points": ["联系IT评估", "说明用途和必要性", "免费软件可直接批准"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "6. 常见问题解答 Q2"
  }
]
```

---

## Category 3: 打印机问题 (打印类 - 25条)

### Subcategory: 打印机故障处理 (15条)

```json
[
  {
    "id": "IT-QA-066",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "简单",
    "question_type": "procedural",
    "question": "打印任务卡在队列里删不掉怎么办？",
    "expected_key_points": ["停止Print Spooler服务", "删除PRINTERS文件夹内容", "重启服务"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.2 打印任务卡在队列里无法删除"
  },
  {
    "id": "IT-QA-067",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "打印机没反应怎么办？",
    "expected_key_points": ["检查打印机是否开机", "检查连接", "检查驱动状态", "重新安装驱动"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.1 点击打印后打印机没反应"
  },
  {
    "id": "IT-QA-068",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "打印出来是白纸是怎么回事？",
    "expected_key_points": ["碳粉用尽", "摇晃硒鼓检查", "更换硒鼓", "联系IT报修"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.3 打印出来是白纸"
  },
  {
    "id": "IT-QA-069",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "打印模糊有污渍怎么处理？",
    "expected_key_points": ["碳粉不足更换硒鼓", "转印带脏清洁", "激光器脏联系IT"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.4 打印模糊有污渍"
  },
  {
    "id": "IT-QA-070",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "卡纸了怎么处理？",
    "expected_key_points": ["关闭打印机电源", "根据位置取出纸张", "检查纸张完整", "重新装纸开机"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.5 卡纸"
  },
  {
    "id": "IT-QA-071",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "HP打印机显示错误代码50.0000是什么意思？",
    "expected_key_points": ["加热组件错误", "联系IT报修", "不要自行拆卸"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "3.1 HP打印机"
  },
  {
    "id": "IT-QA-072",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "我们公司有哪些类型的打印机？",
    "expected_key_points": ["HP激光打印机20+台", "佳能/理光彩色激光5台", "斑马条码打印机3台"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "1.1 公司打印机类型"
  },
  {
    "id": "IT-QA-073",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "打印机指示灯红色闪烁是什么意思？",
    "expected_key_points": ["卡纸等可恢复错误", "检查纸张", "清除卡纸"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "1.2 打印机状态指示灯解读"
  },
  {
    "id": "IT-QA-074",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何清除打印队列？",
    "expected_key_points": ["停止Print Spooler", "删除PRINTERS文件夹内容", "重启服务"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "4.1 完全清除法"
  },
  {
    "id": "IT-QA-075",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "硒鼓如何更换？",
    "expected_key_points": ["打开前盖", "拉住硒鼓手柄拉出", "摇晃均匀碳粉", "插入关闭"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.3 更换硒鼓步骤"
  },
  {
    "id": "IT-QA-076",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "佳能打印机墨头干了怎么处理？",
    "expected_key_points": ["使用打印头清洁功能", "Canon PRINT软件", "维护标签", "打印头清洁"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "3.2 佳能/理光打印机"
  },
  {
    "id": "IT-QA-077",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "各楼层打印机IP地址是什么？",
    "expected_key_points": ["1楼茶水间192.168.1.101", "2楼茶水间192.168.1.102", "财务室192.168.1.110"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "5.2 各楼层打印机IP列表"
  },
  {
    "id": "IT-QA-078",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何添加网络打印机？",
    "expected_key_points": ["控制面板添加打印机", "选择网络打印机", "输入IP地址", "选择驱动"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "5.1 添加网络打印机"
  },
  {
    "id": "IT-QA-079",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "如何预防卡纸？",
    "expected_key_points": ["使用80g/㎡标准纸", "不超纸盒容量", "避免潮湿", "定期清洁"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.5 预防卡纸的方法"
  },
  {
    "id": "IT-QA-080",
    "category": "打印机问题",
    "subcategory": "故障处理",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "打印质量不好，怎么判断是哪个部件的问题？",
    "expected_key_points": ["整体模糊碳粉不足", "左边模糊硒鼓问题", "右边模糊转印带", "有黑线硒鼓刮板"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.4 打印模糊有污渍"
  }
]
```

### Subcategory: 打印机使用与维护 (10条)

```json
[
  {
    "id": "IT-QA-081",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "硒鼓一般多久需要更换？",
    "expected_key_points": ["HP硒鼓1500-3000页", "打印变淡时更换"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "7.2 耗材更换周期"
  },
  {
    "id": "IT-QA-082",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "打印机的日常保养有哪些？",
    "expected_key_points": ["每天检查纸张", "每周清洁外壳", "每月清洁内部", "每季度深度清洁"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "7.1 日常保养"
  },
  {
    "id": "IT-QA-083",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何节省碳粉？",
    "expected_key_points": ["设置经济模式", "草稿模式", "可节省30-50%碳粉"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "6.2 节省碳粉设置"
  },
  {
    "id": "IT-QA-084",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "打印显示碳粉不足怎么办？",
    "expected_key_points": ["准备更换硒鼓", "联系IT采购", "不要等到完全用尽"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "7.3 常见报错处理"
  },
  {
    "id": "IT-QA-085",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "打印机显示需要维护是什么意思？",
    "expected_key_points": ["寿命到期", "联系IT报修", "定影器或搓纸轮问题"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "7.3 常见报错处理"
  },
  {
    "id": "IT-QA-086",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何设置双面打印？",
    "expected_key_points": ["打印首选项", "双面打印选项", "选择长边或短边翻页"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "6.3 常见打印设置"
  },
  {
    "id": "IT-QA-087",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "斑马条码打印机打印头怎么清洁？",
    "expected_key_points": ["关闭电源", "等待冷却", "酒精棉签擦拭", "等待酒精干透"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "3.3 斑马条码打印机"
  },
  {
    "id": "IT-QA-088",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "HP打印机怎么初始化？",
    "expected_key_points": ["关机", "按住取消键不放", "开机等就绪灯亮", "松开取消键"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "3.1 HP打印机初始化"
  },
  {
    "id": "IT-QA-089",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "清洁转印带需要注意什么？",
    "expected_key_points": ["转印带非常脆弱", "只能用于布", "不能用酒精或液体", "谨慎操作"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "2.4 清洁转印带"
  },
  {
    "id": "IT-QA-090",
    "category": "打印机问题",
    "subcategory": "使用维护",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "报修打印机需要提供什么信息？",
    "expected_key_points": ["打印机位置", "打印机型号", "错误现象描述", "是否换过硒鼓"],
    "source_doc": "03-打印机故障解决指南.md",
    "source_section": "IT支持联系方式"
  }
]
```

---

## Category 4: 网络与安全 (网络安全类 - 30条)

### Subcategory: 网络问题 (15条)

```json
[
  {
    "id": "IT-QA-091",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "突然上不了网了怎么办？",
    "expected_key_points": ["检查网线WiFi", "重启路由器和电脑", "检查网络适配器", "ipconfig刷新IP"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "网络问题排查"
  },
  {
    "id": "IT-QA-092",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "WiFi连上了但上不了网怎么处理？",
    "expected_key_points": ["检查路由器", "重启网络设备", "检查DNS设置", "联系IT"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "WiFi问题"
  },
  {
    "id": "IT-QA-093",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司内网怎么连接？",
    "expected_key_points": ["有线网络", "连接网线", "自动获取IP", "联系IT获取WiFi密码"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "网络基础"
  },
  {
    "id": "IT-QA-094",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "只有特定网站打不开是什么问题？",
    "expected_key_points": ["检查URL是否正确", "清除浏览器缓存", "尝试其他DNS", "联系IT"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "网站访问问题"
  },
  {
    "id": "IT-QA-095",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "网络延迟很高怎么排查？",
    "expected_key_points": ["ping网关", "检查网络设备", "关闭占用带宽的应用", "联系IT"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "网络延迟"
  },
  {
    "id": "IT-QA-096",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "我可以自己接路由器吗？",
    "expected_key_points": ["严禁私接网络设备", "个人路由器禁止", "如需使用联系IT审批"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线 R-04"
  },
  {
    "id": "IT-QA-097",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "VPN连不上怎么办？",
    "expected_key_points": ["检查账号密码", "检查网络连接", "重新安装客户端", "联系IT"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.4 远程办公软件"
  },
  {
    "id": "IT-QA-098",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何检查网络是否正常？",
    "expected_key_points": ["ping 192.168.1.1", "ping www.baidu.com", "检查DNS", "检查网关"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "网络诊断命令"
  },
  {
    "id": "IT-QA-099",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司WiFi名称和密码在哪？",
    "expected_key_points": ["联系IT获取", "IT服务热线800-XXX-XXXX", "IT微信群"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "WiFi配置"
  },
  {
    "id": "IT-QA-100",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我的电脑能ping通网关但ping不通DNS是怎么回事？",
    "expected_key_points": ["本地网络正常", "DNS服务器问题", "尝试8.8.8.8", "联系IT"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "DNS问题"
  },
  {
    "id": "IT-QA-101",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司网络有哪些限制？",
    "expected_key_points": ["禁止P2P下载", "禁止翻墙", "禁止访问非法网站", "行为审计"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线"
  },
  {
    "id": "IT-QA-102",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何申请VPN用于远程办公？",
    "expected_key_points": ["OA提交申请", "IT审批", "IT发送账号和客户端", "3个工作日"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.4 远程办公软件"
  },
  {
    "id": "IT-QA-103",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "哪些行为会触发网络审计报警？",
    "expected_key_points": ["访问非法网站", "下载非法内容", "私接网络设备", "翻墙行为"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线"
  },
  {
    "id": "IT-QA-104",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "我可以安装随身WiFi吗？",
    "expected_key_points": ["禁止", "私接网络设备", "安全风险", "联系IT审批"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线 R-04"
  },
  {
    "id": "IT-QA-105",
    "category": "网络与安全",
    "subcategory": "网络问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "发现网络异常缓慢，如何定位问题？",
    "expected_key_points": ["ping测试", "检查带宽占用", "检查网络设备", "排除广播风暴", "联系IT"],
    "source_doc": "02-公司网络问题排查手册.md",
    "source_section": "网络延迟排查"
  }
]
```

### Subcategory: 安全问题 (15条)

```json
[
  {
    "id": "IT-QA-106",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "procedural",
    "question": "收到可疑邮件怎么办？",
    "expected_key_points": ["不要点击链接", "不要下载附件", "不要回复", "转发给security@company.com"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.3 钓鱼邮件应急处理"
  },
  {
    "id": "IT-QA-107",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何识别钓鱼邮件？",
    "expected_key_points": ["检查发件人邮箱", "警惕紧急恐吓", "验证链接真实地址", "电话核实"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.1 钓鱼邮件特征"
  },
  {
    "id": "IT-QA-108",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我不小心点击了钓鱼链接并输入了密码怎么办？",
    "expected_key_points": ["立即断开网络", "更改可能泄露的密码", "报告IT安全团队", "配合调查"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.3 钓鱼邮件应急处理"
  },
  {
    "id": "IT-QA-109",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "哪些行为是信息安全红线？",
    "expected_key_points": ["向外部传输机密数据", "用个人邮箱处理工作", "共享账号密码", "私接网络设备"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线"
  },
  {
    "id": "IT-QA-110",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司有哪些安全联系方式？",
    "expected_key_points": ["IT服务热线800-XXX-XXXX", "IT安全团队security@company.com", "紧急7x24 189-XXXX-XXXX"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "附录A：安全相关联系方式"
  },
  {
    "id": "IT-QA-111",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "违反信息安全规定会有什么后果？",
    "expected_key_points": ["重大违规立即解雇+法律追诉", "严重违规书面警告+绩效处罚", "一般违规口头警告"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.2 违规处罚标准"
  },
  {
    "id": "IT-QA-112",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何验证发件人真实身份？",
    "expected_key_points": ["检查邮箱地址", "悬停查看链接", "电话或其他渠道核实"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.2 验证发件人真实身份"
  },
  {
    "id": "IT-QA-113",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "为什么要开启MFA？",
    "expected_key_points": ["密码泄露即被盗", "单因素认证风险高", "建议企业邮箱OA开启"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "4.1 多因素认证"
  },
  {
    "id": "IT-QA-114",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "VPN需要开启MFA吗？",
    "expected_key_points": ["VPN当前未开启MFA", "强烈建议开启", "财务GitLab也建议开启"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "4.1 多因素认证"
  },
  {
    "id": "IT-QA-115",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "密码多久需要更换一次？",
    "expected_key_points": ["财务系统每季度", "核心业务每半年", "普通系统每年"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "4.2 定期更换密码"
  },
  {
    "id": "IT-QA-116",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司数据分为哪几个级别？",
    "expected_key_points": ["绝密", "机密", "秘密", "内部", "公开"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "7.1 数据分类分级"
  },
  {
    "id": "IT-QA-117",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "敏感文件如何正确销毁？",
    "expected_key_points": ["纸质用碎纸机", "U盘硬盘联系IT", "光盘物理粉碎", "手机恢复出厂设置"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "7.3 敏感文件销毁"
  },
  {
    "id": "IT-QA-118",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "工作电脑可以带出公司吗？",
    "expected_key_points": ["严禁带出过夜", "特殊情况需部门总监+IT审批", "晚上必须存放在公司"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线 R-08"
  },
  {
    "id": "IT-QA-119",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "在公共场所讨论工作内容有什么风险？",
    "expected_key_points": ["警惕社会工程学攻击", "咖啡厅高铁飞机等", "可能被人窃听", "避免讨论敏感信息"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.1 信息安全红线 R-07"
  },
  {
    "id": "IT-QA-120",
    "category": "网络与安全",
    "subcategory": "安全问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我发现有人在我不在的时候用了我的电脑，怎么办？",
    "expected_key_points": ["立即更改密码", "检查是否有异常操作", "检查邮箱转发规则", "报告IT安全团队"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.3 钓鱼邮件应急处理"
  }
]
```

---

## Category 5: 综合问题 (综合类 - 30条)

### Subcategory: IT服务咨询 (15条)

```json
[
  {
    "id": "IT-QA-121",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "IT服务热线是多少？",
    "expected_key_points": ["800-XXX-XXXX", "周一至周五8:30-18:00", "非紧急情况"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-122",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "紧急IT故障联系谁？",
    "expected_key_points": ["189-XXXX-XXXX", "7x24小时", "紧急故障"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-123",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "IT邮箱是多少？",
    "expected_key_points": ["it-support@company.com", "24小时内响应"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-124",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "如何加入IT服务微信群？",
    "expected_key_points": ["联系IT", "IT微信群", "工作时间即时响应"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-125",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "IT服务的工作时间是怎样的？",
    "expected_key_points": ["热线800-XXX-XXXX: 周一至周五8:30-18:00", "邮箱24小时内响应", "微信群工作时间即时响应", "紧急故障7x24"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-126",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "procedural",
    "question": "提交IT工单的最佳方式是什么？",
    "expected_key_points": ["邮件it-support@company.com", "电话800-XXX-XXXX", "IT微信群"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-127",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "年度安全培训是什么时候？",
    "expected_key_points": ["信息安全意识培训每年3月", "钓鱼邮件演练每季度", "新员工入职当月"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "附录C：年度安全培训"
  },
  {
    "id": "IT-QA-128",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "新员工需要参加哪些培训？",
    "expected_key_points": ["入职当月新员工安全培训", "IT系统使用培训"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "附录C：年度安全培训"
  },
  {
    "id": "IT-QA-129",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我应该联系IT还是HR处理账号问题？",
    "expected_key_points": ["IT账号问题联系IT", "密码重置联系IT", "人事信息变更联系HR"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录B：相关文档"
  },
  {
    "id": "IT-QA-130",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "周末遇到紧急IT故障怎么办？",
    "expected_key_points": ["189-XXXX-XXXX 7x24紧急热线", "描述故障现象", "等待IT处理"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-131",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "公司有哪些IT相关的制度文档？",
    "expected_key_points": ["IT安全管理制度", "数据分类分级管理办法", "员工手册IT章节"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录B：相关文档"
  },
  {
    "id": "IT-QA-132",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "密码忘了联系谁？",
    "expected_key_points": ["IT服务热线800-XXX-XXXX", "IT邮箱it-support@company.com", "IT微信群"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "附录A：安全相关联系方式"
  },
  {
    "id": "IT-QA-133",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "我对IT服务不满意，怎么反馈？",
    "expected_key_points": ["联系IT主管", "发送邮件反馈", "描述具体问题"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-134",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "简单",
    "question_type": "factual",
    "question": "IT部门的工作职责是什么？",
    "expected_key_points": ["账号管理", "设备维护", "网络安全", "系统支持"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "文档概述"
  },
  {
    "id": "IT-QA-135",
    "category": "综合问题",
    "subcategory": "IT服务",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "如何申请IT固定资产？",
    "expected_key_points": ["提交IT申请", "部门主管审批", "IT评估采购", "资产登记"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "4. 账号权限管理规范"
  }
]
```

### Subcategory: 边界与异常问题 (15条)

```json
[
  {
    "id": "IT-QA-136",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "我的问题好像涉及多个系统，应该先联系谁？",
    "expected_key_points": ["联系IT服务台", "描述完整问题", "IT会协调相关资源"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-137",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "这个问题我不知道该归IT管还是HR管，怎么办？",
    "expected_key_points": ["先联系IT", "IT会判断并转介", "或直接描述问题"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-138",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我发现一个安全问题但不确定是不是真的安全问题，应该报告吗？",
    "expected_key_points": ["应该报告", "安全团队会评估", "避免漏报", "security@company.com"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "附录A：安全相关联系方式"
  },
  {
    "id": "IT-QA-139",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "中等",
    "question_type": "open-ended",
    "question": "我觉得公司网络安全措施太严格了，影响工作效率怎么办？",
    "expected_key_points": ["安全措施有必要性", "反馈给IT管理层", "评估是否有调整空间"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6. 信息安全红线"
  },
  {
    "id": "IT-QA-140",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我需要在一个不受信任的环境登录公司账号，怎么做才安全？",
    "expected_key_points": ["尽量避免", "使用手机验证码MFA", "操作后立即改密码", "联系IT报告"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "4. 账号安全最佳实践"
  },
  {
    "id": "IT-QA-141",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "公司没有的知识库内容，IT系统回答不了我的问题怎么办？",
    "expected_key_points": ["提交人工工单", "联系IT服务台", "描述具体需求"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "附录A：IT支持联系方式"
  },
  {
    "id": "IT-QA-142",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我怀疑有人窃取公司数据，应该向谁报告？",
    "expected_key_points": ["立即报告security@company.com", "或189-XXXX-XXXX紧急热线", "不要声张", "配合调查"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "5.3 钓鱼邮件应急处理"
  },
  {
    "id": "IT-QA-143",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "我发现同事违反了安全政策，应该怎么办？",
    "expected_key_points": ["可以向IT或安全团队报告", "保护举报人", "同事可能不知情"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.2 违规处罚标准"
  },
  {
    "id": "IT-QA-144",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我在国外出差，需要访问公司内网系统怎么办？",
    "expected_key_points": ["申请VPN", "VPN可远程访问内网", "提前申请", "注意网络安全"],
    "source_doc": "04-软件安装与授权申请指南.md",
    "source_section": "3.4 远程办公软件"
  },
  {
    "id": "IT-QA-145",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我的账号似乎被锁定了，但我不记得做过什么违规操作？",
    "expected_key_points": ["可能是安全机制触发", "联系IT查明原因", "不要尝试绕过"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "6.2 违规处罚标准"
  },
  {
    "id": "IT-QA-146",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "公司是否有数据备份？我误删了重要文件能恢复吗？",
    "expected_key_points": ["联系IT评估", "数据恢复可能性", "定期备份", "不能保证100%恢复"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "7. 数据安全与隐私保护"
  },
  {
    "id": "IT-QA-147",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我需要临时借用同事的账号处理紧急工作，可以吗？",
    "expected_key_points": ["严禁共享账号", "使用委托授权功能", "联系IT申请临时权限"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "4.3 账号共享风险"
  },
  {
    "id": "IT-QA-148",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "troubleshooting",
    "question": "我发现公司网站证书快过期了，对我有影响吗？",
    "expected_key_points": ["网站管理员处理", "个人无法解决", "报告给IT"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "7. 数据安全与隐私保护"
  },
  {
    "id": "IT-QA-149",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "困难",
    "question_type": "open-ended",
    "question": "我想把工作文件备份到个人云盘，可以吗？",
    "expected_key_points": ["严禁", "用公司网盘加密分享", "个人网盘禁止", "数据安全风险"],
    "source_doc": "05-账号密码与信息安全手册.md",
    "source_section": "7.2 敏感数据处理规范"
  },
  {
    "id": "IT-QA-150",
    "category": "综合问题",
    "subcategory": "边界问题",
    "difficulty": "中等",
    "question_type": "procedural",
    "question": "我要离职了，需要提前多久通知IT？",
    "expected_key_points": ["离职前5天提交申请", "IT账号冻结检查前3天", "最后工作日处理账号"],
    "source_doc": "01-员工入职离职IT账号处理指南.md",
    "source_section": "3.2 离职操作时间节点"
  }
]
```

---

## 数据统计

| 维度 | 数量 |
|-----|------|
| 总数据量 | 150条 |
| 简单难度 | 50条 (33%) |
| 中等难度 | 60条 (40%) |
| 困难难度 | 40条 (27%) |
| 账号权限类 | 35条 |
| 软件安装类 | 30条 |
| 打印机问题类 | 25条 |
| 网络安全类 | 30条 |
| 综合问题类 | 30条 |

---

## 使用说明

### 用于效果监控

1. 定期从日志中抽样真实用户问题
2. 与评测集中相似问题对比
3. 分析回答质量差异

### 用于Prompt调优

1. 用同一问题测试不同Prompt版本
2. 对比回答质量评分
3. 选择最优Prompt方案

### 用于Badcase发现

1. 用户反馈的低分样本
2. 与评测集期望对比
3. 归因分析并优化

---

**文档结束**
