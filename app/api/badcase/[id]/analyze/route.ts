import { NextRequest, NextResponse } from 'next/server'
import { analyzeBadcase } from '@/lib/badcase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params.id || !/^[0-9a-f-]{36}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Invalid badcase ID' }, { status: 400 })
  }

  try {
    const result = await analyzeBadcase(params.id)

    if (!result) {
      return NextResponse.json(
        { error: 'Analysis failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to analyze badcase:', error)
    return NextResponse.json(
      { error: 'Failed to analyze badcase' },
      { status: 500 }
    )
  }
}