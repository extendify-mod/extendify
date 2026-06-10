import { registerContext } from "@extendify/api/context";
import { registerEventListener, removeEventListener } from "@extendify/api/context/event";
import { executeQuery, findQuery } from "@extendify/api/gql";
import { player } from "@extendify/api/platform";
import { useEffect, useState } from "@extendify/api/react";
import { ArtistAbout } from "@extendify/components/spotify";
import type { ArtistUnion, Song } from "@extendify/shared/types/spotify/player";

import type { ReactElement } from "react";

const { context } = registerContext({
    name: "ArtistCardsComponent",
    platforms: ["desktop", "browser"]
});

export default function () {
    const unionQuery = findQuery("queryNpvArtist");

    const [cards, setCards] = useState<ReactElement[]>([]);

    async function setState(song: Song | undefined) {
        if (!unionQuery || !song) {
            return;
        }

        const builtCards = await Promise.all(
            song.artists.map(async artist => {
                const {
                    data: { artistUnion: union }
                } = await executeQuery<{
                    artistUnion: ArtistUnion;
                }>(unionQuery, {
                    artistUri: artist.uri,
                    enableRelatedAudioTracks: false,
                    enableRelatedVideos: false,
                    trackUri: song.uri
                });

                return (
                    <ArtistAbout
                        artist={union.profile}
                        artistUri={artist.uri}
                        externalLinks={union.profile.externalLinks.items}
                        stats={union.stats}
                        visuals={union.visuals}
                    />
                );
            })
        );

        setCards(builtCards);
    }

    useEffect(() => {
        setState(player?.getQueue().current);

        const onSongChanged = registerEventListener(context, "songChanged", song => setState(song));
        const onPlay = registerEventListener(context, "play", state => setState(state.item));

        return () => {
            removeEventListener(context, onSongChanged);
            removeEventListener(context, onPlay);
        };
    }, []);

    return <>{cards}</>;
}
