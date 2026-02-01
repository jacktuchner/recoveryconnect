import type { User, Profile, Recording, Call, Review } from "@/generated/prisma";

export type UserWithProfile = User & {
  profile: Profile | null;
};

export type RecordingWithContributor = Recording & {
  contributor: User & { profile: Profile | null };
  reviews: Review[];
};

export type ContributorWithProfile = User & {
  profile: Profile;
  recordings: Recording[];
  reviewsReceived: Review[];
};

export type CallWithParticipants = Call & {
  patient: User;
  contributor: User & { profile: Profile | null };
  reviews: Review[];
};

export type MatchedContributor = ContributorWithProfile & {
  matchScore: number;
  matchBreakdown: {
    attribute: string;
    matched: boolean;
    weight: number;
  }[];
};
