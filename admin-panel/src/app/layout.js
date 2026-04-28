import './globals.css'

export const metadata = {
  title: '2Type Admin Panel',
  description: 'Painel Administrativo — 2Type | TwoType',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
