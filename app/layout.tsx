import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EzERD - Simple ERD to DDL Converter',
  description: 'Create entity relationship diagrams and convert them to Snowflake DDL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background-light dark:bg-background-dark`}>
        {children}
      </body>
    </html>
  );
} 