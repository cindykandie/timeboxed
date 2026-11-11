# Local font assets

Place the supplied Fontshare downloads here, keeping each family and its original
licence/readme files together:

```
assets/fonts/
  satoshi/
  clash-display/
  cabinet-grotesk/
```

Retain the original filenames, static weights, italic styles and variable files
included in each download. TTF/OTF files are needed for the native audition;
keep any supplied web formats too. Do not substitute downloads from another
source or infer licensing from the family name.

The supplied ZIPs have been extracted into these folders, with the original
archives retained beside their Fonts and License directories. No font files
have been converted, renamed, subsetted or edited. The full supplied ITF Free
Font License v2.0 is retained in each family's `License/FFL.txt`.

Font binaries and ZIPs are deliberately ignored by Git because the supplied
licence restricts standalone redistribution, including through repositories.
The licence permits embedding in the licensee's own applications. Another
developer needs their own copies from Fontshare to reproduce this local
audition; do not publish the ZIPs or raw font files with the source repository.

Run `python3 scripts/inspect-fonts.py` from the repository root to regenerate
[the inventory](inventory.json). It records file hashes, name records, actual
weight metadata, variable axes, OpenType features, digit advances and missing
sample glyphs without installing a Python package or changing the fonts.

The application loader uses the original variable TTFs, including Satoshi's
italic file. Static OTFs and all supplied web formats remain available locally.
See [font settings](../../docs/font-settings.md) for controls and validation.
Satoshi is the default; all three families and System can be selected in Settings.
