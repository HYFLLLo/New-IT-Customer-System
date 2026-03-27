'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Report {
  id: string
  title: string
  content: string
  createdAt: string
  ticket: {
    id: string
    title: string
    employee: { name: string }
  }
}

export default function ReportPage() {
  const params = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [params.id])

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/feedback?ticketId=${params.id}`)
      // For demo, we'll use mock data since there's no dedicated report endpoint
      setReport({
        id: params.id as string,
        title: 'IT问题质检报告',
        content: `【问题描述】
        电脑蓝屏问题

        【解决步骤】
        1. 首先记录蓝屏错误代码（通常是 0x000000xx 格式）
        2. 重启电脑，进入安全模式
        3. 检查最近是否安装了新软件或驱动
        4. 如果有，请卸载后重新安装稳定版本驱动
        5. 运行 Windows 内存诊断工具检查 RAM
        6. 检查硬盘健康状态（使用 CrystalDiskInfo）
        7. 如问题依旧，请联系 IT 部门安排上门检测

        【注意事项】
        - 蓝屏代码是诊断的关键，请务必记录
        - 避免使用来历不明的驱动程序
        - 定期更新系统补丁`,
        createdAt: new Date().toISOString(),
        ticket: {
          id: params.id as string,
          title: '电脑蓝屏问题',
          employee: { name: '张三' },
        },
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">报告不存在</p>
          <Link href="/employee/history" className="text-blue-600 hover:underline">
            返回历史记录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/employee/history" className="text-blue-600 hover:underline text-sm">
            ← 返回
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">{report.title}</h1>
          <p className="text-sm text-gray-500">
            工单: {report.ticket.title} · {new Date(report.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
          </div>

          {/* Contact Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">问题是否解决了？</p>
            <div className="flex gap-4">
              <Link
                href={`/employee/feedback/${report.ticket.id}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✓ 问题已解决
              </Link>
              <button
                onClick={() => alert('工作人员将尽快联系您，请保持电话畅通')}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                📞 联系工作人员
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
