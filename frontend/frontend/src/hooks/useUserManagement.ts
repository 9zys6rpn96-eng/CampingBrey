import { useState } from "react";
import type { User } from "../types";
import { createUser, fetchUsers, deleteUser } from "../services/api";

interface UserManagementState {
  users: User[];
  newUsername: string;
  newPassword: string;
  newRole: string;
  loading: boolean;
  saving: boolean;
  success: string | null;
  error: string | null;
}

const initialState: UserManagementState = {
  users: [],
  newUsername: "",
  newPassword: "",
  newRole: "operator",
  loading: false,
  saving: false,
  success: null,
  error: null,
};

export function useUserManagement(isDeveloper: boolean) {
  const [state, setState] = useState<UserManagementState>(initialState);

  const loadUsers = async () => {
    if (!isDeveloper) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const usersData = await fetchUsers();
      setState((prev) => ({
        ...prev,
        users: usersData,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Fehler beim Laden der Benutzer",
        loading: false,
      }));
    }
  };

  const createNewUser = async () => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: null, success: null }));

      const createdUser = await createUser({
        username: state.newUsername,
        password: state.newPassword,
        role: state.newRole,
      });

      setState((prev) => ({
        ...prev,
        success: `Benutzer "${createdUser.username}" wurde erstellt.`,
        newUsername: "",
        newPassword: "",
        newRole: "operator",
        saving: false,
      }));

      await loadUsers();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Fehler beim Erstellen des Benutzers",
        saving: false,
      }));
    }
  };

  const removeUser = async (userId: number) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: null }));
      await deleteUser(userId);
      await loadUsers();
      setState((prev) => ({
        ...prev,
        success: "Benutzer wurde gelöscht.",
        saving: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Fehler beim Löschen",
        saving: false,
      }));
    }
  };

  return {
    ...state,
    loadUsers,
    createNewUser,
    removeUser,
    setNewUsername: (username: string) =>
      setState((prev) => ({ ...prev, newUsername: username })),
    setNewPassword: (password: string) =>
      setState((prev) => ({ ...prev, newPassword: password })),
    setNewRole: (role: string) =>
      setState((prev) => ({ ...prev, newRole: role })),
  };
}

