import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Qwizli Rankings',
  description: 'Global leaderboard and rankings for Qwizli quiz platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="bg"></div>
        {children}
        <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
      </body>
    </html>
  )
}
