import "./restartWarning.css";

import { ButtonSecondary, Text, platform } from "@webpack/common";

type Props = {
    needRestart?: string[];
};

export default (props: Props) => {
    return (
        <div className="ext-settings-container ext-restart-container">
            <Text as="h1" variant="titleMedium" semanticColor="textBase">
                Restart Required
            </Text>
            <div className="ext-warning-content">
                <Text as="span" variant="bodyMedium" semanticColor="textSubdued">
                    The following plugins require you to restart Spotify for changes to take effect:
                </Text>
                <ol>
                    {props.needRestart?.map((v) => (
                        <li key={v}>
                            <Text as="span" variant="bodyMediumBold" semanticColor="textBase">
                                •&nbsp;&nbsp;{v}
                            </Text>
                        </li>
                    ))}
                </ol>
                <ButtonSecondary
                    className="ext-warning-restart"
                    onClick={(_: any) =>
                        platform
                            .getRegistry()
                            .resolve<{
                                applyUpdate(): any;
                            }>(Symbol.for("UpdateAPI"))
                            .applyUpdate()
                    }
                >
                    Click to Restart
                </ButtonSecondary>
            </div>
        </div>
    );
};
