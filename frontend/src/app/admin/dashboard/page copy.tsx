'use client'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import axios from 'axios'

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('adminToken')}`

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <DataTable />
    </div>
  )
}