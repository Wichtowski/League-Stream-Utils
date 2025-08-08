import { NextRequest, NextResponse } from 'next/server';
import { withAuth, setSecurityHeaders } from '@lib/auth';
import { getUserByUsername } from '@lib/database/user';
import { UserModel } from '@lib/database/models';
import { JWTPayload } from '@lib/types/auth';
import {
    validatePassword,
    verifyPassword,
    hashPassword,
    isPasswordReused,
    updatePasswordHistory,
    getClientIP
} from '@lib/utils/security/security';
import { logSecurityEvent } from '@lib/database/security';

export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return setSecurityHeaders(
                NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
            );
        }

        // Admin users can't change password through this endpoint
        if (user.userId === 'admin') {
            return setSecurityHeaders(
                NextResponse.json(
                    {
                        error: 'Admin password changes must be done through environment variables'
                    },
                    { status: 403 }
                )
            );
        }

        // Get user from database
        const userData = await getUserByUsername(user.username);
        if (!userData) {
            return setSecurityHeaders(NextResponse.json({ error: 'User not found' }, { status: 404 }));
        }

        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, userData.password);
        if (!isCurrentPasswordValid) {
            await logSecurityEvent({
                timestamp: new Date(),
                event: 'password_change_invalid_current',
                userId: user.userId,
                ip,
                userAgent,
                details: {}
            });

            return setSecurityHeaders(NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 }));
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return setSecurityHeaders(NextResponse.json({ error: passwordValidation.message }, { status: 400 }));
        }

        // Check password history
        const passwordHistory = userData.passwordHistory || [];
        const isReused = await isPasswordReused(newPassword, [userData.password, ...passwordHistory]);
        if (isReused) {
            await logSecurityEvent({
                timestamp: new Date(),
                event: 'password_change_reused_password',
                userId: user.userId,
                ip,
                userAgent,
                details: {}
            });

            return setSecurityHeaders(
                NextResponse.json(
                    {
                        error: 'Cannot reuse a previous password. Please choose a different password.'
                    },
                    { status: 400 }
                )
            );
        }

        const hashedNewPassword = await hashPassword(newPassword);

        const updatedPasswordHistory = updatePasswordHistory(userData.password, passwordHistory);

        await UserModel.updateOne(
            { id: user.userId },
            {
                $set: {
                    password: hashedNewPassword,
                    passwordHistory: updatedPasswordHistory
                }
            }
        );

        await logSecurityEvent({
            timestamp: new Date(),
            event: 'password_change_success',
            userId: user.userId,
            ip,
            userAgent,
            details: {}
        });

        return setSecurityHeaders(
            NextResponse.json({
                message: 'Password changed successfully'
            })
        );
    } catch (error) {
        console.error('Password change error:', error);

        await logSecurityEvent({
            timestamp: new Date(),
            event: 'password_change_error',
            userId: user.userId,
            ip,
            userAgent,
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        });

        return setSecurityHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
    }
});
