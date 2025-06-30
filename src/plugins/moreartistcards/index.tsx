import { definePluginSettings } from "@api/settings";
import { Devs } from "@utils/constants";
import { executeQuery, findQuery } from "@utils/graphql";
import { OptionType, definePlugin } from "@utils/types";
import { filters, waitForComponent } from "@webpack";
import { player, useEffect, useState } from "@webpack/common";
import { Song } from "@webpack/types";

let AboutArtist = waitForComponent("AboutArtist", filters.componentByName("profiler(NPVArtistAboutV2)"));

function MoreArtistCards() {
    const [cards, setCards] = useState<any>([]);
    const [song, setSong] = useState<Song>(player.getQueue().current);

    useEffect(() => {
        const interval = setInterval(() => {
            const { current } = player.getQueue();

            if (!current || (song && song.uri === current.uri)) {
                return;
            }

            setSong(current);
        }, 10);

        return () => {
            clearInterval(interval);
        };
    });

    useEffect(() => {
        const unionQuery = findQuery("queryNpvArtist");
        if (!unionQuery) {
            return;
        }

        const promises = song.artists.map(async (artist) => {
            const {
                data: { artistUnion: union }
            } = await executeQuery(unionQuery, {
                artistUri: artist.uri,
                trackUri: song.uri,
                enableRelatedAudioTracks: false,
                enableRelatedVideos: false
            });
            return (
                <AboutArtist
                    artistUri={artist.uri}
                    artist={union.profile}
                    stats={union.stats}
                    visuals={union.visuals}
                    externalLinks={union.profile.externalLinks.items}
                />
            );
        });

        Promise.all(promises).then((v) => {
            setCards(v.filter((v) => typeof v !== "undefined"));
        });
    }, [song]);

    return <>{cards}</>;
}

const settings = definePluginSettings({
    hideImages: {
        type: OptionType.BOOLEAN,
        description: "Hide artist images from the artist card",
        default: false,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "MoreArtistCards",
    description: "Displays every artist in the Now Playing section",
    authors: [Devs.elia],
    required: false,
    patches: [
        {
            // Inject all artist cards
            find: "NPVLyrics",
            replacement: [
                {
                    match: /(\(0,.\.jsx\)\(..\..,){artistUri:.+?,.+?}\)/,
                    replace: "$self.getArtistCards()"
                }
            ]
        },
        {
            // Hide artist images
            find: "web-player.now-playing-view.artist-about.title",
            predicate: () => settings.store.hideImages,
            replacement: [
                {
                    match: /(children:\[)(\(0,.*?name:.{1,3}?}\),)/,
                    replace: (_, prefix) => {
                        return prefix;
                    }
                }
            ]
        }
    ],
    settings,
    getArtistCards() {
        return <MoreArtistCards />;
    }
});
