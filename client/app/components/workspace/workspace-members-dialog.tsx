import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRemoveMemberFromWorkspaceMutation } from "@/hooks/use-workspace";
import { useAuth } from "@/provider/auth-context";
import type { Workspace } from "@/type";

const getLastNameInitial = (username: string) => {
  if (!username || username.trim() === "") return "";
  const names = username.trim().split(" ").filter(name => name.length > 0);
  if (names.length === 0) return "";
  const lastName = names[names.length - 1];
  return lastName.charAt(0).toUpperCase();
};

export const WorkspaceMembersDialog = ({
  isOpen,
  onOpenChange,
  workspace,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { mutateAsync: removeMemberAsync, isPending } = useRemoveMemberFromWorkspaceMutation();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; username: string } | null>(null);

  // Check if current user is Leader or Owner
  const isCurrentUserLeader = React.useMemo(() => {
    if (isAuthLoading || !user || !workspace) return false;
    
    // Check if user is owner
    if (workspace.onwner === user.id || (typeof workspace.onwner === 'object' && workspace.onwner?.id === user.id)) {
      return true;
    }
    
    // Check if user is Leader in members
    return workspace.members?.some((member: any) => {
      const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
      return memberUserId === user.id && member.role === 'Leader';
    }) || false;
  }, [isAuthLoading, user, workspace]);

  const handleRemoveClick = (memberId: string, username: string) => {
    setMemberToRemove({ id: memberId, username });
    setConfirmDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!workspace.id || !memberToRemove) return;
    
    try {
      await removeMemberAsync({
        workspaceId: workspace.id,
        userId: memberToRemove.id,
      });
      toast.success("Member removed successfully!");
      setConfirmDialogOpen(false);
      setMemberToRemove(null);
    } catch (error: any) {
      const errorMessage =
        (error as any)?.response?.data?.msg ||
        "Failed to remove member from workspace";
      toast.error(errorMessage);
    }
  };

  const members = workspace?.members || [];
  const ownerId = typeof workspace?.onwner === 'object' ? workspace.onwner?.id : workspace?.onwner;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace Members</DialogTitle>
          <DialogDescription>
            View and manage members of this workspace.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] mt-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {members.map((member: any) => {
                const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
                const isOwner = memberUserId === ownerId;
                const canDelete = isCurrentUserLeader && !isOwner && memberUserId !== user?.id;

                return (
                  <div
                    key={member.user_id || memberUserId}
                    className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
                  >
                    <Avatar className="size-10">
                      <AvatarImage
                        src={member.user?.avatarUrl || undefined}
                        alt={member.user?.username || "User Avatar"}
                      />
                      <AvatarFallback>
                        {member.user?.username
                          ? getLastNameInitial(member.user.username)
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {member.user?.username || "Unknown User"}
                        </p>
                        {isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            Owner
                          </Badge>
                        )}
                        {!isOwner && member.role && (
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.user?.email || "No email"}
                      </p>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClick(memberUserId, member.user?.username || "Unknown User")}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.username}</strong> from this workspace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setMemberToRemove(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

