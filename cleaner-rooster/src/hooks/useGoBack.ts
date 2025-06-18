import { useRouter } from "next/navigation";

const useGoBack = () => {
  const router = useRouter();

  const goBack = () => {
    // Check if we're on the client side
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back(); // Navigate to the previous route
    } else {
      router.push("/"); // Redirect to home if no history exists or on server
    }
  };

  return goBack;
};

export default useGoBack;
