import React from "react";
import EntityTable from "@/components/tables/EntityTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function EntityManagementPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Entity Management" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <EntityTable />
      </div>
    </div>
  );
} 