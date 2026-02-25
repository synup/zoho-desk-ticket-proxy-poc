import type { User, Post, Comment } from '../types/api';
import { User as UserIcon, FileText, MessageCircle } from 'react-feather';
import './DataSections.css';

type Props = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  loading: boolean;
  error: string | null;
};

export function DataSections({ users, posts, comments, loading, error }: Props) {
  if (loading) {
    return (
      <div className="data-sections">
        <div className="data-loading">
          <div className="data-loading-spinner" />
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-sections">
        <div className="data-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const displayPosts = posts.slice(0, 12);
  const displayComments = comments.slice(0, 15);

  return (
    <div className="data-sections">
      <section className="data-section" aria-labelledby="users-heading">
        <h2 id="users-heading" className="data-section-title">
          <UserIcon size={20} />
          Users
        </h2>
        <div className="data-section-content">
          <div className="users-grid">
            {users.map((user) => (
              <article key={user.id} className="user-card">
                <div className="user-card-header">
                  <span className="user-avatar">{user.name.charAt(0)}</span>
                  <div className="user-card-meta">
                    <h3 className="user-name">{user.name}</h3>
                    <span className="user-username">@{user.username}</span>
                  </div>
                </div>
                <div className="user-card-body">
                  <a href={`mailto:${user.email}`} className="user-email">
                    {user.email}
                  </a>
                  <p className="user-company">{user.company.name}</p>
                  <p className="user-address">
                    {user.address.city}, {user.address.zipcode}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="data-section" aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="data-section-title">
          <FileText size={20} />
          Posts
        </h2>
        <div className="data-section-content">
          <div className="posts-grid">
            {displayPosts.map((post) => {
              const author = users.find((u) => u.id === post.userId);
              return (
                <article key={post.id} className="post-card">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-body">{post.body}</p>
                  {author && (
                    <span className="post-author">By {author.name}</span>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="data-section" aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="data-section-title">
          <MessageCircle size={20} />
          Comments
        </h2>
        <div className="data-section-content">
          <div className="comments-list">
            {displayComments.map((comment) => (
              <article key={comment.id} className="comment-card">
                <div className="comment-header">
                  <strong className="comment-name">{comment.name}</strong>
                  <span className="comment-email">{comment.email}</span>
                </div>
                <p className="comment-body">{comment.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
