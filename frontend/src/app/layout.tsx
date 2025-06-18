// import { Outfit } from 'next/font/google';
import { CalendarFilterProvider } from '@/components/calendar/CalendarFilterContext';
import './globals.css';

import { CalendarClientProvider } from '@/components/calendar/CalendarClientContext';
import SessionProvider from '@/components/providers/SessionProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { StaffProvider } from '@/context/StaffContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'sonner';

// const outfit = Outfit({
//   subsets: ["latin"],
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`dark:bg-gray-900`}>
        <SessionProvider>
          <ThemeProvider>
            <StaffProvider>
              <CalendarFilterProvider>
                <CalendarClientProvider>
                  <SidebarProvider>{children}</SidebarProvider>
                </CalendarClientProvider>
              </CalendarFilterProvider>
            </StaffProvider>
          </ThemeProvider>
        </SessionProvider>
        <Toaster 
          position="bottom-right" 
          richColors 
          closeButton 
          duration={4000}
        />
      </body>
    </html>
  );
}
