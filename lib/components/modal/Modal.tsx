import "./modal.css";

import { useEffect } from "@api/react";
import { CloseIcon } from "@components/icons";
import { ButtonTertiary, ModalWrapper, Text } from "@components/spotify";

import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    id?: string;
    animationMs?: number;
    className?: string;
    isOpen?: boolean;
    title?: string;
    onClose?(): void;
}>;

export default function (props: Props) {
    useEffect(() => {
        if (!props.isOpen) {
            return;
        }

        let keyListener: (event: KeyboardEvent) => any;
        window.addEventListener(
            "keyup",
            (keyListener = (event) => {
                if (!props.isOpen || event.key !== "Escape") {
                    return;
                }

                props.onClose?.();

                window.removeEventListener("keyup", keyListener);

                event.preventDefault();
            })
        );

        let mouseListener: (event: MouseEvent) => any;
        window.addEventListener(
            "mouseup",
            (mouseListener = (event) => {
                const children = (event.target as HTMLElement)?.children;

                if (children.length === 0 || children[0]?.id !== props.id || !props.isOpen) {
                    return;
                }

                props.onClose?.();

                window.removeEventListener("mouseup", mouseListener);

                event.preventDefault();
            })
        );
    }, [props]);

    const hasAnimation = (props.animationMs ?? 0) > 0;

    return (
        <ModalWrapper
            id={props.id}
            className={props.className}
            animated={hasAnimation}
            animation={hasAnimation ? { closeTimeoutMs: props.animationMs } : undefined}
            isOpen={props.isOpen}
        >
            <div className="ext-modal-container">
                <div className="ext-modal-header">
                    <Text as="h1" semanticColor="textBase" variant="titleMedium">
                        {props.title}
                    </Text>
                    <ButtonTertiary
                        // className="ext-modal-close"
                        aria-label="Close"
                        iconOnly={() => <CloseIcon />}
                        onClick={() => props.onClose?.()}
                    />
                </div>
                <div className="ext-modal-content">{props.children}</div>
            </div>
        </ModalWrapper>
    );
}
