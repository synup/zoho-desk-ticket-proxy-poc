import type { User, Post, Comment, FetchedData } from '../types/api';

const BASE = 'https://jsonplaceholder.typicode.com';

export async function fetchPageData(signal?: AbortSignal): Promise<FetchedData> {
  const [usersRes, postsRes, commentsRes] = await Promise.all([
    fetch(`${BASE}/users`, { signal }),
    fetch(`${BASE}/posts`, { signal }),
    fetch(`${BASE}/comments`, { signal }),
  ]);

  const [users, posts, comments]: [User[], Post[], Comment[]] = await Promise.all([
    usersRes.json(),
    postsRes.json(),
    commentsRes.json(),
  ]);

  return { users, posts, comments };
}
