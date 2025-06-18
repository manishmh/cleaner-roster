export class PasswordService {
  /**
   * Hash a password using Web Crypto API (PBKDF2)
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Import the password as a key
    const key = await crypto.subtle.importKey(
      "raw",
      data,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    // Derive the hash
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256
    );
    
    // Combine salt and hash
    const hashArray = new Uint8Array(hashBuffer);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      
      // Decode the stored hash
      const combined = new Uint8Array(
        atob(hash)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      
      // Extract salt and hash
      const salt = combined.slice(0, 16);
      const storedHash = combined.slice(16);
      
      // Import the password as a key
      const key = await crypto.subtle.importKey(
        "raw",
        data,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );
      
      // Derive the hash with the same salt
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        key,
        256
      );
      
      const computedHash = new Uint8Array(hashBuffer);
      
      // Compare hashes
      if (computedHash.length !== storedHash.length) {
        return false;
      }
      
      for (let i = 0; i < computedHash.length; i++) {
        if (computedHash[i] !== storedHash[i]) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (password.length > 128) {
      errors.push("Password must be less than 128 characters long");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
} 