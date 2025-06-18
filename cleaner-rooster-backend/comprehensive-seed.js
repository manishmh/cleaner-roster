const API_BASE = 'http://localhost:8787';

// Helper function to generate random dates
function getRandomDate(daysFromNow = 0, daysRange = 30) {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + daysFromNow);
  const randomDays = Math.floor(Math.random() * daysRange);
  baseDate.setDate(baseDate.getDate() + randomDays);
  return baseDate;
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

async function seedData() {
  console.log('🌱 Seeding database with comprehensive sample data...');

  try {
    // Create plenty of staff members including supervisors
    const staffMembers = [
      // Supervisors
      { name: 'Dr. Emily Carter', email: 'emily@cleanerrooster.com', role: 'supervisor', phone: '+1-555-1001' },
      { name: 'James Wilson', email: 'james@cleanerrooster.com', role: 'supervisor', phone: '+1-555-1002' },
      { name: 'Lisa Chen', email: 'lisa@cleanerrooster.com', role: 'supervisor', phone: '+1-555-1003' },
      { name: 'Robert Martinez', email: 'robert@cleanerrooster.com', role: 'supervisor', phone: '+1-555-1004' },
      
      // Managers
      { name: 'David Lee', email: 'david@cleanerrooster.com', role: 'manager', phone: '+1-555-2001' },
      { name: 'Amanda Thompson', email: 'amanda@cleanerrooster.com', role: 'manager', phone: '+1-555-2002' },
      { name: 'Kevin Rodriguez', email: 'kevin@cleanerrooster.com', role: 'manager', phone: '+1-555-2003' },
      
      // Staff Members
      { name: 'Michael Smith', email: 'michael@cleanerrooster.com', role: 'staff', phone: '+1-555-3001' },
      { name: 'Sarah Johnson', email: 'sarah@cleanerrooster.com', role: 'staff', phone: '+1-555-3002' },
      { name: 'Jessica Brown', email: 'jessica@cleanerrooster.com', role: 'staff', phone: '+1-555-3003' },
      { name: 'Christopher Davis', email: 'chris@cleanerrooster.com', role: 'staff', phone: '+1-555-3004' },
      { name: 'Ashley Miller', email: 'ashley@cleanerrooster.com', role: 'staff', phone: '+1-555-3005' },
      { name: 'Daniel Garcia', email: 'daniel@cleanerrooster.com', role: 'staff', phone: '+1-555-3006' },
      { name: 'Michelle White', email: 'michelle@cleanerrooster.com', role: 'staff', phone: '+1-555-3007' },
      { name: 'Brian Taylor', email: 'brian@cleanerrooster.com', role: 'staff', phone: '+1-555-3008' },
      { name: 'Nicole Anderson', email: 'nicole@cleanerrooster.com', role: 'staff', phone: '+1-555-3009' },
      { name: 'Andrew Thomas', email: 'andrew@cleanerrooster.com', role: 'staff', phone: '+1-555-3010' },
      { name: 'Samantha Jackson', email: 'samantha@cleanerrooster.com', role: 'staff', phone: '+1-555-3011' },
      { name: 'Matthew Harris', email: 'matthew@cleanerrooster.com', role: 'staff', phone: '+1-555-3012' },
      { name: 'Jennifer Clark', email: 'jennifer@cleanerrooster.com', role: 'staff', phone: '+1-555-3013' },
      { name: 'Ryan Lewis', email: 'ryan@cleanerrooster.com', role: 'staff', phone: '+1-555-3014' },
      { name: 'Stephanie Walker', email: 'stephanie@cleanerrooster.com', role: 'staff', phone: '+1-555-3015' },
      { name: 'Jonathan Hall', email: 'jonathan@cleanerrooster.com', role: 'staff', phone: '+1-555-3016' },
      { name: 'Megan Allen', email: 'megan@cleanerrooster.com', role: 'staff', phone: '+1-555-3017' },
      { name: 'Tyler Young', email: 'tyler@cleanerrooster.com', role: 'staff', phone: '+1-555-3018' },
      { name: 'Kimberly King', email: 'kimberly@cleanerrooster.com', role: 'staff', phone: '+1-555-3019' },
      { name: 'Brandon Wright', email: 'brandon@cleanerrooster.com', role: 'staff', phone: '+1-555-3020' },
    ];

    console.log('Creating staff members...');
    const createdStaff = [];
    for (const staff of staffMembers) {
      const response = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staff),
      });
      const result = await response.json();
      if (result.success) {
        createdStaff.push(result.data);
        console.log(`✅ Created ${staff.role}: ${staff.name}`);
      } else {
        console.log(`❌ Failed to create staff: ${staff.name}`, result.error);
      }
    }

    // Create plenty of diverse clients
    const clients = [
      {
        name: 'Global Tech Corporation',
        email: 'facilities@globaltech.com',
        phone: '+1-555-4001',
        company: 'Global Tech Corporation',
        abn: '12345678901',
        acn: '123456789',
        address: '123 Silicon Valley Blvd, Tech City, CA 94000',
        clientInstruction: 'Use eco-friendly products only. No scented chemicals.',
        clientInfo: 'Large multinational tech company with 24/7 operations',
        propertyInfo: '10-story headquarters building with 2000+ employees, multiple server rooms',
      },
      {
        name: 'Metropolitan Medical Center',
        email: 'admin@metro-medical.com',
        phone: '+1-555-4002',
        company: 'Metropolitan Medical Center',
        abn: '98765432109',
        acn: '987654321',
        address: '456 Healthcare Dr, Medical District, TX 77000',
        clientInstruction: 'Strict medical-grade disinfection protocols. Staff must be trained for healthcare environment.',
        clientInfo: 'Major hospital and medical research facility',
        propertyInfo: '15-story medical complex with 500 beds, 20 operating rooms, research labs',
      },
      {
        name: 'Prime Restaurant Group',
        email: 'ops@primerestaurants.com',
        phone: '+1-555-4003',
        company: 'Prime Restaurant Group',
        abn: '11223344556',
        acn: '112233445',
        address: '789 Culinary Ave, Food District, NY 10000',
        clientInstruction: 'Deep kitchen cleaning required. Focus on grease removal and food safety compliance.',
        clientInfo: 'Chain of upscale restaurants requiring specialized kitchen cleaning',
        propertyInfo: '5 restaurant locations, full commercial kitchens, dining areas for 150+ guests each',
      },
      {
        name: 'Innovation Startup Campus',
        email: 'facilities@innovationcampus.com',
        phone: '+1-555-4004',
        company: 'Innovation Startup Campus',
        abn: '55667788990',
        acn: '556677889',
        address: '321 Innovation Blvd, Startup Quarter, WA 98000',
        clientInstruction: 'Flexible schedule to accommodate 24/7 work culture. Clean quietly during business hours.',
        clientInfo: 'Co-working space hosting multiple tech startups',
        propertyInfo: 'Modern campus with open offices, maker spaces, event halls, and recreational facilities',
      },
      {
        name: 'Prestige Shopping Plaza',
        email: 'maintenance@prestigeplaza.com',
        phone: '+1-555-4005',
        company: 'Prestige Shopping Plaza',
        abn: '99887766554',
        acn: '998877665',
        address: '654 Retail Blvd, Shopping District, FL 33000',
        clientInstruction: 'Clean only during closed hours (10 PM - 6 AM). High-traffic areas need daily attention.',
        clientInfo: 'Luxury shopping center with premium brands',
        propertyInfo: 'Multi-level mall with 80+ stores, food court, cinema, and underground parking',
      },
      {
        name: 'University Research Institute',
        email: 'facilities@university-research.edu',
        phone: '+1-555-4006',
        company: 'University Research Institute',
        abn: '33445566778',
        acn: '334455667',
        address: '987 Academic Way, University City, MA 02000',
        clientInstruction: 'Laboratory cleaning requires specialized protocols. Some areas need clearance.',
        clientInfo: 'Research university with specialized laboratories',
        propertyInfo: 'Research campus with chemistry labs, biology labs, clean rooms, and academic offices',
      },
      {
        name: 'Financial Services Tower',
        email: 'building-ops@financetower.com',
        phone: '+1-555-4007',
        company: 'Financial Services Tower',
        abn: '77889900112',
        acn: '778899001',
        address: '111 Wall Street, Financial District, NY 10005',
        clientInstruction: 'Security clearance required. Clean during designated hours only.',
        clientInfo: 'High-security financial services building',
        propertyInfo: '40-story office tower housing multiple financial firms, trading floors, conference centers',
      },
      {
        name: 'Luxury Hotel Chain',
        email: 'housekeeping@luxuryhotels.com',
        phone: '+1-555-4008',
        company: 'Luxury Hotel Chain',
        abn: '44556677889',
        acn: '445566778',
        address: '222 Hospitality Blvd, Hotel District, NV 89000',
        clientInstruction: 'Guest room cleaning follows 5-star standards. Use approved luxury amenities only.',
        clientInfo: '5-star hotel requiring premium cleaning services',
        propertyInfo: '25-story luxury hotel with 300 rooms, restaurants, spa, event spaces',
      },
      {
        name: 'Manufacturing Complex',
        email: 'maintenance@manufacturing.com',
        phone: '+1-555-4009',
        company: 'Advanced Manufacturing Complex',
        abn: '66778899001',
        acn: '667788990',
        address: '555 Industrial Park Dr, Manufacturing Zone, OH 44000',
        clientInstruction: 'Industrial cleaning protocols. PPE required. Coordinate with production schedule.',
        clientInfo: 'Large manufacturing facility with clean room requirements',
        propertyInfo: 'Industrial complex with production floors, clean rooms, offices, and warehouse space',
      },
      {
        name: 'Sports & Entertainment Arena',
        email: 'ops@arena-complex.com',
        phone: '+1-555-4010',
        company: 'Sports & Entertainment Arena',
        abn: '88990011223',
        acn: '889900112',
        address: '777 Sports Complex Dr, Entertainment District, IL 60000',
        clientInstruction: 'Event-based cleaning schedule. Deep clean after major events. Quick turnaround required.',
        clientInfo: 'Multi-purpose arena hosting sports events and concerts',
        propertyInfo: '20,000-seat arena with VIP suites, concession areas, locker rooms, parking facilities',
      },
    ];

    console.log('Creating clients...');
    const createdClients = [];
    for (const client of clients) {
      const response = await fetch(`${API_BASE}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      const result = await response.json();
      if (result.success) {
        createdClients.push(result.data);
        console.log(`✅ Created client: ${client.name}`);
      } else {
        console.log(`❌ Failed to create client: ${client.name}`, result.error);
      }
    }

    // Create comprehensive locations
    const locations = [
      // Global Tech Corporation locations
      { unit: 'Building A', name: 'Lobby & Reception', accuracy: 95, comment: 'High-traffic area, marble floors', address: '123 Silicon Valley Blvd, Tech City, CA' },
      { unit: 'Building A', name: 'Executive Floor (10th)', accuracy: 100, comment: 'Premium office space, requires special attention', address: '123 Silicon Valley Blvd, Tech City, CA' },
      { unit: 'Building A', name: 'Open Office Floors 2-5', accuracy: 90, comment: 'Large open workspace areas', address: '123 Silicon Valley Blvd, Tech City, CA' },
      { unit: 'Building A', name: 'Server Room Complex', accuracy: 100, comment: 'Climate-controlled, anti-static protocols', address: '123 Silicon Valley Blvd, Tech City, CA' },
      { unit: 'Building B', name: 'Cafeteria & Kitchen', accuracy: 95, comment: 'Food service area, health regulations apply', address: '123 Silicon Valley Blvd, Tech City, CA' },
      
      // Medical Center locations
      { unit: 'Main Hospital', name: 'Emergency Department', accuracy: 100, comment: 'Critical care area, sterile environment', address: '456 Healthcare Dr, Medical District, TX' },
      { unit: 'Main Hospital', name: 'Operating Theaters 1-10', accuracy: 100, comment: 'Surgical suites, highest sterility standards', address: '456 Healthcare Dr, Medical District, TX' },
      { unit: 'Main Hospital', name: 'Patient Floors 3-12', accuracy: 95, comment: 'Patient rooms and nursing stations', address: '456 Healthcare Dr, Medical District, TX' },
      { unit: 'Research Wing', name: 'Laboratory Complex', accuracy: 100, comment: 'Research labs, biosafety protocols', address: '456 Healthcare Dr, Medical District, TX' },
      { unit: 'Outpatient', name: 'Clinic Areas', accuracy: 90, comment: 'Examination rooms and waiting areas', address: '456 Healthcare Dr, Medical District, TX' },
      
      // Restaurant locations
      { unit: 'Downtown Location', name: 'Main Kitchen', accuracy: 100, comment: 'Commercial kitchen, grease management critical', address: '789 Culinary Ave, Food District, NY' },
      { unit: 'Downtown Location', name: 'Dining Room', accuracy: 90, comment: 'Customer dining area, premium appearance', address: '789 Culinary Ave, Food District, NY' },
      { unit: 'Uptown Location', name: 'Private Dining Rooms', accuracy: 95, comment: 'VIP dining areas, white-glove service', address: '790 Culinary Ave, Food District, NY' },
      
      // Startup Campus locations
      { unit: 'Main Building', name: 'Co-working Spaces', accuracy: 85, comment: 'Flexible workspace, minimal disruption during day', address: '321 Innovation Blvd, Startup Quarter, WA' },
      { unit: 'Main Building', name: 'Conference Centers', accuracy: 90, comment: 'Meeting rooms and presentation areas', address: '321 Innovation Blvd, Startup Quarter, WA' },
      { unit: 'Maker Space', name: 'Workshop Areas', accuracy: 80, comment: 'Industrial workspace, specialized cleaning needed', address: '321 Innovation Blvd, Startup Quarter, WA' },
      
      // Shopping Plaza locations
      { unit: 'Level 1', name: 'Food Court', accuracy: 95, comment: 'High-traffic dining area, frequent cleaning needed', address: '654 Retail Blvd, Shopping District, FL' },
      { unit: 'Level 2-3', name: 'Retail Stores Common Areas', accuracy: 85, comment: 'Corridors and common spaces between stores', address: '654 Retail Blvd, Shopping District, FL' },
      { unit: 'Cinema Level', name: 'Movie Theater Complex', accuracy: 90, comment: 'Entertainment area, post-show cleaning required', address: '654 Retail Blvd, Shopping District, FL' },
    ];

    console.log('Creating locations...');
    const createdLocations = [];
    for (const location of locations) {
      const response = await fetch(`${API_BASE}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });
      const result = await response.json();
      if (result.success) {
        createdLocations.push(result.data);
        console.log(`✅ Created location: ${location.name}`);
      } else {
        console.log(`❌ Failed to create location: ${location.name}`, result.error);
      }
    }

    // Create diverse teams
    const teams = [
      { name: 'Office Cleaning Team A', description: 'Specialized in corporate office environments', isActive: true },
      { name: 'Office Cleaning Team B', description: 'Secondary office cleaning team for large contracts', isActive: true },
      { name: 'Medical Facility Team', description: 'Healthcare and medical facility specialists', isActive: true },
      { name: 'Restaurant & Kitchen Team', description: 'Food service and commercial kitchen experts', isActive: true },
      { name: 'Industrial Cleaning Team', description: 'Manufacturing and industrial facility specialists', isActive: true },
      { name: 'Retail & Hospitality Team', description: 'Shopping centers, hotels, and entertainment venues', isActive: true },
      { name: 'Emergency Response Team', description: 'On-call team for urgent cleaning situations', isActive: true },
      { name: 'Night Shift Team', description: 'Overnight cleaning operations', isActive: true },
      { name: 'Weekend Team', description: 'Weekend and holiday coverage', isActive: true },
      { name: 'Deep Cleaning Specialists', description: 'Periodic deep cleaning and special projects', isActive: true },
    ];

    console.log('Creating teams...');
    const createdTeams = [];
    for (const team of teams) {
      const response = await fetch(`${API_BASE}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team),
      });
      const result = await response.json();
      if (result.success) {
        createdTeams.push(result.data);
        console.log(`✅ Created team: ${team.name}`);
      } else {
        console.log(`❌ Failed to create team: ${team.name}`, result.error);
      }
    }

    // Create comprehensive shifts with various scenarios
    const shiftScenarios = [
      // Individual shifts
      { type: 'individual', title: 'Morning Office Cleaning - Tech Corp', duration: 4, theme: 'Primary' },
      { type: 'individual', title: 'Evening Restaurant Deep Clean', duration: 6, theme: 'Warning' },
      { type: 'individual', title: 'Medical Wing Sterilization', duration: 8, theme: 'Danger' },
      { type: 'individual', title: 'Retail Store Maintenance', duration: 3, theme: 'Success' },
      { type: 'individual', title: 'Executive Floor Premium Clean', duration: 2, theme: 'Primary' },
      
      // Team shifts
      { type: 'team', title: 'Hospital Night Shift Team', duration: 12, theme: 'Danger' },
      { type: 'team', title: 'Shopping Mall Weekend Clean', duration: 8, theme: 'Success' },
      { type: 'team', title: 'Arena Post-Event Cleanup', duration: 10, theme: 'Warning' },
      { type: 'team', title: 'Manufacturing Facility Deep Clean', duration: 6, theme: 'Primary' },
      { type: 'team', title: 'University Campus Maintenance', duration: 8, theme: 'Success' },
    ];

    const shifts = [];
    const themes = ['Primary', 'Success', 'Warning', 'Danger'];
    
    // Generate shifts for the next 60 days
    for (let dayOffset = -10; dayOffset < 50; dayOffset++) {
      const baseDate = getRandomDate(dayOffset, 1);
      
      // Generate 3-8 shifts per day
      const shiftsPerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < shiftsPerDay; i++) {
        const scenario = shiftScenarios[Math.floor(Math.random() * shiftScenarios.length)];
        const startTime = getRandomTime(6, 20);
        const shiftTime = createShiftDateTime(baseDate, startTime, scenario.duration);
        
        // Randomly assign staff (for individual) or teams
        const staffIds = [];
        const teamIds = [];
        
        if (scenario.type === 'individual' && createdStaff.length > 0) {
          const randomStaff = createdStaff[Math.floor(Math.random() * createdStaff.length)];
          staffIds.push(randomStaff.id);
        } else if (scenario.type === 'team' && createdTeams.length > 0) {
          const randomTeam = createdTeams[Math.floor(Math.random() * createdTeams.length)];
          teamIds.push(randomTeam.id);
        }
        
        // Randomly assign clients and locations
        const clientIds = createdClients.length > 0 ? [createdClients[Math.floor(Math.random() * createdClients.length)].id] : [];
        const locationIds = createdLocations.length > 0 ? [createdLocations[Math.floor(Math.random() * createdLocations.length)].id] : [];
        
        const shift = {
          title: `${scenario.title} - ${baseDate.toLocaleDateString()}`,
          startTime: shiftTime.start,
          endTime: shiftTime.end,
          theme: scenario.theme,
          assignmentType: scenario.type,
          isPublished: Math.random() > 0.2, // 80% published
          includeLocation: Math.random() > 0.3, // 70% include location
          shiftInstructions: getRandomInstructions(),
          staffIds,
          teamIds,
          clientIds,
          locationIds,
        };
        
        shifts.push(shift);
      }
    }

    console.log(`Creating ${shifts.length} shifts...`);
    let successCount = 0;
    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      try {
        const response = await fetch(`${API_BASE}/api/shifts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shift),
        });
        
        const result = await response.json();
        if (result.success) {
          successCount++;
          if (i % 10 === 0) {
            console.log(`✅ Created ${successCount} shifts so far...`);
          }
        } else {
          console.log(`❌ Failed to create shift: ${shift.title}`, result.error);
        }
      } catch (error) {
        console.log(`❌ Error creating shift: ${shift.title}`, error.message);
      }
    }

    console.log(`🎉 Database seeding completed! Created ${successCount} shifts total.`);
    
    // Test fetching data
    console.log('\n📊 Testing API endpoints...');
    
    const endpoints = [
      '/api/staff',
      '/api/clients', 
      '/api/locations',
      '/api/teams',
      '/api/shifts'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const result = await response.json();
        console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.count || 0} items)`);
      } catch (error) {
        console.log(`${endpoint}: ❌ Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
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
    'Ensure security protocols are followed throughout'
  ];
  
  return instructions[Math.floor(Math.random() * instructions.length)];
}

// Run the comprehensive seeding
console.log('Starting comprehensive database seeding...');
seedData().then(() => {
  console.log('✨ Comprehensive seeding process completed!');
}).catch(error => {
  console.error('💥 Seeding failed:', error);
});