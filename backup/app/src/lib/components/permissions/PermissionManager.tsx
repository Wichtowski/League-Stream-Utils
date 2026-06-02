"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Role, TournamentPermission, UserPermission } from "@lib/types/permissions";
import { Button } from "@lib/components/common/button/Button";
import { LoadingSpinner } from "@lib/components/common";
import { useModal } from "@lib/contexts/ModalContext";

interface PermissionManagerProps {
  tournamentId?: string;
  onPermissionChange?: () => void;
}

export const PermissionManager = ({ tournamentId, onPermissionChange }: PermissionManagerProps): React.ReactElement => {
  const { showAlert } = useModal();
  const [permissions, setPermissions] = useState<(TournamentPermission | UserPermission)[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<TournamentPermission | UserPermission | null>(null);

  const isGlobal = !tournamentId;

  const loadPermissions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      let data: (TournamentPermission | UserPermission)[];

      if (isGlobal) {
        // Use API call for global permissions
        const response = await fetch("/api/v1/permissions/global");
        if (!response.ok) {
          throw new Error("Failed to fetch global permissions");
        }
        const result = await response.json();
        data = result.roles.map((role: Role) => ({
          _id: `global-${role}`,
          userId: "admin", // Use actual admin user ID
          role,
          grantedBy: "system",
          grantedAt: new Date(),
          isActive: true
        }));
      } else {
        // Use API call for tournament permissions
        const response = await fetch(`/api/v1/permissions/tournament/${tournamentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tournament permissions");
        }
        const result = await response.json();
        data = result.permissions.map((p: Record<string, unknown>) => ({
          _id: p._id?.toString() || "",
          tournamentId: p.tournamentId,
          userId: p.userId,
          role: p.role as Role,
          grantedBy: p.grantedBy,
          grantedAt: new Date(p.grantedAt as string),
          expiresAt: p.expiresAt ? new Date(p.expiresAt as string) : undefined,
          isActive: p.isActive
        }));
      }

      setPermissions(data);
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to load permissions" });
    } finally {
      setLoading(false);
    }
  }, [isGlobal, tournamentId, showAlert]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handleRevokePermission = async (permission: TournamentPermission | UserPermission): Promise<void> => {
    try {
      if (isGlobal) {
        const response = await fetch("/api/v1/permissions/global", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: permission.userId,
            role: permission.role
          })
        });

        if (!response.ok) {
          throw new Error("Failed to revoke global role");
        }
      } else {
        const response = await fetch(
          "/api/v1/permissions/tournament/" + (permission as TournamentPermission).tournamentId,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              userId: permission.userId
            })
          }
        );

        if (!response.ok) {
          throw new Error("Failed to revoke tournament role");
        }
      }

      await showAlert({ type: "success", message: "Permission revoked successfully" });
      await loadPermissions();
      onPermissionChange?.();
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to revoke permission" });
    }
  };

  const getRoleColor = (role: Role): string => {
    const colors: Record<Role, string> = {
      [Role.SUPER_ADMIN]: "bg-red-600",
      [Role.ADMIN]: "bg-purple-600",
      [Role.TOURNAMENT_OWNER]: "bg-yellow-600",
      [Role.TOURNAMENT_ADMIN]: "bg-blue-600",
      [Role.TOURNAMENT_MODERATOR]: "bg-green-600",
      [Role.TOURNAMENT_VIEWER]: "bg-gray-600",
      [Role.COMMENTATOR]: "bg-pink-600",
      [Role.STREAM_MANAGER]: "bg-indigo-600",
      [Role.DATA_ANALYST]: "bg-orange-600",
      [Role.USER]: "bg-gray-500"
    };
    return colors[role] || "bg-gray-500";
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner text="Loading permissions..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {isGlobal ? "Global Permissions" : "Tournament Permissions"}
        </h3>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          Add Permission
        </Button>
      </div>

      {permissions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No permissions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {permissions.map((permission) => (
            <div
              key={`${permission.userId}-${permission.role}`}
              className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium text-white ${getRoleColor(permission.role as Role)}`}
                  >
                    {permission.role}
                  </span>
                  <span className="text-gray-300 text-sm">User: {permission.userId}</span>
                </div>
                <div className="text-xs text-gray-400">
                  <p>Granted: {formatDate(permission.grantedAt)}</p>
                  {permission.expiresAt && <p>Expires: {formatDate(permission.expiresAt)}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setSelectedPermission(permission)}
                  className="bg-gray-600 hover:bg-gray-700 text-sm px-3 py-1"
                >
                  View Details
                </Button>
                <Button
                  onClick={() => handleRevokePermission(permission)}
                  className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                >
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPermissionModal
          tournamentId={tournamentId}
          onClose={() => setShowAddModal(false)}
          onPermissionAdded={() => {
            loadPermissions();
            onPermissionChange?.();
          }}
        />
      )}

      {selectedPermission && (
        <PermissionDetailsModal
          permission={selectedPermission}
          onClose={() => setSelectedPermission(null)}
          onPermissionRevoked={() => {
            loadPermissions();
            onPermissionChange?.();
          }}
        />
      )}
    </div>
  );
};

