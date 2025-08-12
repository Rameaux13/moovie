import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'API en maintenance' }, { status: 503 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'API en maintenance' }, { status: 503 })
}
