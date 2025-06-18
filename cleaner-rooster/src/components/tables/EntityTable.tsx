"use client";

import React, { useState } from "react";
import { PlusIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import EntityFormModal from "./EntityFormModal";

interface Entity {
  id?: number;
  type: "Supervisor" | "Cleaner" | "Team" | "Client";
  name: string;
  contact: string;
  email: string;
  status: "Active" | "Inactive";
  // Supervisor specific
  mobileUsername?: string;
  // Team specific
  supervisor?: string;
  cleaners?: string[];
  // Client specific
  address?: string;
}

// Sample data
const tableData: Entity[] = [
  {
    id: 1,
    type: "Supervisor",
    name: "John Smith",
    contact: "+1234567890",
    email: "john@example.com",
    status: "Active",
    mobileUsername: "johnsmith"
  },
  {
    id: 2,
    type: "Cleaner",
    name: "Sarah Johnson",
    contact: "+1987654321",
    email: "sarah@example.com",
    status: "Active"
  },
  {
    id: 3,
    type: "Team",
    name: "Team Alpha",
    contact: "+1122334455",
    email: "team@example.com",
    supervisor: "John Smith",
    cleaners: ["Sarah Johnson", "Mike Brown"],
    status: "Active"
  },
  {
    id: 4,
    type: "Client",
    name: "ABC Corporation",
    contact: "+1122334455",
    email: "contact@abccorp.com",
    address: "123 Business St, City",
    status: "Active"
  }
];

export default function EntityTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  const handleAddEdit = (data: Entity) => {
    // Here you would typically make an API call to save the data
    console.log("Saving entity:", data);
  };

  const handleEdit = (entity: Entity) => {
    setSelectedEntity(entity);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number | undefined) => {
    // Here you would typically make an API call to delete the entity
    console.log("Deleting entity:", id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Entity Management</h2>
        <Button
          onClick={() => {
            setSelectedEntity(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add New Entity
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Type
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Contact
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {tableData.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <Badge
                        size="sm"
                        variant="light"
                        color={
                          entity.type === "Supervisor"
                            ? "primary"
                            : entity.type === "Cleaner"
                            ? "success"
                            : entity.type === "Team"
                            ? "warning"
                            : "info"
                        }
                      >
                        {entity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {entity.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {entity.contact}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {entity.email}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <Badge
                        size="sm"
                        variant="light"
                        color={entity.status === "Active" ? "success" : "error"}
                      >
                        {entity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(entity)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(entity.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <EntityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntity(null);
        }}
        onSubmit={handleAddEdit}
        initialData={selectedEntity || undefined}
      />
    </div>
  );
} 