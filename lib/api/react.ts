import { emitEvent } from "@api/context/event";
import { findModule } from "@webpack/module";

export let React: typeof import("react");
export let useState: typeof React.useState;
export let useEffect: typeof React.useEffect;
export let useLayoutEffect: typeof React.useLayoutEffect;
export let useMemo: typeof React.useMemo;
export let useRef: typeof React.useRef;
export let useReducer: typeof React.useReducer;
export let useCallback: typeof React.useCallback;

findModule<typeof React>("useState").then((module) => {
    React = module;
    ({ useState, useEffect, useLayoutEffect, useMemo, useRef, useReducer, useCallback } = React);

    emitEvent("reactLoaded", React);
});
