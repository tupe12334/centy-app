# Daemon: Expose VS Code availability in GetDaemonInfo response

## Context

The frontend now conditionally shows/hides the 'Open in VS Code' button based on `vscode_available` field in DaemonInfo (see issue #f95e233a). However, the daemon needs to actually populate this field.

## Requirements

1. On daemon startup, check if VS Code's `code` command is available in PATH
2. Store this as a boolean flag
3. Return it in the `GetDaemonInfo` RPC response

## Implementation

```go
// Check VS Code availability
func checkVSCodeAvailable() bool {
    _, err := exec.LookPath("code")
    return err == nil
}
```

The check should happen once at startup (not on every request) since PATH changes are rare.

## Proto Definition (already updated in app)

```protobuf
message DaemonInfo {
  string version = 1;
  repeated string available_versions = 2;
  string binary_path = 3;
  bool vscode_available = 4;  // NEW: Whether 'code' command is in PATH
}
```

## User Impact

Without this, users see the VS Code button but clicking it fails silently when VS Code isn't properly configured. With this fix, users see a helpful message explaining how to enable the feature.
