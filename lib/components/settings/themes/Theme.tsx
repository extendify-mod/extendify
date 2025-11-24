import type { Theme } from "@api/themes";

import { useState } from "react";

interface Props {
    theme: Theme;
}

export default function (props: Props) {
    const [enabled, setEnabled] = useState();
}
