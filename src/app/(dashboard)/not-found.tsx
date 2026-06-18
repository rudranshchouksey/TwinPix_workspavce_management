import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardNotFound() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-800)] text-[var(--color-surface-400)]">
          <FileQuestion className="h-10 w-10" />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-white">Page not found</h2>
        <p className="mb-8 text-lg text-[var(--color-surface-400)]">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Link href="/dashboard" passHref>
          <Button variant="default" size="lg">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
