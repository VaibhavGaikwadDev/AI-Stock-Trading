// import type { Metadata } from 'next'
// import { Button } from "@/components/ui/button"
// import { IconLogout } from "@tabler/icons-react"
// import { useRouter } from 'next/navigation'

// export const metadata: Metadata = {
//   title: 'Admin Dashboard',
// }

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   const router = useRouter()

//   const handleLogout = () => {
//     localStorage.removeItem('adminToken')
//     router.push('/admin/login')
//   }

//   return (
//     <div className="flex h-screen">
//       <aside className="w-64 bg-muted p-4">
//         <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
//         <nav className="space-y-2">
//           <Button variant="link" onClick={() => router.push('/admin/users')}>Users</Button>
//           <Button variant="link" onClick={() => router.push('/admin/payments')}>Payments</Button>
//           <Button variant="link" onClick={() => router.push('/admin/history')}>History</Button>
//           <Button variant="ghost" onClick={handleLogout}>
//             <IconLogout className="mr-2" /> Logout
//           </Button>
//         </nav>
//       </aside>
//       <main className="flex-1 p-6">
//         {children}
//       </main>
//     </div>
//   )
// }