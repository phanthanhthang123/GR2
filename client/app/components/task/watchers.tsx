import type { User } from "@/type";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Watchers = ({ watchers }: { watchers: User[] }) => {
    return (
        <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Người Theo Dõi</h3>
            {watchers?.length ? (
                <ScrollArea className="h-[100px]">
                    <div className="space-y-2 pr-4">
                        {watchers.map((w) => (
                            <div
                                key={(w as any).id || (w as any)}
                                className="flex items-center gap-2"
                            >
                                <Avatar
                                    className="size-6 shrink-0"
                                    title={(w as any).username || (w as any).email || (w as any)}
                                >
                                    <AvatarImage src={(w as any).avatarUrl || undefined}></AvatarImage>
                                    <AvatarFallback>{(w as any).username?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-muted-foreground truncate">{(w as any).username || (w as any).email || (w as any)}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <span className="text-sm text-muted-foreground">Chưa có người theo dõi</span>
            )}
        </div>
    )
}