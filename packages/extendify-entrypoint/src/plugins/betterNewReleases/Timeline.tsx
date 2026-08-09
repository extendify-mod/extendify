import { Text } from "@extendify/components/spotify";
import { exportFilters, findModuleComponent } from "@extendify/webpack/module";

import type { Group } from ".";

interface Props {
    groups?: Group[];
}

const AlbumRelease = findModuleComponent(
    exportFilters.byCode({
        matches: [/{title:\i,pretitle:`/, "artistUri"],
        mode: "all"
    })
);
const EpisodeRelease = findModuleComponent(
    exportFilters.byCode(/{title:\i,pretitle:\[\i\.\i\.get\("card.tag.episode"\)/)
);

export default function (props: Props) {
    return (
        <div className="ext-timeline">
            <div className="ext-timeline-line" />

            {props.groups?.map(v => (
                <div className="ext-timeline-col" key={v.timestamp.isoString}>
                    <Text as="span">{v.label}</Text>
                    <span className="ext-timeline-dot" />
                    <div className="ext-timeline-col-tracks">
                        {v.entries.map((entry, index) => {
                            const images = entry.coverArt?.sources ?? [];

                            if (entry.__typename === "Album") {
                                return (
                                    <AlbumRelease
                                        artists={entry.artists.items.map((artist: any) => ({
                                            name: artist.profile.name,
                                            type: "artist",
                                            uri: artist.uri
                                        }))}
                                        images={images}
                                        key={entry.uri}
                                        name={entry.name}
                                        position={index}
                                        type={entry.albumType}
                                        uri={entry.uri}
                                    />
                                );
                            } else if (entry.__typename === "Episode") {
                                return (
                                    <EpisodeRelease
                                        description={entry.description ?? void 0}
                                        images={images}
                                        name={entry.name}
                                        podcastName={entry.podcastV2?.data?.name ?? ""}
                                        position={index}
                                        uri={entry.uri}
                                        videoThumbnailImages={[]}
                                    />
                                );
                            }
                            console.log("sum else", entry.__typename);

                            return <></>;
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
