import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // If user has password hash, verify it
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        )
      }
    } else {
      // For users without password (created during seeding), use default passwords
      const defaultPasswords: Record<string, string> = {
        'agent@example.com': 'agent123',
        'admin@example.com': 'admin123',
      }
      
      if (defaultPasswords[email] !== password) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        )
      }
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'EMPLOYEE' | 'AGENT' | 'ADMIN',
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })

    // Set auth cookie
    response.headers.set('Set-Cookie', setAuthCookie(token))

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}
