import { ObjectId } from 'mongodb';

export interface Auction {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  category: 'photography' | 'electronics' | 'art' | 'collectibles' | 'jewelry' | 'fashion';
  status: 'live' | 'ended' | 'upcoming';
  currentHighestBid: number;
  bidsCount: number;
  endTime: Date | string;
  createdAt: Date | string;
}