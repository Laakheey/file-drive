"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, "Required"),
});

export default function UploadButton() {
  const { toast } = useToast();
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const fileRef = form.register("file");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) return;
    setIsFileUploading(true);

    const fileType = values.file[0].type;
    console.log(fileType);

    if (fileType === "video/mp4") {
      const videoInLength = await getVideoLengthInMinutes(values.file[0]);
      if (videoInLength > 5) {
        setIsFileUploading(false);
        toast({
          variant: "destructive",
          title: "Video length must be less than 5 minutes!",
        });
        return;
      }
    }

    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": fileType },
      body: values.file[0],
    });
    const { storageId } = await result.json();

    const types = {
      "image/png": "image",
      "image/jpeg": "image",
      "application/pdf": "pdf",
      "text/csv": "csv",
      "video/mp4": "video",
    } as Record<string, Doc<"files">["type"]>;

    try {
      await createFile({
        name: values.title,
        fileId: storageId,
        orgId,
        type: types[fileType],
      });
      form.reset();
      setIsFormDialogOpen(false);
      setIsFileUploading(false);
    } catch (error) {
      setIsFileUploading(false);
      toast({
        variant: "destructive",
        title: "File could not uploaded! Please try again later!",
      });
    }
  }

  function getVideoLengthInMinutes(videoFile: File): Promise<number> {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        resolve(video.duration / 60);
      };
      video.onerror = reject;
    });
  }

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const createFile = useMutation(api.files.createFile);

  return (
    <Dialog
      open={isFormDialogOpen}
      onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button onClick={() => {}}>Upload file</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-8">Upload your file</DialogTitle>
          <DialogDescription>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input type="file" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isFileUploading}
                  className="flex gap-2"
                >
                  Submit
                  {isFileUploading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              </form>
            </Form>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
