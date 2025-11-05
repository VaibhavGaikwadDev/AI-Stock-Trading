import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/provider'
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stock Analysis App',
  description: 'Secure Stock Analysis Platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.className ,
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
      >
         <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
        <ActiveThemeProvider initialTheme={activeThemeValue}>
        <NuqsAdapter>
        <Providers>
          {children}
        </Providers>
        </NuqsAdapter>
        </ActiveThemeProvider>
       </ThemeProvider>
      </body>
    </html>
  )
}