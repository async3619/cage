import { TaskClass } from "@tasks/base";
import { NotifyTask } from "@tasks/notify";
import { UnfollowerTask } from "@tasks/unfollower";
import { NewFollowerTask } from "@tasks/new-follower";
import { GrabUserTask } from "@tasks/grab-user";
import { SaveTask } from "@tasks/save";
import { RenameTask } from "@tasks/rename";

export const DEFAULT_TASKS: ReadonlyArray<TaskClass> = [
    GrabUserTask,
    NewFollowerTask,
    UnfollowerTask,
    RenameTask,
    NotifyTask,
    SaveTask,
];

export * from "./base";
export * from "./grab-user";
export * from "./new-follower";
export * from "./notify";
export * from "./unfollower";
