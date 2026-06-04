export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
  personId?: number;
  isTemporaryPassword?: boolean;
  isActive?: boolean;
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
  view: string;
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
  email?: string;
  createdBy?: number;
  modifyPermission?: string;
  relationships: Relationship[];
  computedRelationships?: ComputedRelationship[];
}

export interface Relationship {
  id: number;
  relatedPersonId: number;
  type: 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING';
}

export interface ComputedRelationship {
  relatedPersonId: number;
  fullName: string;
  typeLabel: string;
  photoUrl?: string;
  birthDate?: string;
  deathDate?: string;
}
