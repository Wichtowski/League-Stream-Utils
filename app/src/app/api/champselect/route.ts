import { NextResponse } from 'next/server';
import { findLCUCredentials, getChampSelectSession } from '@lib/utils/lcu-helpers';
import { MOCK_CHAMP_SELECT_DATA } from '@lib/mocks/champselect';

export async function GET() {
    const credentials = await findLCUCredentials();
    if (!credentials) {
        return NextResponse.json(MOCK_CHAMP_SELECT_DATA, { status: 200 });
    }
    const result = await getChampSelectSession(credentials);
    if (!result.success || !result.data) {
        return NextResponse.json(MOCK_CHAMP_SELECT_DATA, { status: 200 });
    }
    // Optionally, you could enhance the data here to match EnhancedChampSelectSession
    return NextResponse.json(result.data, { status: 200 });
} 