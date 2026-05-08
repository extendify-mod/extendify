import { findModule } from "@webpack/module";

export let React: typeof import("react");
export let ReactDOM: typeof import("react-dom") & typeof import("react-dom/client");
export let useState: typeof React.useState;
export let useEffect: typeof React.useEffect;
export let useLayoutEffect: typeof React.useLayoutEffect;
export let useMemo: typeof React.useMemo;
export let useRef: typeof React.useRef;
export let useReducer: typeof React.useReducer;
export let useCallback: typeof React.useCallback;
export let forwardRef: typeof React.forwardRef;

window.ExtendifyFragment = Symbol.for("react.fragment");
window.ExtendifyCreateElement = () => {};

findModule<typeof React>("useState").then(module => {
    window.ExtendifyCreateElement = module.createElement;

    React = module;
    ({
        useState,
        useEffect,
        useLayoutEffect,
        useMemo,
        useRef,
        useReducer,
        useCallback,
        forwardRef
    } = React);
});

findModule<typeof ReactDOM>("createRoot").then(module => {
    ReactDOM = module;
});
