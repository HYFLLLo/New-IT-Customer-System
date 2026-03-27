import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
  console.log('Seeding database...')

  // Create users
  const employee = await prisma.user.upsert({
    where: { email: 'zhangsan@company.com' },
    update: {},
    create: {
      id: 'emp-001',
      name: '张三',
      email: 'zhangsan@company.com',
      role: 'EMPLOYEE',
    },
  })

  const agent = await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: {},
    create: {
      id: 'agent-001',
      name: '坐席小王',
      email: 'agent@example.com',
      role: 'AGENT',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'admin-001',
      name: '管理员',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  })

  console.log('Created users:', { employee, agent, admin })

  // Create a sample document
  const doc = await prisma.document.create({
    data: {
      title: 'IT桌面运维常见问题指南',
      fileName: 'it-support-guide.md',
      fileType: 'MARKDOWN',
      filePath: '/uploads/it-support-guide.md',
      status: 'PROCESSED',
      uploadedById: admin.id,
    },
  })

  // Create sample chunks
  const chunks = [
    {
      content: '电脑蓝屏问题的解决方法：\n\n1. 首先记录蓝屏错误代码（通常是 0x000000xx 格式）\n2. 重启电脑，进入安全模式（开机时按 F8）\n3. 检查最近是否安装了新软件或驱动\n4. 如果有，请卸载后重新安装稳定版本驱动\n5. 运行 Windows 内存诊断工具检查 RAM\n6. 检查硬盘健康状态（使用 CrystalDiskInfo）',
      documentId: doc.id,
      chromaId: `${doc.id}-chunk-0`,
    },
    {
      content: '网络连接不上的排查步骤：\n\n1. 检查网线是否插好，或 WiFi 是否连接\n2. 重启路由器和电脑\n3. 检查网络适配器是否启用\n4. 运行 ipconfig /release 和 ipconfig /renew 刷新 IP\n5. 检查是否可以 ping 通网关\n6. 如仍无法解决，联系 IT 部门',
      documentId: doc.id,
      chromaId: `${doc.id}-chunk-1`,
    },
    {
      content: '打印机无法连接的解决方案：\n\n1. 检查打印机是否开机并连接\n2. 确认电脑和打印机在同一个网络\n3. 在控制面板中删除并重新添加打印机\n4. 更新打印机驱动程序\n5. 检查打印服务是否运行（services.msc）',
      documentId: doc.id,
      chromaId: `${doc.id}-chunk-2`,
    },
    {
      content: '账号权限申请流程：\n\n1. 联系直属上级审批\n2. 登录 IT 帮辅系统提交申请\n3. 说明需要的系统权限\n4. IT 部门会在 24 小时内处理\n5. 审批通过后，权限会自动生效',
      documentId: doc.id,
      chromaId: `${doc.id}-chunk-3`,
    },
    {
      content: '软件安装申请流程：\n\n1. 登录 IT 帮辅系统\n2. 选择"软件安装申请"\n3. 填写软件名称和用途\n4. 等待部门经理和 IT 部门审批\n5. 审批通过后，可以远程安装或自行下载',
      documentId: doc.id,
      chromaId: `${doc.id}-chunk-4`,
    },
  ]

  for (const chunk of chunks) {
    await prisma.chunk.create({ data: chunk })
  }

  console.log('Created document with chunks')
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
