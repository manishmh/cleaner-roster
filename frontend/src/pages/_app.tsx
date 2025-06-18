import { CalendarFilterProvider } from "@/components/calendar/CalendarFilterContext";
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CalendarFilterProvider>
      <Component {...pageProps} />
    </CalendarFilterProvider>
  );
}

export default MyApp; 