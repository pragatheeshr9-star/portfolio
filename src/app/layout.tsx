import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pragatheesh | Azure Data & AI Engineer',
  description: 'Azure Data & AI Engineer specializing in Microsoft Fabric, Azure Data Factory, Lakehouse architectures, Azure AI, and RAG.',
  openGraph: {
    title: 'Pragatheesh | Azure Data & AI Engineer',
    description: 'Azure Data & AI Engineer specializing in Microsoft Fabric, Azure Data Factory, Lakehouse architectures, Azure AI, and RAG.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Hanken+Grotesk:ital,wght@0,300..900;1,300..900&family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" async />
      </head>
      <body className="bg-background paper-texture font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container min-h-screen relative overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
