'use client'

import { useState } from 'react'
import { Lead } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin,
  ChevronDown,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface LeadsTableProps {
  leads: Lead[]
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  quoted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  won: 'bg-green-500/10 text-green-500 border-green-500/20',
  lost: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export function LeadsTable({ leads: initialLeads }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const supabase = createClient()

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      )
      toast.success('Status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  if (leads.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No leads yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            When customers submit quotes through your widget, they&apos;ll appear here.
            Make sure to configure your pricing and embed the widget on your website.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            All Leads ({leads.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Customer</TableHead>
              <TableHead className="text-muted-foreground">Contact</TableHead>
              <TableHead className="text-muted-foreground">Service</TableHead>
              <TableHead className="text-muted-foreground">Quote</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="border-border">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {lead.first_name} {lead.last_name}
                    </p>
                    {lead.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {lead.city}, {lead.state}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <a 
                      href={`mailto:${lead.email}`}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </a>
                    <a 
                      href={`tel:${lead.phone}`}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-foreground">{lead.product_name || '-'}</p>
                    {lead.capacity_label && (
                      <p className="text-xs text-muted-foreground">{lead.capacity_label}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {lead.quoted_price ? (
                      <p className="font-medium text-foreground">
                        ${lead.quoted_price.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">-</p>
                    )}
                    {lead.tier_selected && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {lead.tier_selected} tier
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-auto p-0"
                      >
                        <Badge 
                          variant="outline" 
                          className={`capitalize cursor-pointer ${statusColors[lead.status]}`}
                        >
                          {lead.status}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(['new', 'contacted', 'quoted', 'won', 'lost'] as const).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(lead.id, status)}
                          className="capitalize"
                        >
                          <Badge 
                            variant="outline" 
                            className={`${statusColors[status]} mr-2`}
                          >
                            {status}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </p>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
