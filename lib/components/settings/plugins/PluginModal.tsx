import "./plugin.css";
import "./pluginModal.css";

import type { Plugin } from "@api/context/plugin";
import Modal from "@components/modal/Modal";
import ModalFooter from "@components/modal/ModalFooter";
import { Link, Text, Tooltip } from "@components/spotify";

interface Props {
    plugin: Plugin;
    isOpen: boolean;
    onClose(): void;
    onRestartNeeded(): void;
}

export default function (props: Props) {
    return (
        <Modal
            id={`modal-${props.plugin.name}`}
            isOpen={props.isOpen}
            onClose={props.onClose}
            animationMs={100}
            title={props.plugin.name}
        >
            <div className="ext-plugin-modal-description">
                <Text as="span" variant="bodyMedium" semanticColor="textSubdued">
                    {props.plugin.description}
                </Text>
            </div>

            <Text as="span" variant="titleSmall" semanticColor="textBase">
                Authors
            </Text>
            <div className="ext-plugin-modal-authors">
                {props.plugin.authors.map((author) => (
                    <Tooltip label={author} placement="bottom">
                        <Link to={`https://github.com/${author}`}>
                            <img
                                src={`https://github.com/${author}.png`}
                                className="ext-plugin-author-pfp"
                            />
                        </Link>
                    </Tooltip>
                ))}
            </div>

            <Text as="span" variant="titleSmall" semanticColor="textBase">
                Settings
            </Text>
            <div className="ext-plugin-modal-settings"></div>

            <ModalFooter onConfirm={props.onClose} onCancel={props.onClose} />
        </Modal>
    );
}
