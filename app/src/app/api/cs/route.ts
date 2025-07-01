import { NextResponse } from 'next/server';
import { findLCUCredentials, getChampSelectSession } from '@lib/utils/lcu-helpers';
import { MOCK_CHAMP_SELECT_DATA } from '@lib/mocks/champselect';

// GET champion-select data (short path alias).
export async function GET(): Promise<NextResponse> {
    const credentials = await findLCUCredentials();
    if (!credentials) {
        return NextResponse.json(MOCK_CHAMP_SELECT_DATA, { status: 200 });
    }

    const result = await getChampSelectSession(credentials);
    if (!result.success || !result.data) {
        return NextResponse.json(MOCK_CHAMP_SELECT_DATA, { status: 200 });
    }

    return NextResponse.json(result.data, { status: 200 });
} 