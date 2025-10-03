import "./modal.css";

import { PrimaryButton, SecondaryButton } from "@components/spotify";

interface Props {
    confirmText?: string;
    cancelText?: string;
    onConfirm?(): void;
    onCancel?(): void;
}

export default function (props: Props) {
    return (
        <div className="ext-modal-footer">
            <PrimaryButton onClick={() => props.onConfirm?.()}>
                {props.confirmText ?? "Save & Close"}
            </PrimaryButton>
            <SecondaryButton onClick={() => props.onCancel?.()}>
                {props.cancelText ?? "Cancel"}
            </SecondaryButton>
        </div>
    );
}
