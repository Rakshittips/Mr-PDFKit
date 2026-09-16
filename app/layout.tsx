import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Mr PDFKit - Privacy-First Local PDF Tools',
  description: 'Privacy-first local PDF utility. Merge, split, compress, rotate, organize, convert, protect, sign, and edit PDFs 100% locally on your device with Zero-Server Architecture.',
  openGraph: {
    title: 'Mr PDFKit - Privacy-First Local PDF Tools',
    description: 'Privacy-first local PDF utility. Merge, split, compress, rotate, organize, convert, protect, sign, and edit PDFs 100% locally on your device with Zero-Server Architecture.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mr PDFKit - Privacy-First Local PDF Tools',
    description: 'Privacy-first local PDF utility. Merge, split, compress, rotate, organize, convert, protect, sign, and edit PDFs 100% locally on your device with Zero-Server Architecture.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
