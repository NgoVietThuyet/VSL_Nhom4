import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';

export interface NewsTopic {
  id: string;
  code: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder: number;
}

export interface NewsSource {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  baseUrl: string;
  rssUrl?: string;
  priority: number;
  sourceType: number;
  isActive?: boolean;
  isBreaking: boolean;
  lastCrawledAt?: string;
  lastSuccessAt?: string;
}

export interface NewsArticleSummary {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  sourceId: string;
  sourceName?: string;
  sourceLogo?: string;
  sourceCode?: string;
  sourceUrl?: string;
  primaryTopicCode?: string;
  primaryTopicName?: string;
  canonicalUrl: string;
  importance: number;
  topicCodes: string[];
}

export interface NewsArticleSourceRef {
  sourceId: string;
  sourceName?: string;
  sourceLogo?: string;
  url?: string;
  title?: string;
  publishedAt?: string;
  similarity: number;
}

export interface NewsArticleDetail extends NewsArticleSummary {
  subtitle?: string;
  aiSummary?: string;
  aiSummaryLong?: string;
  keywords: string[];
  contentHtml?: string;
  contentText?: string;
  sourceRefs: NewsArticleSourceRef[];
  related: NewsArticleSummary[];
  wordCount: number;
  language: string;
}

export interface NewsSearchRequest {
  query?: string;
  topicCode?: string;
  sourceId?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
  sortBy?: 'published_desc' | 'published_asc' | 'importance_desc';
}

export interface NewsSearchResult {
  total: number;
  page: number;
  pageSize: number;
  items: NewsArticleSummary[];
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  constructor(private common: CommonService) {}

  getLatest(take = 6, topicCode?: string): Observable<NewsArticleSummary[]> {
    const params: any = { take };
    if (topicCode) params.topicCode = topicCode;
    return this.common.get<NewsArticleSummary[]>('News/Latest', params, false);
  }

  getDetail(id: string): Observable<NewsArticleDetail> {
    return this.common.get<NewsArticleDetail>(`News/Detail/${id}`);
  }

  search(req: NewsSearchRequest): Observable<NewsSearchResult> {
    return this.common.post<NewsSearchResult>('News/Search', req);
  }

  getTopics(): Observable<NewsTopic[]> {
    return this.common.get<NewsTopic[]>('News/Topics', undefined, false);
  }

  getSources(): Observable<NewsSource[]> {
    return this.common.get<NewsSource[]>('News/Sources', undefined, false);
  }
}
