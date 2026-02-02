export interface AddOrgInfoProps {
  onClose: () => void;
  handleCreateOrg: () => void;
  handleModalToggle: () => void;
  orgType: "AC" | "LTC" | "HCB" | "HHA" | "OPC" | "SPC";
}

export interface OrganizationFormData {
  organizationType: string;
  organizationName: string;
  organizationEmail: string;
  organizationContact:string;
  location: string;
}

export interface FormErrors {
  organizationName?: string;
  organizationEmail?: string;
  organizationContact?: string;
  location?: string;
  preferredSuborgLabel?: string;
  preferredRoomLabel?: string;
  preferredUnitLabel?: string;
  bedNamingScheme?: string;
}
export interface OrganizationType {
  id: string;
  label: string;
  desc: string;
  color: string;
}
export interface OrganizationTypeOption {
  value: string;
  label: string;
  description: string;
  color: string;
}
export interface OrganizationTypeSelectProps {
  options: OrganizationTypeOption[];
  selected: string;
  onChange: (value: string) => void;    }


  export interface OrgType {
  code: "AC" | "LTC" | "HCB" | "HHA" | "OPC" | "SPC";
  label: string;
  desc: string;
}

// Organization Creation API Types
export interface CreateOrganizationRequest {
  name: string;
  email: string;
  contact: string;
  location: string;
  type: "AC" | "LTC" | "HCB" | "HHA" | "OPC" | "SPC";
  org_structure: "corporate" | "standalone";
  hcbs_subtype?: string | null;
  preferred_suborg_label?: string;
  preferred_room_label?: string;
  preferred_unit_label?: string;
  do_beds_have_names?: boolean;
  bed_naming_scheme?: string;
}

export interface CreateOrganizationResponse {
  id: string;
  name: string;
  email: string;
  contact: string;
  location: string;
  organizationType: "AC" | "LTC" | "HCB" | "HHA" | "OPC" | "SPC";
  status: "active" | "pending" | "inactive";
  createdAt: string;
  updatedAt: string;
}