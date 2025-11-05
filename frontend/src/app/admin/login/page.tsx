'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import ReCAPTCHA from 'react-google-recaptcha'
import axios from 'axios'

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { ...formData, captcha_token: captchaToken, rememberMe })
      if (res.data.role !== 'admin') return toast.error('Admin access only')
      localStorage.setItem('adminToken', res.data.token)
      toast.success('Admin login successful')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <br></br>
          {/* <p className='underline'>Testing Information</p> */}
          <p>Admin email: admin@example.com</p>
          <p>Admin password: admin123</p>
          <CardDescription>Admin access only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
              <Label htmlFor="remember">Remember me</Label>
            </div>
            <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE!} onChange={(token) => setCaptchaToken(token || '')} />
            <Button type="submit" className="w-full" disabled={!captchaToken}>Login</Button>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
