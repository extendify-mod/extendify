import { ButtonPrimary, ButtonSecondary, LabelTooltip } from "@extendify/components/spotify";

interface Props {
    confirmText?: string;
    confirmTooltip?: string;
    cancelText?: string;
    cancelTooltip?: string;
    disabled?: boolean;
    onConfirm?(): void;
    onCancel?(): void;
}

export default function (props: Props) {
    const confirm = (
        <ButtonPrimary disabled={props.disabled} onClick={() => props.onConfirm?.()}>
            {props.confirmText ?? "Save & Close"}
        </ButtonPrimary>
    );
    const cancel = (
        <ButtonSecondary onClick={() => props.onCancel?.()}>
            {props.cancelText ?? "Cancel"}
        </ButtonSecondary>
    );

    return (
        <div className="ext-modal-footer">
            {props.confirmTooltip ? (
                <LabelTooltip label={props.confirmTooltip}>{confirm}</LabelTooltip>
            ) : (
                confirm
            )}

            {props.cancelTooltip ? (
                <LabelTooltip label={props.cancelTooltip}>{cancel}</LabelTooltip>
            ) : (
                cancel
            )}
        </div>
    );
}
