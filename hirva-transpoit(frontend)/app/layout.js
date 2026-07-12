import "./globals.css";

export const metadata = {
  title: "TransitOps — Fleet Command",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-orna" />
        <div className="bg-glow-navy" />
        <div className="bg-glow-gold" />
        {children}
      </body>
    </html>
  );
}
