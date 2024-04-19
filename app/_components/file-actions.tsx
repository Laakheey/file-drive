import { Doc } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DownloadIcon,
  MoreVertical,
  StarIcon,
  TrashIcon,
  UndoIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Protect } from "@clerk/nextjs";

export const FileCardAction = ({
  file,
  isFavorited,
}: {
  file: Doc<"files"> & { url: string | null };
  isFavorited: boolean;
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteFile = useMutation(api.files.deleteFile);
  const restoreFile = useMutation(api.files.restoreFile);
  const { toast } = useToast();
  const favorite = useMutation(api.files.toggleFavorite);
  const me = useQuery(api.users.getMe);

  function downloadFile(url: string, fileType: string) {
    toast({
      variant: "default",
      title: "File is being downloaded",
    });
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = () => {
      const blob = xhr.response;
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      switch (fileType) {
        case "image":
          downloadLink.download = "image.png";
          break;
        case "image":
          downloadLink.download = "image.jpg";
          break;
        case "application":
          downloadLink.download = "document.pdf";
          break;
        case "text":
          downloadLink.download = "data.csv";
          break;
        case "video":
          downloadLink.download = "video.mp4";
          break;
        default:
          downloadLink.download = "file";
      }
      downloadLink.click();
      toast({
        variant: "success",
        title: "File has been successfully downloaded",
      });
    };
    xhr.onerror = () => {
      toast({
        variant: "destructive",
        title: "Download failed",
      });
    };
    xhr.open("GET", url);
    xhr.send();
  }

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              File will be sent in trash and if not recovered in 30 days file
              shall be deleted permanently
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteFile({
                  fileId: file._id,
                });
                toast({
                  variant: "success",
                  title: "File sent in trash successfully",
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {!file.isMarkedForDelete && (
            <DropdownMenuItem
              className="flex gap-1 items-center cursor-pointer"
              onClick={() =>
                favorite({
                  fileId: file._id,
                })
              }
            >
              {isFavorited ? (
                <div className="flex gap-2 items-center">
                  <Image
                    src={"/fav.svg"}
                    height={16}
                    width={16}
                    alt="favorite"
                  />
                  UnFavorite
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <StarIcon className="w-4 h-4" />
                  Favorite
                </div>
              )}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className={`flex gap-1 items-center cursor-pointer`}
            onClick={() => {
              if (file.url) downloadFile(file.url, file.type);
            }}
          >
            <DownloadIcon className="w-4 h-4" />
            Download
          </DropdownMenuItem>

          <Protect
            condition={(check) => {
              return (
                check({
                  role: "org:admin",
                }) || file.userId === me?._id
              );
            }}
            fallback={<></>}
          >
            {!file.isMarkedForDelete && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className={`flex gap-1 items-center cursor-pointer ${file.isMarkedForDelete ? "text-green-500" : "text-red-500"}`}
              onClick={() => {
                if (file.isMarkedForDelete) {
                  restoreFile({
                    fileId: file._id,
                  });
                } else {
                  setIsConfirmOpen(true);
                }
              }}
            >
              {file.isMarkedForDelete ? (
                <>
                  <UndoIcon className="w-4 h-4" /> Restore
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </>
              )}
            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
