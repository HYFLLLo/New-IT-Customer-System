'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Users, Headphones, Cpu, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00f0ff] rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff00aa] rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#12122a] rounded-full border border-[#00f0ff]/30 mb-6">
            <Cpu className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-sm text-[#00f0ff]">AI驱动的智能运维系统</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-[#00f0ff] via-[#9d00ff] to-[#ff00aa] bg-clip-text text-transparent">
              企业IT运维工单系统
            </span>
          </h1>
          <p className="text-xl text-[#8888aa]">智能化桌面运维支持平台</p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Employee Portal */}
          <Link href="/employee">
            <Card className="bg-[#12122a]/80 backdrop-blur border border-[#00f0ff]/20 hover:border-[#00f0ff]/60 transition-all duration-500 group hover:cyber-glow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#00f0ff]/20 to-[#00f0ff]/5 rounded-2xl flex items-center justify-center mb-4 border border-[#00f0ff]/30 group-hover:border-[#00f0ff]/60 transition-colors">
                  <Users className="w-8 h-8 text-[#00f0ff]" />
                </div>
                <CardTitle className="text-2xl text-white">员工端</CardTitle>
                <CardDescription className="text-[#8888aa]">
                  提交问题、获取AI智能解答、查看工单进度
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button size="lg" className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] font-semibold hover:opacity-90 cyber-glow">
                  <Zap className="w-4 h-4 mr-2" />
                  进入员工端
                </Button>
                <ul className="mt-6 text-sm text-[#8888aa] space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#00f0ff]" />
                    快速提问，AI即时响应
                  </li>
                  <li className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#00f0ff]" />
                    智能置信度评估
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00f0ff]" />
                    工单实时跟踪
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Agent Portal */}
          <Link href="/agent/login">
            <Card className="bg-[#12122a]/80 backdrop-blur border border-[#ff00aa]/20 hover:border-[#ff00aa]/60 transition-all duration-500 group hover:cyber-glow-pink">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-2xl flex items-center justify-center mb-4 border border-[#ff00aa]/30 group-hover:border-[#ff00aa]/60 transition-colors">
                  <Headphones className="w-8 h-8 text-[#ff00aa]" />
                </div>
                <CardTitle className="text-2xl text-white">坐席端</CardTitle>
                <CardDescription className="text-[#8888aa]">
                  管理知识库、处理工单、AI辅助生成质检报告
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button size="lg" variant="outline" className="w-full border-[#ff00aa] text-[#ff00aa] hover:bg-[#ff00aa]/10 hover:border-[#ff00aa] cyber-glow-pink">
                  <Zap className="w-4 h-4 mr-2" />
                  进入坐席端
                </Button>
                <ul className="mt-6 text-sm text-[#8888aa] space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#ff00aa]" />
                    知识库统一管理
                  </li>
                  <li className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#ff00aa]" />
                    AI辅助生成回复
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#ff00aa]" />
                    满意度统计分析
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#666688]">
            <span className="text-[#00f0ff]">🤖</span> 由 AI 驱动的智能运维支持系统
          </p>
        </div>
      </div>
    </div>
  )
}
