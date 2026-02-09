import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ShadcnTestPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 space-y-8">
            <div className="space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gradient">Shadcn UI + Tailwind v4</h1>
                <p className="text-muted-foreground">Verify that styles are loading correctly.</p>
            </div>

            <Card className="w-[350px] glass-panel border-white/10">
                <CardHeader>
                    <CardTitle>Integration Test</CardTitle>
                    <CardDescription>If you see this styled, it works!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                        <Input placeholder="hello@example.com" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Deploy</Button>
                </CardFooter>
            </Card>

            <div className="flex gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
            </div>
        </div>
    )
}
