import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get caller info
function getCallerInfo() {
    const error = new Error();
    const stack = error.stack.split('\n');
    // Find the first stack frame that's not this file
    for (let i = 0; i < stack.length; i++) {
        if (stack[i].includes('logger.config.js')) continue;
        const match = stack[i].match(/at (.+?) \((.+?):(\d+):\d+\)/) || stack[i].match(/at (.+?):(\d+):\d+/);
        if (match) {
            const funcName = match[1].split(' ')[0]; // Get function name
            const filePath = match[2];
            const relativePath = path.relative(process.cwd(), filePath);
            return { funcName, relativePath };
        }
    }
    return { funcName: 'unknown', relativePath: 'unknown' };
}

// Logger function
const logger = {
    info: (message) => {
        const { funcName, relativePath } = getCallerInfo();
        console.log(chalk.blue('======================='));
        console.log(chalk.blue(`[${relativePath}]/(${funcName}): ${chalk.green(message)}`));
        console.log(chalk.blue('======================='));
    },
    warn: (message) => {
        const { funcName, relativePath } = getCallerInfo();
        console.log(chalk.yellow('======================='));
        console.log(chalk.yellow(`[${relativePath}]/(${funcName}): ${chalk.yellow(message)}`));
        console.log(chalk.yellow('======================='));
    },
    error: (message) => {
        const { funcName, relativePath } = getCallerInfo();
        console.log(chalk.red('======================='));
        console.log(chalk.red(`[${relativePath}]/(${funcName}): ${chalk.red(message)}`));
        console.log(chalk.red('======================='));
    },
    debug: (message) => {
        const { funcName, relativePath } = getCallerInfo();
        console.log(chalk.magenta('======================='));
        console.log(chalk.magenta(`[${relativePath}]/(${funcName}): ${chalk.cyan(message)}`));
        console.log(chalk.magenta('======================='));
    },
    success: (message) => {
        const { funcName, relativePath } = getCallerInfo();
        console.log(chalk.green('======================='));
        console.log(chalk.green(`[${relativePath}]/(${funcName}): ${chalk.green.bold(message)}`));
        console.log(chalk.green('======================='));
    }
};

export default logger;
