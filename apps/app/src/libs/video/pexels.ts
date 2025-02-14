export interface IPexelsResponse {
  page: number;
  per_page: number;
  videos: IVideo[];
  total_results: number;
  next_page: string;
}

export interface IVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  full_res: null;
  tags: string[];
  url: string;
  image: string;
  avg_color: null;
  user: IUser;
  video_files: IVideoFile[];
  video_pictures: IVideoPicture[];
}

interface IUser {
  id: number;
  name: string;
  url: string;
}

interface IVideoFile {
  id: number;
  quality: 'sd' | 'hd' | 'uhd';
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
  size: number;
}

interface IVideoPicture {
  id: number;
  nr: number;
  picture: string;
}

export interface ISearchVideosParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  locale?: string;
}

export class PexelsService {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;

  constructor() {
    this._apiKey = process.env.PEXELS_API_KEY!;
    this._baseUrl = 'https://api.pexels.com/videos';
  }

  async searchVideos(params: ISearchVideosParams): Promise<IPexelsResponse> {
    const {
      query,
      page = 1,
      perPage = 10,
      orientation,
      size,
      color,
      locale,
    } = params;

    const queryParams = new URLSearchParams({
      query: query,
      page: page.toString(),
      per_page: perPage.toString(),
      ...(orientation && { orientation }),
      ...(size && { size }),
      ...(color && { color }),
      ...(locale && { locale }),
    });

    const response = await fetch(`${this._baseUrl}/search?${queryParams}`, {
      headers: {
        Authorization: this._apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    const data = await response.json();
    return data as IPexelsResponse;
  }
}
