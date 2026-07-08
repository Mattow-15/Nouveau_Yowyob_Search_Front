/**
 * Simple user database (in-memory — remplacé par la BD Kernel en production)
 * @author Matteo Owona, Rouchda Yampen
 *
 * SÉCURITÉ : les mots de passe de démo sont lus depuis les variables
 * d'environnement (DEMO_ADMIN_PASSWORD, DEMO_USER_PASSWORD).
 * En production, ce module est bypassé au profit de l'auth-service Kernel.
 */

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
}

// Comptes de démo — mots de passe configurables via .env (ne jamais hardcoder)
let USERS_DB: User[] = [
  {
    id: '1',
    email: 'admin@yowyob.com',
    password: process.env.DEMO_ADMIN_PASSWORD ?? 'admin123',
    name: 'Admin Yowyob',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@yowyob.com',
    password: process.env.DEMO_USER_PASSWORD ?? 'user123',
    name: 'User Test',
    role: 'user',
  },
];

export function getAllUsers(): User[] {
  return USERS_DB;
}

export function findUserByEmail(email: string): User | undefined {
  return USERS_DB.find((u) => u.email === email);
}

export function verifyUser(email: string, password: string): User | null {
  const user = USERS_DB.find(
    (u) => u.email === email && u.password === password
  );
  return user ?? null;
}

export function createUser(
  email: string,
  password: string,
  name: string,
): { success: boolean; error?: string; user?: User } {
  const existing = findUserByEmail(email);
  if (existing) {
    return { success: false, error: 'Un compte existe déjà avec cet email' };
  }

  const newUser: User = {
    id: String(Date.now()),
    email,
    password,
    name,
    role: 'user',
  };

  USERS_DB.push(newUser);

  return { success: true, user: newUser };
}
