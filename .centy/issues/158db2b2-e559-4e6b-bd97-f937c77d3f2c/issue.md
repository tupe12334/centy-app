# Init Project feature not working in web app

The Init Project feature in the web app (InitProject.tsx component) is not working. Users are unable to initialize new Centy projects through the web interface.

## Steps to Reproduce

1. Navigate to the Init Project page in the web app
1. Enter a project path
1. Click ‘Quick Init’ or ‘Review Changes’
1. The operation fails

## Expected Behavior

The project should be initialized with a .centy folder created at the specified path.

## Actual Behavior

The initialization fails (specific error message TBD - needs investigation with running app).

## Technical Context

The InitProject component (components/project/InitProject.tsx) uses gRPC calls to the daemon:

- `centyClient.init()` for Quick Init
- `centyClient.getReconciliationPlan()` for Review Changes
- `centyClient.executeReconciliation()` for Apply Changes

## Investigation Needed

- Check daemon connectivity and gRPC endpoint availability
- Verify the init request/response protobuf schemas match between app and daemon
- Check browser console for specific error messages
