# Schedule List View Feature

## Overview
A new route `/schedule/list-view` has been implemented with comprehensive search functionality and multiple view modes.

## Features Implemented

### 1. Search Functionality
- **Date Range**: From and To date inputs for filtering schedules
- **Staff Filter**: Dropdown with supervisor options (All Supervisors, Raj Agrawal, Michele Schuster, Craig Douglas, Shannon Dickinson, Kirsten Englert)
- **Client Filter**: Dropdown with client options including major clients like Australia Workers Union, O & G Office, etc.
- **View Types**: Radio buttons for Individual, Group By Staff, and Group By Client views

### 2. View Modes

#### Individual View
- Displays all individual tasks of supervisors in a table format
- Columns: Shift, Staff, Sch (Schedule), Break, Log, Sch/Log Length, Status
- Shows staff name and client information
- Status badges with different colors (Completed, In Progress, Cancelled, Pending)

#### Group View (Staff/Client)
- Collapsible dropdown groups showing summary data
- Group summary columns: Name, Count, Sch Length, Log, PayLength, TrlDist., TrlTime
- Expandable details showing individual tasks within each group
- Individual print button for each group

### 3. Download Functionality
- **Individual View**: Downloads all data in CSV format with proper column headers
- **Group View**: Downloads all groups with separated sections in CSV format
- **Individual Group Download**: Each group has a print button to download only that group's data
- CSV files include proper formatting and quoted strings for complex data

### 4. UI/UX Features
- Modern, sleek design with subtle colors
- Responsive layout that works on different screen sizes
- Hover effects and smooth transitions
- Loading states for search operations
- Toast notifications for user feedback
- Dark mode support

## Technical Implementation

### Components Created
1. `ScheduleListView.tsx` - Main component with state management
2. `ScheduleSearchFilters.tsx` - Search form with filters
3. `ScheduleIndividualView.tsx` - Table view for individual tasks
4. `ScheduleGroupView.tsx` - Collapsible group view with nested tables

### Icons Added
- `search.svg` - Search icon for filters and navigation
- `chevron-right.svg` - Right arrow for collapsible groups
- `printer.svg` - Print icon for individual group downloads

### Navigation
- Added "Schedule" menu item in sidebar with "List View" submenu
- Uses SearchIcon for the menu item

### Data Structure
- Mock data implemented with realistic schedule information
- Proper TypeScript interfaces for type safety
- Flexible data structure supporting both individual and grouped views

## Usage
1. Navigate to Schedule > List View from the sidebar
2. Set date range and select filters
3. Choose view type (Individual or Group)
4. Click Search to filter results
5. Use Download button for full report or individual group print buttons
6. Click on group names to expand/collapse details in group view

## Future Enhancements
- Integration with real API endpoints
- Advanced filtering options
- Export to other formats (PDF, Excel)
- Print preview functionality
- Bulk operations on selected items 