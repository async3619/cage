import { User } from "@repositories/models/user";

import { BaseTask, TaskData } from "@tasks/base";

export class GrabUserTask extends BaseTask {
    public async process(): Promise<TaskData> {
        const taskStartedAt = new Date();
        const allUsers: User[] = [];
        for (const watcher of this.watchers) {
            const users = await watcher.doWatch(taskStartedAt);
            allUsers.push(...users);
        }

        if (allUsers.length <= 0) {
            return this.terminate("No followers found");
        }

        return {
            type: "new-users",
            data: allUsers,
        };
    }
}
