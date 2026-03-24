import { Loader2 } from 'lucide-react'

export default function PortalLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}
