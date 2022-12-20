import { BaseTask, TaskData } from "@tasks/base";

import { groupNotifies } from "@utils/groupNotifies";

export class NotifyTask extends BaseTask {
    public async process(previousData: TaskData[]): Promise<TaskData> {
        const newLogs = previousData.filter(BaseTask.isNewLogsData).flatMap(item => item.data);
        if (newLogs.length <= 0) {
            return this.skip("No new logs to notify was found");
        }

        const logMap = groupNotifies(newLogs);
        for (const notifier of this.notifiers) {
            await notifier.notify(newLogs, logMap);
        }

        return {
            type: "notify",
        };
    }
}
