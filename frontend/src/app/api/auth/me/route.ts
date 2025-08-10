import { NextResponse } from 'next/server'

// Shared mock user storage (in production this would be SQL Server)
const mockUsers = new Map()

// Add a default user for testing
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
    
    // For mock implementation, extract user ID from token string
    // In production, this would use JWT verification with a real secret
    const isValidToken = token.startsWith('mock_access_token_')
    if (!isValidToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // For mock, always return the default test user
    // In production, extract userId from JWT payload
    const user = mockUsers.get('mock_user_123')
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
    
  } catch (error) {
    console.error('User info fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// Export the mock users for other endpoints to use
export { mockUsers }