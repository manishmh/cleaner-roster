import { type Team } from "@/lib/api";
import React from "react";

interface TeamDetailsModalProps {
  teams: Team[];
  onClose: () => void;
  onRemoveTeam?: (teamId: number) => void;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ teams, onClose, onRemoveTeam }) => {
  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {teams.map((team, index) => (
            <div key={`team-${team.id}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{team.name}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID: {team.id}</span>
                </div>
                {onRemoveTeam && (
                  <button
                    onClick={() => onRemoveTeam(team.id)}
                    className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              {team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{team.description}</p>
              )}
            </div>
          ))}
          {teams.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No teams selected for this shift.
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsModal; 