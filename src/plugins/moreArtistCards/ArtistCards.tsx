import { registerContext } from "@api/context";
import { registerEventListener, removeEventListener } from "@api/context/event";
import { executeQuery, findQuery } from "@api/gql";
import { player } from "@api/platform";
import { useEffect, useState } from "@api/react";
import { ArtistAbout } from "@components/spotify";
import type { ArtistUnion, Song } from "@shared/types/spotify/player";

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
            song.artists.map(async (artist) => {
                const {
                    data: { artistUnion: union }
                } = await executeQuery<{
                    artistUnion: ArtistUnion;
                }>(unionQuery, {
                    artistUri: artist.uri,
                    trackUri: song.uri,
                    enableRelatedAudioTracks: false,
                    enableRelatedVideos: false
                });

                return (
                    <ArtistAbout
                        artistUri={artist.uri}
                        artist={union.profile}
                        stats={union.stats}
                        visuals={union.visuals}
                        externalLinks={union.profile.externalLinks.items}
                    />
                );
            })
        );

        setCards(builtCards);
    }

    useEffect(() => {
        setState(player?.getQueue().current);

        const listener = registerEventListener(context, "songChanged", (song) => setState(song));

        return () => {
            removeEventListener(context, listener);
        };
    }, []);

    return <>{cards}</>;
}
