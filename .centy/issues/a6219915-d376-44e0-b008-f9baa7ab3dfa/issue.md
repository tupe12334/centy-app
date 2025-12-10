# Issue in the client

\## Error Type

Console Error

\## Error Message

Cannot update a component `CreateIssue`) while rendering a different component `ForwardRef(AssetUploader)`). To locate the bad setState() call inside `ForwardRef(AssetUploader)`, follow the stack trace as described in [](https://react.dev/link/setstate-in-render)[https://react.dev/link/setstate-in-render](https://react.dev/link/setstate-in-render)

<!-- cspell:disable-next-line -->

at console.error (chrome-extension://iohjgamcilhbgmhbnllfolmkmmekfmci/injected-scripts/host-console-events.js:1:351048)

at AssetUploader.AssetUploader.useCallback\[handleFiles\] (components/assets/AssetUploader.tsx:188:11)

at AssetUploader (components/assets/AssetUploader.tsx:73:53)

at CreateIssue (components/issues/CreateIssue.tsx:162:11)

at NewIssuePage (app/issues/new/page.tsx:6:10)

\## Code Frame

186 | setPendingAssets(prev => {

187 | const updated = \[...prev, pending\]

\> 188 | onPendingChange?.(updated)

| ^

189 | return updated

190 | })

191 |

Next.js version: 15.5.7 (Webpack)
