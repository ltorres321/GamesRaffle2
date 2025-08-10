import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Mock user data until we connect to SQL Server
const mockUsers = new Map()

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, 'your-secret-key') as any
      const userId = decoded.id
      
      // Get user from mock storage
      const user = mockUsers.get(userId)
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }

      // Return user info without password
      const { password, ...userWithoutPassword } = user
      
      return NextResponse.json({
        success: true,
        data: {
          user: userWithoutPassword
        }
      })
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('User info fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}