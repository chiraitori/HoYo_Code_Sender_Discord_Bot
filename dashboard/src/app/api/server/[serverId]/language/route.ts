import { NextRequest, NextResponse } from 'next/server';
import { createBotApiUrl, createBotApiOptions } from '@/utils/botApiUrl';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const { serverId } = await params;

        // Fetch server language from main bot API with authentication
        const response = await fetch(createBotApiUrl(`/api/server/${serverId}/language`), createBotApiOptions());

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch server language' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching server language:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const resolvedParams = await params;
        const { serverId } = resolvedParams;
        const body = await request.json();

        // Forward the request to the main bot API with authentication
        const response = await fetch(createBotApiUrl(`/api/server/${serverId}/language`), createBotApiOptions({
            method: 'PUT',
            body: JSON.stringify(body),
        }));

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to update language' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to update server language:', error);
        return NextResponse.json(
            { error: 'Failed to update language' },
            { status: 500 }
        );
    }
}
