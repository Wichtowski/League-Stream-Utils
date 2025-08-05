interface AuthTabsProps {
  isLogin: boolean;
  onTabChange: (isLogin: boolean) => void;
  onClearMessages: () => void;
}

export function AuthTabs({
  isLogin,
  onTabChange,
  onClearMessages,
}: AuthTabsProps) {
  const handleTabClick = (newIsLogin: boolean) => {
    onTabChange(newIsLogin);
    onClearMessages();
  };

  return (
    <div className="flex mb-6">
      <button
        onClick={() => handleTabClick(true)}
        className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
          isLogin ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
        }`}
      >
        Login
      </button>
      <button
        onClick={() => handleTabClick(false)}
        className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
          !isLogin ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
        }`}
      >
        Register
      </button>
    </div>
  );
}
