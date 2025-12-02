import "./codeBlock.css";
import "highlight.js/styles/github-dark.css";

import { useEffect, useState } from "@api/react";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon } from "@components/icons";
import { ButtonTertiary } from "@components/spotify";

import hljs from "highlight.js";

const EMPTY_CODE = "...";

interface Props {
    code?: string;
    language: string;
    hidden?: boolean;
}

export default function (props: Props) {
    const [hidden, setHidden] = useState(props.hidden ?? !props.code);
    const [code, setCode] = useState<string>(EMPTY_CODE);

    useEffect(() => {
        if (!props.code) {
            return;
        }

        setCode(hljs.highlight(props.code, { language: props.language }).value);
        setHidden(props.hidden ?? false);
    }, [props.code]);

    return (
        <div className="ext-codeblock">
            <div className="ext-codeblock-actions">
                <ButtonTertiary
                    disabled={!props.code}
                    iconOnly={() => <CopyIcon />}
                    onClick={() => props.code && navigator.clipboard.writeText(props.code)}
                />
                <ButtonTertiary
                    iconOnly={() => (hidden ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                    onClick={() => setHidden(!hidden)}
                />
            </div>
            <pre>
                <code
                    className={`hljs language-${props.language.toLowerCase().replaceAll(" ", "-")}`}
                    dangerouslySetInnerHTML={{ __html: hidden ? EMPTY_CODE : (code ?? EMPTY_CODE) }}
                />
            </pre>
        </div>
    );
}
