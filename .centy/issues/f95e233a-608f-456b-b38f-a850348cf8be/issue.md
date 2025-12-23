# Hide Open in VS Code button when code is not in PATH and show info message

When VS Code (code command) is not available in the system PATH, clicking the Open in VS Code button creates the workspace successfully but fails to open VS Code. This results in a confusing message. Solution: 1) Daemon exposes VS Code availability status, 2) App hides button when unavailable and shows info message explaining the feature exists but requires VS Code to be installed and code command to be in PATH.
