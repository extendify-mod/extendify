import "./restartWarning.css";

import { ButtonSecondary, Text, platform } from "@webpack/common";

type Props = {
    themeChanged?: boolean;
    needRestart?: string[];
};

export default (props: Props) => {
    return (
        <div className="ext-warning-container">
            <Text as="h1" variant="titleMedium" semanticColor="textBase">
                Restart Required
            </Text>
            <div className="ext-warning-content">
                <Text as="span" variant="bodyMedium" semanticColor="textSubdued">
                    {props.themeChanged
                        ? "A restart is required to apply the theme changes."
                        : "The following plugins require you to restart Spotify for changes to take effect:"}
                </Text>
                {!props.themeChanged && (
                    <ol>
                        {props.needRestart?.map((v) => (
                            <li key={v}>
                                <Text as="span" variant="bodyMediumBold" semanticColor="textBase">
                                    •&nbsp;{v}
                                </Text>
                            </li>
                        ))}
                    </ol>
                )}
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
