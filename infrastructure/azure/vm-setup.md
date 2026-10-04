# Azure VM Provisioning
 
```bash
# Create Resource Group
az group create --name mindcraft-rg --location eastus

# Deploy Ubuntu VM
az vm create \
  --resource-group mindcraft-rg \
  --name mindcraft-vm \
  --image Ubuntu2204 \
  --size Standard_D4s_v5 \
  --admin-username azureuser \
  --generate-ssh-keys
```

### Ubuntu 22.04 Host Setup for Judge0 1.13 (cgroup v1)
Ubuntu 22.04 LTS defaults to cgroup v2, but Judge0 1.13 requires cgroup v1. Configure GRUB before starting containers:
```bash
# Set cgroup v1 kernel parameter
sudo sed -i 's/GRUB_CMDLINE_LINUX=""/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"/' /etc/default/grub
sudo update-grub
sudo reboot
```
Verify cgroups after reboot:
```bash
stat -fc %T /sys/fs/cgroup/
# Output must be tmpfs (confirming cgroup v1)
```

