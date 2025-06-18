"use client";

import { authApi } from "@/lib/api";
import { useState } from "react";

export default function DebugAuth() {
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      // Test with your actual credentials
      const result = await authApi.login({ 
        email: "test@example.com", // Replace with your test email
        password: "password123" // Replace with your test password
      });
      
      console.log("Raw API Response:", result);
      setResponse(result as unknown as Record<string, unknown>);
    } catch (error) {
      console.error("Error:", error);
      setResponse({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Auth Debug Tool</h3>
      
      <button
        onClick={testLogin}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Login API"}
      </button>
      
      {response && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">API Response:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Update the email/password in this component with your test credentials</li>
          <li>Click &quot;Test Login API&quot; to see the exact response structure</li>
          <li>Check the browser console for additional logs</li>
          <li>Share the response structure to help debug the Auth.js integration</li>
        </ol>
      </div>
    </div>
  );
} 