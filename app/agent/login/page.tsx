'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, LogIn, Eye, EyeOff, Loader2, Cpu } from 'lucide-react'

export default function AgentLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '登录失败')
        setLoading(false)
        return
      }

      toast.success(`欢迎回来，${data.user.name}！`)
      router.push('/agent/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('登录失败，请重试')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid-bg flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#ff00aa] rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#9d00ff] rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-[#ff00aa] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <Card className="bg-[#12122a]/80 backdrop-blur border border-[#ff00aa]/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#ff00aa]/20 to-[#ff00aa]/5 rounded-2xl flex items-center justify-center mb-4 border border-[#ff00aa]/30 cyber-glow-pink">
              <LogIn className="w-8 h-8 text-[#ff00aa]" />
            </div>
            <CardTitle className="text-2xl text-white">坐席端登录</CardTitle>
            <CardDescription className="text-[#8888aa]">请输入您的账号信息</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#e0e0ff]">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="bg-[#0a0a0f] border-[#2a2a4a] text-white placeholder:text-[#666688] focus:border-[#ff00aa]/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#e0e0ff]">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#0a0a0f] border-[#2a2a4a] text-white placeholder:text-[#666688] focus:border-[#ff00aa]/50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888aa] hover:text-[#ff00aa] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-[#ff00aa] to-[#ff3366] text-white hover:opacity-90 cyber-glow-pink" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Cpu className="w-4 h-4 mr-2" />
                )}
                登录
              </Button>
            </form>

            <div className="mt-6 p-4 bg-[#0a0a0f] rounded-lg border border-[#2a2a4a]">
              <p className="text-sm font-medium text-[#e0e0ff] mb-2">演示账号：</p>
              <div className="space-y-1 text-sm text-[#8888aa]">
                <p>坐席：agent@example.com / agent123</p>
                <p>管理员：admin@example.com / admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
