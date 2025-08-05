// Formatter for deployment config files (for /store-deployment-configs)
// Produces output matching the user's required formats (Default, Default+Bond, Segregated, Segregated+Bond)

export function buildDeployConfigPayload(form) {
  // Extract relevant fields from form
  const { configType, useBond, tableData, ip, hostname, selectedDisks, selectedRoles } = form;
  const using_interfaces = {};
  let ifaceCount = 1;

  // Helper to get interface key
  const ifaceKey = () => `interface_0${ifaceCount++}`;

  // Map table rows to using_interfaces
  tableData.forEach(row => {
    // Compose type array (capitalize for consistency)
    let typeArr = Array.isArray(row.type) ? row.type : (row.type ? [row.type] : []);
    typeArr = typeArr.map(t => {
      if (t.toLowerCase() === 'primary') return 'Primary';
      if (t.toLowerCase() === 'secondary') return 'Secondary';
      if (t.toLowerCase() === 'mgmt' || t.toLowerCase() === 'management') return 'Mgmt';
      if (t.toLowerCase() === 'vxlan') return 'VXLAN';
      if (t.toLowerCase() === 'storage') return 'Storage';
      if (t.toLowerCase() === 'external traffic' || t.toLowerCase() === 'external_traffic') return 'External_Traffic';
      return t;
    });
    // Compose interface object
    using_interfaces[ifaceKey()] = {
      interface_name: row.bondName && useBond ? row.bondName : (Array.isArray(row.interface) ? row.interface[0] : row.interface),
      type: typeArr,
      ip: row.ip || '',
    };
  });

  // Compose output object
  const out = {
    using_interfaces,
    hostname: hostname || '',
    disk: selectedDisks || [],
    roles: selectedRoles || []
  };
  // Add top-level ip if present (for segregated)
  if (ip) out.ip = ip;
  return out;
}
