# Local artwork slot

No paintings or neutral artwork assets are included in this project. The
dashboard temporarily reuses `assets/tv-banner.png` with a midnight tint, hiding
the enlarged launcher branding. This is a neutral placeholder, not the intended
painting experience. The source asset is unchanged; no image was downloaded or
generated.

Place approved JPG/PNG/WebP paintings here, then add static `require()` entries (without the placeholder tint)
to `src/artwork/catalog.ts` and change `activeArtworkId`. Landscape images near
16:9 are a useful fit for the 1080p TV. Other aspect ratios are centered and
cropped with `cover`, preserving proportions with no empty edges or stretching.

`ArtworkBackground` accepts an artwork prop and transitions when its ID changes.
A future wallpaper selector or rotation controller only needs to supply that
prop; it does not need to rebuild dashboard navigation or positioning. No
wallpaper settings, downloads, automatic rotation or separate preference is
implemented here.

In development builds only, `/?artworkPreview=bright` and
`/?artworkPreview=dark` tint the existing opaque banner image to exercise
contrast extremes. These fixtures are not paintings or gallery choices. They
do not generate or modify any image asset and are ignored in production.
