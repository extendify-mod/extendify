import type { Song } from "@shared/types/spotify/player";
import type { PlaylistQueryOptions, SortField, SortOrder } from "@shared/types/spotify/queue";

export function filterResults(items: Song[], options: PlaylistQueryOptions): Song[] {
    const { filter, sort } = options;

    if (filter?.length) {
        items = items.filter(
            (song) =>
                song.album.name.toLowerCase().includes(filter) ||
                song.artists.some((artist) => artist.name.toLowerCase().includes(filter)) ||
                song.name.toLowerCase().includes(filter)
        );
    }

    if (sort) {
        items = sortResults(items, sort.field, sort.order);
    }

    return items;
}

export function sortResults(items: Song[], field: SortField, order: SortOrder): Song[] {
    const asc = order === "ASC";

    return items.sort((a, b) => {
        let valueA: string | number | undefined;
        let valueB: string | number | undefined;

        switch (field) {
            case "TITLE":
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case "ARTIST":
                valueA = a.artists[0]?.name.toLowerCase();
                valueB = b.artists[0]?.name.toLowerCase();
                break;
            case "ALBUM":
                valueA = a.album.name.toLowerCase();
                valueB = b.album.name.toLowerCase();
                break;
            case "ADDED_AT":
                valueA = a.addedAt ? new Date(a.addedAt).getTime() : a.addedAt;
                valueB = b.addedAt ? new Date(b.addedAt).getTime() : b.addedAt;
                break;
            case "DURATION":
                valueA = a.duration.milliseconds;
                valueB = b.duration.milliseconds;
                break;
        }

        if (typeof valueA === "string" && typeof valueB === "string") {
            return asc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueB);
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
            return asc ? valueA - valueB : valueB - valueA;
        }

        return 0;
    });
}
