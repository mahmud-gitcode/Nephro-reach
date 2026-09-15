/* The board: tabs, posts and the replies under them. */

export type CommunityTab = {
  id: string;
  label: string;
};

export type PostItem = {
  id: string;
  author: string;
  badge: string;
  time: string;
  paragraphs: string[];
  hashtags: string;
  likes: number;
  categoryId: string;
};

export type ReplyItem = {
  id: string;
  postId: string;
  author: string;
  avatar?: string;
  time: string;
  badge?: string;
  content: string;
  likes?: number;
};
