import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for migration progress
const migrationProgress = new Map<number, any>()

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { terminal, task, status, progress } = data

    // Store progress
    migrationProgress.set(terminal, {
      terminal,
      task,
      status,
      progress,
      timestamp: new Date().toISOString()
    })

    console.log(`Terminal ${terminal} - ${task}: ${status} (${progress}%)`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const progress = Array.from(migrationProgress.values())
  return NextResponse.json({ progress })
}