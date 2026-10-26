# Audio and autoplay policy (W26)

`AudioContext` warnings in Chrome are not an app failure: the browser requires
a user gesture to start audio. The panel shows them as a warning, not an
exception.

## Expected behavior

- **Local panel:** preview audio may require a click; after that interaction it
  plays normally.
- **OBS Browser Source:** OBS allows autoplay; the overlay plays event audio
  without an extra gesture.
- **Widgets and alerts:** do not force `AudioContext.resume()` or simulate
  clicks; the browser may block that workaround anyway.

## Verification

- There must be no JS exception caused by audio; only the browser policy
  warning when there was no interaction.
- In OBS, confirm the Browser Source has audio enabled and the event plays the
  expected sound.
- Automated tests do not assert real audio playback; they only verify that no
  exception is raised.
