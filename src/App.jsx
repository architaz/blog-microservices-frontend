import React, { useState, useEffect } from 'react';
import { User, MessageSquare, Calendar, Edit3, Trash2, Plus, LogIn, UserPlus } from 'lucide-react';

// API Configuration
import API_BASE_URL from './config/api';

// Replace the existing API configuration with:
const USER_SERVICE = API_BASE_URL.user;
const POST_SERVICE = API_BASE_URL.post;
const COMMENT_SERVICE = API_BASE_URL.comment;

const BlogApp = () => {
  // State management
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [commentText, setCommentText] = useState('');

  // API calls (mock implementations - replace with actual API calls)
  const api = {
    // User service calls
    register: async (userData) => {
      const response = await fetch(`${USER_SERVICE}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          full_name: userData.username, // Using username as full_name for simplicity
          bio: ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      return response.json();
    },

    login: async (credentials) => {
      // Since your backend doesn't have authentication yet, we'll simulate login
      // by checking if user exists
      try {
        const response = await fetch(`${USER_SERVICE}/api/v1/users`);
        const users = await response.json();
        const user = users.find(u => u.email === credentials.email);
        
        if (user) {
          return user;
        } else {
          throw new Error('User not found');
        }
      } catch (error) {
        throw new Error('Login failed');
      }
    },
    
    // Post service calls
    getPosts: async () => {
      const response = await fetch(`${POST_SERVICE}/api/v1/posts`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      return response.json();
    },

    createPost: async (postData) => {
      const response = await fetch(`${POST_SERVICE}/api/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          author_id: currentUser?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return response.json();
    },

    deletePost: async (postId) => {
      const response = await fetch(`${POST_SERVICE}/api/v1/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
    },
    
    // Comment service calls
    getComments: async (postId) => {
      const response = await fetch(`${COMMENT_SERVICE}/api/v1/comments/post/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },

    createComment: async (postId, commentData) => {
      const response = await fetch(`${COMMENT_SERVICE}/api/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentData.content,
          post_id: postId,
          author_id: currentUser?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create comment');
      }
      
      return response.json();
    }
  };

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const postsData = await api.getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts. Please try again.');
    }
    setLoading(false);
  };

  const loadComments = async (postId) => {
    try {
      const commentsData = await api.getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const user = await api.login(loginForm);
      setCurrentUser(user);
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async () => {
    try {
      const user = await api.register(registerForm);
      setCurrentUser(user);
      setShowRegisterModal(false);
      setRegisterForm({ username: '', email: '', password: '' });
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;
    
    try {
      const newPost = await api.createPost(postForm);
      setPosts([newPost, ...posts]);
      setShowPostModal(false);
      setPostForm({ title: '', content: '' });
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) return;
    
    try {
      await api.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setComments([]);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCreateComment = async () => {
    if (!currentUser || !selectedPost || !commentText.trim()) return;
    
    try {
      const newComment = await api.createComment(selectedPost.id, { content: commentText });
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const selectPost = (post) => {
    setSelectedPost(post);
    loadComments(post.id);
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Blog Microservices</h1>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <span className="text-gray-700">Welcome, {currentUser.username}!</span>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New Post
                  </button>
                  <button
                    onClick={() => setCurrentUser(null)}
                    className="text-blue-300 hover:text-gray-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                  >
                    <LogIn size={16} />
                    Login
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6">Latest Posts</h2>
            {loading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No posts yet. Be the first to create one!</div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <article
                    key={post.id}
                    className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedPost?.id === post.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => selectPost(post)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-600 mb-4">{post.content}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <User size={14} className="mr-1" />
                          <span className="mr-4">Author ID: {post.author_id}</span>
                          <Calendar size={14} className="mr-1" />
                          <span>{post.created_at}</span>
                        </div>
                      </div>
                      {currentUser && currentUser.id === post.author_id && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare size={18} />
              Comments
            </h3>
            
            {selectedPost ? (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-medium text-sm text-gray-900">{selectedPost.title}</h4>
                </div>
                
                {/* Comment Form */}
                {currentUser && (
                  <div className="mb-6">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      rows="3"
                    />
                    <button
                      onClick={handleCreateComment}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={!commentText.trim()}
                    >
                      Post Comment
                    </button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                        <p className="text-gray-800 mb-2">{comment.content}</p>
                        <div className="text-xs text-gray-500">
                          Author ID: {comment.author_id} • {comment.created_at}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">Select a post to view comments</p>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Login">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </Modal>

      {/* Register Modal */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Register">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <button
            onClick={handleRegister}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Register
          </button>
        </div>
      </Modal>

      {/* Create Post Modal */}
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="Create New Post">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={postForm.title}
              onChange={(e) => setPostForm({...postForm, title: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={postForm.content}
              onChange={(e) => setPostForm({...postForm, content: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white"
              rows="4"
              required
            />
          </div>
          <button
            onClick={handleCreatePost}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Create Post
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BlogApp;
