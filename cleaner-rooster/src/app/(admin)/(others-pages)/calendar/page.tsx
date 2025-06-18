import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Next.js Calender | Rooster - Next.js Dashboard ",
  description:
    "This is Next.js Calender page for Rooster  Tailwind CSS Admin Dashboard ",
  // other metadata
};
export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Calendar" />
      <Suspense>
        <Calendar />
      </Suspense>
    </div>
  );
}
