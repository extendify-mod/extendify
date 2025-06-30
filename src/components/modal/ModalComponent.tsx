import "./modal.css";

import { CloseIcon } from "@components/icons";

import { ButtonTertiary, ModalWrapper, React, Text } from "@webpack/common";

import { PropsWithChildren } from "react";

const createRandomString = (length: number): string => {
    let result = "";
    let counter = 0;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
        counter += 1;
    }
    return result;
};

type Props = PropsWithChildren<{
    animationMs?: number;
    className?: string;
    isOpen?: boolean;
    title?: string;
    onClose?: () => void;
}>;

export default (props: Props) => {
    const [id, _] = React.useState(createRandomString(10));

    React.useEffect(() => {
        if (!props.isOpen) {
            return;
        }

        let keyListener: (e: KeyboardEvent) => any;
        window.addEventListener(
            "keyup",
            (keyListener = (e) => {
                if (e.key === "Escape" && props.isOpen) {
                    props.onClose?.();
                    removeEventListener("keyup", keyListener);
                    e.preventDefault();
                }
            })
        );

        let mouseListener: (e: MouseEvent) => any;
        window.addEventListener(
            "mouseup",
            (mouseListener = (e) => {
                const children = (e.target as HTMLElement)?.children;
                if (children.length > 0 && children[0].id === id && props.isOpen) {
                    props.onClose?.();
                    removeEventListener("mouseup", mouseListener);
                    e.preventDefault();
                }
            })
        );
    }, [props]);

    return (
        <ModalWrapper
            id={id}
            className={props.className}
            animated={!!props.animationMs && props.animationMs > 0}
            animation={!!props.animationMs ? { closeTimeoutMs: props.animationMs } : undefined}
            isOpen={props.isOpen}
        >
            <div className="ext-modal-container">
                <div className="ext-modal-header">
                    <Text as="h1" semanticColor="textBase" variant="titleMedium">
                        {props.title}
                    </Text>
                    <ButtonTertiary
                        className="ext-modal-close"
                        aria-label="Close"
                        iconOnly={() => <CloseIcon />}
                        onClick={(_: any) => props.onClose?.()}
                    />
                </div>
                <div className="ext-modal-content">{props.children}</div>
            </div>
        </ModalWrapper>
    );
};
