const API_BASE = 'http://localhost:8787';

async function cleanup2025Data() {
  console.log('🧹 Starting cleanup of 2025 test data...');

  try {
    // Fetch all shifts to identify 2025 ones
    console.log('📋 Fetching all shifts to identify 2025 test data...');
    
    const response = await fetch(`${API_BASE}/api/shifts`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Failed to fetch shifts:', result.error);
      return;
    }

    const allShifts = result.data || [];
    console.log(`📊 Found ${allShifts.length} total shifts in database`);

    // Filter shifts that are from 2025
    const shifts2025 = allShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate.getFullYear() === 2025;
    });

    console.log(`🎯 Found ${shifts2025.length} shifts from year 2025`);

    if (shifts2025.length === 0) {
      console.log('✅ No 2025 shifts found. Nothing to clean up.');
      return;
    }

    // Ask for confirmation (in a real scenario, you'd want user input)
    console.log(`⚠️  About to delete ${shifts2025.length} shifts from 2025`);
    console.log('📅 Date range:', {
      earliest: new Date(Math.min(...shifts2025.map(s => new Date(s.startTime)))).toLocaleDateString(),
      latest: new Date(Math.max(...shifts2025.map(s => new Date(s.startTime)))).toLocaleDateString()
    });

    // Delete shifts in batches
    const batchSize = 50;
    let deletedCount = 0;
    let failedCount = 0;

    console.log(`🔄 Starting deletion in batches of ${batchSize}...`);

    for (let i = 0; i < shifts2025.length; i += batchSize) {
      const batch = shifts2025.slice(i, i + batchSize);
      
      console.log(`🗑️  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(shifts2025.length / batchSize)} (${batch.length} shifts)`);
      
      for (const shift of batch) {
        try {
          const deleteResponse = await fetch(`${API_BASE}/api/shifts/${shift.id}`, {
            method: 'DELETE',
          });
          
          const deleteResult = await deleteResponse.json();
          if (deleteResult.success) {
            deletedCount++;
          } else {
            failedCount++;
            if (failedCount <= 10) { // Only log first 10 failures
              console.log(`❌ Failed to delete shift ${shift.id}: ${shift.title}`, deleteResult.error);
            }
          }
        } catch (error) {
          failedCount++;
          if (failedCount <= 10) {
            console.log(`❌ Error deleting shift ${shift.id}: ${shift.title}`, error.message);
          }
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Progress update
      if ((i + batchSize) % 200 === 0 || i + batchSize >= shifts2025.length) {
        console.log(`📈 Progress: ${deletedCount} deleted, ${failedCount} failed so far...`);
      }
    }

    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Successfully deleted: ${deletedCount} shifts`);
    console.log(`❌ Failed to delete: ${failedCount} shifts`);
    console.log(`📊 Total processed: ${shifts2025.length} shifts`);
    console.log(`📈 Success rate: ${((deletedCount / shifts2025.length) * 100).toFixed(1)}%`);

    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const verifyResponse = await fetch(`${API_BASE}/api/shifts`);
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.success) {
      const remainingShifts = verifyResult.data || [];
      const remaining2025 = remainingShifts.filter(shift => {
        const shiftDate = new Date(shift.startTime);
        return shiftDate.getFullYear() === 2025;
      });
      
      console.log(`📊 Remaining shifts in database: ${remainingShifts.length}`);
      console.log(`📅 Remaining 2025 shifts: ${remaining2025.length}`);
      
      if (remaining2025.length === 0) {
        console.log('✅ All 2025 test data has been successfully removed!');
      } else {
        console.log(`⚠️  ${remaining2025.length} 2025 shifts still remain (these may have failed to delete)`);
      }
    }

    // Optional: Clean up orphaned data
    console.log('\n🧹 Checking for cleanup of test staff/clients created during seeding...');
    console.log('ℹ️  Note: This script only removes shifts. If you want to remove test staff/clients,');
    console.log('ℹ️  you may need to manually review and delete them from the admin panel.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Alternative function to delete shifts by date range
async function cleanup2025DataByDateRange(startDate = '2025-01-01', endDate = '2025-12-31') {
  console.log(`🧹 Starting cleanup of shifts between ${startDate} and ${endDate}...`);

  try {
    const response = await fetch(`${API_BASE}/api/shifts`);
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Failed to fetch shifts:', result.error);
      return;
    }

    const allShifts = result.data || [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    const shiftsInRange = allShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= start && shiftDate <= end;
    });

    console.log(`🎯 Found ${shiftsInRange.length} shifts in date range ${startDate} to ${endDate}`);

    if (shiftsInRange.length === 0) {
      console.log('✅ No shifts found in the specified date range.');
      return;
    }

    // Delete the shifts
    let deletedCount = 0;
    for (const shift of shiftsInRange) {
      try {
        const deleteResponse = await fetch(`${API_BASE}/api/shifts/${shift.id}`, {
          method: 'DELETE',
        });
        
        const deleteResult = await deleteResponse.json();
        if (deleteResult.success) {
          deletedCount++;
        }
      } catch (error) {
        console.log(`❌ Error deleting shift ${shift.id}:`, error.message);
      }
    }

    console.log(`✅ Deleted ${deletedCount} out of ${shiftsInRange.length} shifts`);

  } catch (error) {
    console.error('❌ Error during date range cleanup:', error);
  }
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cleanup2025Data,
    cleanup2025DataByDateRange
  };
}

// Run cleanup if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: clean all 2025 data
    console.log('🚀 Starting full 2025 data cleanup...');
    cleanup2025Data().then(() => {
      console.log('✨ Cleanup process completed!');
    }).catch(error => {
      console.error('💥 Cleanup failed:', error);
    });
  } else if (args.length === 2) {
    // Custom date range
    const [startDate, endDate] = args;
    console.log(`🚀 Starting cleanup for date range: ${startDate} to ${endDate}`);
    cleanup2025DataByDateRange(startDate, endDate).then(() => {
      console.log('✨ Date range cleanup completed!');
    }).catch(error => {
      console.error('💥 Date range cleanup failed:', error);
    });
  } else {
    console.log('Usage:');
    console.log('  node cleanup-2025-data.js                    # Clean all 2025 data');
    console.log('  node cleanup-2025-data.js 2025-01-01 2025-03-31  # Clean specific date range');
  }
} 