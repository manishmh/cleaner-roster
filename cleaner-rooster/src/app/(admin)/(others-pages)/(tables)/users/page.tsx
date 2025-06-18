import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import StaffTable from "@/components/tables/StaffTable";
import React from "react";

export default function StaffPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Staff Management" />
      <div className="space-y-6">
        <ComponentCard title="Staff">
          <StaffTable />
        </ComponentCard>
      </div>
    </div>
  );
} 