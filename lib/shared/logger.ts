import { LOGGER_NAME } from "./constants";

type LogLevel = "error" | "warn" | "info" | "debug";

function getLevelColor(level: LogLevel) {
    switch (level) {
        default:
        case "info":
            return "#2596be";
        case "error":
            return "#e81c1c";
        case "warn":
            return "#e8801c";
        case "debug":
            return "#9c139a";
    }
}

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
            `${Logger.style} background: ${getLevelColor(level)};`,
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
