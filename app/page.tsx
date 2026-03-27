'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Headphones, Bot, FileText, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Bot className="w-4 h-4" />
            AI 驱动的智能运维系统
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">企业IT运维工单系统</h1>
          <p className="text-xl text-gray-600">智能化桌面运维支持平台</p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Employee Portal */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">员工端</CardTitle>
              <CardDescription className="text-base">
                提交问题、获取AI智能解答、查看工单进度
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/employee">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                  进入员工端
                </Button>
              </Link>
              <ul className="mt-6 text-sm text-gray-600 space-y-3 text-left">
                <li className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  快速提问，AI即时响应
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  智能置信度评估
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  工单实时跟踪
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Agent Portal */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Headphones className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">坐席端</CardTitle>
              <CardDescription className="text-base">
                管理知识库、处理工单、AI辅助生成质检报告
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/agent/login">
                <Button size="lg" variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50">
                  进入坐席端
                </Button>
              </Link>
              <ul className="mt-6 text-sm text-gray-600 space-y-3 text-left">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  知识库统一管理
                </li>
                <li className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-500" />
                  AI辅助生成回复
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  满意度统计分析
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            🤖 由 AI 驱动的智能运维支持系统
          </p>
        </div>
      </div>
    </div>
  )
}
