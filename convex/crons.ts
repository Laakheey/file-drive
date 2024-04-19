import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "Delete files from trash",
  { minutes: 30 },
  internal.files.deleteAllFiles,
);

export default crons;
