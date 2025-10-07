import "./modal.css";

import { ButtonPrimary, ButtonSecondary } from "@components/spotify";

interface Props {
    confirmText?: string;
    cancelText?: string;
    onConfirm?(): void;
    onCancel?(): void;
}

export default function (props: Props) {
    return (
        <div className="ext-modal-footer">
            <ButtonPrimary onClick={() => props.onConfirm?.()}>
                {props.confirmText ?? "Save & Close"}
            </ButtonPrimary>
            <ButtonSecondary onClick={() => props.onCancel?.()}>
                {props.cancelText ?? "Cancel"}
            </ButtonSecondary>
        </div>
    );
}