// Add Permission Modal Component
interface AddPermissionModalProps {
  tournamentId?: string;
  onClose: () => void;
  onPermissionAdded: () => void;
}

const AddPermissionModal = ({
  tournamentId,
  onClose,
  onPermissionAdded
}: AddPermissionModalProps): React.ReactElement => {
  const { showAlert } = useModal();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>(Role.USER);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const loadAvailableRoles = useCallback(async (): Promise<void> => {
    try {
      // For now, return all roles - in a real implementation, you'd call an API
      // to get the roles the current user can grant
      const allRoles = Object.values(Role);
      setAvailableRoles(allRoles);
    } catch (_error) {
      console.error("Failed to load available roles:", _error);
    }
  }, []);

  useEffect(() => {
    loadAvailableRoles();
  }, [loadAvailableRoles]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!userId.trim()) {
      await showAlert({ type: "error", message: "User ID is required" });
      return;
    }

    setLoading(true);
    try {
      if (tournamentId) {
        const response = await fetch(`/api/v1/permissions/tournament/${tournamentId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: userId.trim(),
            role: role,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
          })
        });

        if (!response.ok) {
          throw new Error("Failed to grant tournament role");
        }
      } else {
        const response = await fetch("/api/v1/permissions/global", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: userId.trim(),
            role: role,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
          })
        });

        if (!response.ok) {
          throw new Error("Failed to grant global role");
        }
      }

      await showAlert({ type: "success", message: "Permission granted successfully" });
      onPermissionAdded();
      onClose();
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to grant permission" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Add Permission</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
              placeholder="Enter user ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600">
              {loading ? "Granting..." : "Grant Permission"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Permission Details Modal Component
interface PermissionDetailsModalProps {
  permission: TournamentPermission | UserPermission;
  onClose: () => void;
  onPermissionRevoked: () => void;
}

const PermissionDetailsModal = ({
  permission,
  onClose,
  onPermissionRevoked
}: PermissionDetailsModalProps): React.ReactElement => {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(false);

  const handleRevoke = async (): Promise<void> => {
    setLoading(true);
    try {
      if ("tournamentId" in permission) {
        const response = await fetch("/api/v1/permissions/tournament/" + permission.tournamentId, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: permission.userId
          })
        });

        if (!response.ok) {
          throw new Error("Failed to revoke tournament role");
        }
      } else {
        const response = await fetch("/api/v1/permissions/global", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: permission.userId,
            role: permission.role
          })
        });

        if (!response.ok) {
          throw new Error("Failed to revoke global role");
        }
      }

      await showAlert({ type: "success", message: "Permission revoked successfully" });
      onPermissionRevoked();
      onClose();
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to revoke permission" });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role: Role): string => {
    const descriptions: Record<Role, string> = {
      [Role.SUPER_ADMIN]: "Full system access with all permissions",
      [Role.ADMIN]: "System administrator with broad permissions",
      [Role.TOURNAMENT_OWNER]: "Full control over a specific tournament",
      [Role.TOURNAMENT_ADMIN]: "Administrative access to a specific tournament",
      [Role.TOURNAMENT_MODERATOR]: "Moderation access to a specific tournament",
      [Role.TOURNAMENT_VIEWER]: "Read-only access to a specific tournament",
      [Role.COMMENTATOR]: "Commentator access with camera control",
      [Role.STREAM_MANAGER]: "Stream and broadcast management",
      [Role.DATA_ANALYST]: "Data analysis and statistics management",
      [Role.USER]: "Basic user with minimal permissions"
    };
    return descriptions[role] || "Unknown role";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Permission Details</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <p className="text-white">{permission.role.replace(/_/g, " ")}</p>
            <p className="text-sm text-gray-400">{getRoleDescription(permission.role as Role)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">User ID</label>
            <p className="text-white">{permission.userId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Granted At</label>
            <p className="text-white">{new Date(permission.grantedAt).toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Granted By</label>
            <p className="text-white">{permission.grantedBy}</p>
          </div>

          {permission.expiresAt && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expires At</label>
              <p className="text-white">{new Date(permission.expiresAt).toLocaleString()}</p>
            </div>
          )}

          {"tournamentId" in permission && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tournament ID</label>
              <p className="text-white">{permission.tournamentId}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
              Close
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
            >
              {loading ? "Revoking..." : "Revoke Permission"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
