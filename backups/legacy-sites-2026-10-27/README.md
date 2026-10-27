# Retired JDPI Sites version

This folder preserves the source of the separate Sites-hosted JDPI version 3, published from commit `7280db8dc6ff2bdd02bfb0b5e199402e5edee2a0`. It is **not** the current Vercel website and is not part of the Vercel build.

`source-v3.zip` contains the tracked source, locked dependencies, assets, and published content snapshot from that exact commit. The old hosting manifest is excluded; `site-identity.json` records the non-secret project identity and archive checksum needed to identify the backup. Local environment files and credentials are not included.

To recover the source, verify the ZIP's SHA-256 checksum against `site-identity.json`, extract it into a new directory, run `npm ci`, and follow the source's build instructions. Restoring a hosted Sites deployment requires a deliberate new hosting setup; do not point the current Vercel project at the retired site identity.

The original hosted copy was owner-only when archived and had no JDPI custom domain. Keep it private as a rollback reference. The current public website continues to deploy from this repository's `main` branch to Vercel.
