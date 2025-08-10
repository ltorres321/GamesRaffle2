import { NextResponse } from 'next/server'

// Mock user storage (shared with other endpoints)
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
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Mock verification - accept specific codes for testing
    const validCodes = ['123456', '111111', 'SMS123', '654321']
    
    if (!validCodes.includes(code)) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Update user verification status
    const user = mockUsers.get('mock_user_123')
    if (user) {
      user.phoneVerified = true
      user.isVerified = user.emailVerified && user.phoneVerified
      user.requiresVerification = !user.isVerified
      mockUsers.set('mock_user_123', user)
    }

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully!',
      data: {
        phoneVerified: true,
        fullyVerified: user?.isVerified || false
      }
    })
    
  } catch (error) {
    console.error('Phone verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}