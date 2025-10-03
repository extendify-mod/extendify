import { LOGGER_NAME } from "@shared/constants";

type LogLevel = "error" | "warn" | "info" | "debug";

const levelColors: Record<LogLevel, string> = {
    info: "#2596be",
    error: "#e81c1c",
    warn: "#e8801c",
    debug: "#b57af5"
};

function getNameHash(name: string): number {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}

export class Logger {
    static style = "color: black; font-weight: bold; border-radius: 5px;";

    private readonly name: string;
    private readonly color: string;

    constructor(name: string, color?: string) {
        this.name = name;
        this.color = color ?? `hsl(${getNameHash(name) % 360}, 100%, 85%)`;
    }

    public log(level: LogLevel, args: any[]) {
        console[level](
            `%c ${LOGGER_NAME} %c %c ${this.name} `,
            `${Logger.style} background: ${levelColors[level]};`,
            "",
            `${Logger.style} background: ${this.color}`,
            ...args
        );
    }

    public debug(...args: any[]) {
        this.log("debug", args);
    }

    public info(...args: any[]) {
        this.log("info", args);
    }

    public warn(...args: any[]) {
        this.log("warn", args);
    }

    public error(...args: any[]) {
        this.log("error", args);
    }
}

export function createLogger({ name, color }: { name: string; color?: string }) {
    return new Logger(name, color);
}
