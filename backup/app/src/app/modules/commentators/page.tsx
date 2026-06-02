"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { LoadingSpinner } from "@lib/components/common";
import { ConfirmModal } from "@lib/components/common/modal";
import { PageWrapper } from "@lib/layout";
import { Commentator } from "@libTournament/types";

export default function CommentatorsPage(): React.ReactElement {
  const { setActiveModule } = useNavigation();
  const [commentators, setCommentators] = useState<Commentator[]>([]);
  const [name, setName] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [twitchHandle, setTwitchHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editingCommentator, setEditingCommentator] = useState<Commentator | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    commentator: Commentator | null;
  }>({ isOpen: false, commentator: null });
  const pageProps = useMemo(() => {
    return {
      title: !commentators
        ? loading
          ? "Commentators Management"
          : "Commentators Not Found"
        : "Commentators Management",
      subtitle: "Add, edit, and delete commentators for tournaments",
      breadcrumbs: [{ label: "Commentators", href: "/modules/commentators", isActive: true }]
    };
  }, [commentators, loading]);

  useEffect(() => {
    setActiveModule("commentators");
  }, [setActiveModule]);

  // Fetch commentators
  useEffect(() => {
    const fetchCommentators = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/commentators");
        if (response.ok) {
          const data = await response.json();
          setCommentators(data.commentators || []);
        } else if (response.status === 302 || response.redirected) {
          // Handle redirect to login page
          window.location.href = response.url;
          return;
        } else {
          console.error("Failed to fetch commentators");
        }
      } catch (error) {
        console.error("Error fetching commentators:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentators();
  }, []);

  // Add or update commentator
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      if (editingCommentator) {
        // Update existing commentator
        const commentatorId = editingCommentator._id || editingCommentator.id;
        if (!commentatorId) {
          setSuccessMsg("Error: Commentator ID not found");
          return;
        }

        const response = await fetch("/api/v1/commentators", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: commentatorId,
            name,
            xHandle: xHandle || undefined,
            instagramHandle: instagramHandle || undefined,
            twitchHandle: twitchHandle || undefined
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCommentators((prev) => prev.map((c) => ((c._id || c.id) === commentatorId ? data.commentator : c)));
          setSuccessMsg("Commentator updated successfully!");
        } else if (response.status === 302 || response.redirected) {
          // Handle redirect to login page
          window.location.href = response.url;
          return;
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setSuccessMsg(`Error: ${error.error}`);
          } else {
            setSuccessMsg("Authentication required. Redirecting to login...");
            window.location.href = "/login";
          }
        }
      } else {
        // Add new commentator
        const response = await fetch("/api/v1/commentators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            xHandle: xHandle || undefined,
            instagramHandle: instagramHandle || undefined,
            twitchHandle: twitchHandle || undefined
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCommentators((prev) => [...prev, data.commentator]);
          setSuccessMsg("Commentator added successfully!");
        } else if (response.status === 302 || response.redirected) {
          // Handle redirect to login page
          window.location.href = response.url;
          return;
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            setSuccessMsg(`Error: ${error.error}`);
          } else {
            setSuccessMsg("Authentication required. Redirecting to login...");
            window.location.href = "/login";
          }
        }
      }

      // Clear form
      setName("");
      setXHandle("");
      setInstagramHandle("");
      setTwitchHandle("");
      setEditingCommentator(null);
    } catch (error) {
      console.error("Error submitting commentator:", error);
      setSuccessMsg("Error submitting commentator");
    } finally {
      setTimeout(() => setSuccessMsg(""), 3000);
      setLoading(false);
    }
  };

  const handleEdit = (commentator: Commentator) => {
    setEditingCommentator(commentator);
    setName(commentator.name);
    setXHandle(commentator.xHandle || "");
    setInstagramHandle(commentator.instagramHandle || "");
    setTwitchHandle(commentator.twitchHandle || "");
  };

  const handleCancelEdit = () => {
    setEditingCommentator(null);
    setName("");
    setXHandle("");
    setInstagramHandle("");
    setTwitchHandle("");
  };

  const showDeleteModal = (commentator: Commentator) => {
    setDeleteModal({ isOpen: true, commentator });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.commentator) return;

    try {
      const commentatorId = deleteModal.commentator._id || deleteModal.commentator.id;
      if (!commentatorId) {
        setSuccessMsg("Error: Commentator ID not found");
        return;
      }

      const response = await fetch("/api/v1/commentators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentatorId })
      });

      if (response.ok) {
        setCommentators((prev) => prev.filter((c) => (c._id || c.id) !== commentatorId));
        setSuccessMsg("Commentator deleted successfully!");
      } else if (response.status === 302 || response.redirected) {
        // Handle redirect to login page
        window.location.href = response.url;
        return;
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          setSuccessMsg(`Error: ${error.error}`);
        } else {
          setSuccessMsg("Authentication required. Redirecting to login...");
          window.location.href = "/login";
        }
      }
    } catch (error) {
      console.error("Error deleting commentator:", error);
      setSuccessMsg("Error deleting commentator");
    }

    setDeleteModal({ isOpen: false, commentator: null });
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (loading && commentators.length === 0) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading commentators..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className="bg-gray-900 rounded-xl p-6 mb-10 shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-4">
          {editingCommentator ? "Edit Commentator" : "Add Commentator"}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">Display Name</label>
            <input
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">X Handle (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@username"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Instagram Handle (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@username"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Twitch Handle (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={twitchHandle}
              onChange={(e) => setTwitchHandle(e.target.value)}
              placeholder="username"
            />
          </div>
          <div className="col-span-1 sm:col-span-2 flex gap-2 mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              disabled={loading}
            >
              {loading ? "Saving..." : editingCommentator ? "Update Commentator" : "Add Commentator"}
            </button>
            {editingCommentator && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {successMsg && <div className="text-green-400 mt-4">{successMsg}</div>}
      </div>

      <h3 className="text-xl font-semibold text-white mb-4">All Commentators</h3>
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : commentators.length === 0 ? (
        <div className="text-gray-400">No commentators yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {commentators.map((c) => (
            <div key={c.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow flex flex-col gap-3">
              <div className="text-lg font-bold text-white">{c.name}</div>

              {/* Social Media Handles */}
              <div className="flex flex-wrap gap-3">
                {c.xHandle && (
                  <a
                    key="x"
                    href={`https://x.com/${c.xHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <span className="text-blue-400">𝕏</span>
                    {c.xHandle}
                  </a>
                )}
                {c.instagramHandle && (
                  <a
                    key="instagram"
                    href={`https://instagram.com/${c.instagramHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1"
                  >
                    <span className="text-pink-400">📷</span>
                    {c.instagramHandle}
                  </a>
                )}
                {c.twitchHandle && (
                  <a
                    key="twitch"
                    href={`https://twitch.tv/${c.twitchHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    <span className="text-purple-400">📺</span>
                    {c.twitchHandle}
                  </a>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Created by {c.createdBy} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Unknown date"}
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => showDeleteModal(c)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, commentator: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Commentator"
        message={`Are you sure you want to delete ${deleteModal.commentator?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </PageWrapper>
  );
}
