import { create } from "zustand";

interface Project {
  id: number;
  org_id: string;
  name: string;
  goal: string;
  status: string;
  owner_id: string;
}

interface User {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
}

interface AppState {
  currentUserId: string;
  currentProject: Project | null;
  currentUser: User | null;
  mockUsers: User[];
  setUserId: (id: string) => void;
  setProject: (project: Project | null) => void;
  setCurrentUser: (user: User | null) => void;
  setMockUsers: (users: User[]) => void;
  getAuthHeader: () => { Authorization: string };
  backendUrl: string;
}

export const useStore = create<AppState>((set, get) => ({
  currentUserId: "user_mock_pm",
  currentProject: null,
  currentUser: null,
  mockUsers: [],
  backendUrl: "http://localhost:8000/api/v1",
  
  setUserId: (id) => set({ currentUserId: id }),
  setProject: (project) => set({ currentProject: project }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setMockUsers: (users) => set({ mockUsers: users }),
  getAuthHeader: () => {
    return { Authorization: `Bearer ${get().currentUserId}` };
  },
}));
