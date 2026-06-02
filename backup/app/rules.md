# 🧠 TypeScript + Next.js Coding Guidelines (CursorAI)

This document outlines **best practices**, **coding conventions**, and **patterns** for building scalable, maintainable, and clean applications using **TypeScript** and **Next.js**.

---

## ✅ Best Practices

### 🧱 Project Structure

- Use feature-based folder structure:
  ```
  /app
    /[feature]
      component.tsx
      hook.ts
      service.ts
      types.ts
  /components (reusable)
  /lib (utilities, services)
  /hooks (global hooks)
  /styles
  /types (global types)
  ```
- Co-locate feature-specific files together to minimize coupling.

### 🧾 File Naming Conventions

- Use **kebab-case** for filenames: `user-profile.tsx`
- Use **PascalCase** for component names: `UserProfile`
- Use `.tsx` for files with JSX, `.ts` otherwise.

### 🧠 Code Organization

- Group **hooks**, **services**, **utils**, and **components** clearly.
- Avoid massive files; break them down by responsibility.
- Reuse logic across components through **custom hooks** and **utils**.

### 🧼 Clean Code Principles

- Keep components small and focused on a single responsibility.
- Avoid magic strings/numbers — use constants or enums.
- Use declarative logic over imperative code.
- Avoid nesting more than 3 levels deep (e.g., conditional rendering).

---

## ✅ Do’s and ❌ Don’ts

| ✅ Do                                                       | ❌ Don't                                |
| ----------------------------------------------------------- | --------------------------------------- |
| Use `useEffect`, `useCallback`, and `useMemo` appropriately | Overuse them without understanding deps |
| Use `async/await` over `.then()`                            | Chain too many `.then()` calls          |
| Validate external data (API) with `zod` or `yup`            | Trust raw external data blindly         |
| Use `interface` or `type` for type safety                   | Use `any` or `unknown` without reason   |
| Extract reusable logic into hooks/utilities                 | Copy-paste code across files            |
| Use environment variables (`process.env`) via `.env.local`  | Hardcode secrets or base URLs           |
| Modularize services like API calls, auth, etc.              | Mix logic in components directly        |

---

## 🧹 DRY (Don’t Repeat Yourself)

- 🔁 Identify duplicate logic and extract to:
  - **Hooks**: for shared logic
  - **Utils**: for pure functions
  - **Components**: for UI reuse

- Example:

  ```ts
  // ❌ Duplicated fetch logic
  const fetchUser = async () => {
    /* ... */
  };
  const fetchPost = async () => {
    /* ... */
  };

  // ✅ DRY - reuse API client
  const apiClient = async (url: string) => {
    /* ... */
  };
  const fetchUser = () => apiClient("/user");
  const fetchPost = () => apiClient("/post");
  ```

---

## 🔐 Type Safety

- Prefer `interface` for public contracts (e.g., props), `type` for unions.
- Never use `any` — fall back to `unknown` if absolutely needed.
- Use tools like `zod` or `io-ts` to validate API responses at runtime.
- Infer types where possible using `typeof`, `ReturnType`, `Parameters`, etc.

---

## 🧩 Component Design

- Use **props** explicitly typed:

  ```tsx
  type ButtonProps = {
    label: string;
    onClick: () => void;
  };

  const Button: React.FC<ButtonProps> = ({ label, onClick }) => <button onClick={onClick}>{label}</button>;
  ```

- Avoid unnecessary re-renders with `React.memo`, `useMemo`, and `useCallback`.

---

## 🧪 Testing

- Use **Jest** or **Playwright** for unit and integration tests.
- Test edge cases and type guards.
- Prefer testing **behavior** over implementation details.

---

## 🔄 API & Server Code

- Wrap `fetch` or Axios in service layers (`/lib/api.ts`).
- Create utility clients with built-in error handling.
- Validate external data with schemas (`zod`, `superstruct`).
- Avoid logic in route handlers — delegate to services.
- Router.push() should always be used in event handlers in client components, while redirect() should be used in server components, server functions, and route handlers

---

## 🔧 Linting, Formatting & Tooling

- Use ESLint + Prettier for code consistency.
- Type-check on commit (`tsc --noEmit`).
- Suggested packages:
  - `eslint-config-next`
  - `@typescript-eslint/eslint-plugin`
  - `prettier`
  - `zod` (for runtime validation)

---

## 🧠 Common Patterns

### 🔁 Reusable Fetch Hook (SWR)

```ts
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useUser = (id: string) => useSWR(id ? `/api/user/${id}` : null, fetcher);
```

---

### ⚙️ API Client Wrapper

```ts
const apiClient = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("API Error");
  return res.json();
};

// usage:
const getUser = () => apiClient<User>("/api/user");
```

---

### 🧵 Typed Context Example

```ts
interface AuthContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);
```

### Q&A

If there are any not covered areas, information missing, or you have any questions related to given task, ask them before proceeding with the code changes.
