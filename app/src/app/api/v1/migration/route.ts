import { NextResponse } from 'next/server';
import { localDataMigrationService } from '../../../../../electron/utils/local-data-migration-service';

export async function GET(): Promise<NextResponse> {
  try {
    const status = await localDataMigrationService.getMigrationStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Migration status check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check migration status' 
      },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const result = await localDataMigrationService.migrateFromLocalStorage();
    
    return NextResponse.json({
      success: result.success,
      data: {
        migratedItems: result.migratedItems,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed' 
      },
      { status: 500 }
    );
  }
}
