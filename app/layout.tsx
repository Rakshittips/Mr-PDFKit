import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, Syne} from 'next/font/google';
import './globals.css'; // Global styles

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mr PDFKit - Privacy-First Local PDF Tools',
  description: 'Privacy-first local PDF utility. Open, read, merge, split, compress, rotate, organize, convert, protect, sign, and edit PDFs 100% locally on your device with Zero-Server Architecture.',
  openGraph: {
    title: 'Mr PDFKit - Privacy-First Local PDF Tools',
    description: 'Privacy-first local PDF utility. Open, read, merge, split, compress, rotate, organize, convert, protect, sign, and edit PDFs 100% locally on your device with Zero-Server Architecture.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mr PDFKit - Privacy-First Local PDF Tools',
    description: 'Privacy-first local PDF utility. Open, read, merge, split, compress, rotate, organize, convert, protect, sign, and edit PDFs 100% locally on your device with Zero-Server Architecture.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} ${syne.variable}`}
      style={{ colorScheme: 'dark', backgroundColor: '#0c0d0e' }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="bg-[#fafafa] dark:bg-[#0c0d0e] text-gray-900 dark:text-zinc-100 min-h-screen overflow-x-hidden max-w-full m-0 p-0 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
