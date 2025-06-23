import { NextRequest, NextResponse } from 'next/server';
import { deleteGameSession } from '@lib/database';
import { withAuth } from '@lib/auth';

export const DELETE = withAuth(async (
  req: NextRequest,
  user
) => {
  try {
    const url = new URL(req.url);
    const sessionId = url.search.split('/').pop() || '';
    
    // Verify admin access
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Delete the session
    const deleted = await deleteGameSession(sessionId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}); 