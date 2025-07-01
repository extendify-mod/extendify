/**
 * Modified version of Vendicated's lazyReact.tsx
 * @link https://github.com/Vendicated/Vencord/blob/main/src/utils/lazyReact.tsx
 */
import { makeLazy } from "@utils/lazy";
import { React } from "@webpack/common";

const NoopComponent = () => null;

/**
 * A lazy component. The factory method is called on first render.
 * @param factory Function returning a Component
 * @param attempts How many times to try to get the component before giving up
 * @returns Result of factory function
 */
export const LazyComponent = <T extends object = any>(factory: () => React.ComponentType<T>, attempts = 500) => {
    const get = makeLazy(factory, attempts);
    const LazyComponent = (props: T) => {
        const Component = get() ?? NoopComponent;
        return <Component {...props} />;
    };

    LazyComponent.$$extendifyInternal = get;

    return LazyComponent as React.ComponentType<T>;
};
