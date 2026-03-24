export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="light">
      {children}
    </div>
  )
}
