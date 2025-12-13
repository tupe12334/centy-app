# Bug

\## Error Type

Console Error

\## Error Message

The result of getServerSnapshot should be cached to avoid an infinite loop

at useConfig (hooks/useConfig.ts:75:37)

at IssueDetail (components/issues/IssueDetail.tsx:45:31)

at ClientRouteHandler.useMemo\[routeContent\] (components/layout/ClientRouteHandler.tsx:22:14)

at ClientRouteHandler (components/layout/ClientRouteHandler.tsx:17:31)

at RootLayout (app/layout.tsx:32:15)

\## Code Frame

73 | const { projectPath, isInitialized } = useProject()

74 |

\> 75 | const cache = useSyncExternalStore(

| ^

76 | useCallback(listener => subscribe(projectPath, listener), \[projectPath\]),

77 | useCallback(() => getOrCreateCache(projectPath), \[projectPath\]),

78 | () => ({

Next.js version: 16.0.10 (Turbopack)
