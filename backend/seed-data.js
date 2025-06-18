// Simple script to seed the database with sample data
const API_BASE = 'http://localhost:8787';

async function seedData() {
  console.log('🌱 Seeding database with sample data...');

  try {
    // Create sample staff members
    const staffMembers = [
      { name: 'Dr. Emily Carter', email: 'emily@cleanerrooster.com', role: 'supervisor' },
      { name: 'Michael Smith', email: 'michael@cleanerrooster.com', role: 'staff' },
      { name: 'Sarah Johnson', email: 'sarah@cleanerrooster.com', role: 'staff' },
      { name: 'David Lee', email: 'david@cleanerrooster.com', role: 'manager' },
      { name: 'Jessica Brown', email: 'jessica@cleanerrooster.com', role: 'staff' },
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
        console.log(`✅ Created staff: ${staff.name}`);
      } else {
        console.log(`❌ Failed to create staff: ${staff.name}`, result.error);
      }
    }

    // Create sample clients
    const clients = [
      {
        name: 'ABC Corporation',
        email: 'contact@abc-corp.com',
        phone: '+1-555-0101',
        company: 'ABC Corporation',
        abn: '12345678901',
        acn: '123456789',
        address: '123 Business St, City, State 12345',
        clientInstruction: 'Please use eco-friendly cleaning products only',
        clientInfo: 'Large office building requiring daily cleaning',
        propertyInfo: '5-story office building with 200 employees',
      },
      {
        name: 'XYZ Medical Center',
        email: 'admin@xyz-medical.com',
        phone: '+1-555-0102',
        company: 'XYZ Medical Center',
        abn: '98765432109',
        acn: '987654321',
        address: '456 Health Ave, City, State 12345',
        clientInstruction: 'Medical-grade disinfectants required, follow strict protocols',
        clientInfo: 'Medical facility requiring specialized cleaning',
        propertyInfo: 'Medical center with 50 rooms, operating theaters, and labs',
      },
      {
        name: 'Downtown Restaurant',
        email: 'manager@downtown-restaurant.com',
        phone: '+1-555-0103',
        company: 'Downtown Restaurant',
        abn: '11223344556',
        address: '789 Food St, City, State 12345',
        clientInstruction: 'Kitchen deep cleaning required, focus on grease removal',
        clientInfo: 'Restaurant requiring kitchen and dining area cleaning',
        propertyInfo: 'Restaurant with full kitchen, dining area for 100 guests',
      },
      {
        name: 'Tech Startup Hub',
        email: 'facilities@techstartup.com',
        phone: '+1-555-0104',
        company: 'Tech Startup Hub',
        abn: '55667788990',
        acn: '556677889',
        address: '321 Innovation Blvd, City, State 12345',
        clientInstruction: 'Flexible cleaning schedule, avoid disrupting work areas during peak hours',
        clientInfo: 'Modern tech office with open workspace and meeting rooms',
        propertyInfo: 'Open-plan office with 150 workstations, 10 meeting rooms, and recreational areas',
      },
      {
        name: 'Retail Shopping Center',
        email: 'maintenance@retailcenter.com',
        phone: '+1-555-0105',
        company: 'Retail Shopping Center',
        abn: '99887766554',
        address: '654 Shopping Ave, City, State 12345',
        clientInstruction: 'Clean during off-hours only, pay special attention to high-traffic areas',
        clientInfo: 'Large shopping center with multiple retail stores',
        propertyInfo: 'Shopping center with 50 stores, food court, and parking garage',
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

    // Create sample locations
    const locations = [
      {
        unit: 'Building A',
        name: 'Main Office Floor 1',
        accuracy: 95,
        comment: 'Reception and meeting rooms',
        address: '123 Business St, City',
      },
      {
        unit: 'Building A',
        name: 'Main Office Floor 2',
        accuracy: 90,
        comment: 'Open office space',
        address: '123 Business St, City',
      },
      {
        unit: 'Building B',
        name: 'Medical Wing',
        accuracy: 100,
        comment: 'Sterile environment required',
        address: '456 Health Ave, City',
      },
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

    // Create sample teams
    const teams = [
      {
        name: 'Office Cleaning Team',
        description: 'Specialized in office and commercial cleaning',
        isActive: true,
      },
      {
        name: 'Medical Cleaning Team',
        description: 'Specialized in medical facility cleaning',
        isActive: true,
      },
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

    // Create sample shifts
    const shifts = [
      {
        title: 'Morning Office Cleaning',
        startTime: new Date('2024-01-15T08:00:00Z').toISOString(),
        endTime: new Date('2024-01-15T12:00:00Z').toISOString(),
        theme: 'Primary',
        assignmentType: 'individual',
        isPublished: true,
        includeLocation: true,
        shiftInstructions: 'Focus on reception area and meeting rooms',
        staffIds: createdStaff.length > 0 ? [createdStaff[0].id] : [],
        clientIds: createdClients.length > 0 ? [createdClients[0].id] : [],
        locationIds: createdLocations.length > 0 ? [createdLocations[0].id] : [],
      },
      {
        title: 'Medical Facility Deep Clean',
        startTime: new Date('2024-01-16T06:00:00Z').toISOString(),
        endTime: new Date('2024-01-16T14:00:00Z').toISOString(),
        theme: 'Warning',
        assignmentType: 'individual',
        isPublished: true,
        includeLocation: true,
        shiftInstructions: 'Use medical-grade disinfectants',
        staffIds: createdStaff.length > 0 ? [createdStaff[0].id] : [],
        clientIds: createdClients.length > 1 ? [createdClients[1].id] : [],
        locationIds: createdLocations.length > 2 ? [createdLocations[2].id] : [],
      },
    ];

    console.log('Creating shifts...');
    for (const shift of shifts) {
      const response = await fetch(`${API_BASE}/api/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shift),
      });
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Created shift: ${shift.title}`);
      } else {
        console.log(`❌ Failed to create shift: ${shift.title}`, result.error);
      }
    }

    console.log('🎉 Database seeding completed!');
    
    // Test fetching data
    console.log('\n📊 Testing API endpoints...');
    
    const endpoints = [
      '/api/staff',
      '/api/clients', 
      '/api/locations',
      '/api/shifts'
    ];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const result = await response.json();
      console.log(`${endpoint}: ${result.success ? '✅' : '❌'} (${result.count || 0} items)`);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run the seeding
seedData(); 