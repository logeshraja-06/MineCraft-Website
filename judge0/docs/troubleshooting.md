# Troubleshooting Judge0

### Common Issues
- **Permission denied (cgroups) on Ubuntu 22.04**:
  Ubuntu 22.04 uses cgroup v2 by default. Judge0 v1.13 requires cgroup v1.
  To enable cgroup v1:
  1. Edit `/etc/default/grub` and set:
     ```bash
     GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
     ```
  2. Update GRUB and reboot:
     ```bash
     sudo update-grub
     sudo reboot
     ```
  3. Verify cgroup v1 mount with `stat -fc %T /sys/fs/cgroup/` (should output `tmpfs`).
- **Worker starvation**: Increase worker count if queue latency increases.
- **Redis connection failure**: Check if `judge0-redis` is healthy and REDIS_HOST matches `judge0.conf`.

