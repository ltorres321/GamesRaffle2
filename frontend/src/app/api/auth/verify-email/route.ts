import { NextResponse } from 'next/server'

// Mock user storage (shared with /me endpoint)
const mockUsers = new Map()

// Initialize with test user
mockUsers.set('mock_user_123', {
  id: "mock_user_123",
  username: "testuser",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  dateOfBirth: "1990-01-01",
  streetAddress: "123 Main St",
  city: "Anytown",
  state: "CA",
  zipCode: "12345",
  country: "United States",
  role: 'user',
  emailVerified: false,
  phoneVerified: false,
  isVerified: false,
  isActive: true,
  requiresVerification: true,
  taxVerificationStatus: 'not_required'
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Mock verification - accept specific codes for testing
    const validCodes = ['123456', '111111', 'EMAIL123']
    
    if (!validCodes.includes(token)) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Update user verification status
    const user = mockUsers.get('mock_user_123')
    if (user) {
      user.emailVerified = true
      user.isVerified = user.emailVerified && user.phoneVerified
      mockUsers.set('mock_user_123', user)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        emailVerified: true
      }
    })
    
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}