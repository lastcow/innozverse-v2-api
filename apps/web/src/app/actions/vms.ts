'use server'

// VM operations have been moved to the API server (apps/api).
// All VM-related DB operations and Proxmox calls are now handled via:
//   POST /api/v1/vms/sync
//   GET  /api/v1/vms
//   POST /api/v1/vms/clone
//   GET  /api/v1/vms/tasks/:upid
//   PUT  /api/v1/vms/:vmid/config
//   POST /api/v1/vms/:vmid/status
//   DELETE /api/v1/vms/:vmid
//
// The web app calls these endpoints directly via fetch with Bearer token auth.
