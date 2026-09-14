/**
 * Centralized Roles & Permissions Engine for BITC
 * 
 * Defines canonical roles, capability matrices, and UI badge helpers.
 */

export type UserRole = "creative" | "business" | "user" | "admin";

export interface RolePermissions {
  canCreateEvent: boolean;
  canHostPublicRoom: boolean;
  canPostJob: boolean;
  canApplyToJob: boolean;
  canUploadPortfolio: boolean;
  canReviewApplicants: boolean;
  canAccessAdminConsole: boolean;
  canClaimMarketplaceAsset: boolean;
  canBookMentorship: boolean;
  canOfferMentorship: boolean;
  canCreateCourse: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateEvent: true,
    canHostPublicRoom: true,
    canPostJob: true,
    canApplyToJob: true,
    canUploadPortfolio: true,
    canReviewApplicants: true,
    canAccessAdminConsole: true,
    canClaimMarketplaceAsset: true,
    canBookMentorship: true,
    canOfferMentorship: true,
    canCreateCourse: true,
  },
  business: {
    canCreateEvent: true,        // Official Branded Events & Summits
    canHostPublicRoom: true,     // Branded Audio Rooms
    canPostJob: true,            // Full Job Postings
    canApplyToJob: false,        // Businesses do not apply to jobs
    canUploadPortfolio: false,   // Uses Company Profile / Showcase
    canReviewApplicants: true,   // Candidate Review Dashboard
    canAccessAdminConsole: false,
    canClaimMarketplaceAsset: true,
    canBookMentorship: false,
    canOfferMentorship: false,
    canCreateCourse: true,       // Publish studio masterclasses & courses
  },
  creative: {
    canCreateEvent: true,        // Community Meetups & Portfolio Walkthroughs
    canHostPublicRoom: true,     // Creative & Design Discussion Rooms
    canPostJob: false,           // Requires Business account to post jobs
    canApplyToJob: true,         // Apply to jobs with attached case studies
    canUploadPortfolio: true,    // Case Study & Project Builder
    canReviewApplicants: false,
    canAccessAdminConsole: false,
    canClaimMarketplaceAsset: true,
    canBookMentorship: true,     // Book mentors
    canOfferMentorship: true,    // Can be approved as a mentor
    canCreateCourse: false,
  },
  user: {
    canCreateEvent: false,       // General attendees attend events & buy tickets
    canHostPublicRoom: false,    // Attendees listen and raise hands on stage
    canPostJob: false,
    canApplyToJob: false,
    canUploadPortfolio: false,
    canReviewApplicants: false,
    canAccessAdminConsole: false,
    canClaimMarketplaceAsset: true,
    canBookMentorship: true,
    canOfferMentorship: false,
    canCreateCourse: false,
  },
};

/**
 * Checks if a given role has a specific capability permission
 */
export function hasPermission(
  role: UserRole | string | null | undefined,
  permission: keyof RolePermissions
): boolean {
  if (!role) return false;
  const canonicalRole: UserRole =
    role === "business" || role === "creative" || role === "admin" ? role : "user";
  return !!ROLE_PERMISSIONS[canonicalRole]?.[permission];
}

export interface RoleBadgeInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

/**
 * Returns UI metadata for displaying role badges
 */
export function getRoleBadge(role: UserRole | string | null | undefined): RoleBadgeInfo {
  switch (role) {
    case "business":
      return {
        label: "Business",
        color: "#6C5CE7",
        bgColor: "#6C5CE720",
        icon: "work",
        description: "Studio, Brand & Hiring Partner",
      };
    case "creative":
      return {
        label: "Creative",
        color: "#00B894",
        bgColor: "#00B89420",
        icon: "brush",
        description: "Designer, Developer & Creator",
      };
    case "admin":
      return {
        label: "Super Admin",
        color: "#E17055",
        bgColor: "#E1705520",
        icon: "admin-panel-settings",
        description: "Platform Governance & Operations",
      };
    default:
      return {
        label: "Member",
        color: "#FDCB6E",
        bgColor: "#FDCB6E20",
        icon: "person",
        description: "Community Member & Event Attendee",
      };
  }
}
