const API_BASE = 'http://localhost:8787';

// Helper function to generate dates for 2025
function generateDatesFor2025() {
  const dates = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

function getRandomTime(startHour = 6, endHour = 22) {
  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  return { hour, minute };
}

function createShiftDateTime(baseDate, startTime, durationHours = 4) {
  const startDate = new Date(baseDate);
  startDate.setHours(startTime.hour, startTime.minute, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + durationHours);
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

function getRandomInstructions() {
  const instructions = [
    'Please use eco-friendly cleaning products only',
    'Focus on high-traffic areas and reception',
    'Deep clean bathrooms and kitchen areas',
    'Pay special attention to glass surfaces and mirrors',
    'Vacuum all carpeted areas thoroughly',
    'Sanitize all door handles and light switches',
    'Empty all trash bins and replace liners',
    'Clean and disinfect all work surfaces',
    'Mop floors with appropriate cleaning solution',
    'Dust all furniture and electronics carefully',
    'Clean windows and remove fingerprints',
    'Organize common areas and break rooms',
    'Follow all safety protocols and wear PPE',
    'Report any maintenance issues discovered',
    'Ensure security protocols are followed throughout',
    'Special event cleaning - extra attention to detail',
    'Post-construction cleanup required',
    'Medical grade disinfection protocol',
    'Industrial equipment cleaning required',
    'Food service area deep sanitization',
    'VIP client visit - premium service level',
    'Emergency cleanup - respond immediately',
    'Quarterly deep clean scheduled',
    'Holiday preparation cleaning',
    'Year-end comprehensive maintenance'
  ];
  
  return instructions[Math.floor(Math.random() * instructions.length)];
}

async function seed2025Data() {
  console.log('🌱 Seeding database with comprehensive 2025 data for performance testing...');

  try {
    // First, create essential data if it doesn't exist
    console.log('📋 Checking existing data...');
    
    let existingStaff = [];
    let existingClients = [];
    let existingLocations = [];
    let existingTeams = [];
    
    try {
      // Fetch existing data
      const staffResponse = await fetch(`${API_BASE}/api/staff`);
      const staffResult = await staffResponse.json();
      existingStaff = staffResult.success ? staffResult.data : [];

      const clientsResponse = await fetch(`${API_BASE}/api/clients`);
      const clientsResult = await clientsResponse.json();
      existingClients = clientsResult.success ? clientsResult.data : [];

      const locationsResponse = await fetch(`${API_BASE}/api/locations`);
      const locationsResult = await locationsResponse.json();
      existingLocations = locationsResult.success ? locationsResult.data : [];

      const teamsResponse = await fetch(`${API_BASE}/api/teams`);
      const teamsResult = await teamsResponse.json();
      existingTeams = teamsResult.success ? teamsResult.data : [];

      console.log(`📊 Found: ${existingStaff.length} staff, ${existingClients.length} clients, ${existingLocations.length} locations, ${existingTeams.length} teams`);
    } catch (error) {
      console.log('❌ Error fetching existing data:', error.message);
    }

    // Create additional staff if needed
    if (existingStaff.length < 50) {
      console.log('👥 Creating additional staff members...');
      const additionalStaff = [
        // Morning Shift Staff
        { name: 'Alex Johnson', email: 'alex.johnson@cleanerrooster.com', role: 'staff', phone: '+1-555-5001' },
        { name: 'Maria Gonzalez', email: 'maria.gonzalez@cleanerrooster.com', role: 'staff', phone: '+1-555-5002' },
        { name: 'David Kim', email: 'david.kim@cleanerrooster.com', role: 'staff', phone: '+1-555-5003' },
        { name: 'Jennifer Lopez', email: 'jennifer.lopez@cleanerrooster.com', role: 'staff', phone: '+1-555-5004' },
        { name: 'Michael Chang', email: 'michael.chang@cleanerrooster.com', role: 'staff', phone: '+1-555-5005' },
        
        // Afternoon Shift Staff  
        { name: 'Lisa Wang', email: 'lisa.wang@cleanerrooster.com', role: 'staff', phone: '+1-555-5006' },
        { name: 'Robert Chen', email: 'robert.chen@cleanerrooster.com', role: 'staff', phone: '+1-555-5007' },
        { name: 'Amanda Rodriguez', email: 'amanda.rodriguez@cleanerrooster.com', role: 'staff', phone: '+1-555-5008' },
        { name: 'Kevin Thompson', email: 'kevin.thompson@cleanerrooster.com', role: 'staff', phone: '+1-555-5009' },
        { name: 'Sarah Mitchell', email: 'sarah.mitchell@cleanerrooster.com', role: 'staff', phone: '+1-555-5010' },
        
        // Evening Shift Staff
        { name: 'James Wilson', email: 'james.wilson@cleanerrooster.com', role: 'staff', phone: '+1-555-5011' },
        { name: 'Nicole Brown', email: 'nicole.brown@cleanerrooster.com', role: 'staff', phone: '+1-555-5012' },
        { name: 'Andrew Davis', email: 'andrew.davis@cleanerrooster.com', role: 'staff', phone: '+1-555-5013' },
        { name: 'Michelle Garcia', email: 'michelle.garcia@cleanerrooster.com', role: 'staff', phone: '+1-555-5014' },
        { name: 'Brandon Lee', email: 'brandon.lee@cleanerrooster.com', role: 'staff', phone: '+1-555-5015' },
        
        // Weekend Staff
        { name: 'Jessica Martin', email: 'jessica.martin@cleanerrooster.com', role: 'staff', phone: '+1-555-5016' },
        { name: 'Christopher White', email: 'christopher.white@cleanerrooster.com', role: 'staff', phone: '+1-555-5017' },
        { name: 'Ashley Taylor', email: 'ashley.taylor@cleanerrooster.com', role: 'staff', phone: '+1-555-5018' },
        { name: 'Daniel Anderson', email: 'daniel.anderson@cleanerrooster.com', role: 'staff', phone: '+1-555-5019' },
        { name: 'Stephanie Jackson', email: 'stephanie.jackson@cleanerrooster.com', role: 'staff', phone: '+1-555-5020' },
        
        // Specialist Staff
        { name: 'Matthew Harris', email: 'matthew.harris@cleanerrooster.com', role: 'staff', phone: '+1-555-5021' },
        { name: 'Kimberly Clark', email: 'kimberly.clark@cleanerrooster.com', role: 'staff', phone: '+1-555-5022' },
        { name: 'Tyler Lewis', email: 'tyler.lewis@cleanerrooster.com', role: 'staff', phone: '+1-555-5023' },
        { name: 'Megan Walker', email: 'megan.walker@cleanerrooster.com', role: 'staff', phone: '+1-555-5024' },
        { name: 'Jonathan Hall', email: 'jonathan.hall@cleanerrooster.com', role: 'staff', phone: '+1-555-5025' },
        
        // Supervisors
        { name: 'Patricia Young', email: 'patricia.young@cleanerrooster.com', role: 'supervisor', phone: '+1-555-6001' },
        { name: 'Mark Wright', email: 'mark.wright@cleanerrooster.com', role: 'supervisor', phone: '+1-555-6002' },
        { name: 'Linda King', email: 'linda.king@cleanerrooster.com', role: 'supervisor', phone: '+1-555-6003' },
        { name: 'Thomas Scott', email: 'thomas.scott@cleanerrooster.com', role: 'supervisor', phone: '+1-555-6004' },
        { name: 'Barbara Green', email: 'barbara.green@cleanerrooster.com', role: 'supervisor', phone: '+1-555-6005' },
        
        // Managers
        { name: 'Steven Adams', email: 'steven.adams@cleanerrooster.com', role: 'manager', phone: '+1-555-7001' },
        { name: 'Susan Baker', email: 'susan.baker@cleanerrooster.com', role: 'manager', phone: '+1-555-7002' },
        { name: 'William Nelson', email: 'william.nelson@cleanerrooster.com', role: 'manager', phone: '+1-555-7003' },
        { name: 'Karen Carter', email: 'karen.carter@cleanerrooster.com', role: 'manager', phone: '+1-555-7004' },
        { name: 'Joseph Mitchell', email: 'joseph.mitchell@cleanerrooster.com', role: 'manager', phone: '+1-555-7005' }
      ];

      for (const staff of additionalStaff) {
        try {
          const response = await fetch(`${API_BASE}/api/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staff),
          });
          const result = await response.json();
          if (result.success) {
            existingStaff.push(result.data);
          }
        } catch (error) {
          console.log(`❌ Failed to create staff: ${staff.name}`);
        }
      }
    }

    // Create additional clients if needed
    if (existingClients.length < 20) {
      console.log('🏢 Creating additional clients...');
      const additionalClients = [
        {
          name: 'Enterprise Business Center',
          email: 'facilities@enterprise-bc.com',
          phone: '+1-555-8001',
          company: 'Enterprise Business Center',
          abn: '11111111111',
          acn: '111111111',
          address: '100 Business Park Dr, Enterprise City, CA 90210',
          clientInstruction: 'Standard office cleaning with carpet care',
          clientInfo: 'Multi-tenant office complex',
          propertyInfo: '5-story business center with 50+ offices',
        },
        {
          name: 'Retail Shopping Complex',
          email: 'maintenance@retailcomplex.com',
          phone: '+1-555-8002',
          company: 'Retail Shopping Complex',
          abn: '22222222222',
          acn: '222222222',
          address: '200 Shopping Ave, Retail District, TX 75001',
          clientInstruction: 'High-traffic retail cleaning, focus on customer areas',
          clientInfo: 'Large shopping center with multiple stores',
          propertyInfo: 'Two-level shopping complex with 100+ retail units',
        },
        {
          name: 'Industrial Manufacturing Plant',
          email: 'facilities@manufacturing.com',
          phone: '+1-555-8003',
          company: 'Industrial Manufacturing Plant',
          abn: '33333333333',
          acn: '333333333',
          address: '300 Industrial Blvd, Manufacturing Zone, OH 44101',
          clientInstruction: 'Industrial cleaning with safety protocols',
          clientInfo: 'Heavy manufacturing facility',
          propertyInfo: 'Large industrial complex with production areas',
        }
      ];

      for (const client of additionalClients) {
        try {
          const response = await fetch(`${API_BASE}/api/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client),
          });
          const result = await response.json();
          if (result.success) {
            existingClients.push(result.data);
          }
        } catch (error) {
          console.log(`❌ Failed to create client: ${client.name}`);
        }
      }
    }

    // Generate comprehensive shifts for 2025
    console.log('📅 Generating shifts for entire year 2025...');
    
    const dates2025 = generateDatesFor2025();
    console.log(`📆 Generated ${dates2025.length} dates for 2025`);
    
    const shiftTitles = [
      'Morning Office Cleaning',
      'Evening Deep Clean',
      'Medical Facility Sterilization',
      'Retail Store Maintenance',
      'Industrial Equipment Clean',
      'Restaurant Kitchen Deep Clean',
      'Executive Floor Premium Service',
      'Bathroom Sanitization',
      'Lobby and Reception Care',
      'Window and Glass Cleaning',
      'Carpet and Upholstery Care',
      'Emergency Cleanup',
      'Post-Event Cleanup',
      'Construction Site Cleanup',
      'Moving Preparation Clean',
      'Quarterly Deep Maintenance',
      'Holiday Preparation',
      'Year-End Comprehensive Clean',
      'New Tenant Preparation',
      'Facility Inspection Prep'
    ];

    const themes = ['Primary', 'Success', 'Warning', 'Danger'];
    const shifts = [];
    let totalShifts = 0;

    for (let dateIndex = 0; dateIndex < dates2025.length; dateIndex++) {
      const currentDate = dates2025[dateIndex];
      
      // Generate 10-15 shifts per day (more on weekdays, fewer on weekends)
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const shiftsPerDay = isWeekend ? 
        Math.floor(Math.random() * 6) + 5 : // 5-10 shifts on weekends
        Math.floor(Math.random() * 6) + 10; // 10-15 shifts on weekdays
      
      for (let shiftIndex = 0; shiftIndex < shiftsPerDay; shiftIndex++) {
        const startTime = getRandomTime(6, 20);
        const duration = Math.floor(Math.random() * 6) + 2; // 2-8 hours
        const shiftTime = createShiftDateTime(currentDate, startTime, duration);
        
        // Randomly assign staff and teams
        const useTeam = Math.random() > 0.7; // 30% team assignments
        const staffIds = [];
        const teamIds = [];
        
        if (useTeam && existingTeams.length > 0) {
          const randomTeam = existingTeams[Math.floor(Math.random() * existingTeams.length)];
          teamIds.push(randomTeam.id);
        } else if (existingStaff.length > 0) {
          // Assign 1-3 staff members
          const staffCount = Math.floor(Math.random() * 3) + 1;
          const usedStaffIds = new Set();
          
          for (let i = 0; i < staffCount && i < existingStaff.length; i++) {
            let randomStaffIndex;
            do {
              randomStaffIndex = Math.floor(Math.random() * existingStaff.length);
            } while (usedStaffIds.has(randomStaffIndex) && usedStaffIds.size < existingStaff.length);
            
            usedStaffIds.add(randomStaffIndex);
            staffIds.push(existingStaff[randomStaffIndex].id);
          }
        }
        
        // Randomly assign clients and locations
        const clientIds = existingClients.length > 0 ? 
          [existingClients[Math.floor(Math.random() * existingClients.length)].id] : [];
        const locationIds = existingLocations.length > 0 ? 
          [existingLocations[Math.floor(Math.random() * existingLocations.length)].id] : [];
        
        const randomTitle = shiftTitles[Math.floor(Math.random() * shiftTitles.length)];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        
        const shift = {
          title: `${randomTitle} - ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          startTime: shiftTime.start,
          endTime: shiftTime.end,
          theme: randomTheme,
          assignmentType: useTeam ? 'team' : 'individual',
          isPublished: Math.random() > 0.15, // 85% published
          includeLocation: Math.random() > 0.2, // 80% include location
          shiftInstructions: getRandomInstructions(),
          staffIds,
          teamIds,
          clientIds,
          locationIds,
        };
        
        shifts.push(shift);
        totalShifts++;
      }
      
      // Progress update every 30 days
      if (dateIndex % 30 === 0) {
        console.log(`📅 Generated shifts through ${currentDate.toLocaleDateString()} (${totalShifts} total shifts so far)`);
      }
    }

    console.log(`📊 Generated ${totalShifts} shifts for 2025. Starting creation...`);

    // Create shifts in batches for better performance
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < shifts.length; i += batchSize) {
      const batch = shifts.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(shifts.length / batchSize)} (shifts ${i + 1}-${Math.min(i + batchSize, shifts.length)})`);
      
      // Process batch with some delay to avoid overwhelming the server
      for (const shift of batch) {
        try {
          const response = await fetch(`${API_BASE}/api/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shift),
          });
          
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            if (failCount <= 10) { // Only log first 10 failures to avoid spam
              console.log(`❌ Failed to create shift: ${shift.title}`, result.error);
            }
          }
        } catch (error) {
          failCount++;
          if (failCount <= 10) {
            console.log(`❌ Error creating shift: ${shift.title}`, error.message);
          }
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 2025 Data seeding completed!`);
    console.log(`✅ Successfully created: ${successCount} shifts`);
    console.log(`❌ Failed to create: ${failCount} shifts`);
    console.log(`📊 Total shifts attempted: ${totalShifts}`);
    console.log(`📈 Success rate: ${((successCount / totalShifts) * 100).toFixed(1)}%`);
    
    // Test API performance
    console.log('\n⚡ Testing API performance...');
    
    const performanceTests = [
      { endpoint: '/api/shifts', description: 'All shifts' },
      { endpoint: '/api/shifts?month=2025-01', description: 'January 2025 shifts' },
      { endpoint: '/api/shifts?month=2025-06', description: 'June 2025 shifts' },
      { endpoint: '/api/shifts?month=2025-12', description: 'December 2025 shifts' },
    ];
    
    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE}${test.endpoint}`);
        const endTime = Date.now();
        const result = await response.json();
        
        console.log(`${test.description}: ${result.success ? '✅' : '❌'} (${result.count || 0} items) - ${endTime - startTime}ms`);
      } catch (error) {
        console.log(`${test.description}: ❌ Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding 2025 data:', error);
  }
}

// Run the 2025 seeding
console.log('🚀 Starting comprehensive 2025 database seeding for performance testing...');
seed2025Data().then(() => {
  console.log('✨ 2025 seeding process completed!');
  console.log('📝 Note: Use a deletion script later to remove this test data when needed.');
}).catch(error => {
  console.error('💥 2025 seeding failed:', error);
}); 