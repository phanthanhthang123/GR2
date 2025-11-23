import { CreateWorkspaceSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { COLOR_OPTION } from "@/constants/workspace";
import { useAuth } from "@/provider/auth-context";
import { useCreateWorkspaceMutation } from "@/hooks/use-workspace";
import z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface CreateWorkspaceProps {
  isCreatingWorkspace: boolean;
  setIsCreatingWorkspace: (isCreatingWorkspace: boolean) => void;
}

export const CreateWorkspace = ({
  isCreatingWorkspace,
  setIsCreatingWorkspace,
}: CreateWorkspaceProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const WorkspaceSchema = CreateWorkspaceSchema(t);
  type WorkspaceForm = z.infer<typeof WorkspaceSchema>;
  const form = useForm<WorkspaceForm>({
    resolver: zodResolver(WorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      color: COLOR_OPTION[0]
    }
  });
  const navigate = useNavigate();
  const {mutate,isPending} = useCreateWorkspaceMutation();
  
  const onSubmit = async (data: WorkspaceForm) => {
    console.log(data);
    console.log(user?.id);
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }
    
    try {
      mutate({
        ...data,
        owner_id: user.id
      },{
        onSuccess: (data: any) => {
          console.log(data);
          setIsCreatingWorkspace(false);
          form.reset();
          toast.success("Workspace created successfully");
          navigate(`/workspaces/${data.response.id}`);
        },
        onError: (error: any) => {
          const errorMessage = (error as any)?.response?.data?.message || "Failed to create workspace";
          toast.error(errorMessage);
        }
      });
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || "Failed to create workspace";
      toast.error(errorMessage);
    }
  };
  return (
    <Dialog
      open={isCreatingWorkspace}
      onOpenChange={setIsCreatingWorkspace}
      modal={true}
    >
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Workspace Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Workspace Description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-3 flex-wrap">
                        {COLOR_OPTION.map((color) => (
                              <div key={color}
                              onClick={()=>field.onChange(color)}
                              className={cn("w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-all duration-300",
                                    field.value === color && "ring-2 ring-offset-2 ring-blue-500"
                              )}
                              style={{backgroundColor: color}}
                              ></div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                        {isPending ? "Createing..." : "Create"}
                  </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
