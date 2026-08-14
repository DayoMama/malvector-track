import './globals.css';

export const metadata = {
  title: 'MalVector Track — NMEP',
  description: 'Vector intervention distribution, disposal & insecticide resistance monitoring',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
