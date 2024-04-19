import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DownloadIcon,
  FileTextIcon,
  GanttChartIcon,
  ImageIcon,
  MoreVertical,
  StarIcon,
  TrashIcon,
  UndoIcon,
  VideoIcon,
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
import { ReactNode, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Protect } from "@clerk/nextjs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistance, formatRelative, subDays } from "date-fns";

const getFileUrl = (fileId: Id<"_storage">): string => {
  let p = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${fileId}`;
  return p;
};

const FileCardAction = ({
  file,
  isFavorited,
}: {
  file: Doc<"files">;
  isFavorited: boolean;
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteFile = useMutation(api.files.deleteFile);
  const restoreFile = useMutation(api.files.restoreFile);
  const { toast } = useToast();
  const favorite = useMutation(api.files.toggleFavorite);

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
            onClick={() => window.open(getFileUrl(file.fileId), "_blank")}
          >
            <DownloadIcon className="w-4 h-4" />
            Download
          </DropdownMenuItem>

          <Protect role="org:admin" fallback={<></>}>
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

const FileCard = ({
  file,
  allFavorites,
}: {
  file: Doc<"files">;
  allFavorites: Doc<"favorites">[];
}) => {
  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
    video: <VideoIcon />,
  } as Record<Doc<"files">["type"], ReactNode>;

  const isFavorited = allFavorites.some((fav) => fav.fileId === file._id);

  const userProfile = useQuery(api.files.getUserProfile, {
    userId: file.userId,
  });

  let formattedDate = formatRelative(new Date(file._creationTime), new Date());
  formattedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex justify-center items-center text-center gap-2 test-base font-normal">
            <div className="flex justify-center">
            {typeIcons[file.type]}
            </div>
            {file.name}
          </div>
          <FileCardAction isFavorited={isFavorited} file={file} />
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 mb-4 flex justify-center items-center">
        {file.type === "image" && (
          <Image
            alt={file.name}
            width={200}
            height={200}
            src={getFileUrl(file.fileId)}
          />
        )}
        {file.type === "csv" && <GanttChartIcon className="w-20 h-20" />}
        {file.type === "pdf" && <FileTextIcon className="w-20 h-20" />}
        {file.type === "video" && (
          <video
            src={getFileUrl(file.fileId)}
            controls
            className="w-[80%] rounded"
          ></video>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex justify-end items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userProfile?.imageUrl} />
          </Avatar>
          <div className="text-sm font-semibold">{userProfile?.name}</div>
        </div>
        <div className="text-sm text-gray-600">
          {`Uploaded: ${formattedDate}`}
        </div>
      </CardFooter>
    </Card>
  );
};

export default FileCard;
