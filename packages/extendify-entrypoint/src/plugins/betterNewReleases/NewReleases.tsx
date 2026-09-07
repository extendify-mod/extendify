import type { FeedProps, Group } from ".";
import Timeline from "./Timeline";

function createGroups(props: FeedProps): Group[] | undefined {
    if (!props.data) {
        return;
    }

    const groups: Group[] = [];

    for (const item of props.data.whatsNewFeedItems.items) {
        const groupIdx = groups.findIndex(v => v.timestamp.isoString === item.timestamp.isoString);

        if (groupIdx === -1) {
            groups.push({
                entries: [item.content.data],
                label: formatLabel(item.timestamp.isoString),
                timestamp: item.timestamp
            });
        } else {
            groups[groupIdx]?.entries.push(item.content.data);
        }
    }

    return groups;
}

function formatLabel(iso: string) {
    const [y, m, d] = iso.split(/\D/);
    return `${m}/${d}/${y?.slice(2)}`;
}

export default function (props: FeedProps) {
    const groups = createGroups(props);

    return (
        <div className="ext-new-releases">
            <div className="ext-new-releases-scroll">
                <div className="ext-new-releases-inner">
                    <Timeline groups={groups} />
                </div>
            </div>
        </div>
    );
}
