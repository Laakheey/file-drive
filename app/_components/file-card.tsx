import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  FileTextIcon,
  GanttChartIcon,
  ImageIcon,
  VideoIcon,
} from "lucide-react";

import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { formatRelative } from "date-fns";
import { FileCardAction } from "./file-actions";

const FileCard = ({
  file,
}: {
  file: Doc<"files"> & { isFavourited: boolean; url: string | null };
}) => {
  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
    video: <VideoIcon />,
  } as Record<Doc<"files">["type"], ReactNode>;

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
            <div className="flex justify-center">{typeIcons[file.type]}</div>
            {file.name}
          </div>
          <FileCardAction isFavorited={file.isFavourited} file={file} />
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 mb-4 flex justify-center items-center">
        {file.type === "image" && file.url && (
          <Image
            alt={file.name}
            width={200}
            height={200}
            src={file.url}
          />
        )}
        {file.type === "csv" && <GanttChartIcon className="w-20 h-20" />}
        {file.type === "pdf" && <FileTextIcon className="w-20 h-20" />}
        {file.type === "video" && file.url && (
          <video
            src={file.url}
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
