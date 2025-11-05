'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Stock Analysis App</CardTitle>
          <CardDescription>Secure trading insights with AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => router.push('/login')} className="w-full">Login</Button>
          <Button onClick={() => router.push('/signup')} variant="outline" className="w-full">Sign Up</Button>
          <Button onClick={() => router.push('/admin/login')} variant="secondary" className="w-full">Admin Login</Button>
        </CardContent>
      </Card>
    </div>
  )
}