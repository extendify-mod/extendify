export function hasArg(name: string): boolean {
    return Bun.argv.includes(`--${name}`);
}

export function getKwarg(name: string): string | undefined {
    for (const arg of Bun.argv) {
        if (arg.startsWith(`--${name}=`)) {
            return arg.substring(arg.indexOf("=")+1);
        }
    }
}
