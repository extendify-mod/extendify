import "./modal.css";

import { ButtonPrimary, ButtonSecondary } from "@components/spotify";

interface Props {
    confirmText?: string;
    cancelText?: string;
    disabled?: boolean;
    onConfirm?(): void;
    onCancel?(): void;
}

export default function (props: Props) {
    return (
        <div className="ext-modal-footer">
            <ButtonPrimary onClick={() => props.onConfirm?.()} disabled={props.disabled}>
                {props.confirmText ?? "Save & Close"}
            </ButtonPrimary>
            <ButtonSecondary onClick={() => props.onCancel?.()}>
                {props.cancelText ?? "Cancel"}
            </ButtonSecondary>
        </div>
    );
}
