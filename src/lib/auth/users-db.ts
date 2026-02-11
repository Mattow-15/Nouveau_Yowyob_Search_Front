/**
 * Simple user database (in-memory with JSON export)
 * @author Matteo Owona, Rouchda Yampen
 */

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
}

// Base de données en mémoire
let USERS_DB: User[] = [
  {
    id: '1',
    email: 'admin@yowyob.com',
    password: 'admin123',
    name: 'Admin Yowyob',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@yowyob.com',
    password: 'user123',
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
  
  if (!user) {
    console.log('❌ Utilisateur non trouvé:', email);
    console.log('📋 Emails disponibles:', USERS_DB.map(u => u.email));
    return null;
  }
  
  console.log('✅ Utilisateur trouvé:', user.email);
  return user;
}

export function createUser(email: string, password: string, name: string): { success: boolean; error?: string; user?: User } {
  // Vérifier si existe déjà
  const existing = findUserByEmail(email);
  if (existing) {
    return { success: false, error: 'Un compte existe déjà avec cet email' };
  }

  // Créer le nouvel utilisateur
  const newUser: User = {
    id: String(Date.now()),
    email,
    password,
    name,
    role: 'user',
  };

  USERS_DB.push(newUser);
  
  console.log('✅ Utilisateur créé:', { id: newUser.id, email: newUser.email, name: newUser.name });
  console.log('📊 Total utilisateurs:', USERS_DB.length);
  console.log('📋 Liste:', USERS_DB.map(u => ({ email: u.email, name: u.name })));

  return { success: true, user: newUser };
}