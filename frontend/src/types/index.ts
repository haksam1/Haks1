export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

export interface AuthResponse extends User {
  token: string;
  role: string;
  permissions: string[];
}

export interface FamilyTree {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
}

export interface Person {
  id: number;
  treeId: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender?: string;
  bio?: string;
  photoUrl?: string;
  phoneNumber?: string;
  relationships: Relationship[];
}

export interface Relationship {
  id: number;
  relatedPersonId: number;
  type: 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING';
}
