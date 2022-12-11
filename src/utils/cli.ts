import chalk from "chalk";
import stripAnsi from "strip-ansi";

export function printLogo(latestVersion: string, currentVersion: any) {
    const isOutdated = latestVersion !== currentVersion;
    const formatFunction = !isOutdated ? chalk.green : chalk.yellow;
    const versionInfo = chalk.italic(formatFunction(`v${currentVersion} ${isOutdated ? "(outdated)" : ""}`));

    const content = `  _________ _____ ____ 
 / ___/ __ \`/ __ \`/ _ \\
/ /__/ /_/ / /_/ /  __/
\\___/\\__,_/\\__, /\\___/ 
          /____/          ${versionInfo}`;

    console.log(chalk.cyan(content));

    return Math.max(
        ...stripAnsi(content)
            .split("\n")
            .map(l => l.length),
    );
}

export function drawLine(width = 45) {
    console.log("=".repeat(width));
}
