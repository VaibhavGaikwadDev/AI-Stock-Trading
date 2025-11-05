'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import axios from 'axios'
import { useState } from 'react'
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`

export default function Dashboard() {
  const queryClient = useQueryClient()
//   const toast = toast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [strategy, setStrategy] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: () => axios.get(`${process.env.NEXT_PUBLIC_API_URL}/wallet/balance`).then(res => res.data)
  })

  const { data: history } = useQuery({
    queryKey: ['history'],
    queryFn: () => axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stock/history`).then(res => res.data.history || [])
  })

  const handleAnalysis = async () => {
    if (!strategy || !image) return toast.error('Select strategy and upload image')
    const formData = new FormData()
    formData.append('strategy', strategy)
    formData.append('image', image)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/stock/analysis`, formData)
      toast.success('Analysis complete')
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    }
    setOpen(false)
  }

  const handleTopup = () => router.push('/topup')

  if (!balanceData) return <div>Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Balance: ${balanceData.balance}</p>
          <p>Trial Searches Left: {balanceData.trial_remaining}</p>
          <Button onClick={handleTopup}>Top-up Wallet</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stock Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger>
              <SelectValue placeholder="Select Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scalping">Scalping (2 credits)</SelectItem>
              <SelectItem value="Day Trading">Day Trading (3 credits)</SelectItem>
              <SelectItem value="Swing Trading">Swing Trading (5 credits)</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="image">Upload Chart Image</Label>
          <Input id="image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>Analyze</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Analysis</DialogTitle>
              </DialogHeader>
              <Button onClick={handleAnalysis}>Start</Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {history?.map((h: any) => (
            <div key={h.id} className="flex justify-between">
              <span>{h.strategy} - {new Date(h.created_at).toLocaleDateString()}</span>
              <Badge>{h.credits_deducted} credits</Badge>
            </div>
          )) || 'No history'}
        </CardContent>
      </Card>
    </div>
  )
}