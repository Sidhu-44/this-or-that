export interface Poll {
  id: number;
  question: string;
  option_a_label: string;
  option_a_image_url: string;
  option_b_label: string;
  option_b_image_url: string;
  scheduled_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface PollStats {
  total_votes: number;
  votes_a: number;
  votes_b: number;
  percentage_a: number;
  percentage_b: number;
}

export interface DailyPollResponse {
  poll: Poll | null;
  stats: PollStats | null;
  has_voted: boolean;
  user_vote: 'A' | 'B' | null;
  countdown_seconds: number;
  current_ist_date: string;
  is_today: boolean;
  is_archived: boolean;
}

export interface VoteResponse {
  message: string;
  option_selected: 'A' | 'B';
  stats: PollStats;
}

export interface ArchivePollItem {
  id: number;
  question: string;
  option_a_label: string;
  option_a_image_url: string;
  option_b_label: string;
  option_b_image_url: string;
  scheduled_date: string;
  total_votes: number;
  votes_a: number;
  votes_b: number;
  percentage_a: number;
  percentage_b: number;
}

export interface PollInput {
  question: string;
  option_a_label: string;
  option_a_image_url: string;
  option_b_label: string;
  option_b_image_url: string;
  scheduled_date: string;
}
