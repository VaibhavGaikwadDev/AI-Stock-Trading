'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import axios from 'axios'
import { z } from 'zod'
import ReCAPTCHA from 'react-google-recaptcha'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

export default function Signup() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '' })
  const [captchaToken, setCaptchaToken] = useState('')
  const router = useRouter()
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const validated = schema.parse(formData)
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, validated)
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`, { email: validated.email, purpose: 'verification' })
      toast.success('OTP sent')
      setStep(2)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Signup failed')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, { email: formData.email, otp: formData.otp })
      toast.success('Account verified')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{step === 1 ? 'Sign Up' : 'Verify OTP'}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE!} onChange={(token) => setCaptchaToken(token || '')} />
              <Button type="submit" className="w-full" disabled={!captchaToken}>Sign Up & Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input id="otp" value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Verify</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}