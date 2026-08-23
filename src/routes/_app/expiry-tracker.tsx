import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/expiry-tracker')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/expiry-tracker"!</div>
}
