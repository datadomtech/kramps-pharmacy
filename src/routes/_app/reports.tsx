import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/reports"!</div>
}
