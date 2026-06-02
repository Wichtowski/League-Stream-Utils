"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Role } from "@lib/types/permissions";

interface PermissionRequest {
  _id: string;
  userId: string;
  requesterId: string;
  requestedRole: Role;
  tournamentId?: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: Date;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}
import { Button } from "@lib/components/common/button/Button";
import { LoadingSpinner } from "@lib/components/common";
import { useModal } from "@lib/contexts/ModalContext";

interface PermissionRequestManagerProps {
  tournamentId?: string;
  onRequestChange?: () => void;
}

export const PermissionRequestManager = ({
  tournamentId,
  onRequestChange
}: PermissionRequestManagerProps): React.ReactElement => {
  const { showAlert } = useModal();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const isGlobal = !tournamentId;

  const loadRequests = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const url = tournamentId
        ? `/api/v1/permissions/requests?tournamentId=${tournamentId}`
        : "/api/v1/permissions/requests";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch permission requests");
      }

      const result = await response.json();
      setRequests(result.requests);
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to load permission requests" });
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showAlert]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApproveRequest = async (requestId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/permissions/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "approve"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      await showAlert({ type: "success", message: "Permission request approved" });
      await loadRequests();
      onRequestChange?.();
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to approve request" });
    }
  };

  const handleRejectRequest = async (requestId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/permissions/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "reject"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      await showAlert({ type: "success", message: "Permission request rejected" });
      await loadRequests();
      onRequestChange?.();
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to reject request" });
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-600",
      APPROVED: "bg-green-600",
      REJECTED: "bg-red-600",
      EXPIRED: "bg-gray-600"
    };
    return colors[status] || "bg-gray-600";
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner text="Loading permission requests..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {isGlobal ? "Global Permission Requests" : "Tournament Permission Requests"}
        </h3>
        <Button onClick={() => setShowRequestModal(true)} className="bg-green-600 hover:bg-green-700">
          Request Permission
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No pending requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request._id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(request.status)}`}
                  >
                    {request.status}
                  </span>
                  <span className="text-white font-medium">{request.requestedRole.replace(/_/g, " ")}</span>
                  {request.tournamentId && (
                    <span className="text-gray-400 text-sm">Tournament: {request.tournamentId}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatDate(request.createdAt)}</span>
              </div>

              <div className="mb-3">
                <p className="text-gray-300 text-sm">
                  <strong>Requester:</strong> {request.requesterId}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Reason:</strong> {request.reason}
                </p>
              </div>

              {request.status === "PENDING" && (
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleRejectRequest(request._id!)}
                    className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApproveRequest(request._id!)}
                    className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                  >
                    Approve
                  </Button>
                </div>
              )}

              {request.reviewedBy && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-xs text-gray-400">
                    <strong>Reviewed by:</strong> {request.reviewedBy} on {formatDate(request.reviewedAt!)}
                  </p>
                  {request.reviewNotes && (
                    <p className="text-xs text-gray-400 mt-1">
                      <strong>Notes:</strong> {request.reviewNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRequestModal && (
        <PermissionRequestModal
          tournamentId={tournamentId}
          onClose={() => setShowRequestModal(false)}
          onRequestSubmitted={() => {
            loadRequests();
            onRequestChange?.();
          }}
        />
      )}
    </div>
  );
};

// Permission Request Modal Component
interface PermissionRequestModalProps {
  tournamentId?: string;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

const PermissionRequestModal = ({
  tournamentId,
  onClose,
  onRequestSubmitted
}: PermissionRequestModalProps): React.ReactElement => {
  const { showAlert } = useModal();
  const [requestedRole, setRequestedRole] = useState<Role>(Role.USER);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const availableRoles = Object.values(Role).filter(
    (role) => role !== Role.SUPER_ADMIN && (tournamentId ? !role.includes("GLOBAL") : !role.includes("TOURNAMENT"))
  );

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!reason.trim()) {
      await showAlert({ type: "error", message: "Reason is required" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/permissions/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestedRole: requestedRole,
          tournamentId: tournamentId,
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit permission request");
      }

      await showAlert({ type: "success", message: "Permission request submitted successfully" });
      onRequestSubmitted();
      onClose();
    } catch (_error) {
      await showAlert({ type: "error", message: "Failed to submit permission request" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Request Permission</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Requested Role</label>
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as Role)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500"
              rows={3}
              placeholder="Explain why you need this permission..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
