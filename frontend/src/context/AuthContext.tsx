'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type UserSession = {
  id: number;
  email: string;
  name: string;
  phone: string;
  address?: string;
  roles: string[];
  primaryRole: string;
  customerId: number | null;
  employeeId: number | null;
  redirectUrl: string;
};

type AuthContextType = {
  user: UserSession | null;
  token: string | null;
  login: (user: UserSession, token: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Tải thông tin phiên đăng nhập từ localStorage khi mở ứng dụng
    const savedUser = localStorage.getItem('viettour_user');
    const savedToken = localStorage.getItem('viettour_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem('viettour_user');
        localStorage.removeItem('viettour_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: UserSession, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('viettour_user', JSON.stringify(newUser));
    localStorage.setItem('viettour_token', newToken);

    // Tự động điều hướng đến đúng giao diện phù hợp với vai trò
    router.push(newUser.redirectUrl || '/');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('viettour_user');
    localStorage.removeItem('viettour_token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
