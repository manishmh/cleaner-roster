import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ScheduleListView from "@/components/schedule/ScheduleListView";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Schedule List View | Rooster - Next.js Dashboard",
  description: "Schedule list view with search functionality for Rooster Dashboard",
};

export default function ScheduleListViewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Schedule List View" />
      <ScheduleListView />
    </div>
  );
} 