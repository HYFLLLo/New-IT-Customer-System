import { NextRequest, NextResponse } from 'next/server'
import { verifyOptimization } from '@/lib/badcase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyOptimization(params.id)

    if (!result) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to verify optimization:', error)
    return NextResponse.json(
      { error: 'Failed to verify optimization' },
      { status: 500 }
    )
  }
}