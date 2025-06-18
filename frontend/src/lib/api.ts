import { z } from "zod";

const URL_MAP = {
  development: 'http://localhost:8787',
  staging: 'https://cleaner-rooster-backend.manishmh982.workers.dev',
  production: 'https://cleaner-rooster-backend-production.dasdev-pratik.workers.dev/',
}

const API_BASE_URL = URL_MAP[process.env.NEXT_PUBLIC_ENVIRONMENT as keyof typeof URL_MAP] || 'http://localhost:8787';

// Zod schemas for validation
export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number")
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, "Password must contain at least one special character"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number")
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, "Password must contain at least one special character"),
});

// TypeScript types derived from Zod schemas
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  validationErrors?: Record<string, string>;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies in requests
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        
        // Handle different error response structures
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
        }
      } catch {
        // If response is not JSON, use the text as error message
        errorMessage = errorText || errorMessage;
      }
      throw new ApiError(response.status, errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: data.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    // Handle case where error is not an Error object
    return {
      success: false,
      error: typeof error === 'string' ? error : 'An unexpected error occurred',
    };
  }
}

export const authApi = {
  login: async (credentials: unknown): Promise<ApiResponse | ValidationErrorResponse> => {
    // Validate input with Zod
    const validation = LoginSchema.safeParse(credentials);
    
    if (!validation.success) {
      const validationErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        validationErrors[field] = err.message;
      });
      
      return {
        success: false,
        error: "Please fix the validation errors",
        validationErrors,
      };
    }

    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(validation.data),
    });
  },

  register: async (userData: unknown): Promise<ApiResponse | ValidationErrorResponse> => {
    // Validate input with Zod
    const validation = RegisterSchema.safeParse(userData);
    
    if (!validation.success) {
      const validationErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        validationErrors[field] = err.message;
      });
      
      return {
        success: false,
        error: "Please fix the validation errors",
        validationErrors,
      };
    }

    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(validation.data),
    });
  },

  forgotPassword: async (email: unknown): Promise<ApiResponse | ValidationErrorResponse> => {
    // Validate input with Zod
    const validation = ForgotPasswordSchema.safeParse(email);
    
    if (!validation.success) {
      const validationErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        validationErrors[field] = err.message;
      });
      
      return {
        success: false,
        error: "Please fix the validation errors",
        validationErrors,
      };
    }

    return apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(validation.data),
    });
  },

  resetPassword: async (resetData: unknown): Promise<ApiResponse | ValidationErrorResponse> => {
    // Validate input with Zod
    const validation = ResetPasswordSchema.safeParse(resetData);
    
    if (!validation.success) {
      const validationErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        validationErrors[field] = err.message;
      });
      
      return {
        success: false,
        error: "Please fix the validation errors",
        validationErrors,
      };
    }

    return apiRequest('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(validation.data),
    });
  },

  verifyResetToken: async (token: string): Promise<ApiResponse> => {
    return apiRequest(`/api/auth/forgot-password/verify-reset-token?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  logout: async (): Promise<ApiResponse> => {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  me: async (): Promise<ApiResponse> => {
    return apiRequest('/api/auth/me', {
      method: 'GET',
    });
  },
};

// Calendar-related types and schemas

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  abn?: string;
  acn?: string;
  address?: string;
  clientInstruction?: string;
  clientInfo?: string;
  propertyInfo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  unit: string;
  name: string;
  accuracy: number;
  comment?: string;
  address?: string;
  // Google Maps specific fields
  latitude?: number;
  longitude?: number;
  placeId?: string;
  formattedAddress?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftInstruction {
  id: number;
  shiftId: number;
  instructionText: string;
  instructionType: 'ok' | 'yes/no' | 'text';
  createdBy?: number;
  createdAt: string;
}

export interface ShiftMessage {
  id: number;
  shiftId: number;
  messageText: string;
  createdBy?: number;
  createdAt: string;
}

// Backend response wrapper interfaces
export interface ShiftTeamWrapper {
  shift_teams: {
    id: number;
    shiftId: number;
    teamId: number;
    createdAt: string;
  };
  teams: Team;
}

export interface ShiftLocationWrapper {
  shift_locations: {
    id: number;
    shiftId: number;
    locationId: number;
    createdAt: string;
  };
  locations: Location;
}

export interface Shift {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  theme: 'Danger' | 'Warning' | 'Success' | 'Primary';
  assignmentType: 'individual' | 'team';
  isPublished: boolean;
  includeLocation: boolean;
  shiftInstructions?: string;
  jobStarted: boolean;
  jobStartedAt?: string;
  jobPaused: boolean;
  jobEndedAt?: string;
  scheduledInTime?: string;
  scheduledOutTime?: string;
  loggedInTime?: string;
  loggedOutTime?: string;
  pauseLog?: string;
  travelDistance?: number; // in kilometers
  travelDuration?: number; // in minutes
  travelFromLocation?: string; // address of previous location
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  staff: Array<Staff & { roleInShift: string }>;
  clients: Client[];
  teams: ShiftTeamWrapper[] | Team[]; // Can be either wrapped or plain
  locations: ShiftLocationWrapper[] | Location[]; // Can be either wrapped or plain
  instructions: ShiftInstruction[];
  messages: ShiftMessage[];
}

// Validation schemas for calendar entities
export const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  role: z.enum(['cleaner', 'supervisor', 'staff']).default('cleaner'),
  isActive: z.boolean().default(true),
});

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  abn: z.string().optional(),
  acn: z.string().optional(),
  address: z.string().optional(),
  clientInstruction: z.string().optional(),
  clientInfo: z.string().optional(),
  propertyInfo: z.string().optional(),
});

export const createLocationSchema = z.object({
  unit: z.string().min(1, 'Unit is required'),
  name: z.string().min(1, 'Name is required'),
  accuracy: z.number().min(0).max(100).default(100),
  comment: z.string().optional(),
  address: z.string().optional(),
  // Google Maps specific fields
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  formattedAddress: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const createShiftSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  theme: z.enum(['Danger', 'Warning', 'Success', 'Primary']).default('Primary'),
  assignmentType: z.enum(['individual', 'team']).default('individual'),
  isPublished: z.boolean().default(false),
  includeLocation: z.boolean().default(false),
  shiftInstructions: z.string().optional(),
  staffIds: z.array(z.number()).default([]),
  clientIds: z.array(z.number()).default([]),
  teamIds: z.array(z.number()).default([]),
  locationIds: z.array(z.number()).default([]),
  supervisorIds: z.array(z.number()).default([]),
  teamMemberIds: z.array(z.number()).default([]),
});

export type CreateStaffData = z.infer<typeof createStaffSchema>;
export type CreateClientData = z.infer<typeof createClientSchema>;
export type CreateLocationData = z.infer<typeof createLocationSchema>;
export type CreateTeamData = z.infer<typeof createTeamSchema>;
export type CreateShiftData = z.infer<typeof createShiftSchema>;



// Client API functions
export const clientApi = {
  getAll: async (params?: { search?: string; company?: string; isActive?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.company) searchParams.append('company', params.company);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    
    const query = searchParams.toString();
    return apiRequest<{ data: Client[]; count: number }>(`/api/clients${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => 
    apiRequest<{ data: Client }>(`/api/clients/${id}`),

  create: (data: CreateClientData) =>
    apiRequest<{ data: Client }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateClientData>) =>
    apiRequest<{ data: Client }>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/api/clients/${id}`, {
      method: 'DELETE',
    }),
};

// Location API functions
export const locationApi = {
  getAll: async (params?: { search?: string; unit?: string; history?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.unit) searchParams.append('unit', params.unit);
    if (params?.history) searchParams.append('history', 'true');
    
    const query = searchParams.toString();
    return apiRequest<{ data: Location[]; count: number }>(`/api/locations${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => 
    apiRequest<{ data: Location }>(`/api/locations/${id}`),

  create: (data: CreateLocationData) =>
    apiRequest<{ data: Location }>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateLocationData>) =>
    apiRequest<{ data: Location }>(`/api/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  markAsUsed: (id: number) =>
    apiRequest<{ data: Location }>(`/api/locations/${id}/use`, {
      method: 'PUT',
    }),

  delete: (id: number) =>
    apiRequest<void>(`/api/locations/${id}`, {
      method: 'DELETE',
    }),
};

// Team API functions
export const teamApi = {
  getAll: async (params?: { search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest<{ data: Team[]; count: number }>(`/api/teams${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => 
    apiRequest<{ data: Team }>(`/api/teams/${id}`),

  create: (data: CreateTeamData) =>
    apiRequest<{ data: Team }>('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateTeamData>) =>
    apiRequest<{ data: Team }>(`/api/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/api/teams/${id}`, {
      method: 'DELETE',
    }),
};

// Shift API functions
export const shiftApi = {
  getAll: (params?: { 
    startDate?: string; 
    endDate?: string; 
    limit?: number; 
    offset?: number;
    includeRelations?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.includeRelations !== undefined) searchParams.append('includeRelations', params.includeRelations.toString());
    
    const query = searchParams.toString();
    return apiRequest<{ data: Shift[]; count: number }>(`/api/shifts${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => 
    apiRequest<{ data: Shift }>(`/api/shifts/${id}`),

  create: (data: CreateShiftData) =>
    apiRequest<{ data: Shift }>('/api/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateShiftData>) =>
    apiRequest<{ data: Shift }>(`/api/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/api/shifts/${id}`, {
      method: 'DELETE',
    }),

  cancel: (id: number) =>
    apiRequest<{ data: { shiftId: number; coverStaffId: number } }>(`/api/shifts/${id}/cancel`, {
      method: 'POST',
    }),

  addInstruction: (id: number, data: { instructionText: string; instructionType?: string }) =>
    apiRequest<{ data: ShiftInstruction }>(`/api/shifts/${id}/instructions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addMessage: (id: number, data: { messageText: string; createdBy?: number }) =>
    apiRequest<{ data: ShiftMessage }>(`/api/shifts/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLocation: (id: number, locationId: number) =>
    apiRequest<{ message: string }>(`/api/shifts/${id}/location`, {
      method: 'PUT',
      body: JSON.stringify({ locationId }),
    }),

  updateClient: (id: number, clientId: number | null) =>
    apiRequest<{ message: string }>(`/api/shifts/${id}/client`, {
      method: 'PUT',
      body: JSON.stringify({ clientId }),
    }),

  removeTeam: (shiftId: number, teamId: number) =>
    apiRequest<{ message: string }>(`/api/shifts/${shiftId}/teams/${teamId}`, {
      method: 'DELETE',
    }),
};

// User Profile API
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
}

// Staff Management API
export interface Staff {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: "cleaner" | "supervisor" | "staff";
  access: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  name: string;
  email?: string;
  phone?: string;
  role: "cleaner" | "supervisor" | "staff";
  access: string[];
  isActive: boolean;
}

export const staffApi = {
  getAll: async (params?: { role?: string; isActive?: boolean; search?: string }): Promise<ApiResponse<{ data: Staff[]; count: number }>> => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest(`/api/staff${query ? `?${query}` : ''}`);
  },

  getById: async (staffId: string): Promise<ApiResponse<Staff>> => {
    return apiRequest(`/api/staff/${staffId}`, {
      method: 'GET',
    });
  },

  create: async (staffData: CreateStaffRequest): Promise<ApiResponse<Staff>> => {
    return apiRequest('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },

  update: async (staffId: string, staffData: Partial<CreateStaffRequest>): Promise<ApiResponse<Staff>> => {
    return apiRequest(`/api/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  },

  delete: async (staffId: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/api/staff/${staffId}`, {
      method: 'DELETE',
    });
  },
};

// Keep userApi for profile management only
export const userApi = {
  // Profile management
  getProfile: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    return apiRequest(`/api/users/${userId}`, {
      method: 'GET',
    });
  },

  updateProfile: async (userId: string, profileData: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    return apiRequest(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Cleaner Roster Management API
export interface CleanerRoster {
  id: number;
  clientLink: string;
  bookingDate: string;
  bookingTime: string;
  scheduledTime: string;
  loggedTime?: string;
  inTime?: string;
  outTime?: string;
  locationAddress: string;
  locationGoogleMapLink?: string;
  startLocationAddress?: string;
  startLocationGoogleMapLink?: string;
  endLocationAddress?: string;
  endLocationGoogleMapLink?: string;
  shiftInstructions?: string;
  supervisorQuestions: Array<{
    question: string;
    type: "OK" | "YES_NO" | "TEXT";
    answer?: string;
  }>;
  mobileMessage?: {
    text: string;
    imageUrl?: string;
  };
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface CreateCleanerRosterRequest {
  clientLink: string;
  bookingDate: string;
  bookingTime: string;
  scheduledTime: string;
  loggedTime?: string;
  inTime?: string;
  outTime?: string;
  locationAddress: string;
  locationGoogleMapLink?: string;
  startLocationAddress?: string;
  startLocationGoogleMapLink?: string;
  endLocationAddress?: string;
  endLocationGoogleMapLink?: string;
  shiftInstructions?: string;
  supervisorQuestions: Array<{
    question: string;
    type: "OK" | "YES_NO" | "TEXT";
    answer?: string;
  }>;
  mobileMessage?: {
    text: string;
    imageUrl?: string;
  };
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
}

export const cleanerRosterApi = {
  getAll: async (params?: { status?: string; search?: string }): Promise<ApiResponse<{ data: CleanerRoster[]; count: number }>> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    return apiRequest(`/api/cleaner-roster${query ? `?${query}` : ''}`);
  },

  getById: async (rosterId: string): Promise<ApiResponse<CleanerRoster>> => {
    return apiRequest(`/api/cleaner-roster/${rosterId}`, {
      method: 'GET',
    });
  },

  create: async (rosterData: CreateCleanerRosterRequest): Promise<ApiResponse<CleanerRoster>> => {
    return apiRequest('/api/cleaner-roster', {
      method: 'POST',
      body: JSON.stringify(rosterData),
    });
  },

  update: async (rosterId: string, rosterData: Partial<CreateCleanerRosterRequest>): Promise<ApiResponse<CleanerRoster>> => {
    return apiRequest(`/api/cleaner-roster/${rosterId}`, {
      method: 'PUT',
      body: JSON.stringify(rosterData),
    });
  },

  delete: async (rosterId: string): Promise<ApiResponse<void>> => {
    return apiRequest(`/api/cleaner-roster/${rosterId}`, {
      method: 'DELETE',
    });
  },
}; 