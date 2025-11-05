'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import ReCAPTCHA from 'react-google-recaptcha'
import axios from 'axios'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const validated = schema.parse(formData)
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { ...validated, captcha_token: captchaToken, rememberMe })
      localStorage.setItem('token', res.data.token)
      toast.success('Login successful')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter credentials to access.</CardDescription>
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
        <CardFooter className="flex justify-between">
          <Button variant="link" onClick={() => router.push('/forgot-password')}>Forgot Password?</Button>
          <Button variant="link" onClick={() => router.push('/signup')}>Sign Up</Button>
        </CardFooter>
      </Card>
    </div>
  )
}