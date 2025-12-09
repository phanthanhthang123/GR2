import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { toast } from "sonner";
import { useAddMemberToWorkspaceMutation, useGetAllUsersQuery } from "@/hooks/use-workspace";
import { Loader } from "../loader";
import type { User } from "@/type";

const InviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["Leader", "Manager", "Developer"]),
});

export type InviteMemberFormData = z.infer<typeof InviteMemberSchema>;

export const InviteMemberDialog = ({
  isOpen,
  onOpenChange,
  workspaceId,
  existingMembers = [],
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  existingMembers?: any[];
}) => {
  const [activeTab, setActiveTab] = useState<"email" | "list">("email");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("Developer");
  
  const { mutateAsync: addMemberAsync, mutate: addMember } = useAddMemberToWorkspaceMutation();
  const [isPending, setIsPending] = useState(false);
  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(searchQuery);

  const form = useForm<InviteMemberFormData>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: {
      email: "",
      role: "Developer",
    },
  });

  // Filter out existing members from users list
  const availableUsers = useMemo(() => {
    const users = (usersData as any)?.response || [];
    if (!users || users.length === 0) return [];
    const existingMemberIds = existingMembers.map((m: any) => 
      typeof m.user === 'string' ? m.user : m.user?.id || m.user_id
    );
    return users.filter((user: User) => 
      !existingMemberIds.includes(user.id)
    );
  }, [usersData, existingMembers]);

  const onSubmitEmail = (data: InviteMemberFormData) => {
    addMember(
      { workspaceId, email: data.email, role: data.role },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success("Member added successfully!");
        },
        onError: (error: any) => {
          const errorMessage =
            (error as any)?.response?.data?.msg ||
            "Failed to add member to workspace";
          toast.error(errorMessage);
        },
      }
    );
  };

  const onSubmitList = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    
    setIsPending(true);
    
    try {
      // Add members one by one using Promise.allSettled to handle all results
      const addPromises = selectedUserIds.map((userId) => 
        addMemberAsync({ workspaceId, userId, role: selectedRole })
          .then(() => ({ success: true, userId }))
          .catch((error: any) => {
            const errorMessage =
              (error as any)?.response?.data?.msg ||
              "Failed to add member";
            return { success: false, error: errorMessage, userId };
          })
      );

      // Wait for all requests to complete
      const results = await Promise.all(addPromises);
      
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;
      const errors = results
        .filter((r): r is { success: false; error: string; userId: string } => !r.success)
        .map((r) => r.error || "Failed");

      // Show results
      if (successCount > 0) {
        // Reset state first
        setSelectedUserIds([]);
        setSearchQuery("");
        
        // Show toast
        if (errorCount > 0) {
          toast.warning(
            `Added ${successCount} member(s) successfully. ${errorCount} failed.`
          );
        } else {
          toast.success(
            `Successfully added ${successCount} member(s)!`
          );
        }
        
        // Close dialog after a small delay to ensure toast is visible
        setTimeout(() => {
          onOpenChange(false);
        }, 100);
      } else {
        toast.error("Failed to add members. " + (errors[0] || ""));
      }
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("Failed to add members");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Add a new member to this workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "email" | "list")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">By Email</TabsTrigger>
            <TabsTrigger value="list">From List</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitEmail)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="user@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Leader">Leader</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="list" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-user">Search User</Label>
                <Input
                  id="search-user"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="role-select">Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                >
                  <SelectTrigger id="role-select" className="mt-2">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Leader">Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select User</Label>
                  {selectedUserIds.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                <ScrollArea className="h-[300px] border rounded-md mt-2">
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader />
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {searchQuery ? "No users found" : "Start typing to search users"}
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {availableUsers.map((user: User) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => {
                              // Toggle selection: if already selected, deselect; otherwise select
                              setSelectedUserIds(prev => 
                                isSelected 
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent border-transparent"
                            }`}
                          >
                            <Avatar className="size-8">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>
                                {user.username?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.username}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            {isSelected && (
                              <div className="size-4 rounded-full bg-primary flex items-center justify-center">
                                <div className="size-2 rounded-full bg-primary-foreground" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitList}
                  disabled={isPending || selectedUserIds.length === 0}
                >
                  {isPending 
                    ? `Adding ${selectedUserIds.length} member${selectedUserIds.length > 1 ? 's' : ''}...` 
                    : `Add ${selectedUserIds.length > 0 ? `${selectedUserIds.length} ` : ''}Member${selectedUserIds.length > 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

