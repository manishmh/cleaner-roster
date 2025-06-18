import React from "react";

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  text: string;
  test: (password: string) => boolean;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const requirements: Requirement[] = [
    {
      text: "At least 8 characters",
      test: (pwd) => pwd.length >= 8,
    },
    {
      text: "One uppercase letter",
      test: (pwd) => /(?=.*[A-Z])/.test(pwd),
    },
    {
      text: "One number",
      test: (pwd) => /(?=.*\d)/.test(pwd),
    },
    {
      text: "One special character",
      test: (pwd) => /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(pwd),
    },
  ];

  const metRequirements = requirements.filter(req => req.test(password));
  const strength = metRequirements.length;
  
  const getStrengthColor = () => {
    switch (strength) {
      case 0:
      case 1:
        return "text-red-500";
      case 2:
        return "text-yellow-500";
      case 3:
        return "text-yellow-600";
      case 4:
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 0:
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  const getProgressWidth = () => {
    return `${(strength / 4) * 100}%`;
  };

  const getProgressColor = () => {
    switch (strength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-yellow-600";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Password strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Password strength:
          </span>
          <span className={`text-xs font-medium ${getStrengthColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: getProgressWidth() }}
          ></div>
        </div>
      </div>

      {/* Requirements list */}
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full text-xs flex items-center justify-center text-white ${
                req.test(password)
                  ? "bg-green-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              {req.test(password) && (
                <svg
                  className="w-2 h-2 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </div>
            <span
              className={`text-xs ${
                req.test(password)
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength; 