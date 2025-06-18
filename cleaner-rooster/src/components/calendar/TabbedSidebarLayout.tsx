import { useStaff } from "@/context/StaffContext";
import { useShiftDetails } from "@/hooks/useShiftDetails";
import React from "react";
import { CalendarEvent } from "./Calendar";
import SendRosterEmailModal from "./SendRosterEmailModal";
import RepeatTabContent from "./tab-content/repeat/repeat";
import ShiftClientTabContent from "./tab-content/shift-content/ShiftClientTabContent";
import ShiftTabContent from "./tab-content/shift-content/ShiftTabContent";
import InstructionTabContent from "./tab-content/shift-content/instruction";
import ReportTabContent from "./tab-content/shift-content/report";

export interface SidebarItem {
  key: string;
  label: string;
}
export interface Tab {
  key: string;
  label: string;
  sidebar: SidebarItem[];
}

const tabs: Tab[] = [
  {
    key: "shiftDetail",
    label: "Shift Detail",
    sidebar: [
      { key: "shift", label: "Shift" },
      { key: "client", label: "Client" },
      { key: "instruction", label: "Instruction" },
      { key: "report", label: "Report" },
    ],
  },
  { key: "repeat", label: "Repeat", sidebar: [] },
];

interface TabbedSidebarLayoutProps {
  event: CalendarEvent;
  onUpdate: (updatedEvent: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
  onRefetch?: () => Promise<void>;
  onClose?: () => void;
}

const TabbedSidebarLayout: React.FC<TabbedSidebarLayoutProps> = ({ event, onUpdate, onDelete, onCancel, onRefetch, onClose }) => {
  const [selectedTab, setSelectedTab] = React.useState<string>(tabs[0].key);
  const [selectedSidebar, setSelectedSidebar] = React.useState<string>(tabs[0].sidebar[0]?.key || "");
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(event.title || "");
  const [displayTitle, setDisplayTitle] = React.useState(event.title || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);

  // Fetch detailed shift data
  const shiftId = parseInt(event.id as string);
  const { staff: allStaff } = useStaff();
   
  const { 
    data: shiftData, 
    loading, // eslint-disable-line @typescript-eslint/no-unused-vars
    error, 
    updateShift, 
    addInstruction, 
    addMessage 
  } = useShiftDetails(shiftId);

  React.useEffect(() => {
    const tab = tabs.find((t: Tab) => t.key === selectedTab);
    setSelectedSidebar(tab?.sidebar[0]?.key || "");
  }, [selectedTab]);

  React.useEffect(() => {
    setEditedTitle(event.title || "");
    setDisplayTitle(event.title || "");
  }, [event.title]);

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      setDisplayTitle(editedTitle.trim());
      onUpdate({
        ...event,
        title: editedTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(displayTitle);
    setIsEditingTitle(false);
  };

  const handleDeleteShift = () => {
    if (onDelete) {
      onDelete(event.id as string);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelShift = () => {
    if (onCancel) {
      onCancel(event.id as string);
    }
    setShowCancelConfirm(false);
  };

  // Check if shift is cancelled (assigned to Cover staff)
  const isCancelled = React.useMemo(() => {
    if (shiftData?.shift?.staff && shiftData.shift.staff.length > 0) {
      return shiftData.shift.staff.some(staff => staff.name === 'Cover');
    }
    return false;
  }, [shiftData?.shift?.staff]);

  const handleSendEmail = () => {
    setShowEmailModal(true);
  };

  // Get the current week start date (Monday) for the shift
  const getWeekStart = (shiftDate: string) => {
    const date = new Date(shiftDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

  const sidebarContent: Record<string, React.ReactNode> = {
    shift: (
      <div>
        <ShiftTabContent 
          event={event} 
          onUpdate={onUpdate}
          shiftData={shiftData.shift}
          allStaff={allStaff}
          allClients={shiftData.allClients}
          allLocations={shiftData.allLocations}
          allTeams={shiftData.allTeams}
          updateShift={updateShift}
        />
      </div>
    ),
    client: (
      <div>
        <ShiftClientTabContent 
          event={event} 
          onUpdate={onUpdate}
        />
      </div>
    ),
    instruction: (
      <div>
        <InstructionTabContent 
          event={event} 
          onUpdate={onUpdate}
          shiftData={shiftData.shift}
          addInstruction={addInstruction}
        />
      </div>
    ),
    report: (
      <div>
        <ReportTabContent 
          event={event} 
          shiftData={shiftData.shift}
          addMessage={addMessage}
          updateShift={updateShift}
          allStaff={allStaff}
        />
      </div>
    ),
    repeat: (
      <div>
        <RepeatTabContent 
          event={event} 
          onRefetch={onRefetch}
          onClose={onClose}
        />
      </div>
    ),
  };

  const currentTab = tabs.find((t: Tab) => t.key === selectedTab);

  // Don't show loading state to prevent flickering - render with event data initially
  // if (loading) {
  //   return (
  //     <div className="flex sm:h-auto border-b border-gray-200 dark:border-gray-800 flex-col w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
  //       <div className="p-8 flex items-center justify-center">
  //         <div className="text-gray-500">Loading shift details...</div>
  //       </div>
  //     </div>
  //   );
  // }

  // Show error state only for critical errors
  if (error && !shiftData.shift) {
    return (
      <div className="flex sm:h-auto border-b border-gray-200 dark:border-gray-800 flex-col w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="p-8 flex items-center justify-center">
          <div className="text-red-500">Error loading shift details: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex sm:h-auto border-b border-gray-200 dark:border-gray-800 flex-col w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Shift Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 mr-4">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-2 border rounded text-lg font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                />
                <button
                  onClick={handleTitleSave}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm border border-gray-300 dark:border-gray-600"
                >
                  ✓
                </button>
                <button
                  onClick={handleTitleCancel}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm border border-gray-300 dark:border-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 border border-transparent">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {displayTitle || "Untitled Shift"} {isCancelled && <span className="text-red-600">(Deleted Shift)</span>}
                </h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditingTitle && (
              <button
                onClick={handleTitleEdit}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium border border-gray-300 dark:border-gray-600"
              >
                Edit Shift Name
              </button>
            )}
            {isCancelled ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium border border-gray-300 dark:border-gray-600"
              >
                Delete Shift
              </button>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium border border-gray-300 dark:border-gray-600"
              >
                Cancel Shift
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/30 bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Cancel
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to cancel this shift? 
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Keep Shift
              </button>
              <button
                onClick={handleCancelShift}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/30 bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete this shift? This action cannot be undone and will remove the shift completely from the calendar.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Keep Shift
              </button>
              <button
                onClick={handleDeleteShift}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Tab Bar - Always visible */}
      <div className="flex border-b mb-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto scrollbar-hide">
        {tabs.map((tab: Tab) => (
          <button
            key={tab.key}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium focus:outline-none border-b-2 transition-colors duration-150 whitespace-nowrap flex-shrink-0
              ${
                selectedTab === tab.key
                  ? "border-blue-500 text-blue-600 bg-white dark:border-blue-400 dark:text-blue-300 dark:bg-gray-900"
                  : "border-transparent text-gray-600 bg-gray-50 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-900 dark:hover:bg-gray-700"
              }
            `}
            onClick={() => setSelectedTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Mobile: Sidebar as horizontal scrollable tabs */}
      <div className="md:hidden">
        {currentTab?.sidebar.length ? (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700">
            {currentTab.sidebar.map((item: SidebarItem) => (
              <button
                key={item.key}
                className={`px-3 py-1 text-xs rounded transition-colors duration-150 whitespace-nowrap flex-shrink-0
                  ${
                    selectedSidebar === item.key
                      ? "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }
                `}
                onClick={() => setSelectedSidebar(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        
        {/* Mobile Content Area */}
        <div className="p-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 max-h-[calc(100vh-200px)]">
          {currentTab?.sidebar.length
            ? sidebarContent[selectedSidebar] || <div>Select an option</div>
            : currentTab?.key === 'repeat' 
              ? sidebarContent['repeat']
              : <div className="text-gray-500 dark:text-gray-400">{currentTab?.label} content goes here.</div>}
        </div>
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        {currentTab?.key === 'repeat' ? (
          /* Repeat tab uses full width without sidebar */
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            {sidebarContent['repeat']}
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <div className="w-48 border-r bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex flex-col py-2 pr-2">
              {currentTab?.sidebar.length ? (
                currentTab.sidebar.map((item: SidebarItem) => (
                  <button
                    key={item.key}
                    className={`text-left px-4 py-2 text-sm rounded transition-colors duration-150 mb-1
                      ${
                        selectedSidebar === item.key
                          ? "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-300"
                          : "text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                      }
                    `}
                    onClick={() => setSelectedSidebar(item.key)}
                  >
                    {item.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-400 dark:text-gray-500 text-sm">No options</div>
              )}
            </div>
            {/* Desktop Content Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
              {currentTab?.sidebar.length
                ? sidebarContent[selectedSidebar] || <div>Select an option</div>
                : <div className="text-gray-500 dark:text-gray-400">{currentTab?.label} content goes here.</div>}
            </div>
          </>
        )}
      </div>

      {/* Send Mail Button - Bottom Left */}
      {shiftData.shift && shiftData.shift.staff && shiftData.shift.staff.length > 0 && (
        <div className="absolute bottom-10 left-4">
          <button
            onClick={handleSendEmail}
            className="flex items-center gap-2 px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border text-xs transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Mail
          </button>
        </div>
      )}

      {/* Send Roster Email Modal */}
      {shiftData.shift && shiftData.shift.staff && shiftData.shift.staff.length > 0 && (
        <SendRosterEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          staffMembers={shiftData.shift.staff}
          weekStart={getWeekStart(event.start || event.startTime)}
        />
      )}
    </div>
  );
};

export default TabbedSidebarLayout;
